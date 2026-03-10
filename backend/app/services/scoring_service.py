"""Deterministic client scoring service — no AI calls."""

import math
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session

from app.models.client import Client
from app.models.client_score import ClientScore
from app.models.client_activity import ClientActivityLog
from app.models.call_cycle import ClientCallCycle
from app.models.portfolio import ClientPortfolio
from app.models.life_event import LifeEvent
from app.models.alert import Alert
from app.models.communication import CommunicationLog


WEIGHTS = {
    "contact_recency": 0.25,
    "aum": 0.20,
    "portfolio_risk": 0.20,
    "life_event_proximity": 0.15,
    "alert_severity": 0.10,
    "behavioral_signals": 0.10,
}


def _contact_recency_score(client: Client, db: Session) -> tuple[float, dict]:
    """Score based on days since last contact vs call cycle target."""
    call_cycle = db.query(ClientCallCycle).filter(ClientCallCycle.client_id == client.id).first()
    last_comm = (
        db.query(CommunicationLog)
        .filter(CommunicationLog.client_id == client.id)
        .order_by(CommunicationLog.created_at.desc())
        .first()
    )

    if not last_comm:
        return 90.0, {"days_since_contact": 999, "cycle_days": call_cycle.call_cycle_days if call_cycle else 90}

    days_since = (datetime.utcnow() - last_comm.created_at).days
    cycle_days = call_cycle.call_cycle_days if call_cycle else 90
    ratio = days_since / max(cycle_days, 1)

    # Score increases as contact becomes more overdue
    if ratio >= 1.5:
        score = 100.0
    elif ratio >= 1.0:
        score = 70.0 + (ratio - 1.0) * 60.0  # 70-100
    elif ratio >= 0.7:
        score = 40.0 + (ratio - 0.7) * 100.0  # 40-70
    else:
        score = ratio / 0.7 * 40.0  # 0-40

    return min(100, score), {"days_since_contact": days_since, "cycle_days": cycle_days, "ratio": round(ratio, 2)}


def _aum_score(client: Client) -> tuple[float, dict]:
    """Log-scaled AUM importance score."""
    aum = max(client.aum, 1)
    # log10(100k)=5, log10(1M)=6, log10(10M)=7, log10(100M)=8
    raw = (math.log10(aum) - 4) * 25  # 100k=25, 1M=50, 10M=75, 100M=100
    score = max(0, min(100, raw))
    return score, {"aum": client.aum, "log_score": round(score, 1)}


def _portfolio_risk_score(client: Client, db: Session) -> tuple[float, dict]:
    """Score based on concentration, losses, and drift."""
    holdings = db.query(ClientPortfolio).filter(ClientPortfolio.client_id == client.id).all()
    if not holdings:
        return 0.0, {"no_holdings": True}

    factors = {}
    score = 0.0

    # Concentration check — any single position > 25%
    max_alloc = max((h.allocation_pct for h in holdings), default=0)
    if max_alloc > 25:
        concentration_penalty = min(50, (max_alloc - 25) * 2.5)
        score += concentration_penalty
        factors["max_concentration"] = round(max_alloc, 1)

    # Loss check — any position down > 10%
    worst_loss = min((h.gain_loss_pct for h in holdings), default=0)
    if worst_loss < -10:
        loss_penalty = min(30, abs(worst_loss + 10) * 1.5)
        score += loss_penalty
        factors["worst_loss_pct"] = round(worst_loss, 1)

    # Drift — standard deviation of allocations from equal weight
    n = len(holdings)
    equal_weight = 100.0 / n if n > 0 else 0
    if n > 1:
        variance = sum((h.allocation_pct - equal_weight) ** 2 for h in holdings) / n
        drift = math.sqrt(variance)
        if drift > 15:
            drift_penalty = min(20, (drift - 15) * 1.0)
            score += drift_penalty
            factors["allocation_drift"] = round(drift, 1)

    return min(100, score), factors


def _life_event_score(client: Client, db: Session) -> tuple[float, dict]:
    """Score based on upcoming high-impact life events."""
    today = date.today()
    upcoming = (
        db.query(LifeEvent)
        .filter(
            LifeEvent.client_id == client.id,
            LifeEvent.event_date >= today,
            LifeEvent.event_date <= today + timedelta(days=60),
        )
        .all()
    )

    if not upcoming:
        return 0.0, {"upcoming_events": 0}

    score = 0.0
    event_details = []
    for event in upcoming:
        days_away = (event.event_date - today).days
        impact_mult = {"high": 1.0, "medium": 0.6, "low": 0.3}.get(event.impact, 0.5)

        if days_away <= 7:
            event_score = 100 * impact_mult
        elif days_away <= 14:
            event_score = 75 * impact_mult
        elif days_away <= 30:
            event_score = 50 * impact_mult
        else:
            event_score = 25 * impact_mult

        score = max(score, event_score)  # Take highest event score
        event_details.append({"title": event.title, "days_away": days_away, "impact": event.impact})

    return min(100, score), {"upcoming_events": len(upcoming), "details": event_details}


def _alert_score(client: Client, db: Session) -> tuple[float, dict]:
    """Score based on unread alert severity."""
    alerts = (
        db.query(Alert)
        .filter(Alert.client_id == client.id, Alert.is_read == False)
        .all()
    )

    if not alerts:
        return 0.0, {"unread_alerts": 0}

    score = 0.0
    for alert in alerts:
        if alert.severity == "critical":
            score += 40
        elif alert.severity == "warning":
            score += 20
        else:
            score += 5

    return min(100, score), {"unread_alerts": len(alerts), "severities": [a.severity for a in alerts]}


def _behavioral_score(client: Client, db: Session) -> tuple[float, dict]:
    """Score based on unusual portal activity patterns."""
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_activities = (
        db.query(ClientActivityLog)
        .filter(
            ClientActivityLog.client_id == client.id,
            ClientActivityLog.timestamp >= seven_days_ago,
        )
        .all()
    )

    if not recent_activities:
        return 0.0, {"recent_activities": 0}

    score = 0.0
    factors = {"recent_activities": len(recent_activities)}

    # 4+ logins in 7 days = unusual activity
    logins = [a for a in recent_activities if a.activity_type == "portal_login"]
    if len(logins) >= 4:
        score += 60
        factors["frequent_logins"] = len(logins)

    # Off-hours activity (11pm - 5am)
    off_hours = [a for a in recent_activities if a.timestamp.hour >= 23 or a.timestamp.hour < 5]
    if off_hours:
        score += 30
        factors["off_hours_activity"] = len(off_hours)

    # Performance checks
    perf_checks = [a for a in recent_activities if a.activity_type == "performance_check"]
    if len(perf_checks) >= 3:
        score += 20
        factors["performance_checks"] = len(perf_checks)

    return min(100, score), factors


def calculate_client_score(client: Client, db: Session) -> ClientScore:
    """Calculate full composite score for a client."""
    contact_score, contact_factors = _contact_recency_score(client, db)
    aum_sc, aum_factors = _aum_score(client)
    portfolio_sc, portfolio_factors = _portfolio_risk_score(client, db)
    life_sc, life_factors = _life_event_score(client, db)
    alert_sc, alert_factors = _alert_score(client, db)
    behavioral_sc, behavioral_factors = _behavioral_score(client, db)

    # Weighted composite
    composite = (
        contact_score * WEIGHTS["contact_recency"]
        + aum_sc * WEIGHTS["aum"]
        + portfolio_sc * WEIGHTS["portfolio_risk"]
        + life_sc * WEIGHTS["life_event_proximity"]
        + alert_sc * WEIGHTS["alert_severity"]
        + behavioral_sc * WEIGHTS["behavioral_signals"]
    )

    # Map sub-scores to the 4 display categories
    engagement_score = (contact_score * 0.6 + behavioral_sc * 0.4)
    urgency_score = (life_sc * 0.4 + alert_sc * 0.3 + contact_score * 0.3)
    revenue_score = aum_sc
    risk_score = portfolio_sc

    factors = {
        "contact_recency": contact_factors,
        "aum": aum_factors,
        "portfolio_risk": portfolio_factors,
        "life_events": life_factors,
        "alerts": alert_factors,
        "behavioral": behavioral_factors,
        "weights": WEIGHTS,
    }

    # Upsert score
    existing = db.query(ClientScore).filter(ClientScore.client_id == client.id).first()
    if existing:
        existing.engagement_score = round(engagement_score, 1)
        existing.urgency_score = round(urgency_score, 1)
        existing.revenue_score = round(revenue_score, 1)
        existing.risk_score = round(risk_score, 1)
        existing.composite_score = round(composite, 1)
        existing.factors = factors
        existing.calculated_at = datetime.utcnow()
        return existing
    else:
        score = ClientScore(
            client_id=client.id,
            engagement_score=round(engagement_score, 1),
            urgency_score=round(urgency_score, 1),
            revenue_score=round(revenue_score, 1),
            risk_score=round(risk_score, 1),
            composite_score=round(composite, 1),
            factors=factors,
        )
        db.add(score)
        return score


def score_all_clients(advisor_id: int, db: Session) -> list[ClientScore]:
    """Batch recalculate scores for all of an advisor's clients."""
    clients = db.query(Client).filter(Client.advisor_id == advisor_id, Client.status == "active").all()
    scores = []
    for client in clients:
        score = calculate_client_score(client, db)
        scores.append(score)
    db.commit()
    return scores


def score_idea(trigger_type: str, trigger_data: dict, client_score: ClientScore) -> float:
    """Score an idea using client context + trigger severity."""
    # Base score from trigger type severity
    trigger_base = {
        "portfolio_downgrade": 75,
        "concentrated_position": 80,
        "life_event_approaching": 65,
        "call_cycle_overdue": 55,
        "market_event": 60,
        "portfolio_drift": 50,
        "behavioral_signal": 70,
    }.get(trigger_type, 50)

    # Boost based on client composite score
    client_boost = (client_score.composite_score / 100) * 20 if client_score else 0

    # Revenue boost for high-AUM clients
    revenue_boost = (client_score.revenue_score / 100) * 10 if client_score else 0

    return min(100, round(trigger_base + client_boost + revenue_boost, 1))

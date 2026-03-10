"""Idea engine — scans clients for triggers and generates actionable ideas."""

import re
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session

from app.models.client import Client
from app.models.client_idea import ClientIdea
from app.models.idea_template import IdeaTemplate
from app.models.client_score import ClientScore
from app.models.call_cycle import ClientCallCycle
from app.models.portfolio import ClientPortfolio
from app.models.life_event import LifeEvent
from app.models.client_activity import ClientActivityLog
from app.models.communication import CommunicationLog
from app.models.advisor import Advisor
from app.services.scoring_service import score_idea


def render_template(template_text: str, context: dict) -> str:
    """Replace {{merge_field}} placeholders with context values."""
    def replacer(match):
        key = match.group(1)
        return str(context.get(key, f"{{{{{key}}}}}"))
    return re.sub(r"\{\{(\w+)\}\}", replacer, template_text)


def build_merge_context(client: Client, advisor: Advisor, trigger: dict, db: Session) -> dict:
    """Build merge field values for template rendering."""
    # Base context
    context = {
        "client_first_name": client.first_name,
        "client_last_name": client.last_name,
        "client_full_name": f"{client.first_name} {client.last_name}",
        "advisor_name": advisor.full_name,
        "risk_profile": client.risk_profile,
        "aum": f"{client.aum:,.0f}",
    }

    # Add trigger-specific fields
    trigger_data = trigger.get("data", {})
    context.update(trigger_data)

    # Last contact date
    last_comm = (
        db.query(CommunicationLog)
        .filter(CommunicationLog.client_id == client.id)
        .order_by(CommunicationLog.created_at.desc())
        .first()
    )
    if last_comm:
        context["last_contact_date"] = last_comm.created_at.strftime("%B %d, %Y")
    else:
        context["last_contact_date"] = "N/A"

    return context


def detect_triggers(client: Client, db: Session) -> list[dict]:
    """Detect all active triggers for a client."""
    triggers = []
    today = date.today()

    # 1. Concentrated positions (>25%)
    holdings = db.query(ClientPortfolio).filter(ClientPortfolio.client_id == client.id).all()
    for h in holdings:
        if h.allocation_pct > 25:
            triggers.append({
                "type": "concentrated_position",
                "data": {
                    "ticker": h.ticker,
                    "holding_name": h.name,
                    "allocation_pct": f"{h.allocation_pct:.1f}",
                    "holding_value": f"{h.value:,.0f}",
                },
            })

    # 2. Life events approaching (within 30 days)
    upcoming_events = (
        db.query(LifeEvent)
        .filter(
            LifeEvent.client_id == client.id,
            LifeEvent.event_date >= today,
            LifeEvent.event_date <= today + timedelta(days=30),
        )
        .all()
    )
    for event in upcoming_events:
        triggers.append({
            "type": "life_event_approaching",
            "data": {
                "event_title": event.title,
                "event_date": event.event_date.strftime("%B %d, %Y"),
                "event_description": event.description or "",
            },
        })

    # 3. Call cycle overdue
    cycle = db.query(ClientCallCycle).filter(ClientCallCycle.client_id == client.id).first()
    if cycle and cycle.status in ("overdue", "due_soon"):
        triggers.append({
            "type": "call_cycle_overdue",
            "data": {
                "days_overdue": str(abs((today - cycle.next_due_at).days)) if cycle.next_due_at else "unknown",
                "cycle_days": str(cycle.call_cycle_days),
            },
        })

    # 4. Behavioral signals
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_activities = (
        db.query(ClientActivityLog)
        .filter(
            ClientActivityLog.client_id == client.id,
            ClientActivityLog.timestamp >= seven_days_ago,
        )
        .all()
    )
    logins = [a for a in recent_activities if a.activity_type == "portal_login"]
    if len(logins) >= 4:
        triggers.append({
            "type": "behavioral_signal",
            "data": {
                "login_count": str(len(logins)),
                "period": "7 days",
            },
        })

    # 5. Portfolio losses (>10%)
    for h in holdings:
        if h.gain_loss_pct < -10:
            triggers.append({
                "type": "portfolio_downgrade",
                "data": {
                    "ticker": h.ticker,
                    "holding_name": h.name,
                    "allocation_pct": f"{h.allocation_pct:.1f}",
                    "holding_value": f"{h.value:,.0f}",
                    "loss_pct": f"{h.gain_loss_pct:.1f}",
                },
            })

    return triggers


def _has_similar_pending_idea(client_id: int, trigger_type: str, db: Session) -> bool:
    """Check if a similar pending idea already exists."""
    existing = (
        db.query(ClientIdea)
        .filter(
            ClientIdea.client_id == client_id,
            ClientIdea.trigger_type == trigger_type,
            ClientIdea.status == "pending",
        )
        .first()
    )
    return existing is not None


def scan_and_generate_ideas(advisor_id: int, db: Session) -> list[ClientIdea]:
    """Scan all active clients for triggers and generate ideas."""
    advisor = db.query(Advisor).filter(Advisor.id == advisor_id).first()
    if not advisor:
        return []

    clients = db.query(Client).filter(
        Client.advisor_id == advisor_id,
        Client.status == "active",
    ).all()

    templates = db.query(IdeaTemplate).filter(IdeaTemplate.is_active == True).all()
    template_map = {t.trigger_type: t for t in templates}

    generated = []

    for client in clients:
        triggers = detect_triggers(client, db)

        # Get client score for idea scoring
        client_score = db.query(ClientScore).filter(ClientScore.client_id == client.id).first()

        for trigger in triggers:
            trigger_type = trigger["type"]

            # Skip if similar pending idea exists
            if _has_similar_pending_idea(client.id, trigger_type, db):
                continue

            # Find matching template
            template = template_map.get(trigger_type)
            if not template:
                continue

            # Build merge context and render
            context = build_merge_context(client, advisor, trigger, db)
            subject = render_template(template.subject_template, context)
            body = render_template(template.body_template, context)

            # Score the idea
            idea_score = score_idea(trigger_type, trigger.get("data", {}), client_score)

            idea = ClientIdea(
                client_id=client.id,
                template_id=template.id,
                advisor_id=advisor_id,
                trigger_type=trigger_type,
                trigger_data=trigger.get("data"),
                subject=subject,
                rendered_content=body,
                channel=template.default_channel,
                score=idea_score,
                status="pending",
            )
            db.add(idea)
            generated.append(idea)

    if generated:
        db.commit()

    return generated

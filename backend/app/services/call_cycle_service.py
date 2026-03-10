"""Call cycle management service with algorithmic override detection."""

from __future__ import annotations

from datetime import datetime, date, timedelta
from typing import Optional
from sqlalchemy.orm import Session

from app.models.client import Client
from app.models.call_cycle import ClientCallCycle
from app.models.portfolio import ClientPortfolio
from app.models.life_event import LifeEvent
from app.models.client_activity import ClientActivityLog
from app.models.communication import CommunicationLog


def get_default_cycle_days(aum: float) -> int:
    """AUM-tier default call cycle days."""
    if aum >= 10_000_000:
        return 30
    elif aum >= 5_000_000:
        return 60
    elif aum >= 1_000_000:
        return 90
    else:
        return 180


def set_call_cycle(client_id: int, days: int, db: Session) -> ClientCallCycle:
    """Set or update a client's call cycle."""
    cycle = db.query(ClientCallCycle).filter(ClientCallCycle.client_id == client_id).first()
    if not cycle:
        cycle = ClientCallCycle(client_id=client_id, call_cycle_days=days)
        db.add(cycle)
    else:
        cycle.call_cycle_days = days

    # Recalculate next_due_at
    if cycle.last_contacted_at:
        cycle.next_due_at = (cycle.last_contacted_at + timedelta(days=days)).date()
    else:
        cycle.next_due_at = (datetime.utcnow() + timedelta(days=days)).date()

    _update_status(cycle)
    db.flush()
    return cycle


def update_call_cycle_status(client_id: int, db: Session) -> ClientCallCycle:
    """Recalculate call cycle status + detect overrides for a client."""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        return None

    cycle = db.query(ClientCallCycle).filter(ClientCallCycle.client_id == client_id).first()
    if not cycle:
        cycle = ClientCallCycle(
            client_id=client_id,
            call_cycle_days=get_default_cycle_days(client.aum),
        )
        db.add(cycle)
        db.flush()

    # Update last_contacted_at from communications
    last_comm = (
        db.query(CommunicationLog)
        .filter(CommunicationLog.client_id == client_id)
        .order_by(CommunicationLog.created_at.desc())
        .first()
    )
    if last_comm:
        cycle.last_contacted_at = last_comm.created_at
        cycle.next_due_at = (last_comm.created_at + timedelta(days=cycle.call_cycle_days)).date()

    # Check for override conditions
    override_reason = _detect_override(client, db)
    if override_reason:
        cycle.override_active = True
        cycle.override_reason = override_reason
        cycle.status = "urgent_override"
    else:
        cycle.override_active = False
        cycle.override_reason = None
        _update_status(cycle)

    db.flush()
    return cycle


def _update_status(cycle: ClientCallCycle):
    """Update status based on next_due_at."""
    if not cycle.next_due_at:
        cycle.status = "on_track"
        return

    today = date.today()
    days_until = (cycle.next_due_at - today).days

    if days_until < 0:
        cycle.status = "overdue"
    elif days_until <= 7:
        cycle.status = "due_soon"
    else:
        cycle.status = "on_track"


def _detect_override(client: Client, db: Session) -> Optional[str]:
    """Check for conditions that should trigger an urgent override.
    Returns override reason string or None."""
    reasons = []

    # 1. Concentrated position — any holding > 25%
    holdings = db.query(ClientPortfolio).filter(ClientPortfolio.client_id == client.id).all()
    concentrated = [h for h in holdings if h.allocation_pct > 25]
    if concentrated:
        tickers = ", ".join(h.ticker for h in concentrated[:3])
        reasons.append(f"Concentrated position: {tickers} ({concentrated[0].allocation_pct:.0f}%)")

    # 2. Behavioral signals — 4+ portal logins in 7 days OR off-hours logins
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
    off_hours = [a for a in recent_activities if a.timestamp.hour >= 23 or a.timestamp.hour < 5]
    if len(logins) >= 4:
        reasons.append(f"Unusual activity: {len(logins)} portal logins in 7 days")
    if off_hours:
        reasons.append(f"Off-hours activity detected ({len(off_hours)} events)")

    # 3. Critical life event within 7 days
    today = date.today()
    critical_events = (
        db.query(LifeEvent)
        .filter(
            LifeEvent.client_id == client.id,
            LifeEvent.event_date >= today,
            LifeEvent.event_date <= today + timedelta(days=7),
            LifeEvent.impact == "high",
        )
        .all()
    )
    if critical_events:
        reasons.append(f"Critical life event: {critical_events[0].title}")

    if reasons:
        return " | ".join(reasons)
    return None

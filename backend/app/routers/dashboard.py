from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_advisor
from app.models.advisor import Advisor
from app.models.client import Client
from app.models.life_event import LifeEvent
from app.models.task import AdvisorTask
from app.models.communication import CommunicationLog
from app.models.call_cycle import ClientCallCycle
from app.schemas.dashboard import (
    MorningBriefingResponse,
    DashboardEventResponse,
    RecommendedContactResponse,
    TaskResponse,
    MarketMoverResponse,
)
from app.services.briefing_service import generate_morning_briefing
from app.mock.market_data import MOCK_MARKET_MOVERS

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/briefing/morning", response_model=MorningBriefingResponse)
async def get_morning_briefing(
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    return await generate_morning_briefing(advisor, db)


@router.get("/dashboard/events", response_model=list[DashboardEventResponse])
def get_events(
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    today = date.today()
    future = today + timedelta(days=30)

    events = (
        db.query(LifeEvent)
        .join(Client)
        .filter(
            Client.advisor_id == advisor.id,
            LifeEvent.event_date >= today,
            LifeEvent.event_date <= future,
        )
        .order_by(LifeEvent.event_date)
        .all()
    )

    result = []
    for i, event in enumerate(events):
        client = db.query(Client).filter(Client.id == event.client_id).first()
        days_away = (event.event_date - today).days
        urgency = "high" if days_away <= 7 else ("medium" if days_away <= 14 else "low")

        result.append(DashboardEventResponse(
            id=event.id,
            client_name=f"{client.first_name} {client.last_name}" if client else "Unknown",
            event_type=event.event_type,
            description=event.title,
            date=event.event_date.isoformat(),
            urgency=urgency,
        ))

    return result


@router.get("/dashboard/recommended-contacts", response_model=list[RecommendedContactResponse])
def get_recommended_contacts(
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    clients = db.query(Client).filter(
        Client.advisor_id == advisor.id,
        Client.status == "active",
    ).all()

    recommendations = []
    for client in clients:
        # Use call cycle status for prioritization
        cycle = db.query(ClientCallCycle).filter(ClientCallCycle.client_id == client.id).first()

        last_contact_str = None
        if cycle and cycle.last_contacted_at:
            last_contact_str = cycle.last_contacted_at.isoformat()

        # Check upcoming high-impact life events
        upcoming_events = (
            db.query(LifeEvent)
            .filter(
                LifeEvent.client_id == client.id,
                LifeEvent.event_date >= date.today(),
                LifeEvent.event_date <= date.today() + timedelta(days=30),
                LifeEvent.impact == "high",
            )
            .all()
        )

        # Determine if client should be recommended based on call cycle
        should_recommend = False
        reason = ""
        priority = "medium"

        if cycle and cycle.status == "urgent_override":
            should_recommend = True
            reason = f"Urgent: {cycle.override_reason or 'Override triggered'}"
            priority = "high"
        elif cycle and cycle.status == "overdue":
            should_recommend = True
            days_overdue = (date.today() - cycle.next_due_at).days if cycle.next_due_at else 0
            reason = f"Overdue by {days_overdue} days ({cycle.call_cycle_days}-day cycle)"
            priority = "high"
        elif upcoming_events:
            should_recommend = True
            reason = f"Upcoming: {upcoming_events[0].title}"
            priority = "high"
        elif cycle and cycle.status == "due_soon":
            should_recommend = True
            days_until = (cycle.next_due_at - date.today()).days if cycle.next_due_at else 0
            reason = f"Contact due in {days_until} days"
            priority = "medium"
        elif not cycle:
            # Fallback for clients without call cycles
            last_comm = (
                db.query(CommunicationLog)
                .filter(CommunicationLog.client_id == client.id)
                .order_by(CommunicationLog.created_at.desc())
                .first()
            )
            if last_comm:
                days_since = (date.today() - last_comm.created_at.date()).days
                last_contact_str = last_comm.created_at.isoformat()
                if days_since >= 14:
                    should_recommend = True
                    reason = f"Last contact {days_since} days ago"
                    priority = "high" if days_since >= 30 else "medium"

        if should_recommend:
            recommendations.append(RecommendedContactResponse(
                client_id=client.id,
                client_name=f"{client.first_name} {client.last_name}",
                reason=reason,
                last_contact=last_contact_str,
                priority=priority,
            ))

    # Sort: urgent_override first, then overdue, then due_soon
    priority_order = {"high": 0, "medium": 1, "low": 2}
    recommendations.sort(key=lambda r: priority_order.get(r.priority, 2))
    return recommendations[:10]


@router.get("/dashboard/tasks", response_model=list[TaskResponse])
def get_tasks(
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    tasks = (
        db.query(AdvisorTask)
        .filter(
            AdvisorTask.advisor_id == advisor.id,
            AdvisorTask.status.in_(["pending", "in_progress"]),
        )
        .order_by(AdvisorTask.due_date.asc().nulls_last())
        .limit(20)
        .all()
    )

    result = []
    for task in tasks:
        client_name = None
        if task.client_id:
            client = db.query(Client).filter(Client.id == task.client_id).first()
            if client:
                client_name = f"{client.first_name} {client.last_name}"

        result.append(TaskResponse(
            id=task.id,
            title=task.title,
            description=task.description,
            priority=task.priority,
            status=task.status,
            due_date=task.due_date,
            client_name=client_name,
            created_at=task.created_at,
        ))

    return result


@router.get("/dashboard/market-movers", response_model=list[MarketMoverResponse])
def get_market_movers():
    return [MarketMoverResponse(**m) for m in MOCK_MARKET_MOVERS]

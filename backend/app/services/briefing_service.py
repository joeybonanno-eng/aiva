"""Morning briefing generation using Claude."""

from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models.advisor import Advisor
from app.models.client import Client
from app.models.life_event import LifeEvent
from app.models.task import AdvisorTask
from app.models.meeting import Meeting
from app.models.alert import Alert
from app.schemas.dashboard import MorningBriefingResponse
from app.config import settings

try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False


async def generate_morning_briefing(advisor: Advisor, db: Session) -> MorningBriefingResponse:
    """Generate AI morning briefing for the advisor."""
    today = date.today()

    # Gather context
    client_count = db.query(Client).filter(Client.advisor_id == advisor.id).count()
    total_aum = db.query(Client).filter(Client.advisor_id == advisor.id).with_entities(
        Client.aum
    ).all()
    total_aum_value = sum(a[0] for a in total_aum if a[0])

    # Upcoming events (next 14 days)
    upcoming_events = (
        db.query(LifeEvent)
        .join(Client)
        .filter(
            Client.advisor_id == advisor.id,
            LifeEvent.event_date >= today,
            LifeEvent.event_date <= today + timedelta(days=14),
        )
        .order_by(LifeEvent.event_date)
        .all()
    )

    # Pending tasks
    pending_tasks = (
        db.query(AdvisorTask)
        .filter(
            AdvisorTask.advisor_id == advisor.id,
            AdvisorTask.status.in_(["pending", "in_progress"]),
        )
        .order_by(AdvisorTask.due_date.asc().nulls_last())
        .limit(5)
        .all()
    )

    # Unread alerts
    unread_alerts = (
        db.query(Alert)
        .filter(Alert.advisor_id == advisor.id, Alert.is_read == False)
        .order_by(Alert.created_at.desc())
        .limit(5)
        .all()
    )

    # Upcoming meetings
    upcoming_meetings = (
        db.query(Meeting)
        .filter(
            Meeting.advisor_id == advisor.id,
            Meeting.status == "scheduled",
        )
        .limit(3)
        .all()
    )

    # Build event list for response (matches frontend MorningBriefing.key_events shape)
    key_events = []
    for event in upcoming_events:
        client = db.query(Client).filter(Client.id == event.client_id).first()
        client_name = f"{client.first_name} {client.last_name}" if client else "Unknown"
        days_away = (event.event_date - today).days
        urgency = "high" if days_away <= 7 else ("medium" if days_away <= 14 else "low")
        key_events.append({
            "id": str(event.id),
            "client_id": event.client_id,
            "title": f"{client_name} — {event.title}",
            "description": f"{event.event_date.strftime('%b %d')} ({days_away}d away)",
            "type": event.event_type,
            "urgency": urgency,
        })

    priority_tasks = []
    for task in pending_tasks:
        client_name = None
        if task.client_id:
            client = db.query(Client).filter(Client.id == task.client_id).first()
            if client:
                client_name = f"{client.first_name} {client.last_name}"
        priority_tasks.append({
            "id": task.id,
            "title": task.title,
            "priority": task.priority,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "client_name": client_name,
        })

    # Try to generate AI summary
    summary = _build_fallback_summary(advisor, client_count, total_aum_value, upcoming_events, pending_tasks, unread_alerts)

    if HAS_ANTHROPIC and settings.ANTHROPIC_API_KEY:
        try:
            summary = await _generate_ai_summary(
                advisor, client_count, total_aum_value,
                key_events, priority_tasks, unread_alerts,
            )
        except Exception:
            pass  # Fall back to template summary

    market_highlights = [
        {"symbol": "SPY", "name": "S&P 500 ETF", "change_pct": 0.47, "relevance": "Tech sector leading gains"},
        {"symbol": "TLT", "name": "20+ Year Treasury", "change_pct": -0.31, "relevance": "10Y yield at 4.23%, down 3bps"},
        {"symbol": "GLD", "name": "Gold ETF", "change_pct": 1.24, "relevance": "New highs amid geopolitical uncertainty"},
        {"symbol": "QQQ", "name": "Nasdaq 100 ETF", "change_pct": 0.82, "relevance": "AI and semiconductor rally continues"},
    ]

    return MorningBriefingResponse(
        summary=summary,
        key_events=key_events,
        recommended_contacts=[],  # Populated by separate endpoint
        market_highlights=market_highlights,
        priority_tasks=priority_tasks,
    )


async def _generate_ai_summary(
    advisor: Advisor,
    client_count: int,
    total_aum: float,
    key_events: list[dict],
    priority_tasks: list[dict],
    unread_alerts: list,
) -> str:
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    events_text = "\n".join(
        f"- {e['client']}: {e['event']} on {e['date']} (impact: {e['impact']})"
        for e in key_events
    )
    tasks_text = "\n".join(
        f"- [{t['priority'].upper()}] {t['title']}" + (f" for {t['client']}" if t.get('client') else "")
        for t in priority_tasks
    )
    alerts_text = "\n".join(
        f"- [{a.severity.upper()}] {a.title}: {a.description}"
        for a in unread_alerts
    )

    prompt = f"""You are AIVA, an AI virtual advisor assistant for {advisor.full_name}, a financial advisor.

Generate a concise, actionable morning briefing. Be direct and professional — like a Bloomberg terminal notification.

Context:
- Managing {client_count} clients with ${total_aum:,.0f} total AUM
- Today's date: {date.today().isoformat()}

Upcoming Client Events (next 14 days):
{events_text or "None"}

Priority Tasks:
{tasks_text or "None"}

Unread Alerts:
{alerts_text or "None"}

Write a 3-4 sentence morning briefing that highlights the most urgent items and recommended priorities for today. Be specific about client names and actions needed."""

    response = client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    )

    return response.content[0].text


def _build_fallback_summary(
    advisor: Advisor,
    client_count: int,
    total_aum: float,
    upcoming_events: list,
    pending_tasks: list,
    unread_alerts: list,
) -> str:
    """Template-based fallback when Claude is unavailable."""
    parts = [f"Good morning, {advisor.full_name}. You're managing {client_count} clients with ${total_aum:,.0f} in total AUM."]

    if unread_alerts:
        critical = [a for a in unread_alerts if a.severity == "critical"]
        if critical:
            parts.append(f"You have {len(critical)} critical alert(s) requiring immediate attention: {critical[0].title}.")

    if upcoming_events:
        parts.append(f"There are {len(upcoming_events)} client events in the next 14 days.")

    if pending_tasks:
        high_priority = [t for t in pending_tasks if t.priority == "high"]
        if high_priority:
            parts.append(f"{len(high_priority)} high-priority task(s) need your attention today, starting with: {high_priority[0].title}.")

    return " ".join(parts)

"""Client intelligence — AI-powered insights for 360-degree client view."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.client import Client
from app.models.life_event import LifeEvent
from app.models.communication import CommunicationLog
from app.schemas.client import ClientInsightsResponse
from app.config import settings

try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False


async def generate_client_insights(client: Client, db: Session) -> ClientInsightsResponse:
    """Generate AI-powered insights for a client."""
    # Gather context
    life_events = db.query(LifeEvent).filter(LifeEvent.client_id == client.id).all()
    recent_comms = (
        db.query(CommunicationLog)
        .filter(CommunicationLog.client_id == client.id)
        .order_by(CommunicationLog.created_at.desc())
        .limit(10)
        .all()
    )

    portfolio_text = ""
    for holding in client.portfolio_holdings:
        portfolio_text += f"  {holding.ticker} ({holding.asset_class}): ${holding.value:,.0f} ({holding.allocation_pct}%), G/L: {holding.gain_loss_pct:+.1f}%\n"

    events_text = "\n".join(
        f"  - {e.title} ({e.event_type}, {e.event_date}, impact: {e.impact})"
        for e in life_events
    )

    comms_text = "\n".join(
        f"  - [{c.channel}/{c.direction}] {c.subject} ({c.created_at.strftime('%Y-%m-%d')})"
        for c in recent_comms
    )

    if HAS_ANTHROPIC and settings.ANTHROPIC_API_KEY:
        try:
            return await _generate_with_claude(client, portfolio_text, events_text, comms_text)
        except Exception:
            pass

    # Fallback insights
    insights = f"{client.first_name} {client.last_name} is a {client.status} client with ${client.aum:,.0f} AUM and a {client.risk_profile} risk profile."
    if life_events:
        insights += f" They have {len(life_events)} upcoming life events to monitor."
    if client.notes:
        insights += f" Key notes: {client.notes}"

    return ClientInsightsResponse(
        client_id=client.id,
        insights=insights,
        recommended_actions=["Schedule a portfolio review", "Check for rebalancing opportunities"],
    )


async def _generate_with_claude(
    client: Client,
    portfolio_text: str,
    events_text: str,
    comms_text: str,
) -> ClientInsightsResponse:
    api_client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    prompt = f"""You are AIVA, an AI financial advisor assistant. Provide brief, actionable insights for this client.

Client: {client.first_name} {client.last_name}
Company: {client.company}, Title: {client.title}
AUM: ${client.aum:,.0f}, Risk Profile: {client.risk_profile}
Status: {client.status}
Notes: {client.notes or 'None'}

Portfolio:
{portfolio_text or 'No holdings data'}

Life Events:
{events_text or 'None'}

Recent Communications:
{comms_text or 'None'}

Provide:
1. A 2-3 sentence insight summary highlighting key opportunities and risks
2. A list of 3-5 recommended actions (be specific)

Format: Start with the insight paragraph, then list actions on separate lines starting with "- "."""

    response = api_client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=800,
        messages=[{"role": "user", "content": prompt}],
    )

    text = response.content[0].text
    lines = text.strip().split("\n")

    # Split into insight text and actions
    insight_lines = []
    actions = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("- "):
            actions.append(stripped[2:])
        else:
            insight_lines.append(stripped)

    insights = " ".join(l for l in insight_lines if l)

    return ClientInsightsResponse(
        client_id=client.id,
        insights=insights,
        recommended_actions=actions or ["Schedule a review meeting"],
    )

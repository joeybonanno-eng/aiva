"""Smart message drafting using Claude."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.advisor import Advisor
from app.models.client import Client
from app.models.communication import MessageDraft, CommunicationLog
from app.schemas.message import CreateMessageDraftRequest
from app.config import settings

try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False


async def generate_message_draft(
    advisor: Advisor,
    client: Client,
    request: CreateMessageDraftRequest,
    db: Session,
) -> MessageDraft:
    """Generate an AI-crafted message draft for a client."""
    body = request.body

    if not body:
        # Generate body with AI
        recent_comms = (
            db.query(CommunicationLog)
            .filter(CommunicationLog.client_id == client.id)
            .order_by(CommunicationLog.created_at.desc())
            .limit(5)
            .all()
        )

        comms_context = "\n".join(
            f"  - [{c.channel}] {c.subject} ({c.created_at.strftime('%Y-%m-%d')})"
            for c in recent_comms
        )

        if HAS_ANTHROPIC and settings.ANTHROPIC_API_KEY:
            try:
                body = await _generate_with_claude(
                    advisor, client, request, comms_context
                )
            except Exception:
                body = _build_fallback_message(advisor, client, request)
        else:
            body = _build_fallback_message(advisor, client, request)

    draft = MessageDraft(
        advisor_id=advisor.id,
        client_id=client.id,
        subject=request.subject or f"Follow-up: {client.first_name}",
        body=body,
        tone=request.tone,
        channel=request.channel,
        status="draft",
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return draft


async def _generate_with_claude(
    advisor: Advisor,
    client: Client,
    request: CreateMessageDraftRequest,
    comms_context: str,
) -> str:
    api_client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    prompt = f"""Draft a {request.tone} {request.channel} message from financial advisor {advisor.full_name} to client {client.first_name} {client.last_name}.

Client: {client.first_name} {client.last_name}, {client.title} at {client.company}
AUM: ${client.aum:,.0f}
Subject: {request.subject or 'General follow-up'}

Recent communication history:
{comms_context or 'No recent communications'}

Client notes: {client.notes or 'None'}

Write ONLY the message body — no subject line. Tone: {request.tone}. Channel: {request.channel}.
Keep it concise and professional."""

    response = api_client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}],
    )

    return response.content[0].text


def _build_fallback_message(
    advisor: Advisor,
    client: Client,
    request: CreateMessageDraftRequest,
) -> str:
    return f"""Dear {client.first_name},

I wanted to reach out regarding {request.subject or 'your financial planning'}. I hope this message finds you well.

Please let me know if you'd like to schedule a time to discuss further.

Best regards,
{advisor.full_name}"""

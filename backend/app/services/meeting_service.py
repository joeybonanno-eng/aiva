"""Meeting AI processing — summary, action extraction, follow-up email."""

from __future__ import annotations

import json
from datetime import date, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.models.advisor import Advisor
from app.models.meeting import Meeting, MeetingAction
from app.models.client import Client
from app.config import settings

try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False


async def process_meeting_ai(meeting: Meeting, advisor: Advisor, db: Session):
    """Chain: summarize → extract actions → draft follow-up email."""
    # Build transcript text
    transcript_text = "\n".join(
        f"[{seg.timestamp:.0f}s] {seg.speaker}: {seg.text}"
        for seg in sorted(meeting.transcript_segments, key=lambda s: s.timestamp)
    )

    client = None
    client_context = ""
    if meeting.client_id:
        client = db.query(Client).filter(Client.id == meeting.client_id).first()
        if client:
            client_context = f"\nClient: {client.first_name} {client.last_name}, {client.title} at {client.company}. AUM: ${client.aum:,.0f}. Risk profile: {client.risk_profile}."

    if HAS_ANTHROPIC and settings.ANTHROPIC_API_KEY:
        try:
            summary, actions, follow_up = await _process_with_claude(
                transcript_text, client_context, advisor, client
            )
            meeting.summary = summary
            meeting.follow_up_draft = follow_up

            for action_data in actions:
                due_days = action_data.get("due_days", 7)
                action = MeetingAction(
                    meeting_id=meeting.id,
                    description=action_data.get("description", ""),
                    assignee=action_data.get("assignee", "Advisor"),
                    priority=action_data.get("priority", "medium"),
                    due_date=date.today() + timedelta(days=due_days),
                    status="pending",
                )
                db.add(action)

            db.flush()
            return
        except Exception:
            pass

    # Fallback: template-based processing
    meeting.summary = f"Meeting with {client.first_name + ' ' + client.last_name if client else 'client'} — {meeting.title}. {len(meeting.transcript_segments)} transcript segments recorded over {meeting.meeting_type} session."
    meeting.follow_up_draft = _build_fallback_email(meeting, client, advisor)

    # Add a generic action item
    action = MeetingAction(
        meeting_id=meeting.id,
        description=f"Review meeting notes and follow up on discussed items",
        assignee="Advisor",
        priority="medium",
        due_date=date.today() + timedelta(days=3),
        status="pending",
    )
    db.add(action)
    db.flush()


async def _process_with_claude(
    transcript: str,
    client_context: str,
    advisor: Advisor,
    client: Client | None,
) -> tuple[str, list[dict], str]:
    """Use Claude to summarize, extract actions, and draft follow-up."""
    api_client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    # Step 1: Summary + Action Items
    summary_prompt = f"""You are AIVA, an AI assistant for financial advisor {advisor.full_name}.

Analyze this meeting transcript and provide:
1. A concise meeting summary (3-5 sentences)
2. A JSON array of action items

{client_context}

Transcript:
{transcript}

Respond in this exact JSON format:
{{
  "summary": "...",
  "action_items": [
    {{
      "description": "...",
      "assignee": "Advisor" or "Client",
      "priority": "high" or "medium" or "low",
      "due_days": 7
    }}
  ]
}}"""

    response = api_client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=2000,
        messages=[{"role": "user", "content": summary_prompt}],
    )

    result_text = response.content[0].text
    # Extract JSON from response
    try:
        # Try to find JSON in the response
        start = result_text.find("{")
        end = result_text.rfind("}") + 1
        if start >= 0 and end > start:
            parsed = json.loads(result_text[start:end])
            summary = parsed.get("summary", "Meeting summary unavailable.")
            actions = parsed.get("action_items", [])
        else:
            summary = result_text
            actions = []
    except json.JSONDecodeError:
        summary = result_text
        actions = []

    # Step 2: Follow-up email
    client_name = f"{client.first_name}" if client else "there"
    email_prompt = f"""Draft a professional follow-up email after this meeting.

Advisor: {advisor.full_name}
{client_context}
Meeting Summary: {summary}

Action Items:
{json.dumps(actions, indent=2)}

Write a concise, warm but professional follow-up email addressed to {client_name}. Include:
- Thank them for the meeting
- Recap key discussion points
- List action items and next steps
- Professional sign-off from {advisor.full_name}

Do not include subject line — just the email body."""

    email_response = api_client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=1000,
        messages=[{"role": "user", "content": email_prompt}],
    )

    follow_up = email_response.content[0].text

    return summary, actions, follow_up


def _build_fallback_email(meeting: Meeting, client: Client | None, advisor: Advisor) -> str:
    """Template-based follow-up email when Claude is unavailable."""
    client_name = client.first_name if client else "there"
    return f"""Dear {client_name},

Thank you for taking the time to meet today regarding {meeting.title}. I appreciated our discussion and want to ensure we stay on track with the items we covered.

I'll be reviewing my notes from our conversation and will follow up with any action items within the next few days.

Please don't hesitate to reach out if you have any questions or additional thoughts.

Best regards,
{advisor.full_name}"""

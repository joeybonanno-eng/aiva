from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_advisor
from app.models.advisor import Advisor
from app.models.client import Client
from app.models.communication import MessageDraft
from app.schemas.message import (
    CreateMessageDraftRequest,
    MessageDraftResponse,
    MessageDraftListResponse,
)
from app.services.message_service import generate_message_draft

router = APIRouter(prefix="/api/messages", tags=["messages"])


@router.post("/drafts", response_model=MessageDraftResponse)
async def create_draft(
    request: CreateMessageDraftRequest,
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    client = db.query(Client).filter(
        Client.id == request.client_id,
        Client.advisor_id == advisor.id,
    ).first()

    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    draft = await generate_message_draft(advisor, client, request, db)

    client_name = f"{client.first_name} {client.last_name}"
    return MessageDraftResponse(
        id=draft.id,
        advisor_id=draft.advisor_id,
        client_id=draft.client_id,
        client_name=client_name,
        subject=draft.subject,
        body=draft.body,
        tone=draft.tone,
        channel=draft.channel,
        status=draft.status,
        created_at=draft.created_at,
    )


@router.get("/drafts", response_model=MessageDraftListResponse)
def list_drafts(
    client_id: int = Query(None),
    status: str = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    query = db.query(MessageDraft).filter(MessageDraft.advisor_id == advisor.id)

    if client_id:
        query = query.filter(MessageDraft.client_id == client_id)
    if status:
        query = query.filter(MessageDraft.status == status)

    total = query.count()
    drafts = query.order_by(MessageDraft.created_at.desc()).offset(offset).limit(limit).all()

    items = []
    for draft in drafts:
        client = db.query(Client).filter(Client.id == draft.client_id).first()
        client_name = f"{client.first_name} {client.last_name}" if client else None

        items.append(MessageDraftResponse(
            id=draft.id,
            advisor_id=draft.advisor_id,
            client_id=draft.client_id,
            client_name=client_name,
            subject=draft.subject,
            body=draft.body,
            tone=draft.tone,
            channel=draft.channel,
            status=draft.status,
            created_at=draft.created_at,
        ))

    return MessageDraftListResponse(items=items, total=total)

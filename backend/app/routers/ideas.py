"""Ideas router — actionable outreach ideas."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.dependencies import get_current_advisor
from app.models.advisor import Advisor
from app.models.client import Client
from app.models.client_idea import ClientIdea
from app.models.communication import CommunicationLog
from app.schemas.idea import IdeaResponse, IdeaListResponse, IdeaCustomizeRequest
from app.services.idea_engine import scan_and_generate_ideas

router = APIRouter(prefix="/api/ideas", tags=["ideas"])


def _idea_to_response(idea: ClientIdea, db: Session) -> IdeaResponse:
    client = db.query(Client).filter(Client.id == idea.client_id).first()
    return IdeaResponse(
        id=idea.id,
        client_id=idea.client_id,
        client_name=f"{client.first_name} {client.last_name}" if client else "Unknown",
        template_id=idea.template_id,
        trigger_type=idea.trigger_type,
        trigger_data=idea.trigger_data,
        subject=idea.subject,
        rendered_content=idea.rendered_content,
        channel=idea.channel,
        score=idea.score,
        status=idea.status,
        created_at=idea.created_at,
    )


@router.get("", response_model=IdeaListResponse)
def list_ideas(
    status: str = None,
    limit: int = 50,
    offset: int = 0,
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    query = db.query(ClientIdea).filter(ClientIdea.advisor_id == advisor.id)
    if status:
        query = query.filter(ClientIdea.status == status)

    total = query.count()
    ideas = query.order_by(ClientIdea.score.desc()).offset(offset).limit(limit).all()

    return IdeaListResponse(
        items=[_idea_to_response(idea, db) for idea in ideas],
        total=total,
    )


@router.get("/{idea_id}", response_model=IdeaResponse)
def get_idea(
    idea_id: int,
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    idea = db.query(ClientIdea).filter(
        ClientIdea.id == idea_id,
        ClientIdea.advisor_id == advisor.id,
    ).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    return _idea_to_response(idea, db)


@router.post("/{idea_id}/send")
def send_idea(
    idea_id: int,
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    idea = db.query(ClientIdea).filter(
        ClientIdea.id == idea_id,
        ClientIdea.advisor_id == advisor.id,
    ).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    idea.status = "sent"
    idea.updated_at = datetime.utcnow()

    # Create communication log entry
    comm = CommunicationLog(
        client_id=idea.client_id,
        advisor_id=advisor.id,
        channel=idea.channel,
        direction="outbound",
        subject=idea.subject,
        content=idea.rendered_content,
    )
    db.add(comm)
    db.commit()

    return {"success": True, "message": "Idea sent and logged"}


@router.post("/{idea_id}/dismiss")
def dismiss_idea(
    idea_id: int,
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    idea = db.query(ClientIdea).filter(
        ClientIdea.id == idea_id,
        ClientIdea.advisor_id == advisor.id,
    ).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    idea.status = "dismissed"
    idea.updated_at = datetime.utcnow()
    db.commit()

    return {"success": True, "message": "Idea dismissed"}


@router.post("/{idea_id}/customize", response_model=IdeaResponse)
def customize_idea(
    idea_id: int,
    request: IdeaCustomizeRequest,
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    idea = db.query(ClientIdea).filter(
        ClientIdea.id == idea_id,
        ClientIdea.advisor_id == advisor.id,
    ).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    if request.subject is not None:
        idea.subject = request.subject
    if request.rendered_content is not None:
        idea.rendered_content = request.rendered_content
    if request.channel is not None:
        idea.channel = request.channel

    idea.updated_at = datetime.utcnow()
    db.commit()

    return _idea_to_response(idea, db)


@router.post("/generate", response_model=IdeaListResponse)
def generate_ideas(
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    ideas = scan_and_generate_ideas(advisor.id, db)
    return IdeaListResponse(
        items=[_idea_to_response(idea, db) for idea in ideas],
        total=len(ideas),
    )

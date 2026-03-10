from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_advisor
from app.models.advisor import Advisor
from app.models.client import Client
from app.models.communication import CommunicationLog
from app.schemas.client import (
    ClientResponse,
    ClientListResponse,
    ClientDetailResponse,
    PortfolioHoldingResponse,
    LifeEventResponse,
    CommunicationLogResponse,
    ClientInsightsResponse,
)
from app.services.client_intelligence_service import generate_client_insights

router = APIRouter(prefix="/api/clients", tags=["clients"])


@router.get("/", response_model=ClientListResponse)
def list_clients(
    status: str = Query(None),
    search: str = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    query = db.query(Client).filter(Client.advisor_id == advisor.id)

    if status:
        query = query.filter(Client.status == status)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Client.first_name.ilike(search_term))
            | (Client.last_name.ilike(search_term))
            | (Client.company.ilike(search_term))
            | (Client.email.ilike(search_term))
        )

    total = query.count()
    clients = query.order_by(Client.last_name).offset(offset).limit(limit).all()

    return ClientListResponse(
        items=[ClientResponse.model_validate(c) for c in clients],
        total=total,
    )


@router.get("/{client_id}", response_model=ClientDetailResponse)
def get_client(
    client_id: int,
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    client = (
        db.query(Client)
        .options(
            joinedload(Client.portfolio_holdings),
            joinedload(Client.life_events),
        )
        .filter(Client.id == client_id, Client.advisor_id == advisor.id)
        .first()
    )

    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    recent_comms = (
        db.query(CommunicationLog)
        .filter(CommunicationLog.client_id == client_id)
        .order_by(CommunicationLog.created_at.desc())
        .limit(20)
        .all()
    )

    return ClientDetailResponse(
        **{c.key: getattr(client, c.key) for c in Client.__table__.columns},
        portfolio_holdings=[PortfolioHoldingResponse.model_validate(h) for h in client.portfolio_holdings],
        life_events=[LifeEventResponse.model_validate(e) for e in client.life_events],
        recent_communications=[CommunicationLogResponse.model_validate(c) for c in recent_comms],
    )


@router.get("/{client_id}/portfolio", response_model=list[PortfolioHoldingResponse])
def get_client_portfolio(
    client_id: int,
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    client = db.query(Client).filter(Client.id == client_id, Client.advisor_id == advisor.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    from app.models.portfolio import ClientPortfolio
    holdings = db.query(ClientPortfolio).filter(ClientPortfolio.client_id == client_id).all()
    return [PortfolioHoldingResponse.model_validate(h) for h in holdings]


@router.get("/{client_id}/life-events", response_model=list[LifeEventResponse])
def get_client_life_events(
    client_id: int,
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    client = db.query(Client).filter(Client.id == client_id, Client.advisor_id == advisor.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    from app.models.life_event import LifeEvent
    events = db.query(LifeEvent).filter(LifeEvent.client_id == client_id).order_by(LifeEvent.event_date).all()
    return [LifeEventResponse.model_validate(e) for e in events]


@router.get("/{client_id}/communications", response_model=list[CommunicationLogResponse])
def get_client_communications(
    client_id: int,
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    client = db.query(Client).filter(Client.id == client_id, Client.advisor_id == advisor.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    comms = (
        db.query(CommunicationLog)
        .filter(CommunicationLog.client_id == client_id)
        .order_by(CommunicationLog.created_at.desc())
        .limit(50)
        .all()
    )
    return [CommunicationLogResponse.model_validate(c) for c in comms]


@router.get("/{client_id}/insights", response_model=ClientInsightsResponse)
async def get_client_insights(
    client_id: int,
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    client = (
        db.query(Client)
        .options(
            joinedload(Client.portfolio_holdings),
            joinedload(Client.life_events),
        )
        .filter(Client.id == client_id, Client.advisor_id == advisor.id)
        .first()
    )

    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    return await generate_client_insights(client, db)

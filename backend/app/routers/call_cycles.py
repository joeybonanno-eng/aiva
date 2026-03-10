"""Call cycle management router."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_advisor
from app.models.advisor import Advisor
from app.models.client import Client
from app.models.call_cycle import ClientCallCycle
from app.schemas.call_cycle import CallCycleResponse, CallCycleUpdateRequest, CallCycleListResponse
from app.services.call_cycle_service import set_call_cycle, update_call_cycle_status

router = APIRouter(prefix="/api", tags=["call-cycles"])


def _cycle_to_response(cycle: ClientCallCycle, db: Session) -> CallCycleResponse:
    client = db.query(Client).filter(Client.id == cycle.client_id).first()
    return CallCycleResponse(
        client_id=cycle.client_id,
        client_name=f"{client.first_name} {client.last_name}" if client else "Unknown",
        call_cycle_days=cycle.call_cycle_days,
        last_contacted_at=cycle.last_contacted_at,
        next_due_at=cycle.next_due_at,
        override_active=cycle.override_active,
        override_reason=cycle.override_reason,
        status=cycle.status,
    )


@router.get("/clients/{client_id}/call-cycle", response_model=CallCycleResponse)
def get_client_call_cycle(
    client_id: int,
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    client = db.query(Client).filter(Client.id == client_id, Client.advisor_id == advisor.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    cycle = update_call_cycle_status(client_id, db)
    db.commit()
    return _cycle_to_response(cycle, db)


@router.put("/clients/{client_id}/call-cycle", response_model=CallCycleResponse)
def update_client_call_cycle(
    client_id: int,
    request: CallCycleUpdateRequest,
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    client = db.query(Client).filter(Client.id == client_id, Client.advisor_id == advisor.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    cycle = set_call_cycle(client_id, request.call_cycle_days, db)
    db.commit()
    return _cycle_to_response(cycle, db)


@router.get("/call-cycles", response_model=CallCycleListResponse)
def list_call_cycles(
    status: str = None,
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    query = (
        db.query(ClientCallCycle)
        .join(Client)
        .filter(Client.advisor_id == advisor.id)
    )
    if status:
        query = query.filter(ClientCallCycle.status == status)

    cycles = query.all()
    total = len(cycles)

    return CallCycleListResponse(
        items=[_cycle_to_response(c, db) for c in cycles],
        total=total,
    )


@router.get("/call-cycles/overdue", response_model=CallCycleListResponse)
def get_overdue_cycles(
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    cycles = (
        db.query(ClientCallCycle)
        .join(Client)
        .filter(
            Client.advisor_id == advisor.id,
            ClientCallCycle.status.in_(["overdue", "urgent_override"]),
        )
        .all()
    )

    return CallCycleListResponse(
        items=[_cycle_to_response(c, db) for c in cycles],
        total=len(cycles),
    )

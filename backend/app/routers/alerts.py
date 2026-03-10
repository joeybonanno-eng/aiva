from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_advisor
from app.models.advisor import Advisor
from app.models.alert import Alert
from app.models.client import Client
from app.schemas.alert import AlertResponse, AlertListResponse, AlertActionRequest

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("/", response_model=AlertListResponse)
def list_alerts(
    type: str = Query(None),
    severity: str = Query(None),
    is_read: bool = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    query = db.query(Alert).filter(Alert.advisor_id == advisor.id)

    if type:
        query = query.filter(Alert.type == type)
    if severity:
        query = query.filter(Alert.severity == severity)
    if is_read is not None:
        query = query.filter(Alert.is_read == is_read)

    total = query.count()
    alerts = query.order_by(Alert.created_at.desc()).offset(offset).limit(limit).all()

    items = []
    for alert in alerts:
        client_name = None
        if alert.client_id:
            client = db.query(Client).filter(Client.id == alert.client_id).first()
            if client:
                client_name = f"{client.first_name} {client.last_name}"

        items.append(AlertResponse(
            id=alert.id,
            type=alert.type,
            title=alert.title,
            description=alert.description,
            severity=alert.severity,
            client_id=alert.client_id,
            client_name=client_name,
            is_read=alert.is_read,
            action_url=alert.action_url,
            created_at=alert.created_at,
        ))

    return AlertListResponse(items=items, total=total)


@router.post("/{alert_id}/act")
def act_on_alert(
    alert_id: int,
    request: AlertActionRequest,
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    alert = db.query(Alert).filter(
        Alert.id == alert_id,
        Alert.advisor_id == advisor.id,
    ).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if request.action == "dismiss":
        alert.is_read = True
    elif request.action == "acknowledge":
        alert.is_read = True
    elif request.action == "snooze":
        pass  # Could implement snooze logic

    db.commit()
    return {"status": "ok", "action": request.action}

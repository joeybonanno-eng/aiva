from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AlertResponse(BaseModel):
    id: int
    type: str
    title: str
    description: Optional[str] = None
    severity: str
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    is_read: bool
    action_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AlertListResponse(BaseModel):
    items: list[AlertResponse]
    total: int


class AlertActionRequest(BaseModel):
    action: str  # dismiss/acknowledge/snooze

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CreateMessageDraftRequest(BaseModel):
    client_id: int
    subject: Optional[str] = None
    body: Optional[str] = None
    tone: str = "professional"
    channel: str = "email"


class MessageDraftResponse(BaseModel):
    id: int
    advisor_id: int
    client_id: int
    client_name: Optional[str] = None
    subject: Optional[str] = None
    body: str
    tone: str
    channel: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageDraftListResponse(BaseModel):
    items: list[MessageDraftResponse]
    total: int

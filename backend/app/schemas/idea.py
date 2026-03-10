from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class IdeaResponse(BaseModel):
    id: int
    client_id: int
    client_name: str
    template_id: Optional[int] = None
    trigger_type: str
    trigger_data: Optional[dict] = None
    subject: str
    rendered_content: str
    channel: str
    score: float
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}

class IdeaListResponse(BaseModel):
    items: list[IdeaResponse]
    total: int

class IdeaActionRequest(BaseModel):
    pass

class IdeaCustomizeRequest(BaseModel):
    subject: Optional[str] = None
    rendered_content: Optional[str] = None
    channel: Optional[str] = None

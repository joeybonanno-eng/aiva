from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class CallCycleResponse(BaseModel):
    client_id: int
    client_name: str
    call_cycle_days: int
    last_contacted_at: Optional[datetime] = None
    next_due_at: Optional[date] = None
    override_active: bool
    override_reason: Optional[str] = None
    status: str

    model_config = {"from_attributes": True}

class CallCycleUpdateRequest(BaseModel):
    call_cycle_days: int  # 30/60/90/180

class CallCycleListResponse(BaseModel):
    items: list[CallCycleResponse]
    total: int

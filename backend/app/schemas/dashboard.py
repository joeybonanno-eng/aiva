from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class BriefingKeyEvent(BaseModel):
    id: str
    title: str
    description: str
    type: str
    urgency: str


class BriefingMarketHighlight(BaseModel):
    symbol: str
    name: str
    change_pct: float
    relevance: str


class BriefingPriorityTask(BaseModel):
    id: int
    title: str
    due_date: Optional[str] = None
    priority: str
    client_name: Optional[str] = None


class MorningBriefingResponse(BaseModel):
    summary: str
    key_events: list[BriefingKeyEvent] = []
    recommended_contacts: list[dict] = []
    market_highlights: list[BriefingMarketHighlight] = []
    priority_tasks: list[BriefingPriorityTask] = []


class DashboardEventResponse(BaseModel):
    id: int
    client_id: int
    client_name: str
    event_type: str
    description: str
    date: str
    urgency: str


class RecommendedContactResponse(BaseModel):
    client_id: int
    client_name: str
    reason: str
    last_contact: Optional[str] = None
    priority: str = "medium"


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    priority: str
    status: str
    due_date: Optional[date] = None
    client_name: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class MarketMoverResponse(BaseModel):
    symbol: str
    name: str
    price: float
    change_pct: float
    volume: int

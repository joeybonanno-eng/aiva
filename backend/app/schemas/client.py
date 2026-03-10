from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel


class PortfolioHoldingResponse(BaseModel):
    id: int
    asset_class: str
    ticker: str
    name: str
    value: float
    allocation_pct: float
    gain_loss_pct: float

    model_config = {"from_attributes": True}


class LifeEventResponse(BaseModel):
    id: int
    event_type: str
    title: str
    description: Optional[str] = None
    event_date: date
    impact: str

    model_config = {"from_attributes": True}


class CommunicationLogResponse(BaseModel):
    id: int
    channel: str
    direction: str
    subject: Optional[str] = None
    content: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ClientResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None
    aum: float
    risk_profile: str
    status: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ClientDetailResponse(ClientResponse):
    portfolio_holdings: list[PortfolioHoldingResponse] = []
    life_events: list[LifeEventResponse] = []
    recent_communications: list[CommunicationLogResponse] = []


class ClientListResponse(BaseModel):
    items: list[ClientResponse]
    total: int


class ClientInsightsResponse(BaseModel):
    client_id: int
    insights: str
    recommended_actions: list[str] = []

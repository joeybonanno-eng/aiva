from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ClientScoreResponse(BaseModel):
    client_id: int
    client_name: str
    engagement_score: float
    urgency_score: float
    revenue_score: float
    risk_score: float
    composite_score: float
    factors: Optional[dict] = None
    calculated_at: datetime

    model_config = {"from_attributes": True}

class ScoreLeaderboardEntry(BaseModel):
    client_id: int
    client_name: str
    composite_score: float
    aum: float
    status: str

class ScoreLeaderboardResponse(BaseModel):
    items: list[ScoreLeaderboardEntry]

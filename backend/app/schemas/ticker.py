from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TickerQuoteResponse(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    change_pct: float
    day_high: Optional[float] = None
    day_low: Optional[float] = None
    year_high: Optional[float] = None
    year_low: Optional[float] = None
    pe_ratio: Optional[float] = None
    market_cap: Optional[int] = None
    volume: Optional[int] = None
    analyst_rating: Optional[str] = None  # "Buy" / "Hold" / "Sell"
    analyst_target: Optional[float] = None
    cached_at: datetime

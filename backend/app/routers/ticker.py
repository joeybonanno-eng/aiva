import logging

from fastapi import APIRouter, HTTPException

from app.config import settings
from app.schemas.ticker import TickerQuoteResponse
from app.services.stock_data_service import get_ticker_quote

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ticker", tags=["ticker"])


@router.get("/{symbol}", response_model=TickerQuoteResponse)
async def ticker_quote(symbol: str):
    if not settings.FMP_API_KEY:
        raise HTTPException(status_code=503, detail="FMP_API_KEY not configured")
    try:
        result = await get_ticker_quote(symbol)
    except Exception as exc:
        logger.exception("Ticker quote failed for %s", symbol)
        raise HTTPException(status_code=502, detail=f"Upstream error: {exc}")
    if result is None:
        raise HTTPException(status_code=404, detail=f"No quote data for {symbol}")
    return result

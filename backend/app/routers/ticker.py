from fastapi import APIRouter, HTTPException

from app.schemas.ticker import TickerQuoteResponse
from app.services.stock_data_service import get_ticker_quote

router = APIRouter(prefix="/api/ticker", tags=["ticker"])


@router.get("/{symbol}", response_model=TickerQuoteResponse)
async def ticker_quote(symbol: str):
    result = await get_ticker_quote(symbol)
    if result is None:
        raise HTTPException(status_code=404, detail=f"No quote data for {symbol}")
    return result

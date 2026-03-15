import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_advisor
from app.models.advisor import Advisor
from app.models.client import Client
from app.models.portfolio import ClientPortfolio
from app.schemas.ticker import (
    TickerHoldersListResponse,
    TickerQuoteResponse,
)
from app.services.stock_data_service import get_ticker_quote

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ticker", tags=["ticker"])


@router.get("/health")
def ticker_health():
    """Check which stock data providers are available."""
    providers = []
    if settings.ALPHAVANTAGE_API_KEY:
        providers.append("alphavantage")
    try:
        import yfinance
        providers.append(f"yfinance=={yfinance.__version__}")
    except ImportError:
        pass
    return {"providers": providers}


@router.get("/{symbol}", response_model=TickerQuoteResponse)
async def ticker_quote(symbol: str):
    try:
        result = await get_ticker_quote(symbol)
    except Exception as exc:
        logger.exception("Ticker quote failed for %s", symbol)
        raise HTTPException(status_code=502, detail=f"Upstream error: {exc}")
    if result is None:
        raise HTTPException(status_code=404, detail=f"Quote unavailable for {symbol.upper()}")
    return result


@router.get("/{symbol}/holders", response_model=TickerHoldersListResponse)
def ticker_holders(
    symbol: str,
    db: Session = Depends(get_db),
    advisor: Advisor = Depends(get_current_advisor),
):
    rows = (
        db.query(ClientPortfolio, Client)
        .join(Client, ClientPortfolio.client_id == Client.id)
        .filter(
            func.upper(ClientPortfolio.ticker) == symbol.upper(),
            Client.advisor_id == advisor.id,
        )
        .all()
    )

    holders = [
        {
            "client_id": client.id,
            "client_name": f"{client.first_name} {client.last_name}",
            "value": holding.value,
            "allocation_pct": holding.allocation_pct,
            "gain_loss_pct": holding.gain_loss_pct,
        }
        for holding, client in rows
    ]

    return {"symbol": symbol.upper(), "holders": holders}

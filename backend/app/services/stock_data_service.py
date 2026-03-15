import asyncio
import time
from datetime import datetime, timezone
from typing import Optional

import httpx

from app.config import settings
from app.schemas.ticker import TickerQuoteResponse

# In-memory cache: symbol -> (TickerQuoteResponse, timestamp)
_cache: dict[str, tuple[TickerQuoteResponse, float]] = {}
_CACHE_TTL = 300  # 5 minutes

AV_BASE = "https://www.alphavantage.co/query"


def _safe_float(val) -> Optional[float]:
    if val is None or val in ("None", "-", ""):
        return None
    try:
        return float(str(val).replace("%", "").replace(",", ""))
    except (ValueError, TypeError):
        return None


def _safe_int(val) -> Optional[int]:
    if val is None or val in ("None", "-", ""):
        return None
    try:
        return int(float(str(val).replace(",", "")))
    except (ValueError, TypeError):
        return None


def _derive_analyst_rating(overview: dict) -> Optional[str]:
    """Derive Buy/Hold/Sell from Alpha Vantage analyst rating counts."""
    strong_buy = _safe_int(overview.get("AnalystRatingStrongBuy")) or 0
    buy = _safe_int(overview.get("AnalystRatingBuy")) or 0
    hold = _safe_int(overview.get("AnalystRatingHold")) or 0
    sell = _safe_int(overview.get("AnalystRatingSell")) or 0
    strong_sell = _safe_int(overview.get("AnalystRatingStrongSell")) or 0

    total = strong_buy + buy + hold + sell + strong_sell
    if total == 0:
        return None

    buy_total = strong_buy + buy
    sell_total = sell + strong_sell

    if buy_total >= hold and buy_total >= sell_total:
        return "Buy"
    elif sell_total >= hold and sell_total >= buy_total:
        return "Sell"
    return "Hold"


async def get_ticker_quote(symbol: str) -> Optional[TickerQuoteResponse]:
    symbol = symbol.upper().strip()
    now = time.time()

    # Check cache
    if symbol in _cache:
        cached, ts = _cache[symbol]
        if now - ts < _CACHE_TTL:
            return cached

    if not settings.ALPHAVANTAGE_API_KEY:
        return None

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            # Fetch GLOBAL_QUOTE and OVERVIEW concurrently
            quote_resp, overview_resp = await asyncio.gather(
                client.get(AV_BASE, params={
                    "function": "GLOBAL_QUOTE",
                    "symbol": symbol,
                    "apikey": settings.ALPHAVANTAGE_API_KEY,
                }),
                client.get(AV_BASE, params={
                    "function": "OVERVIEW",
                    "symbol": symbol,
                    "apikey": settings.ALPHAVANTAGE_API_KEY,
                }),
            )

            quote_data = quote_resp.json().get("Global Quote", {})
            if not quote_data:
                return None

            overview = overview_resp.json()
            has_overview = "Symbol" in overview

            price = _safe_float(quote_data.get("05. price"))
            change = _safe_float(quote_data.get("09. change"))
            change_pct = _safe_float(quote_data.get("10. change percent"))

            result = TickerQuoteResponse(
                symbol=symbol,
                name=overview.get("Name", symbol) if has_overview else symbol,
                price=price or 0,
                change=change or 0,
                change_pct=change_pct or 0,
                day_high=_safe_float(quote_data.get("03. high")),
                day_low=_safe_float(quote_data.get("04. low")),
                year_high=_safe_float(overview.get("52WeekHigh")) if has_overview else None,
                year_low=_safe_float(overview.get("52WeekLow")) if has_overview else None,
                pe_ratio=_safe_float(overview.get("PERatio")) if has_overview else None,
                market_cap=_safe_int(overview.get("MarketCapitalization")) if has_overview else None,
                volume=_safe_int(quote_data.get("06. volume")),
                analyst_rating=_derive_analyst_rating(overview) if has_overview else None,
                analyst_target=_safe_float(overview.get("AnalystTargetPrice")) if has_overview else None,
                cached_at=datetime.now(timezone.utc),
            )

            _cache[symbol] = (result, now)
            return result

    except Exception as exc:
        import logging
        logging.getLogger(__name__).exception("Failed to fetch quote for %s: %s", symbol, exc)
        # Return stale cache if available
        if symbol in _cache:
            return _cache[symbol][0]
        raise

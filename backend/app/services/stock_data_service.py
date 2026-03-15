import asyncio
import logging
import time
from datetime import datetime, timezone
from typing import Optional

import httpx

from app.config import settings
from app.schemas.ticker import TickerQuoteResponse

logger = logging.getLogger(__name__)

# In-memory cache: symbol -> (TickerQuoteResponse, timestamp)
_cache: dict[str, tuple[TickerQuoteResponse, float]] = {}
_CACHE_TTL = 300  # 5 minutes

AV_BASE = "https://www.alphavantage.co/query"
YF_CHART = "https://query1.finance.yahoo.com/v8/finance/chart"

_HTTP_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; AIVA/1.0)",
}

# Map common display symbols to Yahoo Finance symbols
_YAHOO_ALIASES: dict[str, str] = {
    "BTC": "BTC-USD",
    "ETH": "ETH-USD",
    "VIX": "^VIX",
    "DXY": "DX-Y.NYB",
    "TNX": "^TNX",
    "GSPC": "^GSPC",
}


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


async def _fetch_via_alphavantage(symbol: str) -> Optional[TickerQuoteResponse]:
    """Try Alpha Vantage API (sequential calls for free tier rate limit)."""
    if not settings.ALPHAVANTAGE_API_KEY:
        return None

    async with httpx.AsyncClient(timeout=10) as client:
        quote_resp = await client.get(AV_BASE, params={
            "function": "GLOBAL_QUOTE",
            "symbol": symbol,
            "apikey": settings.ALPHAVANTAGE_API_KEY,
        })

        quote_data = quote_resp.json().get("Global Quote", {})
        if not quote_data:
            return None

        await asyncio.sleep(1.2)
        overview_resp = await client.get(AV_BASE, params={
            "function": "OVERVIEW",
            "symbol": symbol,
            "apikey": settings.ALPHAVANTAGE_API_KEY,
        })

        overview = overview_resp.json()
        has_overview = "Symbol" in overview

        return TickerQuoteResponse(
            symbol=symbol,
            name=overview.get("Name", symbol) if has_overview else symbol,
            price=_safe_float(quote_data.get("05. price")) or 0,
            change=_safe_float(quote_data.get("09. change")) or 0,
            change_pct=_safe_float(quote_data.get("10. change percent")) or 0,
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


async def _fetch_via_yahoo(symbol: str) -> Optional[TickerQuoteResponse]:
    """Fallback: direct Yahoo Finance chart API (single lightweight request)."""
    yf_symbol = _YAHOO_ALIASES.get(symbol, symbol)
    async with httpx.AsyncClient(timeout=10, headers=_HTTP_HEADERS) as client:
        resp = await client.get(
            f"{YF_CHART}/{yf_symbol}",
            params={"interval": "1d", "range": "5d"},
        )
        data = resp.json()
        result = (data.get("chart", {}).get("result") or [None])[0]
        if not result:
            return None

        meta = result.get("meta", {})
        price = meta.get("regularMarketPrice")
        if price is None:
            return None

        prev_close = meta.get("chartPreviousClose") or meta.get("previousClose") or 0
        change = round(price - prev_close, 2) if prev_close else 0
        change_pct = round((change / prev_close) * 100, 2) if prev_close else 0

        return TickerQuoteResponse(
            symbol=symbol,
            name=meta.get("shortName") or meta.get("longName") or symbol,
            price=price,
            change=change,
            change_pct=change_pct,
            day_high=meta.get("regularMarketDayHigh"),
            day_low=meta.get("regularMarketDayLow"),
            year_high=meta.get("fiftyTwoWeekHigh"),
            year_low=meta.get("fiftyTwoWeekLow"),
            pe_ratio=None,
            market_cap=None,
            volume=meta.get("regularMarketVolume"),
            analyst_rating=None,
            analyst_target=None,
            cached_at=datetime.now(timezone.utc),
        )


async def get_ticker_quote(symbol: str) -> Optional[TickerQuoteResponse]:
    symbol = symbol.upper().strip()
    now = time.time()

    # Check cache
    if symbol in _cache:
        cached, ts = _cache[symbol]
        if now - ts < _CACHE_TTL:
            return cached

    # Try Alpha Vantage first
    try:
        result = await _fetch_via_alphavantage(symbol)
        if result:
            _cache[symbol] = (result, now)
            return result
    except Exception:
        logger.warning("Alpha Vantage failed for %s", symbol)

    # Fall back to direct Yahoo Finance API
    try:
        result = await _fetch_via_yahoo(symbol)
        if result:
            _cache[symbol] = (result, now)
            return result
    except Exception:
        logger.warning("Yahoo Finance also failed for %s", symbol)

    # Return stale cache if available
    if symbol in _cache:
        return _cache[symbol][0]
    return None

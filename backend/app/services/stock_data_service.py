import time
from datetime import datetime, timezone
from typing import Optional

import httpx

from app.config import settings
from app.schemas.ticker import TickerQuoteResponse

# In-memory cache: symbol -> (TickerQuoteResponse, timestamp)
_cache: dict[str, tuple[TickerQuoteResponse, float]] = {}
_CACHE_TTL = 300  # 5 minutes

FMP_BASE = "https://financialmodelingprep.com/stable"


async def get_ticker_quote(symbol: str) -> Optional[TickerQuoteResponse]:
    symbol = symbol.upper().strip()
    now = time.time()

    # Check cache
    if symbol in _cache:
        cached, ts = _cache[symbol]
        if now - ts < _CACHE_TTL:
            return cached

    if not settings.FMP_API_KEY:
        return None

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            quote_resp = await client.get(
                f"{FMP_BASE}/quote",
                params={"symbol": symbol, "apikey": settings.FMP_API_KEY},
            )
            quote_resp.raise_for_status()
            quotes = quote_resp.json()

            if not quotes:
                return None

            q = quotes[0]

            # Fetch analyst consensus + price target (best-effort)
            analyst_rating = None
            analyst_target = None
            try:
                grades_resp, target_resp = await asyncio_gather(
                    client.get(
                        f"{FMP_BASE}/grades-consensus",
                        params={"symbol": symbol, "apikey": settings.FMP_API_KEY},
                    ),
                    client.get(
                        f"{FMP_BASE}/price-target-consensus",
                        params={"symbol": symbol, "apikey": settings.FMP_API_KEY},
                    ),
                )
                if grades_resp.status_code == 200:
                    grades = grades_resp.json()
                    if grades:
                        analyst_rating = grades[0].get("consensus")
                if target_resp.status_code == 200:
                    targets = target_resp.json()
                    if targets:
                        analyst_target = targets[0].get("targetConsensus")
            except Exception:
                pass

            result = TickerQuoteResponse(
                symbol=q.get("symbol", symbol),
                name=q.get("name", symbol),
                price=q.get("price", 0),
                change=q.get("change", 0),
                change_pct=q.get("changePercentage", 0),
                day_high=q.get("dayHigh"),
                day_low=q.get("dayLow"),
                year_high=q.get("yearHigh"),
                year_low=q.get("yearLow"),
                pe_ratio=q.get("pe"),
                market_cap=q.get("marketCap"),
                volume=q.get("volume"),
                analyst_rating=analyst_rating,
                analyst_target=analyst_target,
                cached_at=datetime.now(timezone.utc),
            )

            _cache[symbol] = (result, now)
            return result

    except Exception:
        # Return stale cache if available
        if symbol in _cache:
            return _cache[symbol][0]
        return None


async def asyncio_gather(*coros):
    """Simple wrapper to run multiple awaitables concurrently."""
    import asyncio
    return await asyncio.gather(*coros)

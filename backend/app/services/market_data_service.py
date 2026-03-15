import time
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings

AV_BASE = "https://www.alphavantage.co/query"

# In-memory cache — longer TTL to conserve Alpha Vantage quota
_cache: Dict[str, Dict[str, Any]] = {}
_cache_ttl = 300  # 5 minutes


def _av_get(function: str, symbol: str, **extra) -> Dict[str, Any]:
    """Make a request to Alpha Vantage and return the JSON response."""
    params = {
        "function": function,
        "symbol": symbol.upper(),
        "apikey": settings.ALPHAVANTAGE_API_KEY,
        **extra,
    }
    resp = httpx.get(AV_BASE, params=params, timeout=15)
    return resp.json()


def _safe_float(val: Any) -> Optional[float]:
    if val is None or val in ("None", "-", ""):
        return None
    try:
        return float(str(val).replace("%", "").replace(",", ""))
    except (ValueError, TypeError):
        return None


def _safe_int(val: Any) -> Optional[int]:
    if val is None or val in ("None", "-", ""):
        return None
    try:
        return int(float(str(val).replace(",", "")))
    except (ValueError, TypeError):
        return None


def _get_info(symbol: str) -> Dict[str, Any]:
    """Fetch from Alpha Vantage and return a yfinance-compatible dict for backward compat."""
    symbol = symbol.upper()

    unified_key = f"info:{symbol}"
    now = time.time()
    if unified_key in _cache and now - _cache[unified_key]["_ts"] < _cache_ttl:
        return _cache[unified_key]

    quote_data = _av_get("GLOBAL_QUOTE", symbol)
    overview_data = _av_get("OVERVIEW", symbol)

    quote = quote_data.get("Global Quote", {})
    overview = overview_data if "Symbol" in overview_data else {}

    price = _safe_float(quote.get("05. price"))
    change = _safe_float(quote.get("09. change"))
    change_pct = _safe_float(quote.get("10. change percent"))

    # Convert ex-dividend date string to timestamp for calendar.py compat
    ex_div_ts = None
    ex_div_str = overview.get("ExDividendDate")
    if ex_div_str and ex_div_str not in ("None", "-", "0000-00-00"):
        try:
            ex_div_ts = datetime.strptime(ex_div_str, "%Y-%m-%d").timestamp()
        except ValueError:
            pass

    info = {
        # Price data from GLOBAL_QUOTE
        "currentPrice": price,
        "regularMarketPrice": price,
        "regularMarketChange": change,
        "regularMarketChangePercent": change_pct,
        "regularMarketVolume": _safe_int(quote.get("06. volume")),
        "dayHigh": _safe_float(quote.get("03. high")),
        "dayLow": _safe_float(quote.get("04. low")),
        "regularMarketOpen": _safe_float(quote.get("02. open")),
        "regularMarketPreviousClose": _safe_float(quote.get("08. previous close")),
        # Company info from OVERVIEW
        "shortName": overview.get("Name", symbol),
        "sector": overview.get("Sector", "N/A"),
        "industry": overview.get("Industry", "N/A"),
        "longBusinessSummary": overview.get("Description", "N/A"),
        "marketCap": _safe_int(overview.get("MarketCapitalization")),
        "trailingPE": _safe_float(overview.get("PERatio")),
        "forwardPE": _safe_float(overview.get("ForwardPE")),
        "trailingEps": _safe_float(overview.get("EPS")),
        "dividendYield": _safe_float(overview.get("DividendYield")) or 0,
        "dividendRate": _safe_float(overview.get("DividendPerShare")),
        "exDividendDate": ex_div_ts,
        "fiftyTwoWeekHigh": _safe_float(overview.get("52WeekHigh")),
        "fiftyTwoWeekLow": _safe_float(overview.get("52WeekLow")),
        "beta": _safe_float(overview.get("Beta")),
        "analystTargetPrice": _safe_float(overview.get("AnalystTargetPrice")),
        "_ts": now,
    }
    _cache[unified_key] = info
    return info


def get_stock_quote(symbol: str) -> Dict[str, Any]:
    info = _get_info(symbol)
    return {
        "symbol": symbol.upper(),
        "name": info.get("shortName", "N/A"),
        "price": info.get("currentPrice"),
        "change": info.get("regularMarketChange"),
        "change_percent": info.get("regularMarketChangePercent"),
        "volume": info.get("regularMarketVolume"),
        "market_cap": info.get("marketCap"),
        "day_high": info.get("dayHigh"),
        "day_low": info.get("dayLow"),
        "open": info.get("regularMarketOpen"),
        "previous_close": info.get("regularMarketPreviousClose"),
    }


def get_price_history(symbol: str, period: str = "1mo", interval: str = "1d") -> Dict[str, Any]:
    symbol = symbol.upper()

    # Choose Alpha Vantage function based on interval
    if interval in ("1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h"):
        av_interval_map = {
            "1m": "1min", "2m": "5min", "5m": "5min", "15m": "15min",
            "30m": "30min", "60m": "60min", "90m": "60min", "1h": "60min",
        }
        av_interval = av_interval_map.get(interval, "5min")
        data = _av_get("TIME_SERIES_INTRADAY", symbol, interval=av_interval, outputsize="compact")
        ts_key = f"Time Series ({av_interval})"
    elif interval == "1wk":
        data = _av_get("TIME_SERIES_WEEKLY", symbol)
        ts_key = "Weekly Time Series"
    elif interval in ("1mo", "3mo"):
        data = _av_get("TIME_SERIES_MONTHLY", symbol)
        ts_key = "Monthly Time Series"
    else:
        data = _av_get("TIME_SERIES_DAILY", symbol, outputsize="compact")
        ts_key = "Time Series (Daily)"

    time_series = data.get(ts_key, {})
    if not time_series:
        return {"symbol": symbol, "period": period, "interval": interval, "data": []}

    period_limits = {
        "1d": 1, "5d": 5, "1mo": 22, "3mo": 63, "6mo": 126,
        "1y": 252, "2y": 504, "5y": 1260, "10y": 2520, "ytd": 252, "max": 9999,
    }
    limit = period_limits.get(period, 22)

    sorted_dates = sorted(time_series.keys())
    dates_to_use = sorted_dates[-limit:]

    records = []
    for date_str in dates_to_use:
        day = time_series[date_str]
        records.append({
            "date": date_str[:10],
            "open": round(float(day["1. open"]), 2),
            "high": round(float(day["2. high"]), 2),
            "low": round(float(day["3. low"]), 2),
            "close": round(float(day["4. close"]), 2),
            "volume": int(float(day["5. volume"])),
        })

    return {
        "symbol": symbol,
        "period": period,
        "interval": interval,
        "data": records[-50:],
    }


def get_company_info(symbol: str) -> Dict[str, Any]:
    info = _get_info(symbol)
    return {
        "symbol": symbol.upper(),
        "name": info.get("shortName", "N/A"),
        "sector": info.get("sector", "N/A"),
        "industry": info.get("industry", "N/A"),
        "description": info.get("longBusinessSummary", "N/A"),
        "pe_ratio": info.get("trailingPE"),
        "forward_pe": info.get("forwardPE"),
        "dividend_yield": info.get("dividendYield"),
        "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
        "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
        "beta": info.get("beta"),
        "eps": info.get("trailingEps"),
        "market_cap": info.get("marketCap"),
    }


SECTOR_ETFS = {
    "Technology": "XLK",
    "Healthcare": "XLV",
    "Financials": "XLF",
    "Consumer Discretionary": "XLY",
    "Communication Services": "XLC",
    "Industrials": "XLI",
    "Consumer Staples": "XLP",
    "Energy": "XLE",
    "Utilities": "XLU",
    "Real Estate": "XLRE",
    "Materials": "XLB",
}


def get_sector_performance() -> List[Dict[str, Any]]:
    results = []
    for sector_name, etf_symbol in SECTOR_ETFS.items():
        try:
            info = _get_info(etf_symbol)
            results.append({
                "sector": sector_name,
                "etf": etf_symbol,
                "price": info.get("currentPrice") or info.get("regularMarketPrice"),
                "change_percent": info.get("regularMarketChangePercent"),
            })
        except Exception:
            results.append({"sector": sector_name, "etf": etf_symbol, "price": None, "change_percent": None})
    return results


def get_trending_tickers() -> List[Dict[str, Any]]:
    popular = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "SPY", "QQQ"]
    results = []
    for symbol in popular:
        try:
            info = _get_info(symbol)
            results.append({
                "symbol": symbol,
                "name": info.get("shortName", "N/A"),
                "price": info.get("currentPrice") or info.get("regularMarketPrice"),
                "change_percent": info.get("regularMarketChangePercent"),
            })
        except Exception:
            continue
    return results

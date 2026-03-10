"""Mock market data for StatusTicker and MarketMovers widget."""

MOCK_MARKET_DATA = [
    {"symbol": "SPY", "name": "S&P 500", "price": 5892.34, "change_pct": 0.47, "volume": 78_500_000},
    {"symbol": "QQQ", "name": "Nasdaq 100", "price": 20145.67, "change_pct": 0.82, "volume": 52_300_000},
    {"symbol": "DIA", "name": "Dow Jones", "price": 43567.89, "change_pct": 0.23, "volume": 31_200_000},
    {"symbol": "IWM", "name": "Russell 2000", "price": 2234.56, "change_pct": -0.34, "volume": 28_400_000},
    {"symbol": "TLT", "name": "20+ Year Treasury", "price": 92.45, "change_pct": -0.12, "volume": 18_700_000},
    {"symbol": "GLD", "name": "Gold", "price": 2847.30, "change_pct": 1.15, "volume": 12_300_000},
    {"symbol": "VIX", "name": "Volatility Index", "price": 14.23, "change_pct": -3.45, "volume": 0},
    {"symbol": "DXY", "name": "US Dollar Index", "price": 103.67, "change_pct": -0.18, "volume": 0},
    {"symbol": "BTC", "name": "Bitcoin", "price": 97234.50, "change_pct": 2.34, "volume": 42_100_000},
    {"symbol": "CL=F", "name": "Crude Oil", "price": 78.92, "change_pct": -0.67, "volume": 15_600_000},
]

MOCK_MARKET_MOVERS = [
    {"symbol": "NVDA", "name": "NVIDIA Corp", "price": 892.45, "change_pct": 4.23, "volume": 145_000_000},
    {"symbol": "AAPL", "name": "Apple Inc", "price": 234.67, "change_pct": 1.89, "volume": 67_800_000},
    {"symbol": "MSFT", "name": "Microsoft Corp", "price": 445.23, "change_pct": 1.45, "volume": 42_300_000},
    {"symbol": "TSLA", "name": "Tesla Inc", "price": 267.89, "change_pct": -2.34, "volume": 98_500_000},
    {"symbol": "AMZN", "name": "Amazon.com", "price": 198.45, "change_pct": 0.78, "volume": 55_200_000},
    {"symbol": "META", "name": "Meta Platforms", "price": 567.34, "change_pct": 2.12, "volume": 38_900_000},
    {"symbol": "GOOGL", "name": "Alphabet Inc", "price": 178.92, "change_pct": -0.56, "volume": 29_400_000},
    {"symbol": "JPM", "name": "JPMorgan Chase", "price": 198.34, "change_pct": 0.34, "volume": 15_600_000},
]

MOCK_SECTOR_PERFORMANCE = {
    "Technology": 2.34,
    "Healthcare": 0.89,
    "Financials": 0.45,
    "Consumer Discretionary": -0.23,
    "Industrials": 0.67,
    "Energy": -1.12,
    "Real Estate": 0.12,
    "Utilities": -0.34,
    "Materials": 0.56,
    "Communication Services": 1.45,
    "Consumer Staples": 0.23,
}

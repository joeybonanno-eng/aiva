"""Mock portfolio data for 20 clients — realistic allocations by risk profile."""

from __future__ import annotations

import random
from datetime import datetime

# Portfolio templates by risk profile
CONSERVATIVE_PORTFOLIO = [
    {"asset_class": "Fixed Income", "ticker": "BND", "name": "Vanguard Total Bond Market ETF", "allocation_pct": 35.0},
    {"asset_class": "Fixed Income", "ticker": "TIP", "name": "iShares TIPS Bond ETF", "allocation_pct": 10.0},
    {"asset_class": "Fixed Income", "ticker": "MUB", "name": "iShares National Muni Bond ETF", "allocation_pct": 10.0},
    {"asset_class": "US Equity", "ticker": "VTV", "name": "Vanguard Value ETF", "allocation_pct": 15.0},
    {"asset_class": "US Equity", "ticker": "SCHD", "name": "Schwab US Dividend Equity ETF", "allocation_pct": 10.0},
    {"asset_class": "International", "ticker": "VXUS", "name": "Vanguard Total International Stock ETF", "allocation_pct": 8.0},
    {"asset_class": "Real Estate", "ticker": "VNQ", "name": "Vanguard Real Estate ETF", "allocation_pct": 5.0},
    {"asset_class": "Cash", "ticker": "VMFXX", "name": "Vanguard Federal Money Market", "allocation_pct": 7.0},
]

MODERATE_PORTFOLIO = [
    {"asset_class": "US Equity", "ticker": "VOO", "name": "Vanguard S&P 500 ETF", "allocation_pct": 25.0},
    {"asset_class": "US Equity", "ticker": "VGT", "name": "Vanguard Information Technology ETF", "allocation_pct": 10.0},
    {"asset_class": "US Equity", "ticker": "VIG", "name": "Vanguard Dividend Appreciation ETF", "allocation_pct": 10.0},
    {"asset_class": "International", "ticker": "VXUS", "name": "Vanguard Total International Stock ETF", "allocation_pct": 12.0},
    {"asset_class": "Emerging Markets", "ticker": "VWO", "name": "Vanguard FTSE Emerging Markets ETF", "allocation_pct": 5.0},
    {"asset_class": "Fixed Income", "ticker": "BND", "name": "Vanguard Total Bond Market ETF", "allocation_pct": 20.0},
    {"asset_class": "Fixed Income", "ticker": "VCIT", "name": "Vanguard Intermediate-Term Corporate Bond ETF", "allocation_pct": 8.0},
    {"asset_class": "Real Estate", "ticker": "VNQ", "name": "Vanguard Real Estate ETF", "allocation_pct": 5.0},
    {"asset_class": "Cash", "ticker": "VMFXX", "name": "Vanguard Federal Money Market", "allocation_pct": 5.0},
]

AGGRESSIVE_PORTFOLIO = [
    {"asset_class": "US Equity", "ticker": "VOO", "name": "Vanguard S&P 500 ETF", "allocation_pct": 20.0},
    {"asset_class": "US Equity", "ticker": "QQQ", "name": "Invesco QQQ Trust", "allocation_pct": 15.0},
    {"asset_class": "US Equity", "ticker": "VGT", "name": "Vanguard Information Technology ETF", "allocation_pct": 10.0},
    {"asset_class": "US Equity", "ticker": "ARKK", "name": "ARK Innovation ETF", "allocation_pct": 5.0},
    {"asset_class": "International", "ticker": "VXUS", "name": "Vanguard Total International Stock ETF", "allocation_pct": 12.0},
    {"asset_class": "Emerging Markets", "ticker": "VWO", "name": "Vanguard FTSE Emerging Markets ETF", "allocation_pct": 8.0},
    {"asset_class": "Fixed Income", "ticker": "BND", "name": "Vanguard Total Bond Market ETF", "allocation_pct": 10.0},
    {"asset_class": "Alternatives", "ticker": "GLD", "name": "SPDR Gold Shares", "allocation_pct": 5.0},
    {"asset_class": "Crypto", "ticker": "BITO", "name": "ProShares Bitcoin Strategy ETF", "allocation_pct": 3.0},
    {"asset_class": "Real Estate", "ticker": "VNQ", "name": "Vanguard Real Estate ETF", "allocation_pct": 7.0},
    {"asset_class": "Cash", "ticker": "VMFXX", "name": "Vanguard Federal Money Market", "allocation_pct": 5.0},
]

VERY_AGGRESSIVE_PORTFOLIO = [
    {"asset_class": "US Equity", "ticker": "QQQ", "name": "Invesco QQQ Trust", "allocation_pct": 20.0},
    {"asset_class": "US Equity", "ticker": "ARKK", "name": "ARK Innovation ETF", "allocation_pct": 10.0},
    {"asset_class": "US Equity", "ticker": "SOXX", "name": "iShares Semiconductor ETF", "allocation_pct": 10.0},
    {"asset_class": "US Equity", "ticker": "VGT", "name": "Vanguard Information Technology ETF", "allocation_pct": 15.0},
    {"asset_class": "International", "ticker": "VXUS", "name": "Vanguard Total International Stock ETF", "allocation_pct": 10.0},
    {"asset_class": "Emerging Markets", "ticker": "VWO", "name": "Vanguard FTSE Emerging Markets ETF", "allocation_pct": 10.0},
    {"asset_class": "Crypto", "ticker": "BITO", "name": "ProShares Bitcoin Strategy ETF", "allocation_pct": 5.0},
    {"asset_class": "Alternatives", "ticker": "GLD", "name": "SPDR Gold Shares", "allocation_pct": 5.0},
    {"asset_class": "Private Equity", "ticker": "PSP", "name": "Invesco Global Listed Private Equity ETF", "allocation_pct": 8.0},
    {"asset_class": "Real Estate", "ticker": "VNQ", "name": "Vanguard Real Estate ETF", "allocation_pct": 5.0},
    {"asset_class": "Cash", "ticker": "VMFXX", "name": "Vanguard Federal Money Market", "allocation_pct": 2.0},
]

PORTFOLIO_TEMPLATES = {
    "conservative": CONSERVATIVE_PORTFOLIO,
    "moderate": MODERATE_PORTFOLIO,
    "aggressive": AGGRESSIVE_PORTFOLIO,
    "very_aggressive": VERY_AGGRESSIVE_PORTFOLIO,
}


def generate_portfolio_for_client(client_data: dict) -> list[dict]:
    """Generate portfolio holdings for a client based on their risk profile and AUM."""
    risk_profile = client_data["risk_profile"]
    aum = client_data["aum"]
    template = PORTFOLIO_TEMPLATES.get(risk_profile, MODERATE_PORTFOLIO)

    holdings = []
    for position in template:
        # Add some randomness to gain/loss
        gain_loss = random.uniform(-15.0, 35.0)
        value = aum * (position["allocation_pct"] / 100.0)

        holdings.append({
            "asset_class": position["asset_class"],
            "ticker": position["ticker"],
            "name": position["name"],
            "value": round(value, 2),
            "allocation_pct": position["allocation_pct"],
            "gain_loss_pct": round(gain_loss, 2),
        })

    return holdings

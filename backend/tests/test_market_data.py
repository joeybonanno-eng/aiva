from unittest.mock import MagicMock, patch


def _mock_av_response(url, **kwargs):
    """Return mock Alpha Vantage responses based on the function parameter."""
    params = kwargs.get("params", {})
    function = params.get("function", "")
    resp = MagicMock()

    if function == "GLOBAL_QUOTE":
        resp.json.return_value = {
            "Global Quote": {
                "01. symbol": "AAPL",
                "02. open": "174.00",
                "03. high": "176.00",
                "04. low": "173.50",
                "05. price": "175.50",
                "06. volume": "50000000",
                "08. previous close": "173.20",
                "09. change": "2.30",
                "10. change percent": "1.3300%",
            }
        }
    elif function == "OVERVIEW":
        resp.json.return_value = {
            "Symbol": "AAPL",
            "Name": "Apple Inc.",
            "Sector": "Technology",
            "Industry": "Consumer Electronics",
            "Description": "Apple Inc. designs, manufactures...",
            "MarketCapitalization": "2750000000000",
            "PERatio": "28.5",
            "ForwardPE": "26.0",
            "DividendYield": "0.006",
            "DividendPerShare": "0.96",
            "EPS": "6.13",
            "52WeekHigh": "200.00",
            "52WeekLow": "130.00",
            "Beta": "1.2",
            "ExDividendDate": "2024-11-08",
        }
    elif function == "TIME_SERIES_DAILY":
        resp.json.return_value = {
            "Time Series (Daily)": {
                "2024-01-01": {
                    "1. open": "170.00",
                    "2. high": "175.00",
                    "3. low": "169.00",
                    "4. close": "174.00",
                    "5. volume": "50000000",
                },
                "2024-01-02": {
                    "1. open": "172.00",
                    "2. high": "176.00",
                    "3. low": "171.00",
                    "4. close": "175.00",
                    "5. volume": "45000000",
                },
            }
        }
    else:
        resp.json.return_value = {}

    return resp


def test_get_quote(client):
    with patch("app.services.market_data_service.httpx.get", side_effect=_mock_av_response):
        # Clear cache to ensure fresh fetch
        from app.services import market_data_service
        market_data_service._cache.clear()

        response = client.get("/api/market/quote/AAPL")
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "AAPL"
        assert data["price"] == 175.50
        assert data["name"] == "Apple Inc."


def test_get_company_info(client):
    with patch("app.services.market_data_service.httpx.get", side_effect=_mock_av_response):
        from app.services import market_data_service
        market_data_service._cache.clear()

        response = client.get("/api/market/info/AAPL")
        assert response.status_code == 200
        data = response.json()
        assert data["sector"] == "Technology"
        assert data["pe_ratio"] == 28.5


def test_get_history(client):
    with patch("app.services.market_data_service.httpx.get", side_effect=_mock_av_response):
        from app.services import market_data_service
        market_data_service._cache.clear()

        response = client.get("/api/market/history/AAPL?period=1mo&interval=1d")
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "AAPL"
        assert len(data["data"]) == 2
        assert data["data"][0]["close"] == 174.0

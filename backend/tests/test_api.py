import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["dataAvailable"] is True
    assert data["actualsCount"] == 1488

def test_summary_endpoint():
    response = client.get("/api/summary?month=2026-01")
    assert response.status_code == 200
    data = response.json()
    assert data["month"] == "2026-01"
    assert data["expectedPeriods"] == 1488
    assert data["observedActualPeriods"] == 1488
    assert data["matchedPeriods"] == 744
    assert data["missingForecastCount"] == 744
    assert data["missingActualCount"] == 0
    assert data["mae"] is not None
    assert data["rmse"] is not None
    assert data["bias"] is not None
    assert data["unit"] == "MW"

def test_timeseries_endpoint():
    response = client.get("/api/timeseries?date=2026-01-01")
    assert response.status_code == 200
    data = response.json()
    assert data["date"] == "2026-01-01"
    assert data["periodsCount"] == 48 # 48 half-hour settlement periods
    assert data["matchedCount"] == 24 # 24 hourly forecasts matched
    assert len(data["points"]) == 48

    # First point (:00) has both actual and forecast
    p0 = data["points"][0]
    assert p0["actualGeneration"] is not None
    assert p0["forecastGeneration"] is not None
    assert p0["errorMw"] is not None

    # Second point (:30) has actual but forecast is null (not fabricated!)
    p1 = data["points"][1]
    assert p1["actualGeneration"] is not None
    assert p1["forecastGeneration"] is None
    assert p1["errorMw"] is None

def test_accuracy_endpoint():
    response = client.get("/api/accuracy?start=2026-01-01&end=2026-02-01")
    assert response.status_code == 200
    data = response.json()
    assert data["startDate"] == "2026-01-01"
    assert data["endDate"] == "2026-02-01"
    assert data["matchedCount"] == 744
    assert data["totalPeriods"] == 1488
    assert len(data["dailyMetrics"]) == 31 # 31 days in January

def test_forecast_history_endpoint():
    response = client.get("/api/forecast-history?delivery_time=2026-01-01T12:00:00Z")
    assert response.status_code == 200
    data = response.json()
    assert data["deliveryTime"] == "2026-01-01T12:00:00+00:00"
    assert data["totalVersions"] > 0
    assert data["selectedVersion"] is not None
    assert data["selectedVersion"]["status"] == "SELECTED"
    assert data["selectedVersion"]["isEligible"] is True

def test_data_quality_endpoint():
    response = client.get("/api/data-quality?month=2026-01")
    assert response.status_code == 200
    data = response.json()
    assert data["month"] == "2026-01"
    assert data["expectedDeliveryPeriods"] == 1488
    assert data["observedActualPeriods"] == 1488
    assert data["actualsCoveragePercentage"] == 100.0
    assert data["matchedValidPairs"] == 744
    assert data["missingForecastCount"] == 744
    assert data["missingActualCount"] == 0

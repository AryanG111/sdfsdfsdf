import math
import numpy as np
import pandas as pd
import pytest
from app.services.metrics import calculate_accuracy_metrics, calculate_daily_metrics

def test_metrics_hand_calculated():
    """
    Test MAE, RMSE, and bias against exact hand calculations.
    Pairs:
      1: A=100, F=110 => error = +10, |err| = 10, err^2 = 100
      2: A=200, F=190 => error = -10, |err| = 10, err^2 = 100
      3: A=300, F=320 => error = +20, |err| = 20, err^2 = 400

    Expected:
      MAE = (10 + 10 + 20) / 3 = 13.33
      RMSE = sqrt((100 + 100 + 400) / 3) = sqrt(200) = 14.14
      Bias = (+10 - 10 + 20) / 3 = 6.67
    """
    df = pd.DataFrame({
        "actual_generation": [100.0, 200.0, 300.0],
        "forecast_generation": [110.0, 190.0, 320.0],
    })

    metrics = calculate_accuracy_metrics(df)

    assert metrics["matchedCount"] == 3
    assert metrics["mae"] == 13.33
    assert metrics["mse"] == 200.0
    assert metrics["rmse"] == 14.14
    assert metrics["bias"] == 6.67

def test_missing_values_excluded_not_zero():
    """
    Test that missing forecasts or missing actuals are strictly excluded
    from the calculation and NOT replaced with zero.
    """
    df = pd.DataFrame({
        "actual_generation": [100.0, 200.0, np.nan, 400.0],
        "forecast_generation": [110.0, np.nan, 300.0, 420.0],
    })

    # Only rows 0 (100, 110: err=+10) and 3 (400, 420: err=+20) are valid matched pairs
    metrics = calculate_accuracy_metrics(df)

    assert metrics["matchedCount"] == 2
    assert metrics["totalPeriods"] == 4
    # Valid errors: +10, +20
    # MAE = (10 + 20) / 2 = 15.0
    # MSE = (100 + 400) / 2 = 250.0
    # RMSE = sqrt((100 + 400) / 2) = sqrt(250) = 15.81
    # Bias = (+10 + 20) / 2 = 15.0
    assert metrics["mae"] == 15.0
    assert metrics["mse"] == 250.0
    assert metrics["rmse"] == 15.81
    assert metrics["bias"] == 15.0

def test_empty_dataset_returns_nulls():
    """
    Test that an empty dataset returns None/null metrics.
    """
    df = pd.DataFrame(columns=["actual_generation", "forecast_generation"])
    metrics = calculate_accuracy_metrics(df)

    assert metrics["matchedCount"] == 0
    assert metrics["mae"] is None
    assert metrics["mse"] is None
    assert metrics["rmse"] is None
    assert metrics["bias"] is None

def test_daily_metrics_aggregation():
    """
    Test that calculate_daily_metrics groups by date correctly.
    """
    df = pd.DataFrame({
        "startTime": [
            "2026-01-01T00:00:00Z",
            "2026-01-01T01:00:00Z",
            "2026-01-02T00:00:00Z",
        ],
        "actual_generation": [100.0, 200.0, 300.0],
        "forecast_generation": [110.0, 210.0, 280.0],
    })

    daily = calculate_daily_metrics(df)

    assert len(daily) == 2
    day1 = daily[0]
    assert day1["date"] == "2026-01-01"
    assert day1["matchedCount"] == 2
    assert day1["mae"] == 10.0
    assert day1["mse"] == 100.0
    assert day1["rmse"] == 10.0
    assert day1["bias"] == 10.0

    day2 = daily[1]
    assert day2["date"] == "2026-01-02"
    assert day2["matchedCount"] == 1
    assert day2["mae"] == 20.0
    assert day2["mse"] == 400.0
    assert day2["rmse"] == 20.0
    assert day2["bias"] == -20.0

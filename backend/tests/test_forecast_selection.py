import pandas as pd
import numpy as np
import pytest
from app.services.forecast_selection import select_day_ahead_forecasts, get_delivery_forecast_history

def test_select_day_ahead_forecast_latest_eligible():
    """
    Test that the most recent eligible forecast (publishTime <= T - 24h) is selected,
    and forecasts published after the cutoff are rejected.
    """
    delivery_time = pd.Timestamp("2026-01-02T12:00:00Z")
    cutoff = delivery_time - pd.Timedelta(hours=24) # 2026-01-01T12:00:00Z

    df_actuals = pd.DataFrame([{
        "startTime": delivery_time,
        "generation": 1000.0,
        "fuelType": "WIND"
    }])

    df_forecasts = pd.DataFrame([
        # Eligible, older
        {"startTime": delivery_time, "publishTime": pd.Timestamp("2026-01-01T08:00:00Z"), "generation": 1100.0},
        # Eligible, latest (should be selected)
        {"startTime": delivery_time, "publishTime": pd.Timestamp("2026-01-01T11:30:00Z"), "generation": 1200.0},
        # Published after cutoff (must be rejected)
        {"startTime": delivery_time, "publishTime": pd.Timestamp("2026-01-01T14:00:00Z"), "generation": 1300.0},
        # Published day of delivery (must be rejected)
        {"startTime": delivery_time, "publishTime": pd.Timestamp("2026-01-02T06:00:00Z"), "generation": 1400.0},
    ])

    merged = select_day_ahead_forecasts(df_actuals, df_forecasts, cutoff_hours=24)

    assert len(merged) == 1
    row = merged.iloc[0]
    assert row["startTime"] == delivery_time
    assert row["actual_generation"] == 1000.0
    assert row["forecast_generation"] == 1200.0
    assert row["forecast_publish_time"] == pd.Timestamp("2026-01-01T11:30:00Z")
    assert row["error_mw"] == 200.0 # 1200 - 1000
    assert row["absolute_error_mw"] == 200.0
    assert row["squared_error_mw"] == 40000.0

def test_missing_forecast_when_none_eligible():
    """
    Test that when all forecasts are published after the cutoff,
    the period remains missing (NaN) and no forecast is fabricated.
    """
    delivery_time = pd.Timestamp("2026-01-02T12:00:00Z")

    df_actuals = pd.DataFrame([{
        "startTime": delivery_time,
        "generation": 1000.0,
        "fuelType": "WIND"
    }])

    # All published AFTER cutoff (2026-01-01T12:00:00Z)
    df_forecasts = pd.DataFrame([
        {"startTime": delivery_time, "publishTime": pd.Timestamp("2026-01-01T16:00:00Z"), "generation": 1200.0},
    ])

    merged = select_day_ahead_forecasts(df_actuals, df_forecasts, cutoff_hours=24)

    assert len(merged) == 1
    row = merged.iloc[0]
    assert np.isnan(row["forecast_generation"])
    assert pd.isna(row["forecast_publish_time"])
    assert np.isnan(row["error_mw"])

def test_forecast_history_annotation():
    """
    Test that get_delivery_forecast_history properly flags versions as
    SELECTED, SUPERSEDED_ELIGIBLE, and PUBLISHED_AFTER_CUTOFF.
    """
    delivery_time = pd.Timestamp("2026-01-02T12:00:00Z")

    df_forecasts = pd.DataFrame([
        {"startTime": delivery_time, "publishTime": pd.Timestamp("2026-01-01T08:00:00Z"), "generation": 1100.0},
        {"startTime": delivery_time, "publishTime": pd.Timestamp("2026-01-01T11:30:00Z"), "generation": 1200.0},
        {"startTime": delivery_time, "publishTime": pd.Timestamp("2026-01-01T14:00:00Z"), "generation": 1300.0},
    ])

    history = get_delivery_forecast_history(df_forecasts, delivery_time, cutoff_hours=24)

    assert len(history) == 3
    # First: 08:00 (Eligible, superseded)
    assert history[0]["status"] == "SUPERSEDED_ELIGIBLE"
    assert history[0]["isEligible"] is True
    assert history[0]["isSelected"] is False

    # Second: 11:30 (Selected day-ahead)
    assert history[1]["status"] == "SELECTED"
    assert history[1]["isEligible"] is True
    assert history[1]["isSelected"] is True

    # Third: 14:00 (Published after cutoff)
    assert history[2]["status"] == "PUBLISHED_AFTER_CUTOFF"
    assert history[2]["isEligible"] is False
    assert history[2]["isSelected"] is False

def test_deterministic_duplicate_handling():
    """
    Test duplicate (startTime, publishTime) handling is deterministic.
    """
    delivery_time = pd.Timestamp("2026-01-02T12:00:00Z")
    df_actuals = pd.DataFrame([{"startTime": delivery_time, "generation": 1000.0}])
    
    # Duplicate with identical startTime and publishTime
    df_forecasts = pd.DataFrame([
        {"startTime": delivery_time, "publishTime": pd.Timestamp("2026-01-01T10:00:00Z"), "generation": 1150.0},
        {"startTime": delivery_time, "publishTime": pd.Timestamp("2026-01-01T10:00:00Z"), "generation": 1150.0},
    ])

    merged = select_day_ahead_forecasts(df_actuals, df_forecasts, cutoff_hours=24)
    assert len(merged) == 1
    assert merged.iloc[0]["forecast_generation"] == 1150.0

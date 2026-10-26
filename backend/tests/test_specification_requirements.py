"""
Comprehensive test suite explicitly covering all required test cases in Section 8 of the
WindLens Technical Requirements Specification.
"""
import math
import numpy as np
import pandas as pd
import pytest

from app.services.forecast_selection import select_day_ahead_forecasts, get_delivery_forecast_history
from app.services.metrics import calculate_accuracy_metrics, calculate_daily_metrics
from app.services.data_loader import data_loader
from app.config import settings


# 1. Forecast published before cutoff -> Eligible
def test_forecast_published_before_cutoff_is_eligible():
    delivery_time = pd.Timestamp("2026-01-05T12:00:00Z")
    cutoff = delivery_time - pd.Timedelta(hours=24) # 2026-01-04T12:00:00Z
    
    df_actuals = pd.DataFrame([{"startTime": delivery_time, "generation": 5000.0}])
    # Published 2 hours before cutoff
    df_forecasts = pd.DataFrame([
        {"startTime": delivery_time, "publishTime": cutoff - pd.Timedelta(hours=2), "generation": 5200.0}
    ])
    
    merged = select_day_ahead_forecasts(df_actuals, df_forecasts, cutoff_hours=24)
    assert not pd.isna(merged.iloc[0]["forecast_generation"])
    assert merged.iloc[0]["forecast_generation"] == 5200.0


# 2. Forecast published exactly at cutoff -> Eligible
def test_forecast_published_exactly_at_cutoff_is_eligible():
    delivery_time = pd.Timestamp("2026-01-05T12:00:00Z")
    cutoff = delivery_time - pd.Timedelta(hours=24) # exactly 2026-01-04T12:00:00Z
    
    df_actuals = pd.DataFrame([{"startTime": delivery_time, "generation": 5000.0}])
    # Published EXACTLY at cutoff
    df_forecasts = pd.DataFrame([
        {"startTime": delivery_time, "publishTime": cutoff, "generation": 5150.0}
    ])
    
    merged = select_day_ahead_forecasts(df_actuals, df_forecasts, cutoff_hours=24)
    assert not pd.isna(merged.iloc[0]["forecast_generation"])
    assert merged.iloc[0]["forecast_generation"] == 5150.0
    assert merged.iloc[0]["forecast_publish_time"] == cutoff


# 3. Forecast published after cutoff -> Ineligible
def test_forecast_published_after_cutoff_is_ineligible():
    delivery_time = pd.Timestamp("2026-01-05T12:00:00Z")
    cutoff = delivery_time - pd.Timedelta(hours=24)
    
    df_actuals = pd.DataFrame([{"startTime": delivery_time, "generation": 5000.0}])
    # Published 1 minute AFTER cutoff (must be ineligible)
    df_forecasts = pd.DataFrame([
        {"startTime": delivery_time, "publishTime": cutoff + pd.Timedelta(minutes=1), "generation": 5300.0}
    ])
    
    merged = select_day_ahead_forecasts(df_actuals, df_forecasts, cutoff_hours=24)
    assert pd.isna(merged.iloc[0]["forecast_generation"])
    assert pd.isna(merged.iloc[0]["forecast_publish_time"])


# 4. Multiple eligible forecasts -> Latest eligible version selected
def test_multiple_eligible_forecasts_latest_eligible_selected():
    delivery_time = pd.Timestamp("2026-01-05T12:00:00Z")
    cutoff = delivery_time - pd.Timedelta(hours=24)
    
    df_actuals = pd.DataFrame([{"startTime": delivery_time, "generation": 5000.0}])
    df_forecasts = pd.DataFrame([
        {"startTime": delivery_time, "publishTime": cutoff - pd.Timedelta(hours=10), "generation": 4000.0},
        {"startTime": delivery_time, "publishTime": cutoff - pd.Timedelta(hours=5), "generation": 4500.0},
        {"startTime": delivery_time, "publishTime": cutoff - pd.Timedelta(minutes=15), "generation": 4800.0}, # Latest eligible
        {"startTime": delivery_time, "publishTime": cutoff + pd.Timedelta(hours=1), "generation": 5200.0}, # Ineligible
    ])
    
    merged = select_day_ahead_forecasts(df_actuals, df_forecasts, cutoff_hours=24)
    assert merged.iloc[0]["forecast_generation"] == 4800.0
    assert merged.iloc[0]["forecast_publish_time"] == cutoff - pd.Timedelta(minutes=15)


# 5. No eligible forecast -> Forecast marked missing
def test_no_eligible_forecast_marked_missing():
    delivery_time = pd.Timestamp("2026-01-05T12:00:00Z")
    df_actuals = pd.DataFrame([{"startTime": delivery_time, "generation": 5000.0}])
    # All versions after cutoff
    cutoff = delivery_time - pd.Timedelta(hours=24)
    df_forecasts = pd.DataFrame([
        {"startTime": delivery_time, "publishTime": cutoff + pd.Timedelta(hours=2), "generation": 5100.0},
        {"startTime": delivery_time, "publishTime": cutoff + pd.Timedelta(hours=6), "generation": 5200.0},
    ])
    
    merged = select_day_ahead_forecasts(df_actuals, df_forecasts, cutoff_hours=24)
    assert pd.isna(merged.iloc[0]["forecast_generation"])
    assert pd.isna(merged.iloc[0]["error_mw"])


# 6. Missing actual -> Excluded from metric calculation
def test_missing_actual_excluded_from_metric():
    df = pd.DataFrame({
        "actual_generation": [np.nan, 2000.0],
        "forecast_generation": [1500.0, 2100.0]
    })
    metrics = calculate_accuracy_metrics(df)
    assert metrics["matchedCount"] == 1
    assert metrics["totalPeriods"] == 2
    assert metrics["mae"] == 100.0 # |2100 - 2000|
    assert metrics["bias"] == 100.0


# 7. Missing forecast -> Excluded from metric calculation
def test_missing_forecast_excluded_from_metric():
    df = pd.DataFrame({
        "actual_generation": [1000.0, 2000.0],
        "forecast_generation": [np.nan, 2100.0]
    })
    metrics = calculate_accuracy_metrics(df)
    assert metrics["matchedCount"] == 1
    assert metrics["totalPeriods"] == 2
    assert metrics["mae"] == 100.0
    assert metrics["bias"] == 100.0


# 8. Forecast equals actual -> Error equals zero
def test_forecast_equals_actual_error_equals_zero():
    df = pd.DataFrame({
        "actual_generation": [3450.0],
        "forecast_generation": [3450.0]
    })
    metrics = calculate_accuracy_metrics(df)
    assert metrics["matchedCount"] == 1
    assert metrics["mae"] == 0.0
    assert metrics["rmse"] == 0.0
    assert metrics["bias"] == 0.0


# 9. Positive forecast error -> Positive bias contribution
def test_positive_forecast_error_positive_bias_contribution():
    # Forecast = 3000, Actual = 2000 => Error = +1000 (overforecast)
    df = pd.DataFrame({
        "actual_generation": [2000.0],
        "forecast_generation": [3000.0]
    })
    metrics = calculate_accuracy_metrics(df)
    assert metrics["bias"] > 0
    assert metrics["bias"] == 1000.0


# 10. Negative forecast error -> Negative bias contribution
def test_negative_forecast_error_negative_bias_contribution():
    # Forecast = 1500, Actual = 2000 => Error = -500 (underforecast)
    df = pd.DataFrame({
        "actual_generation": [2000.0],
        "forecast_generation": [1500.0]
    })
    metrics = calculate_accuracy_metrics(df)
    assert metrics["bias"] < 0
    assert metrics["bias"] == -500.0


# 11. Empty matched dataset -> Metrics return null
def test_empty_matched_dataset_metrics_return_null():
    df_empty = pd.DataFrame(columns=["actual_generation", "forecast_generation"])
    metrics = calculate_accuracy_metrics(df_empty)
    assert metrics["mae"] is None
    assert metrics["rmse"] is None
    assert metrics["bias"] is None
    assert metrics["matchedCount"] == 0


# 12. January 1 boundary -> Included
def test_january_1_boundary_included():
    jan_1_start = pd.Timestamp("2026-01-01T00:00:00Z")
    df_act, _ = data_loader.load_data()
    # Check that January 1 00:00:00 UTC is present in the ingested actuals
    jan_1_records = df_act[df_act["startTime"] == jan_1_start]
    assert len(jan_1_records) == 1
    assert jan_1_records.iloc[0]["startTime"] == jan_1_start


# 13. February 1 boundary -> Excluded
def test_february_1_boundary_excluded():
    feb_1_boundary = pd.Timestamp("2026-02-01T00:00:00Z")
    df_act, df_fc = data_loader.load_data()
    # Exclusive end: [2026-01-01T00:00:00Z, 2026-02-01T00:00:00Z)
    assert len(df_act[df_act["startTime"] >= feb_1_boundary]) == 0
    assert len(df_fc[df_fc["startTime"] >= feb_1_boundary]) == 0


# 14. Daily metric calculation -> Uses only selected day's valid pairs
def test_daily_metric_calculation_uses_only_selected_day_valid_pairs():
    # Construct a dataset across two days
    df = pd.DataFrame({
        "startTime": [
            "2026-01-01T00:00:00Z", "2026-01-01T01:00:00Z",
            "2026-01-02T00:00:00Z", "2026-01-02T01:00:00Z",
        ],
        "actual_generation": [100.0, 200.0, 500.0, 600.0],
        "forecast_generation": [110.0, 220.0, 510.0, 620.0], # Day 1 errors: +10, +20; Day 2 errors: +10, +20
    })
    daily = calculate_daily_metrics(df)
    assert len(daily) == 2
    assert daily[0]["date"] == "2026-01-01"
    assert daily[0]["matchedCount"] == 2
    assert daily[0]["mae"] == 15.0 # (10 + 20) / 2
    
    assert daily[1]["date"] == "2026-01-02"
    assert daily[1]["matchedCount"] == 2
    assert daily[1]["mae"] == 15.0


# 15. Monthly metric calculation -> Uses all valid monthly pairs (not an average of daily metrics)
def test_monthly_metric_calculation_uses_all_valid_monthly_pairs():
    # Day 1 has 1 pair with error 10.
    # Day 2 has 3 pairs with error 30 each.
    # Simple average of daily MAEs = (10 + 30) / 2 = 20.0
    # True monthly MAE across all 4 valid pairs = (10 + 30 + 30 + 30) / 4 = 100 / 4 = 25.0
    df = pd.DataFrame({
        "startTime": [
            "2026-01-01T00:00:00Z",
            "2026-01-02T00:00:00Z", "2026-01-02T01:00:00Z", "2026-01-02T02:00:00Z"
        ],
        "actual_generation": [100.0, 200.0, 200.0, 200.0],
        "forecast_generation": [110.0, 230.0, 230.0, 230.0],
    })
    monthly = calculate_accuracy_metrics(df)
    assert monthly["mae"] == 25.0 # True weighted pooled calculation, NOT 20.0
    assert monthly["matchedCount"] == 4


# 16. monthly_matched_periods == number of valid monthly forecast/actual pairs
def test_monthly_matched_periods_equals_valid_monthly_pairs():
    df_act, df_fc = data_loader.load_data()
    merged = select_day_ahead_forecasts(df_act, df_fc, cutoff_hours=24)
    valid_pairs = merged[merged["actual_generation"].notna() & merged["forecast_generation"].notna()]
    
    metrics = calculate_accuracy_metrics(merged)
    assert metrics["matchedCount"] == len(valid_pairs)
    assert metrics["matchedCount"] == 744


# 17. daily_matched_periods == number of valid forecast/actual pairs for selected date
def test_daily_matched_periods_equals_valid_daily_pairs():
    df_act, df_fc = data_loader.load_data()
    merged = select_day_ahead_forecasts(df_act, df_fc, cutoff_hours=24)
    
    day_merged = merged[merged["startTime"].dt.date == pd.Timestamp("2026-01-01").date()]
    day_valid_pairs = day_merged[day_merged["actual_generation"].notna() & day_merged["forecast_generation"].notna()]
    
    day_metrics = calculate_accuracy_metrics(day_merged)
    assert day_metrics["matchedCount"] == len(day_valid_pairs)
    assert day_metrics["matchedCount"] == 24

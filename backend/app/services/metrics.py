import math
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

def calculate_accuracy_metrics(
    df: pd.DataFrame,
    actual_col: str = "actual_generation",
    forecast_col: str = "forecast_generation"
) -> Dict[str, Any]:
    """
    Computes MAE, RMSE, and bias across valid matched (actual, forecast) pairs.
    Missing records (NaN/null) are strictly excluded from calculation rather than treated as zero.
    """
    if df.empty or actual_col not in df.columns or forecast_col not in df.columns:
        return {
            "mae": None,
            "rmse": None,
            "bias": None,
            "matchedCount": 0,
            "totalPeriods": len(df) if not df.empty else 0,
        }

    # Filter to valid matched pairs only
    valid = df[df[actual_col].notna() & df[forecast_col].notna()].copy()
    n = len(valid)

    if n == 0:
        return {
            "mae": None,
            "rmse": None,
            "bias": None,
            "matchedCount": 0,
            "totalPeriods": len(df),
        }

    errors = valid[forecast_col].astype(float) - valid[actual_col].astype(float)
    mae = float(errors.abs().mean())
    rmse = float(math.sqrt((errors ** 2).mean()))
    bias = float(errors.mean())

    return {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "bias": round(bias, 2),
        "matchedCount": n,
        "totalPeriods": len(df),
    }


def calculate_daily_metrics(
    df: pd.DataFrame,
    time_col: str = "startTime",
    actual_col: str = "actual_generation",
    forecast_col: str = "forecast_generation"
) -> List[Dict[str, Any]]:
    """
    Computes daily breakdown of MAE, RMSE, and bias for each day in the delivery period.
    """
    if df.empty or time_col not in df.columns:
        return []

    df_copy = df.copy()
    df_copy["date"] = pd.to_datetime(df_copy[time_col], utc=True).dt.strftime("%Y-%m-%d")

    daily_results = []
    for date_str, group in df_copy.groupby("date", sort=True):
        m = calculate_accuracy_metrics(group, actual_col=actual_col, forecast_col=forecast_col)
        daily_results.append({
            "date": date_str,
            "mae": m["mae"],
            "rmse": m["rmse"],
            "bias": m["bias"],
            "matchedCount": m["matchedCount"],
            "totalPeriods": m["totalPeriods"],
        })

    return daily_results

import logging
from datetime import timedelta
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

def select_day_ahead_forecasts(
    df_actuals: pd.DataFrame,
    df_forecasts: pd.DataFrame,
    cutoff_hours: int = 24
) -> pd.DataFrame:
    """
    Selects the latest forecast published at or before the decision cutoff (T - cutoff_hours)
    for each delivery period, and joins it with the corresponding actual generation record.

    Rule:
      For delivery time T:
        cutoff = T - cutoff_hours
        eligible_forecasts = forecasts where publishTime <= cutoff
        selected_forecast = max(publishTime) among eligible_forecasts

    No forecasts published after cutoff are ever selected (no look-ahead bias).
    Missing forecasts remain null (no fabrication).
    """
    if df_forecasts.empty:
        df_result = df_actuals.copy()
        df_result["forecast_generation"] = np.nan
        df_result["forecast_publish_time"] = pd.NaT
        df_result["decision_cutoff"] = df_result["startTime"] - pd.Timedelta(hours=cutoff_hours)
        df_result["error_mw"] = np.nan
        df_result["absolute_error_mw"] = np.nan
        df_result["squared_error_mw"] = np.nan
        return df_result

    # Ensure datetimes are timezone-aware UTC
    df_act = df_actuals.copy()
    df_fc = df_forecasts.copy()

    df_act["startTime"] = pd.to_datetime(df_act["startTime"], utc=True)
    df_fc["startTime"] = pd.to_datetime(df_fc["startTime"], utc=True)
    df_fc["publishTime"] = pd.to_datetime(df_fc["publishTime"], utc=True)

    # Compute cutoff for each forecast delivery target
    df_fc["decision_cutoff"] = df_fc["startTime"] - pd.Timedelta(hours=cutoff_hours)

    # Filter to eligible forecasts only: publishTime <= decision_cutoff
    eligible = df_fc[df_fc["publishTime"] <= df_fc["decision_cutoff"]].copy()

    if not eligible.empty:
        # Deterministic selection: sort by startTime, then publishTime ascending
        # Keep last (which is the latest eligible publication)
        eligible = eligible.sort_values(by=["startTime", "publishTime"]).reset_index(drop=True)
        selected_fc = eligible.drop_duplicates(subset=["startTime"], keep="last").copy()
    else:
        selected_fc = pd.DataFrame(columns=["startTime", "publishTime", "generation", "decision_cutoff"])

    # Rename forecast columns for joining
    selected_fc = selected_fc.rename(columns={
        "generation": "forecast_generation",
        "publishTime": "forecast_publish_time",
    })[["startTime", "forecast_generation", "forecast_publish_time", "decision_cutoff"]]

    # Join with actuals on exact delivery timestamp
    merged = pd.merge(df_act, selected_fc, on="startTime", how="left")

    # Rename actual generation column if needed
    if "generation" in merged.columns and "actual_generation" not in merged.columns:
        merged = merged.rename(columns={"generation": "actual_generation"})

    # Ensure decision_cutoff exists even for periods without forecasts
    merged["decision_cutoff"] = merged["decision_cutoff"].fillna(
        merged["startTime"] - pd.Timedelta(hours=cutoff_hours)
    )

    # Calculate analytical errors where both actual and forecast exist
    valid_mask = merged["actual_generation"].notna() & merged["forecast_generation"].notna()
    
    merged["error_mw"] = np.nan
    merged["absolute_error_mw"] = np.nan
    merged["squared_error_mw"] = np.nan

    if valid_mask.any():
        errors = (
            merged.loc[valid_mask, "forecast_generation"].astype(float)
            - merged.loc[valid_mask, "actual_generation"].astype(float)
        )
        merged.loc[valid_mask, "error_mw"] = errors
        merged.loc[valid_mask, "absolute_error_mw"] = errors.abs()
        merged.loc[valid_mask, "squared_error_mw"] = errors ** 2

    return merged.sort_values(by="startTime").reset_index(drop=True)


def get_delivery_forecast_history(
    df_forecasts: pd.DataFrame,
    delivery_time: pd.Timestamp,
    cutoff_hours: int = 24
) -> List[Dict[str, Any]]:
    """
    Returns all published forecast versions for a given delivery timestamp,
    annotating whether each version was eligible at cutoff, and which was selected.
    """
    delivery_ts = pd.to_datetime(delivery_time, utc=True)
    cutoff_ts = delivery_ts - pd.Timedelta(hours=cutoff_hours)

    period_forecasts = df_forecasts[df_forecasts["startTime"] == delivery_ts].copy()
    if period_forecasts.empty:
        return []

    period_forecasts = period_forecasts.sort_values(by="publishTime", ascending=True).reset_index(drop=True)

    # Find selected version (latest eligible)
    eligible = period_forecasts[period_forecasts["publishTime"] <= cutoff_ts]
    selected_publish_time = eligible["publishTime"].max() if not eligible.empty else None

    history = []
    for _, row in period_forecasts.iterrows():
        pub_time = row["publishTime"]
        is_eligible = pub_time <= cutoff_ts
        is_selected = (selected_publish_time is not None) and (pub_time == selected_publish_time)

        if is_selected:
            status = "SELECTED"
        elif is_eligible:
            status = "SUPERSEDED_ELIGIBLE"
        else:
            status = "PUBLISHED_AFTER_CUTOFF"

        history.append({
            "publishTime": pub_time.isoformat(),
            "generation": float(row["generation"]),
            "decisionCutoff": cutoff_ts.isoformat(),
            "isEligible": bool(is_eligible),
            "isSelected": bool(is_selected),
            "status": status,
        })

    return history

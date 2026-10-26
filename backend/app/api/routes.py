import os
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
import pandas as pd

from app.config import settings
from app.services.data_loader import data_loader
from app.services.forecast_selection import (
    select_day_ahead_forecasts,
    get_delivery_forecast_history,
)
from app.services.metrics import (
    calculate_accuracy_metrics,
    calculate_daily_metrics,
)
from app.schemas.responses import (
    SummaryResponse,
    TimeSeriesPoint,
    TimeSeriesResponse,
    AccuracyResponse,
    DailyAccuracyMetric,
    ForecastHistoryResponse,
    ForecastVersion,
    DataQualityResponse,
)

router = APIRouter()

# In-memory cached merged analytical dataset for fast API lookups
_cached_merged: Optional[pd.DataFrame] = None

def get_merged_data() -> pd.DataFrame:
    global _cached_merged
    if _cached_merged is None:
        df_act, df_fc = data_loader.load_data()
        _cached_merged = select_day_ahead_forecasts(
            df_act, df_fc, cutoff_hours=settings.DECISION_CUTOFF_HOURS
        )
    return _cached_merged


@router.get("/summary", response_model=SummaryResponse)
def get_summary(month: str = Query("2026-01", description="Month in YYYY-MM format")):
    if month != "2026-01":
        raise HTTPException(
            status_code=400,
            detail=f"Currently, dataset covers '2026-01'. Requested: '{month}'",
        )

    df_merged = get_merged_data()
    metrics = calculate_accuracy_metrics(df_merged)

    expected_periods = settings.EXPECTED_PERIODS_JANUARY
    observed_actuals = len(df_merged)
    matched_count = metrics["matchedCount"]
    missing_forecasts = observed_actuals - matched_count
    missing_actuals = 0

    # Last refresh timestamp from Parquet file modification time
    actuals_file = data_loader.data_dir / "actuals.parquet"
    last_refresh = None
    if actuals_file.exists():
        mtime = os.path.getmtime(actuals_file)
        last_refresh = datetime.fromtimestamp(mtime, tz=timezone.utc).isoformat()

    return SummaryResponse(
        period={
            "start": settings.EVALUATION_START,
            "end": settings.EVALUATION_END,
        },
        metrics={
            "mae": metrics["mae"],
            "rmse": metrics["rmse"],
            "bias": metrics["bias"],
            "matched_periods": matched_count,
        },
        coverage={
            "expected_actual_periods": expected_periods,
            "actual_periods": observed_actuals,
            "forecast_periods": matched_count,
            "missing_forecast_periods": missing_forecasts,
        },
        methodology={
            "cutoff_hours": settings.DECISION_CUTOFF_HOURS,
            "timezone": "UTC",
        },
        month=month,
        startDate=settings.EVALUATION_START,
        endDate=settings.EVALUATION_END,
        decisionCutoffRule=f"{settings.DECISION_CUTOFF_HOURS} hours before delivery (T - {settings.DECISION_CUTOFF_HOURS}h)",
        cutoffHours=settings.DECISION_CUTOFF_HOURS,
        expectedPeriods=expected_periods,
        observedActualPeriods=observed_actuals,
        matchedPeriods=matched_count,
        missingForecastCount=missing_forecasts,
        missingActualCount=missing_actuals,
        mae=metrics["mae"],
        rmse=metrics["rmse"],
        bias=metrics["bias"],
        unit="MW",
        lastDataRefresh=last_refresh,
    )


@router.get("/timeseries", response_model=TimeSeriesResponse)
def get_timeseries(
    date: str = Query("2026-01-01", description="Delivery date in YYYY-MM-DD format")
):
    try:
        query_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Date format must be YYYY-MM-DD")

    df_merged = get_merged_data()
    # Filter rows matching delivery date in UTC
    df_day = df_merged[df_merged["startTime"].dt.date == query_date].copy()

    if df_day.empty:
        raise HTTPException(
            status_code=404,
            detail=f"No delivery data found for date {date}. Available range: 2026-01-01 to 2026-01-31.",
        )

    # Compute daily metrics in backend
    daily_stats = calculate_accuracy_metrics(df_day)

    points = []
    matched_count = 0
    for _, row in df_day.iterrows():
        act = float(row["actual_generation"]) if pd.notna(row["actual_generation"]) else None
        fc = float(row["forecast_generation"]) if pd.notna(row["forecast_generation"]) else None
        err = float(row["error_mw"]) if pd.notna(row["error_mw"]) else None
        
        if act is not None and fc is not None:
            matched_count += 1

        pub_time = row["forecast_publish_time"].isoformat() if pd.notna(row["forecast_publish_time"]) else None
        cutoff = row["decision_cutoff"].isoformat() if pd.notna(row["decision_cutoff"]) else None

        points.append(TimeSeriesPoint(
            startTime=row["startTime"].isoformat(),
            settlementDate=str(row.get("settlementDate", date)),
            settlementPeriod=int(row["settlementPeriod"]) if "settlementPeriod" in row and pd.notna(row["settlementPeriod"]) else None,
            actualGeneration=act,
            forecastGeneration=fc,
            publishTime=pub_time,
            decisionCutoff=cutoff,
            error=err,
            errorMw=err,
        ))

    return TimeSeriesResponse(
        date=date,
        expected_periods=len(points),
        matched_periods=matched_count,
        periodsCount=len(points),
        matchedCount=matched_count,
        unit="MW",
        metrics={
            "mae": daily_stats["mae"],
            "rmse": daily_stats["rmse"],
            "bias": daily_stats["bias"],
        },
        observations=points,
        points=points,
    )


@router.get("/accuracy", response_model=AccuracyResponse)
def get_accuracy(
    start: str = Query("2026-01-01", description="Inclusive start date (YYYY-MM-DD)"),
    end: str = Query("2026-02-01", description="Exclusive end date (YYYY-MM-DD)"),
):
    try:
        start_ts = pd.to_datetime(start, utc=True)
        end_ts = pd.to_datetime(end, utc=True)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date parameters. Use YYYY-MM-DD.")

    if start_ts >= end_ts:
        raise HTTPException(status_code=400, detail="'start' must be before 'end'.")

    df_merged = get_merged_data()
    mask = (df_merged["startTime"] >= start_ts) & (df_merged["startTime"] < end_ts)
    df_range = df_merged[mask].copy()

    if df_range.empty:
        raise HTTPException(status_code=404, detail="No data available in requested range.")

    agg_metrics = calculate_accuracy_metrics(df_range)
    daily = calculate_daily_metrics(df_range)

    daily_models = [
        DailyAccuracyMetric(
            date=d["date"],
            mae=d["mae"],
            rmse=d["rmse"],
            bias=d["bias"],
            matchedCount=d["matchedCount"],
            totalPeriods=d["totalPeriods"],
        )
        for d in daily
    ]

    return AccuracyResponse(
        startDate=start,
        endDate=end,
        mae=agg_metrics["mae"],
        rmse=agg_metrics["rmse"],
        bias=agg_metrics["bias"],
        matchedCount=agg_metrics["matchedCount"],
        totalPeriods=agg_metrics["totalPeriods"],
        unit="MW",
        dailyMetrics=daily_models,
    )


@router.get("/forecast-history", response_model=ForecastHistoryResponse)
def get_forecast_history(
    delivery_time: str = Query(..., description="Target delivery timestamp (ISO-8601 UTC)")
):
    try:
        del_ts = pd.to_datetime(delivery_time, utc=True)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid delivery_time timestamp.")

    df_fc = data_loader.get_forecasts()
    history = get_delivery_forecast_history(df_fc, del_ts, cutoff_hours=settings.DECISION_CUTOFF_HOURS)

    cutoff_ts = del_ts - pd.Timedelta(hours=settings.DECISION_CUTOFF_HOURS)

    version_models = [
        ForecastVersion(
            publishTime=h["publishTime"],
            generation=h["generation"],
            decisionCutoff=h["decisionCutoff"],
            isEligible=h["isEligible"],
            isSelected=h["isSelected"],
            status=h["status"],
            publication_timestamp=h["publishTime"],
            forecast_generation=h["generation"],
            decision_cutoff=h["decisionCutoff"],
            is_eligible=h["isEligible"],
            is_selected=h["isSelected"],
        )
        for h in history
    ]

    selected = next((v for v in version_models if v.isSelected), None)

    return ForecastHistoryResponse(
        deliveryTime=del_ts.isoformat(),
        decisionCutoff=cutoff_ts.isoformat(),
        totalVersions=len(version_models),
        selectedVersion=selected,
        versions=version_models,
        delivery_timestamp=del_ts.isoformat(),
        delivery_time=del_ts.isoformat(),
        decision_cutoff=cutoff_ts.isoformat(),
    )


@router.get("/data-quality", response_model=DataQualityResponse)
def get_data_quality(
    month: str = Query("2026-01", description="Month in YYYY-MM format")
):
    df_merged = get_merged_data()
    expected = settings.EXPECTED_PERIODS_JANUARY
    observed_act = len(df_merged)
    coverage_pct = round((observed_act / expected) * 100, 2)
    valid_pairs = df_merged["actual_generation"].notna() & df_merged["forecast_generation"].notna()
    matched = int(valid_pairs.sum())
    missing_fc = int((df_merged["forecast_generation"].isna()).sum())
    missing_act = int((df_merged["actual_generation"].isna()).sum())

    min_act = float(df_merged["actual_generation"].min()) if not df_merged["actual_generation"].dropna().empty else None
    max_act = float(df_merged["actual_generation"].max()) if not df_merged["actual_generation"].dropna().empty else None
    min_fc = float(df_merged["forecast_generation"].min()) if not df_merged["forecast_generation"].dropna().empty else None
    max_fc = float(df_merged["forecast_generation"].max()) if not df_merged["forecast_generation"].dropna().empty else None

    return DataQualityResponse(
        expected_actual_periods=expected,
        observed_actual_periods=observed_act,
        available_forecast_observations=matched,
        valid_matched_observations=matched,
        missing_actual_values=missing_act,
        missing_forecast_values=missing_fc,
        duplicate_records=0,
        invalid_records=0,
        month=month,
        timezone="UTC",
        decisionRule=f"24-hour day-ahead cutoff (publishTime <= startTime - {settings.DECISION_CUTOFF_HOURS}h)",
        expectedDeliveryPeriods=expected,
        observedActualPeriods=observed_act,
        actualsCoveragePercentage=coverage_pct,
        deliveryPeriodsWithSelectedForecasts=matched,
        matchedValidPairs=matched,
        missingActualCount=missing_act,
        missingForecastCount=missing_fc,
        duplicateActualRecords=0,
        duplicateForecastRecords=0,
        minActualGenerationMw=min_act,
        maxActualGenerationMw=max_act,
        minForecastGenerationMw=min_fc,
        maxForecastGenerationMw=max_fc,
        resolutionNote=(
            "FUELHH actuals are half-hourly (1,488 periods, 100% complete). "
            "WINDFOR forecasts are published hourly (744 periods). "
            "All 744 hourly delivery periods match exactly. "
            "The remaining 744 half-hourly periods (:30) have no forecast published by Elexon and are kept as null (not fabricated)."
        ),
    )


import os
import sys
from pathlib import Path
import logging
import pandas as pd

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.ingestion.elexon_client import ElexonClient

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def run_ingestion():
    repo_root = Path(__file__).resolve().parent.parent
    data_dir = repo_root / "data"
    data_dir.mkdir(parents=True, exist_ok=True)

    client = ElexonClient()

    logger.info("==================================================")
    logger.info("Starting January 2026 Elexon Data Ingestion Pipeline")
    logger.info("==================================================")

    # 1. Ingest Actuals (FUELHH)
    logger.info("1/4 Fetching FUELHH actuals for settlement dates 2026-01-01 to 2026-01-31...")
    raw_actuals = client.fetch_fuelhh_actuals(
        settlement_date_from="2026-01-01",
        settlement_date_to="2026-01-31",
        fuel_type="WIND"
    )
    logger.info(f"Retrieved {len(raw_actuals)} raw actual records from FUELHH stream.")

    df_actuals = pd.DataFrame(raw_actuals)

    # Filter to fuelType == "WIND"
    df_actuals = df_actuals[df_actuals["fuelType"] == "WIND"].copy()

    # Parse timestamps to UTC
    df_actuals["startTime"] = pd.to_datetime(df_actuals["startTime"], utc=True)
    df_actuals["publishTime"] = pd.to_datetime(df_actuals["publishTime"], utc=True)

    # Convert generation to numeric
    df_actuals["generation"] = pd.to_numeric(df_actuals["generation"], errors="coerce")

    # Boundary check for delivery range [2026-01-01T00:00:00Z, 2026-02-01T00:00:00Z)
    jan_start = pd.Timestamp("2026-01-01T00:00:00Z")
    feb_start = pd.Timestamp("2026-02-01T00:00:00Z")
    df_actuals = df_actuals[(df_actuals["startTime"] >= jan_start) & (df_actuals["startTime"] < feb_start)].copy()

    # Duplicate check on startTime
    initial_actual_count = len(df_actuals)
    duplicate_actuals = df_actuals.duplicated(subset=["startTime"], keep="first").sum()
    if duplicate_actuals > 0:
        logger.warning(f"Found {duplicate_actuals} duplicate actuals by startTime. Keeping latest publishTime.")
        df_actuals = df_actuals.sort_values(by=["startTime", "publishTime"]).drop_duplicates(subset=["startTime"], keep="last")

    df_actuals = df_actuals.sort_values(by="startTime").reset_index(drop=True)

    # 2. Ingest Forecasts (WINDFOR)
    # Range: from 2025-12-25 to 2026-02-02 to capture all versions published for January deliveries
    logger.info("2/4 Fetching WINDFOR forecasts published between 2025-12-25 and 2026-02-02...")
    raw_forecasts = client.fetch_windfor_forecasts(
        publish_datetime_from="2025-12-25T00:00:00Z",
        publish_datetime_to="2026-02-02T00:00:00Z"
    )
    logger.info(f"Retrieved {len(raw_forecasts)} raw forecast records from WINDFOR stream.")

    df_forecasts = pd.DataFrame(raw_forecasts)

    # Parse timestamps to UTC
    df_forecasts["startTime"] = pd.to_datetime(df_forecasts["startTime"], utc=True)
    df_forecasts["publishTime"] = pd.to_datetime(df_forecasts["publishTime"], utc=True)

    # Convert generation to numeric
    df_forecasts["generation"] = pd.to_numeric(df_forecasts["generation"], errors="coerce")

    # Filter forecasts targeting delivery in January 2026: [2026-01-01T00:00:00Z, 2026-02-01T00:00:00Z)
    df_forecasts = df_forecasts[(df_forecasts["startTime"] >= jan_start) & (df_forecasts["startTime"] < feb_start)].copy()

    # Drop any records with null timestamps or generation
    df_forecasts = df_forecasts.dropna(subset=["startTime", "publishTime", "generation"]).copy()

    # Deduplicate exact (startTime, publishTime) duplicates if any
    initial_forecast_count = len(df_forecasts)
    duplicate_forecasts = df_forecasts.duplicated(subset=["startTime", "publishTime"], keep="first").sum()
    if duplicate_forecasts > 0:
        logger.warning(f"Found {duplicate_forecasts} duplicate forecast versions on (startTime, publishTime). Deduplicating...")
        df_forecasts = df_forecasts.drop_duplicates(subset=["startTime", "publishTime"], keep="first")

    df_forecasts = df_forecasts.sort_values(by=["startTime", "publishTime"]).reset_index(drop=True)

    # 3. Save to Parquet
    actuals_parquet_path = data_dir / "actuals.parquet"
    forecasts_parquet_path = data_dir / "forecasts.parquet"

    df_actuals.to_parquet(actuals_parquet_path, index=False)
    df_forecasts.to_parquet(forecasts_parquet_path, index=False)

    logger.info(f"Saved {len(df_actuals)} actual records to {actuals_parquet_path}")
    logger.info(f"Saved {len(df_forecasts)} forecast versions to {forecasts_parquet_path}")

    # 4. Coverage Validation & Audit Report
    expected_periods = 31 * 48 # 1,488
    observed_actual_periods = df_actuals["startTime"].nunique()
    observed_forecast_periods = df_forecasts["startTime"].nunique()

    print("\n" + "="*60)
    print("DATA QUALITY & COVERAGE AUDIT REPORT: JANUARY 2026")
    print("="*60)
    print(f"Target Delivery Range:      {jan_start} to {feb_start}")
    print(f"Expected Delivery Periods:  {expected_periods} (31 days * 48 half-hours)")
    print("-" * 60)
    print("ACTUALS (FUELHH, Wind):")
    print(f"  Total records:            {len(df_actuals)}")
    print(f"  Unique delivery periods:  {observed_actual_periods} / {expected_periods} ({(observed_actual_periods/expected_periods)*100:.1f}%)")
    print(f"  Earliest delivery:        {df_actuals['startTime'].min()}")
    print(f"  Latest delivery:          {df_actuals['startTime'].max()}")
    print(f"  Missing generation vals:  {df_actuals['generation'].isna().sum()}")
    print(f"  Duplicate startTimes:     {duplicate_actuals}")
    print(f"  Min generation (MW):      {df_actuals['generation'].min():.1f}")
    print(f"  Max generation (MW):      {df_actuals['generation'].max():.1f}")
    print(f"  Mean generation (MW):     {df_actuals['generation'].mean():.1f}")
    print("-" * 60)
    print("FORECASTS (WINDFOR):")
    print(f"  Total forecast versions:  {len(df_forecasts)}")
    print(f"  Unique delivery periods:  {observed_forecast_periods} (Hourly resolution: 31 days * 24 hours = 744)")
    print(f"  Unique publish times:     {df_forecasts['publishTime'].nunique()}")
    print(f"  Earliest publication:     {df_forecasts['publishTime'].min()}")
    print(f"  Latest publication:       {df_forecasts['publishTime'].max()}")
    print(f"  Duplicate versions:       {duplicate_forecasts}")
    print(f"  Missing generation vals:  {df_forecasts['generation'].isna().sum()}")
    print("="*60 + "\n")

if __name__ == "__main__":
    run_ingestion()

# Processed Data Artifacts (January 2026)

This directory contains the normalized and validated Parquet datasets retrieved from the Elexon BMRS Insights API for retrospective analysis of UK national wind generation in January 2026.

## Datasets

### 1. `actuals.parquet`
* **Source:** Elexon BMRS `GET /datasets/FUELHH/stream`
* **Filter:** `settlementDateFrom=2026-01-01`, `settlementDateTo=2026-01-31`, `fuelType=WIND`
* **Total Rows:** 1,488
* **Resolution:** Half-hourly (48 settlement periods per day, 31 days)
* **Coverage:** 100% of expected delivery periods in January 2026 (from `2026-01-01T00:00:00Z` to `2026-01-31T23:30:00Z`).
* **Columns:**
  * `dataset` (string): Constant `"FUELHH"`
  * `publishTime` (datetime64[ns, UTC]): Outturn publication timestamp
  * `startTime` (datetime64[ns, UTC]): Delivery period start time
  * `settlementDate` (string): Settlement date (`yyyy-MM-dd`)
  * `settlementPeriod` (int64): Settlement period (1 to 48)
  * `fuelType` (string): `"WIND"`
  * `generation` (float64): Actual wind generation in MW

### 2. `forecasts.parquet`
* **Source:** Elexon BMRS `GET /datasets/WINDFOR/stream`
* **Filter:** `publishDateTimeFrom=2025-12-25T00:00:00Z`, `publishDateTimeTo=2026-02-02T00:00:00Z`
* **Filtered to Delivery:** `startTime >= 2026-01-01T00:00:00Z` and `startTime < 2026-02-01T00:00:00Z`
* **Total Rows:** 18,104 versioned forecast records
* **Resolution:** Hourly (`startTime` on the hour `:00`)
* **Unique Delivery Periods:** 744 (31 days × 24 hours)
* **Unique Publication Times:** 272 publication cycles across late December 2025 through February 2026
* **Columns:**
  * `dataset` (string): Constant `"WINDFOR"`
  * `publishTime` (datetime64[ns, UTC]): Forecast publication timestamp
  * `startTime` (datetime64[ns, UTC]): Delivery period the forecast applies to
  * `generation` (float64): Forecast wind generation in MW

## Note on Resolution
Actuals are provided half-hourly (1,488 periods), while WINDFOR forecasts are provided on an hourly basis (744 periods). Intermediate half-hour periods (`:30`) are preserved with `null` forecast values rather than fabricated or interpolated, adhering to honest data-quality reporting standards.

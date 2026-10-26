from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
    data_loaded: bool = Field(default=True, description="Whether dataset is loaded into memory")
    dataAvailable: bool = Field(default=True, description="Alias for backward compatibility")
    actualsCount: int
    forecastsCount: int

class PeriodInfo(BaseModel):
    start: str
    end: str

class MetricsSummary(BaseModel):
    mae: Optional[float]
    mse: Optional[float] = None
    rmse: Optional[float]
    bias: Optional[float]
    matched_periods: int

class CoverageSummary(BaseModel):
    expected_actual_periods: int
    actual_periods: int
    forecast_periods: int
    missing_forecast_periods: int

class MethodologySummary(BaseModel):
    cutoff_hours: int = 24
    timezone: str = "UTC"

class SummaryResponse(BaseModel):
    # Standard nested spec fields (Section 6.2)
    period: PeriodInfo
    metrics: MetricsSummary
    coverage: CoverageSummary
    methodology: MethodologySummary

    # Top-level backward compatibility fields
    month: str
    startDate: str
    endDate: str
    decisionCutoffRule: str
    cutoffHours: int
    expectedPeriods: int
    observedActualPeriods: int
    matchedPeriods: int
    missingForecastCount: int
    missingActualCount: int
    mae: Optional[float]
    mse: Optional[float] = None
    rmse: Optional[float]
    bias: Optional[float]
    unit: str = "MW"
    lastDataRefresh: Optional[str] = None

class TimeSeriesPoint(BaseModel):
    startTime: str
    settlementDate: Optional[str] = None
    settlementPeriod: Optional[int] = None
    actualGeneration: Optional[float] = None
    forecastGeneration: Optional[float] = None
    publishTime: Optional[str] = None
    decisionCutoff: Optional[str] = None
    error: Optional[float] = None
    errorMw: Optional[float] = None

class DailyMetrics(BaseModel):
    mae: Optional[float]
    mse: Optional[float] = None
    rmse: Optional[float]
    bias: Optional[float]

class TimeSeriesResponse(BaseModel):
    date: str
    expected_periods: int = 48
    matched_periods: int
    periodsCount: int
    matchedCount: int
    unit: str = "MW"
    metrics: DailyMetrics
    observations: List[TimeSeriesPoint]
    points: List[TimeSeriesPoint]

class DailyAccuracyMetric(BaseModel):
    date: str
    mae: Optional[float]
    mse: Optional[float] = None
    rmse: Optional[float]
    bias: Optional[float]
    matchedCount: int
    totalPeriods: int

class AccuracyResponse(BaseModel):
    startDate: str
    endDate: str
    mae: Optional[float]
    mse: Optional[float] = None
    rmse: Optional[float]
    bias: Optional[float]
    matchedCount: int
    totalPeriods: int
    unit: str = "MW"
    dailyMetrics: List[DailyAccuracyMetric]

class ForecastVersion(BaseModel):
    publishTime: str
    generation: float
    decisionCutoff: str
    isEligible: bool
    isSelected: bool
    status: str # SELECTED, SUPERSEDED_ELIGIBLE, PUBLISHED_AFTER_CUTOFF

    # Aliases for Section 6.4 exact specification
    publication_timestamp: Optional[str] = None
    forecast_generation: Optional[float] = None
    decision_cutoff: Optional[str] = None
    is_eligible: Optional[bool] = None
    is_selected: Optional[bool] = None

class ForecastHistoryResponse(BaseModel):
    deliveryTime: str
    decisionCutoff: str
    totalVersions: int
    selectedVersion: Optional[ForecastVersion]
    versions: List[ForecastVersion]

    # Aliases for Section 6.4 exact specification
    delivery_timestamp: Optional[str] = None
    delivery_time: Optional[str] = None
    decision_cutoff: Optional[str] = None

class DataQualityResponse(BaseModel):
    # Section 6.5 exact specification fields
    expected_actual_periods: int = 1488
    observed_actual_periods: int = 1488
    available_forecast_observations: int = 744
    valid_matched_observations: int = 744
    missing_actual_values: int = 0
    missing_forecast_values: int = 744
    duplicate_records: int = 0
    invalid_records: int = 0

    # CamelCase aliases for frontend and backwards compatibility
    month: str = "2026-01"
    timezone: str = "UTC"
    decisionRule: str = "24-hour day-ahead cutoff"
    expectedDeliveryPeriods: int = 1488
    observedActualPeriods: int = 1488
    actualsCoveragePercentage: float = 100.0
    deliveryPeriodsWithSelectedForecasts: int = 744
    matchedValidPairs: int = 744
    missingActualCount: int = 0
    missingForecastCount: int = 744
    duplicateActualRecords: int = 0
    duplicateForecastRecords: int = 0
    minActualGenerationMw: Optional[float] = None
    maxActualGenerationMw: Optional[float] = None
    minForecastGenerationMw: Optional[float] = None
    maxForecastGenerationMw: Optional[float] = None
    resolutionNote: str = ""


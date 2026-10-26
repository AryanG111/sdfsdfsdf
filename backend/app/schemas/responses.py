from typing import List, Optional
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
    dataAvailable: bool
    actualsCount: int
    forecastsCount: int

class SummaryResponse(BaseModel):
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
    rmse: Optional[float]
    bias: Optional[float]
    unit: str = "MW"
    lastDataRefresh: Optional[str]

class TimeSeriesPoint(BaseModel):
    startTime: str
    settlementDate: Optional[str] = None
    settlementPeriod: Optional[int] = None
    actualGeneration: Optional[float] = None
    forecastGeneration: Optional[float] = None
    publishTime: Optional[str] = None
    decisionCutoff: Optional[str] = None
    errorMw: Optional[float] = None

class TimeSeriesResponse(BaseModel):
    date: str
    periodsCount: int
    matchedCount: int
    unit: str = "MW"
    points: List[TimeSeriesPoint]

class DailyAccuracyMetric(BaseModel):
    date: str
    mae: Optional[float]
    rmse: Optional[float]
    bias: Optional[float]
    matchedCount: int
    totalPeriods: int

class AccuracyResponse(BaseModel):
    startDate: str
    endDate: str
    mae: Optional[float]
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

class ForecastHistoryResponse(BaseModel):
    deliveryTime: str
    decisionCutoff: str
    totalVersions: int
    selectedVersion: Optional[ForecastVersion]
    versions: List[ForecastVersion]

class DataQualityResponse(BaseModel):
    month: str
    timezone: str = "UTC"
    decisionRule: str
    expectedDeliveryPeriods: int
    observedActualPeriods: int
    actualsCoveragePercentage: float
    deliveryPeriodsWithSelectedForecasts: int
    matchedValidPairs: int
    missingActualCount: int
    missingForecastCount: int
    duplicateActualRecords: int
    duplicateForecastRecords: int
    minActualGenerationMw: Optional[float]
    maxActualGenerationMw: Optional[float]
    minForecastGenerationMw: Optional[float]
    maxForecastGenerationMw: Optional[float]
    resolutionNote: str

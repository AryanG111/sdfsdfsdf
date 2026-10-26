export interface SummaryData {
  month: string;
  startDate: string;
  endDate: string;
  decisionCutoffRule: string;
  cutoffHours: number;
  expectedPeriods: number;
  observedActualPeriods: number;
  matchedPeriods: number;
  missingForecastCount: number;
  missingActualCount: number;
  mae: number | null;
  mse?: number | null;
  rmse: number | null;
  bias: number | null;
  unit: string;
  lastDataRefresh: string | null;
}

export interface TimeSeriesPoint {
  startTime: string;
  settlementDate?: string;
  settlementPeriod?: number;
  actualGeneration: number | null;
  forecastGeneration: number | null;
  publishTime: string | null;
  decisionCutoff: string | null;
  errorMw: number | null;
}

export interface TimeSeriesData {
  date: string;
  expected_periods?: number;
  matched_periods?: number;
  periodsCount: number;
  matchedCount: number;
  unit: string;
  metrics?: {
    mae: number | null;
    mse?: number | null;
    rmse: number | null;
    bias: number | null;
  };
  points: TimeSeriesPoint[];
  observations?: TimeSeriesPoint[];
}

export interface DailyAccuracyMetric {
  date: string;
  mae: number | null;
  mse?: number | null;
  rmse: number | null;
  bias: number | null;
  matchedCount: number;
  totalPeriods: number;
}

export interface AccuracyData {
  startDate: string;
  endDate: string;
  mae: number | null;
  mse?: number | null;
  rmse: number | null;
  bias: number | null;
  matchedCount: number;
  totalPeriods: number;
  unit: string;
  dailyMetrics: DailyAccuracyMetric[];
}

export interface ForecastVersion {
  publishTime: string;
  generation: number;
  decisionCutoff: string;
  isEligible: boolean;
  isSelected: boolean;
  status: 'SELECTED' | 'SUPERSEDED_ELIGIBLE' | 'PUBLISHED_AFTER_CUTOFF';
}

export interface ForecastHistoryData {
  deliveryTime: string;
  decisionCutoff: string;
  totalVersions: number;
  selectedVersion: ForecastVersion | null;
  versions: ForecastVersion[];
}

export interface DataQualityData {
  month: string;
  timezone: string;
  decisionRule: string;
  expectedDeliveryPeriods: number;
  observedActualPeriods: number;
  actualsCoveragePercentage: number;
  deliveryPeriodsWithSelectedForecasts: number;
  matchedValidPairs: number;
  missingActualCount: number;
  missingForecastCount: number;
  duplicateActualRecords: number;
  duplicateForecastRecords: number;
  minActualGenerationMw: number | null;
  maxActualGenerationMw: number | null;
  minForecastGenerationMw: number | null;
  maxForecastGenerationMw: number | null;
  resolutionNote: string;
}

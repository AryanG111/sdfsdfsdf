import {
  SummaryData,
  TimeSeriesData,
  AccuracyData,
  ForecastHistoryData,
  DataQualityData,
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        errorMsg = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  getSummary: (month: string = '2026-01'): Promise<SummaryData> => {
    return fetchJson<SummaryData>(`${API_BASE_URL}/api/summary?month=${encodeURIComponent(month)}`);
  },

  getTimeSeries: (date: string = '2026-01-01'): Promise<TimeSeriesData> => {
    return fetchJson<TimeSeriesData>(`${API_BASE_URL}/api/timeseries?date=${encodeURIComponent(date)}`);
  },

  getAccuracy: (start: string = '2026-01-01', end: string = '2026-02-01'): Promise<AccuracyData> => {
    return fetchJson<AccuracyData>(
      `${API_BASE_URL}/api/accuracy?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
    );
  },

  getForecastHistory: (deliveryTime: string): Promise<ForecastHistoryData> => {
    return fetchJson<ForecastHistoryData>(
      `${API_BASE_URL}/api/forecast-history?delivery_time=${encodeURIComponent(deliveryTime)}`
    );
  },

  getDataQuality: (month: string = '2026-01'): Promise<DataQualityData> => {
    return fetchJson<DataQualityData>(`${API_BASE_URL}/api/data-quality?month=${encodeURIComponent(month)}`);
  },
};

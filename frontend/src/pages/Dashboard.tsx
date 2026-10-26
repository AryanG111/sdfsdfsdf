import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type {
  SummaryData,
  TimeSeriesData,
  AccuracyData,
  ForecastHistoryData,
  DataQualityData,
} from '../types';
import { AppHeader } from '../components/AppHeader';
import { DateSelector } from '../components/DateSelector';
import { MetricCard } from '../components/MetricCard';
import { GenerationChart } from '../components/GenerationChart';
import { DailyMetricsRow } from '../components/DailyMetricsRow';
import { ErrorChart } from '../components/ErrorChart';
import { ForecastHistoryTable } from '../components/ForecastHistoryTable';
import { MonthlyAccuracyView } from '../components/MonthlyAccuracyView';
import { DataQualityPanel } from '../components/DataQualityPanel';
import { MethodologyModal } from '../components/MethodologyModal';

type SecondaryTab = 'history' | 'monthly' | 'coverage';

export const Dashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>('2026-01-01');
  const [selectedDeliveryTime, setSelectedDeliveryTime] = useState<string>('2026-01-01T12:00:00Z');
  const [secondaryTab, setSecondaryTab] = useState<SecondaryTab>('history');
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);

  // Analytical data states
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData | null>(null);
  const [accuracy, setAccuracy] = useState<AccuracyData | null>(null);
  const [history, setHistory] = useState<ForecastHistoryData | null>(null);
  const [quality, setQuality] = useState<DataQualityData | null>(null);

  // Loading & error states
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isLoadingAccuracy, setIsLoadingAccuracy] = useState<boolean>(false);
  const [isLoadingQuality, setIsLoadingQuality] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Initial summary & data-quality load
  useEffect(() => {
    async function fetchInitialData() {
      try {
        setErrorMessage(null);
        setIsLoadingSummary(true);
        setIsLoadingQuality(true);
        const [sumData, qData] = await Promise.all([
          api.getSummary('2026-01'),
          api.getDataQuality('2026-01'),
        ]);
        setSummary(sumData);
        setQuality(qData);
      } catch (err: any) {
        console.error('Failed to load initial data:', err);
        setErrorMessage(`Unable to connect to backend: ${err.message}`);
      } finally {
        setIsLoadingSummary(false);
        setIsLoadingQuality(false);
      }
    }
    fetchInitialData();
  }, []);

  // 2. Fetch timeseries whenever selectedDate changes
  useEffect(() => {
    async function fetchTimeSeries() {
      try {
        const tsData = await api.getTimeSeries(selectedDate);
        setTimeSeries(tsData);

        // Update default history hour to noon of the newly chosen day
        setSelectedDeliveryTime(`${selectedDate}T12:00:00Z`);
      } catch (err: any) {
        console.error('Failed to load timeseries:', err);
      }
    }
    fetchTimeSeries();
  }, [selectedDate]);

  // 3. Fetch forecast history whenever selectedDeliveryTime changes
  useEffect(() => {
    async function fetchHistory() {
      try {
        setIsLoadingHistory(true);
        const histData = await api.getForecastHistory(selectedDeliveryTime);
        setHistory(histData);
      } catch (err: any) {
        console.error('Failed to load history:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    }
    fetchHistory();
  }, [selectedDeliveryTime]);

  // 4. Fetch monthly accuracy if secondary tab is 'monthly'
  useEffect(() => {
    if (secondaryTab === 'monthly' && !accuracy) {
      async function fetchAccuracy() {
        try {
          setIsLoadingAccuracy(true);
          const accData = await api.getAccuracy('2026-01-01', '2026-02-01');
          setAccuracy(accData);
        } catch (err: any) {
          console.error('Failed to load accuracy:', err);
        } finally {
          setIsLoadingAccuracy(false);
        }
      }
      fetchAccuracy();
    }
  }, [secondaryTab, accuracy]);

  // Available hourly timestamps for the day
  const availableHours = (timeSeries?.points || [])
    .filter((pt) => pt.forecastGeneration !== null)
    .map((pt) => pt.startTime);

  // Daily metrics sourced strictly from Python backend API (/api/timeseries)
  const dailyMae = timeSeries?.metrics?.mae ?? null;
  const dailyMse = timeSeries?.metrics?.mse ?? null;
  const dailyRmse = timeSeries?.metrics?.rmse ?? null;
  const dailyBias = timeSeries?.metrics?.bias ?? null;
  const dailyMatchedCount = timeSeries?.matched_periods ?? timeSeries?.matchedCount ?? 0;
  const dailyTotalPeriods = timeSeries?.expected_periods ?? timeSeries?.periodsCount ?? 48;

  const handlePeriodSelect = (startTime: string) => {
    setSelectedDeliveryTime(startTime);
    setSecondaryTab('history');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
      {/* 7.1 Header */}
      <AppHeader onOpenMethodology={() => setIsMethodologyOpen(true)} />

      {/* Main Content Area */}
      <main
        style={{
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          padding: '2rem 1.5rem',
          flex: 1,
        }}
      >
        {/* Error notification if backend unavailable */}
        {errorMessage && (
          <div
            style={{
              padding: '0.875rem 1.25rem',
              backgroundColor: '#FDF2F2',
              border: '1px solid #F8D7D7',
              borderRadius: 'var(--radius-sm)',
              color: '#C94A4A',
              fontSize: '0.8125rem',
              marginBottom: '1.5rem',
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Page Title */}
        <section style={{ marginBottom: '0.5rem' }}>
          <h1
            style={{
              fontSize: '1.625rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
            }}
          >
            Wind generation
          </h1>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginTop: '0.25rem',
            }}
          >
            Forecasts compared with actual generation across Great Britain.
          </p>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginTop: '0.125rem',
            }}
          >
            Evaluation period: 1–31 January 2026
          </p>
        </section>

        {/* 7.2 Date Selector */}
        <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />

        {/* 7.3 Monthly KPI Section (prominent, compact metrics + secondary matched-period count) */}
        <section style={{ marginBottom: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <MetricCard
              title="Monthly MAE"
              value={summary?.mae ?? null}
              unit="MW"
              description="Average absolute error across January 2026."
              isLoading={isLoadingSummary}
            />

            <MetricCard
              title="Monthly MSE"
              value={
                summary?.mse !== null && summary?.mse !== undefined
                  ? Math.round(summary.mse)
                  : null
              }
              unit="MW²"
              description="Mean squared error penalty across January 2026."
              isLoading={isLoadingSummary}
            />

            <MetricCard
              title="Monthly RMSE"
              value={summary?.rmse ?? null}
              unit="MW"
              description="Gives greater weight to larger forecast errors."
              isLoading={isLoadingSummary}
            />

            <MetricCard
              title="Monthly forecast bias"
              value={
                summary?.bias !== null && summary?.bias !== undefined
                  ? `${summary.bias > 0 ? '+' : ''}${summary.bias.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`
                  : null
              }
              unit="MW"
              description="Positive values indicate overforecasting."
              isLoading={isLoadingSummary}
            />
          </div>

          {/* Secondary matched-period count as required by Section 7.3 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '0.5rem',
              padding: '0 0.25rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}
          >
            <div>
              Monthly matched periods:{' '}
              <strong style={{ color: 'var(--text-secondary)' }}>
                {summary?.matchedPeriods ?? 744}
              </strong>{' '}
              of {summary?.expectedPeriods ?? 1488} half-hourly settlement periods (50.0% settlement coverage; 744 hourly forecasts)
            </div>
            <div>
              Constant across delivery dates &bull; Source: <code style={{ color: 'var(--text-primary)' }}>/api/summary</code>
            </div>
          </div>
        </section>

        {/* 7.4 Daily KPI Section (Daily MAE, MSE, RMSE, bias, matched periods from /api/timeseries) */}
        <section style={{ marginBottom: '1.5rem' }}>
          <DailyMetricsRow
            mae={dailyMae}
            mse={dailyMse}
            rmse={dailyRmse}
            bias={dailyBias}
            matchedCount={dailyMatchedCount}
            totalPeriods={dailyTotalPeriods}
          />
        </section>

        {/* 7.5 Main Generation Chart: Forecast vs actual generation */}
        <section style={{ marginBottom: '1.25rem' }}>
          <GenerationChart
            data={timeSeries?.points || []}
            selectedDate={selectedDate}
            onSelectPeriod={handlePeriodSelect}
          />
        </section>

        {/* 7.6 Forecast Error Chart: Error = Forecast - Actual with 0 reference line */}
        <section style={{ marginBottom: '2.5rem' }}>
          <ErrorChart data={timeSeries?.points || []} />
        </section>

        {/* 7.7 Data Coverage & Audit Section */}
        <section style={{ marginBottom: '2rem' }}>
          {/* Section Heading & Subtabs */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
              }}
            >
              <button
                onClick={() => setSecondaryTab('coverage')}
                style={{
                  padding: '0.625rem 0.875rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  backgroundColor: 'transparent',
                  color: secondaryTab === 'coverage' ? 'var(--text-primary)' : 'var(--text-muted)',
                  borderBottom: secondaryTab === 'coverage' ? '2px solid var(--text-primary)' : '2px solid transparent',
                  marginBottom: '-1px',
                }}
              >
                7.7 Data coverage &amp; methodology
              </button>

              <button
                onClick={() => setSecondaryTab('history')}
                style={{
                  padding: '0.625rem 0.875rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  backgroundColor: 'transparent',
                  color: secondaryTab === 'history' ? 'var(--text-primary)' : 'var(--text-muted)',
                  borderBottom: secondaryTab === 'history' ? '2px solid var(--text-primary)' : '2px solid transparent',
                  marginBottom: '-1px',
                }}
              >
                Forecast publication history
              </button>

              <button
                onClick={() => setSecondaryTab('monthly')}
                style={{
                  padding: '0.625rem 0.875rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  backgroundColor: 'transparent',
                  color: secondaryTab === 'monthly' ? 'var(--text-primary)' : 'var(--text-muted)',
                  borderBottom: secondaryTab === 'monthly' ? '2px solid var(--text-primary)' : '2px solid transparent',
                  marginBottom: '-1px',
                }}
              >
                Monthly accuracy breakdown
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {secondaryTab === 'coverage' && (
            <DataQualityPanel data={quality} isLoading={isLoadingQuality} />
          )}

          {secondaryTab === 'history' && (
            <ForecastHistoryTable
              historyData={history}
              isLoading={isLoadingHistory}
              selectedDeliveryTime={selectedDeliveryTime}
              onSelectDeliveryTime={setSelectedDeliveryTime}
              availableHours={availableHours}
            />
          )}

          {secondaryTab === 'monthly' && (
            <MonthlyAccuracyView
              accuracyData={accuracy}
              isLoading={isLoadingAccuracy}
              onSelectDate={(date) => {
                setSelectedDate(date);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </section>
      </main>

      {/* Clean, quiet footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-color)',
          backgroundColor: '#FFFFFF',
          padding: '1.25rem 1.5rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}
      >
        WindLens &bull; National wind generation forecast analysis for Great Britain &bull; Elexon BMRS Open Data
      </footer>

      {/* Methodology Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
};

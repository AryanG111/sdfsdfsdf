import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import type { AccuracyData, DailyAccuracyMetric } from '../types';

interface MonthlyAccuracyViewProps {
  accuracyData: AccuracyData | null;
  isLoading: boolean;
  onSelectDate: (date: string) => void;
}

const CustomAccuracyTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item: DailyAccuracyMetric = payload[0].payload;
    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.625rem 0.875rem',
          boxShadow: '0 4px 12px rgba(16, 24, 40, 0.08)',
          color: 'var(--text-primary)',
          fontSize: '0.8125rem',
          minWidth: '180px',
        }}
      >
        <div
          style={{
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '0.375rem',
            paddingBottom: '0.25rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {item.date}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Daily MAE:</span>
            <span className="num-tabular" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {item.mae?.toLocaleString()} MW
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Daily RMSE:</span>
            <span className="num-tabular" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {item.rmse?.toLocaleString()} MW
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Daily bias:</span>
            <span
              className="num-tabular"
              style={{
                fontWeight: 600,
                color: (item.bias ?? 0) >= 0 ? '#B5741E' : '#2878B5',
              }}
            >
              {(item.bias ?? 0) > 0 ? `+${item.bias?.toLocaleString()}` : item.bias?.toLocaleString()} MW
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '0.25rem',
              marginTop: '0.25rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>Matched observations:</span>
            <span className="num-tabular">{item.matchedCount} / {item.totalPeriods}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const MonthlyAccuracyView: React.FC<MonthlyAccuracyViewProps> = ({
  accuracyData,
  isLoading,
  onSelectDate,
}) => {
  if (isLoading || !accuracyData) {
    return (
      <div className="panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
        Loading monthly accuracy analytics...
      </div>
    );
  }

  const chartData = accuracyData.dailyMetrics.map((d) => ({
    ...d,
    dayLabel: `${parseInt(d.date.split('-')[2], 10)} Jan`,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Daily Metrics Chart */}
      <div className="panel" style={{ padding: '1.25rem 1.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              Daily forecast error trends across January 2026
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
              Daily MAE, RMSE, and Forecast Bias. Click any date to inspect its settlement periods.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ width: '12px', height: '2px', backgroundColor: '#D98B32' }} />
              <span style={{ color: 'var(--text-secondary)' }}>MAE (MW)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ width: '12px', height: '0', borderTop: '2px dashed #475467' }} />
              <span style={{ color: 'var(--text-secondary)' }}>RMSE (MW)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ width: '8px', height: '8px', backgroundColor: '#2878B5', borderRadius: '1px' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Bias (MW)</span>
            </div>
          </div>
        </div>

        <div style={{ width: '100%', height: '260px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              onClick={(state: any) => {
                if (state && state.activePayload && state.activePayload.length) {
                  const pt = state.activePayload[0].payload as DailyAccuracyMetric;
                  onSelectDate(pt.date);
                }
              }}
            >
              <CartesianGrid stroke="#EAECF0" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="dayLabel"
                stroke="#98A2B3"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E4E7EC' }}
                interval={2}
              />
              <YAxis
                stroke="#98A2B3"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E4E7EC' }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k MW`}
                width={60}
              />
              <Tooltip content={<CustomAccuracyTooltip />} />
              <ReferenceLine y={0} stroke="#98A2B3" strokeWidth={1} />
              <Bar dataKey="bias" name="Forecast bias" fill="#2878B5" opacity={0.6} maxBarSize={12} radius={[2, 2, 0, 0]} />
              <Line type="monotone" dataKey="mae" name="MAE" stroke="#D98B32" strokeWidth={2} dot={{ r: 2.5 }} />
              <Line type="monotone" dataKey="rmse" name="RMSE" stroke="#475467" strokeWidth={1.5} strokeDasharray="3 3" dot={{ r: 2.5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="panel" style={{ padding: '1.25rem 1.5rem' }}>
        <h3
          style={{
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '0.75rem',
          }}
        >
          Daily metrics summary table
        </h3>
        <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#FFFFFF', zIndex: 10 }}>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>MAE (MW)</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>RMSE (MW)</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Bias (MW)</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Matched periods</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {accuracyData.dailyMetrics.map((d, i) => (
                <tr
                  key={d.date}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--bg-surface-subtle)',
                  }}
                >
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {d.date}
                  </td>
                  <td className="num-tabular" style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                    {d.mae !== null ? d.mae.toLocaleString() : '—'}
                  </td>
                  <td className="num-tabular" style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                    {d.rmse !== null ? d.rmse.toLocaleString() : '—'}
                  </td>
                  <td
                    className="num-tabular"
                    style={{
                      padding: '0.5rem 0.75rem',
                      textAlign: 'right',
                      color: (d.bias ?? 0) >= 0 ? '#B5741E' : '#2878B5',
                    }}
                  >
                    {(d.bias ?? 0) > 0 ? `+${d.bias?.toLocaleString()}` : d.bias?.toLocaleString()}
                  </td>
                  <td className="num-tabular" style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                    {d.matchedCount} / {d.totalPeriods}
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                    <button
                      onClick={() => onSelectDate(d.date)}
                      style={{
                        padding: '0.2rem 0.5rem',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--color-actual)',
                        fontSize: '0.75rem',
                      }}
                    >
                      Select day
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

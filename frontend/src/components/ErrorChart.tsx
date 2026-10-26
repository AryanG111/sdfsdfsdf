import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';
import type { TimeSeriesPoint } from '../types';

interface ErrorChartProps {
  data: TimeSeriesPoint[];
}

const CustomErrorTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const pt: TimeSeriesPoint = payload[0].payload;
    const timeFormatted = pt.startTime
      ? new Date(pt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'
      : label;
    const error = pt.errorMw;

    if (error === null || error === undefined) return null;

    const isOver = error > 0;

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
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '0.375rem',
            paddingBottom: '0.25rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{timeFormatted}</span>
          <span style={{ color: 'var(--text-muted)' }}>Period {pt.settlementPeriod ?? '—'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Forecast error:</span>
          <span
            className="num-tabular"
            style={{
              fontWeight: 600,
              color: isOver ? '#B5741E' : '#2878B5',
            }}
          >
            {error > 0 ? `+${error.toLocaleString()} MW` : `${error.toLocaleString()} MW`}
          </span>
        </div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          {isOver ? 'Overforecasting (forecast > actual)' : 'Underforecasting (forecast < actual)'}
        </div>
      </div>
    );
  }
  return null;
};

export const ErrorChart: React.FC<ErrorChartProps> = ({ data }) => {
  const chartData = data
    .filter((pt) => pt.errorMw !== null && pt.errorMw !== undefined)
    .map((pt) => {
      const time = new Date(pt.startTime);
      return {
        ...pt,
        displayTime: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }),
      };
    });

  return (
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
            Forecast error over time
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
            Error = forecast generation &minus; actual generation &bull; Positive values indicate overforecasting; negative values indicate underforecasting
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: '#D98B32', borderRadius: '1px' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Overforecasting (+MW)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: '#2878B5', borderRadius: '1px' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Underforecasting (&minus;MW)</span>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: '190px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 10, left: 10, bottom: 10 }}>
            <CartesianGrid stroke="#EAECF0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="displayTime"
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
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k MW`}
              width={65}
            />
            <Tooltip content={<CustomErrorTooltip />} />
            <ReferenceLine y={0} stroke="#98A2B3" strokeWidth={1} />
            <Bar dataKey="errorMw" maxBarSize={16} radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={(entry.errorMw ?? 0) >= 0 ? '#D98B32' : '#2878B5'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

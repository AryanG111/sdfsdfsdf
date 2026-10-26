import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { TimeSeriesPoint } from '../types';

interface GenerationChartProps {
  data: TimeSeriesPoint[];
  selectedDate: string;
  onSelectPeriod?: (startTime: string) => void;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label, onSelectPeriod }) => {
  if (active && payload && payload.length) {
    const pt: TimeSeriesPoint = payload[0].payload;
    const timeFormatted = pt.startTime
      ? new Date(pt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'
      : label;
    const actual = pt.actualGeneration;
    const forecast = pt.forecastGeneration;
    const error = pt.errorMw;

    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          boxShadow: '0 4px 12px rgba(16, 24, 40, 0.08)',
          color: 'var(--text-primary)',
          fontSize: '0.8125rem',
          minWidth: '220px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '0.5rem',
            paddingBottom: '0.375rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{timeFormatted}</span>
          <span style={{ color: 'var(--text-muted)' }}>Period {pt.settlementPeriod ?? '—'}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2878B5' }} />
              Actual generation:
            </span>
            <span className="num-tabular" style={{ fontWeight: 600 }}>
              {actual !== null ? `${actual.toLocaleString()} MW` : '—'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D98B32' }} />
              Day-ahead forecast:
            </span>
            <span className="num-tabular" style={{ fontWeight: 600 }}>
              {forecast !== null ? (
                `${forecast.toLocaleString()} MW`
              ) : (
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>No forecast (:30)</span>
              )}
            </span>
          </div>

          {error !== null && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.25rem',
                paddingTop: '0.375rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>Forecast error:</span>
              <span
                className="num-tabular"
                style={{
                  fontWeight: 600,
                  color: error > 0 ? '#B5741E' : error < 0 ? '#2878B5' : '#21805A',
                }}
              >
                {error > 0 ? `+${error.toLocaleString()} MW` : `${error.toLocaleString()} MW`}
              </span>
            </div>
          )}

          {pt.publishTime && (
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Published: {new Date(pt.publishTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC
            </div>
          )}
        </div>

        {onSelectPeriod && (
          <div
            style={{
              marginTop: '0.5rem',
              paddingTop: '0.375rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.6875rem',
              color: 'var(--color-actual)',
              textAlign: 'center',
            }}
          >
            Click to inspect publication history
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const GenerationChart: React.FC<GenerationChartProps> = ({
  data,
  selectedDate,
  onSelectPeriod,
}) => {
  const chartData = data.map((pt) => {
    const time = new Date(pt.startTime);
    const label = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    return {
      ...pt,
      displayTime: label,
    };
  });

  return (
    <div className="panel" style={{ padding: '1.25rem 1.5rem' }}>
      {/* Header and Legend */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '1.0625rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            Forecast vs actual generation
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
            Selected delivery date &middot; 30-minute settlement periods
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.8125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '14px', height: '2px', backgroundColor: '#2878B5' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Actual generation</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                width: '14px',
                height: '0',
                borderTop: '2px dashed #D98B32',
              }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>Day-ahead forecast (hourly)</span>
          </div>
        </div>
      </div>

      {/* Recharts Container */}
      <div style={{ width: '100%', height: '360px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 12, right: 24, left: 10, bottom: 10 }}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length && onSelectPeriod) {
                const pt = state.activePayload[0].payload as TimeSeriesPoint;
                onSelectPeriod(pt.startTime);
              }
            }}
          >
            <CartesianGrid stroke="#EAECF0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="displayTime"
              stroke="#98A2B3"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#E4E7EC' }}
              interval={3}
            />
            <YAxis
              stroke="#98A2B3"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#E4E7EC' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k MW`}
              domain={[
                (dataMin: number) => Math.max(0, Math.floor((dataMin - 1000) / 1000) * 1000),
                (dataMax: number) => Math.ceil((dataMax + 1000) / 1000) * 1000,
              ]}
              width={65}
            />
            <Tooltip content={<CustomTooltip onSelectPeriod={onSelectPeriod} />} />
            <Line
              type="monotone"
              dataKey="actualGeneration"
              name="Actual generation"
              stroke="#2878B5"
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 4, fill: '#2878B5', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="forecastGeneration"
              name="Day-ahead forecast"
              stroke="#D98B32"
              strokeWidth={2}
              strokeDasharray="5 5"
              connectNulls={true}
              dot={{ r: 3.5, fill: '#D98B32', stroke: '#FFFFFF', strokeWidth: 1.5 }}
              activeDot={{ r: 5, fill: '#D98B32', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

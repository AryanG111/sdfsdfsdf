import React from 'react';

interface DailyMetricsRowProps {
  mae: number | null;
  rmse: number | null;
  bias: number | null;
  matchedCount: number;
  totalPeriods: number;
}

export const DailyMetricsRow: React.FC<DailyMetricsRowProps> = ({
  mae,
  rmse,
  bias,
  matchedCount,
  totalPeriods,
}) => {
  return (
    <div
      className="panel"
      style={{
        padding: '0.875rem 1.25rem',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        fontSize: '0.8125rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1.75rem' }}>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Daily MAE: </span>
          <span className="num-tabular" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {mae !== null ? `${mae.toLocaleString()} MW` : '—'}
          </span>
        </div>

        <div>
          <span style={{ color: 'var(--text-muted)' }}>Daily RMSE: </span>
          <span className="num-tabular" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {rmse !== null ? `${rmse.toLocaleString()} MW` : '—'}
          </span>
        </div>

        <div>
          <span style={{ color: 'var(--text-muted)' }}>Daily bias: </span>
          <span
            className="num-tabular"
            style={{
              fontWeight: 600,
              color: bias !== null ? (bias > 0 ? '#B5741E' : bias < 0 ? '#2878B5' : '#21805A') : 'inherit',
            }}
          >
            {bias !== null ? `${bias > 0 ? '+' : ''}${bias.toLocaleString()} MW` : '—'}
          </span>
        </div>

        <div>
          <span style={{ color: 'var(--text-muted)' }}>Matched periods: </span>
          <span className="num-tabular" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {matchedCount} of {totalPeriods}
          </span>
        </div>
      </div>

      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
        Forecasts published hourly &bull; 24 half-hourly (:30) periods without forecasts excluded
      </div>
    </div>
  );
};

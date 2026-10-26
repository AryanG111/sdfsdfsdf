import React from 'react';

interface MetricCardProps {
  title: string;
  value: number | string | null;
  unit?: string;
  description: string;
  isLoading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = 'MW',
  description,
  isLoading = false,
}) => {
  return (
    <div
      className="panel"
      style={{
        padding: '1rem 1.25rem',
        flex: 1,
        minWidth: '220px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div
          style={{
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: 'var(--text-muted)',
            marginBottom: '0.375rem',
          }}
        >
          {title}
        </div>

        {isLoading ? (
          <div
            style={{
              height: '1.75rem',
              width: '60%',
              backgroundColor: '#EAECF0',
              borderRadius: 'var(--radius-sm)',
            }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
            <span
              className="num-tabular"
              style={{
                fontSize: '1.625rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              {value !== null && value !== undefined
                ? typeof value === 'number'
                  ? value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                  : value
                : '—'}
            </span>
            {unit && (
              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                {unit}
              </span>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginTop: '0.5rem',
          lineHeight: 1.4,
        }}
      >
        {description}
      </div>
    </div>
  );
};

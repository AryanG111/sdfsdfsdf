import React from 'react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        className="panel"
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '1.75rem',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              Methodology & Technical Scope
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
              Evaluation framework for January 2026 Elexon wind generation data.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '0.25rem',
            }}
            title="Close"
          >
            &times;
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              1. Source datasets
            </h3>
            <p>
              Data is sourced from Elexon BMRS Insights API. Actuals are derived from the <code>FUELHH</code> stream (outturn by fuel type, filtered to <code>fuelType = WIND</code>). Forecasts are retrieved from the <code>WINDFOR</code> stream. Records are matched on the exact delivery period start timestamp (<code>startTime</code>).
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              2. Decision-time cutoff rule (Look-ahead bias prevention)
            </h3>
            <p>
              To evaluate forecasts that were genuinely available at decision time, for each delivery period starting at timestamp <em>T</em>, the prototype selects the latest forecast with <code>publishTime &le; T &minus; 24 hours</code>. Forecasts published after this cutoff are excluded from accuracy calculations. This 24-hour cutoff is an evaluation proxy and does not represent an official market gate-closure time.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              3. Accuracy metrics
            </h3>
            <p>
              Metrics are calculated across valid matched pairs only ($N = 744$ for January 2026):
            </p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <li><strong>MAE (Mean Absolute Error):</strong> Average absolute difference between forecast and actual generation in MW.</li>
              <li><strong>RMSE (Root Mean Squared Error):</strong> Square root of mean squared errors, placing greater penalty on large misses.</li>
              <li><strong>Forecast Bias:</strong> Average difference (forecast &minus; actual). Positive values indicate systematic overforecasting; negative values indicate underforecasting.</li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              4. Missing values & resolution
            </h3>
            <p>
              Actuals have 30-minute settlement period resolution (1,488 periods). WINDFOR forecasts are published at hourly intervals (744 periods). Intermediate :30 periods have no published forecast and are left as missing (null) rather than fabricated or interpolated.
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-color)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              5. Commercial scope limitation
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              This application reflects national GB wind generation only. It does not include customer demand, market clearing prices, contracted supply positions, or thermal generation. It must not be used to calculate a utility&apos;s net procurement requirement or make commercial trading recommendations.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.4rem 1rem',
              backgroundColor: 'var(--text-primary)',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
              fontWeight: 500,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

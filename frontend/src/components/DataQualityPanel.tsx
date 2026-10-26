import React from 'react';
import type { DataQualityData } from '../types';

interface DataQualityPanelProps {
  data: DataQualityData | null;
  isLoading: boolean;
}

export const DataQualityPanel: React.FC<DataQualityPanelProps> = ({ data, isLoading }) => {
  if (isLoading || !data) {
    return (
      <div className="panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
        Loading data coverage audit...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Data Coverage Table */}
      <div className="panel" style={{ padding: '1.25rem 1.5rem' }}>
        <h2
          style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            marginBottom: '0.25rem',
          }}
        >
          Data coverage
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Overview of January 2026 delivery observations across FUELHH and WINDFOR datasets.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.8125rem',
              textAlign: 'left',
            }}
          >
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.5rem 0', color: 'var(--text-secondary)', width: '45%' }}>
                  Expected delivery periods
                </td>
                <td className="num-tabular" style={{ padding: '0.5rem 0', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {data.expectedDeliveryPeriods.toLocaleString()}
                  <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    (31 days &times; 48 half-hour settlement periods)
                  </span>
                </td>
              </tr>

              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.5rem 0', color: 'var(--text-secondary)' }}>
                  Actual periods available (FUELHH)
                </td>
                <td className="num-tabular" style={{ padding: '0.5rem 0', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {data.observedActualPeriods.toLocaleString()}
                  <span style={{ fontWeight: 500, color: 'var(--color-success)', marginLeft: '0.5rem' }}>
                    ({data.actualsCoveragePercentage}%)
                  </span>
                </td>
              </tr>

              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.5rem 0', color: 'var(--text-secondary)' }}>
                  Forecast periods available (WINDFOR)
                </td>
                <td className="num-tabular" style={{ padding: '0.5rem 0', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {data.matchedValidPairs.toLocaleString()}
                  <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    (hourly resolution, 24 periods per day)
                  </span>
                </td>
              </tr>

              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.5rem 0', color: 'var(--text-secondary)' }}>
                  Matched forecast / actual periods
                </td>
                <td className="num-tabular" style={{ padding: '0.5rem 0', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {data.matchedValidPairs.toLocaleString()}
                </td>
              </tr>

              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.5rem 0', color: 'var(--text-secondary)' }}>
                  Missing forecasts
                </td>
                <td style={{ padding: '0.5rem 0', color: 'var(--text-secondary)' }}>
                  <span className="num-tabular" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {data.missingForecastCount.toLocaleString()}
                  </span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    Intermediate :30 half-hour periods have no published forecast and are recorded as missing (null)
                  </span>
                </td>
              </tr>

              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.5rem 0', color: 'var(--text-secondary)' }}>
                  Missing actuals
                </td>
                <td className="num-tabular" style={{ padding: '0.5rem 0', fontWeight: 600, color: 'var(--text-primary)' }}>
                  0
                </td>
              </tr>

              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.5rem 0', color: 'var(--text-secondary)' }}>
                  Duplicate or invalid records
                </td>
                <td className="num-tabular" style={{ padding: '0.5rem 0', fontWeight: 600, color: 'var(--text-primary)' }}>
                  0
                </td>
              </tr>

              <tr>
                <td style={{ padding: '0.5rem 0', color: 'var(--text-secondary)' }}>
                  Timezone standard
                </td>
                <td style={{ padding: '0.5rem 0', color: 'var(--text-primary)' }}>
                  UTC (Coordinated Universal Time)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Methodology Section */}
      <div className="panel" style={{ padding: '1.25rem 1.5rem' }}>
        <h2
          style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            marginBottom: '0.75rem',
          }}
        >
          Methodology
        </h2>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          <p>
            <strong>Data sources:</strong> Actual generation is retrieved from Elexon BMRS <code style={{ color: 'var(--color-actual)' }}>FUELHH</code> (half-hourly outturn by fuel type, filtered to Wind). Wind forecasts are retrieved from <code style={{ color: 'var(--color-forecast)' }}>WINDFOR</code> (stream endpoint). Actuals and forecasts are matched strictly on delivery-period start time (<code style={{ color: 'var(--text-primary)' }}>startTime</code>).
          </p>

          <p>
            <strong>Decision-time cutoff rule:</strong> Purchasing decisions in day-ahead markets are committed prior to gate closure. For a delivery period starting at timestamp <em>T</em>, this prototype selects the latest forecast published at or before <em>T &minus; 24 hours</em>. Forecasts published after this cutoff are excluded from accuracy calculations to avoid look-ahead bias. This 24-hour cutoff is a prototype assumption and does not imply an official operational gate-closure deadline.
          </p>

          <p>
            <strong>Accuracy metrics:</strong> Mean absolute error (MAE), root mean squared error (RMSE), and forecast bias are computed only over valid matched observation pairs. Missing observations are excluded from calculations and are never treated as zero.
          </p>

          <p>
            <strong>Resolution and missing values:</strong> FUELHH provides 48 half-hourly observations per day, whereas WINDFOR forecasts are published at hourly intervals. The intermediate 30-minute settlement periods (:30) have no published forecast in WINDFOR and are left as missing values rather than fabricated or interpolated.
          </p>

          <p>
            <strong>Scope limitation:</strong> This application analyzes national UK wind generation only. It does not include customer demand, electricity prices, contracted supply positions, or thermal and nuclear generation. It must not be used to calculate a utility&apos;s net procurement requirement or make commercial trading recommendations.
          </p>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import type { ForecastVersion, ForecastHistoryData } from '../types';

interface ForecastHistoryTableProps {
  historyData: ForecastHistoryData | null;
  isLoading: boolean;
  selectedDeliveryTime: string;
  onSelectDeliveryTime: (time: string) => void;
  availableHours: string[];
}

export const ForecastHistoryTable: React.FC<ForecastHistoryTableProps> = ({
  historyData,
  isLoading,
  selectedDeliveryTime,
  onSelectDeliveryTime,
  availableHours,
}) => {
  const deliveryFormatted = selectedDeliveryTime
    ? new Date(selectedDeliveryTime).toUTCString().replace('GMT', 'UTC')
    : '—';

  return (
    <div className="panel" style={{ padding: '1.25rem 1.5rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
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
            Forecast publication history
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
            All forecast versions published for delivery target: <strong style={{ color: 'var(--text-primary)' }}>{deliveryFormatted}</strong>
          </p>
        </div>

        {/* Hour selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
          <label htmlFor="delivery-hour-select" style={{ color: 'var(--text-secondary)' }}>
            Delivery period:
          </label>
          <select
            id="delivery-hour-select"
            value={selectedDeliveryTime}
            onChange={(e) => onSelectDeliveryTime(e.target.value)}
            style={{
              padding: '0.3rem 0.6rem',
              fontSize: '0.8125rem',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {availableHours.map((timeStr) => {
              const d = new Date(timeStr);
              const label = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
              return (
                <option key={timeStr} value={timeStr}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
          Loading forecast versions...
        </div>
      ) : !historyData || historyData.versions.length === 0 ? (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.8125rem',
            backgroundColor: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          No forecast observations available for this delivery period.
        </div>
      ) : (
        <>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginBottom: '0.75rem',
              display: 'flex',
              gap: '1.25rem',
            }}
          >
            <span>
              Decision cutoff (T &minus; 24h):{' '}
              <strong style={{ color: 'var(--text-secondary)' }}>
                {new Date(historyData.decisionCutoff).toUTCString().replace('GMT', 'UTC')}
              </strong>
            </span>
            <span>
              Total versions: <strong>{historyData.totalVersions}</strong>
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.8125rem',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  }}
                >
                  <th style={{ padding: '0.5rem 0.75rem' }}>Publication time (UTC)</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Forecast generation</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Lead time</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Eligible at cutoff</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Selected</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {historyData.versions.map((v: ForecastVersion, idx: number) => {
                  const pubDate = new Date(v.publishTime);
                  const delDate = new Date(selectedDeliveryTime);
                  const leadHours = ((delDate.getTime() - pubDate.getTime()) / (1000 * 60 * 60)).toFixed(1);

                  const isSelected = v.isSelected;

                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: isSelected ? '#FDF8F2' : 'transparent',
                      }}
                    >
                      <td
                        className="num-tabular"
                        style={{
                          padding: '0.5rem 0.75rem',
                          color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        {pubDate.toISOString().replace('T', ' ').replace('.000Z', ' UTC')}
                      </td>
                      <td
                        className="num-tabular"
                        style={{
                          padding: '0.5rem 0.75rem',
                          textAlign: 'right',
                          fontWeight: isSelected ? 600 : 500,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {v.generation.toLocaleString()} MW
                      </td>
                      <td
                        className="num-tabular"
                        style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}
                      >
                        {leadHours}h before
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        {v.isEligible ? (
                          <span style={{ color: 'var(--color-success)', fontWeight: 500 }}>Yes</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>No (&lt; 24h)</span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        {isSelected ? (
                          <span className="status-tag status-tag-selected">Selected</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>No</span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {v.status === 'SELECTED' ? (
                          <span style={{ color: '#B5741E', fontWeight: 500 }}>
                            Selected day-ahead (latest version &le; T &minus; 24h)
                          </span>
                        ) : v.status === 'SUPERSEDED_ELIGIBLE' ? (
                          <span>Superseded by later eligible version</span>
                        ) : (
                          <span style={{ color: 'var(--text-subtle)' }}>
                            Published after cutoff &mdash; excluded to prevent look-ahead bias
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

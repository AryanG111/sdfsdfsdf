import React from 'react';

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onDateChange }) => {
  const currentDayNum = parseInt(selectedDate.split('-')[2], 10);

  const handlePrev = () => {
    if (currentDayNum > 1) {
      const prevDay = String(currentDayNum - 1).padStart(2, '0');
      onDateChange(`2026-01-${prevDay}`);
    }
  };

  const handleNext = () => {
    if (currentDayNum < 31) {
      const nextDay = String(currentDayNum + 1).padStart(2, '0');
      onDateChange(`2026-01-${nextDay}`);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        margin: '1.25rem 0 1.5rem 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label
          htmlFor="delivery-date-select"
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
          }}
        >
          Delivery date:
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button
            onClick={handlePrev}
            disabled={currentDayNum <= 1}
            style={{
              padding: '0.35rem 0.55rem',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: currentDayNum <= 1 ? 'var(--text-subtle)' : 'var(--text-secondary)',
              cursor: currentDayNum <= 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.8125rem',
              lineHeight: 1,
            }}
            title="Previous day"
          >
            &larr;
          </button>

          <select
            id="delivery-date-select"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            style={{
              padding: '0.35rem 0.65rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            {Array.from({ length: 31 }, (_, i) => {
              const day = String(i + 1).padStart(2, '0');
              const dateVal = `2026-01-${day}`;
              return (
                <option key={dateVal} value={dateVal}>
                  {i + 1} January 2026
                </option>
              );
            })}
          </select>

          <button
            onClick={handleNext}
            disabled={currentDayNum >= 31}
            style={{
              padding: '0.35rem 0.55rem',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: currentDayNum >= 31 ? 'var(--text-subtle)' : 'var(--text-secondary)',
              cursor: currentDayNum >= 31 ? 'not-allowed' : 'pointer',
              fontSize: '0.8125rem',
              lineHeight: 1,
            }}
            title="Next day"
          >
            &rarr;
          </button>
        </div>
      </div>

      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
        Forecasts selected using a 24-hour-ahead cutoff.
      </div>
    </div>
  );
};

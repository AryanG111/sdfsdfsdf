import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Filter, SlidersHorizontal, BarChart3, History, CheckCircle2 } from 'lucide-react';

export type ActiveTab = 'overview' | 'accuracy' | 'history' | 'quality';

interface FilterBarProps {
  selectedDate: string;
  onDateChange: (newDate: string) => void;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  cutoffRule: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedDate,
  onDateChange,
  activeTab,
  onTabChange,
  cutoffRule,
}) => {
  // Navigation helpers for January 2026
  const handlePrevDay = () => {
    const current = new Date(selectedDate);
    current.setUTCDate(current.getUTCDate() - 1);
    if (current.getUTCFullYear() === 2026 && current.getUTCMonth() === 0) {
      onDateChange(current.toISOString().split('T')[0]);
    }
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate);
    current.setUTCDate(current.getUTCDate() + 1);
    if (current.getUTCFullYear() === 2026 && current.getUTCMonth() === 0) {
      onDateChange(current.toISOString().split('T')[0]);
    }
  };

  const isFirstDay = selectedDate === '2026-01-01';
  const isLastDay = selectedDate === '2026-01-31';

  return (
    <div className="glass-panel" style={{ padding: '0.875rem 1.25rem', marginBottom: '1.25rem' }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}>
        {/* Date Selector & Prev/Next */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            <Calendar size={16} color="#0EA5E9" />
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Delivery Date:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button
              onClick={handlePrevDay}
              disabled={isFirstDay}
              style={{
                background: 'var(--bg-input)',
                color: isFirstDay ? 'var(--text-dim)' : 'var(--text-main)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.375rem 0.5rem',
                display: 'flex',
                alignItems: 'center',
                opacity: isFirstDay ? 0.4 : 1,
                cursor: isFirstDay ? 'not-allowed' : 'pointer',
              }}
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>

            <select
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.4rem 0.75rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {Array.from({ length: 31 }, (_, i) => {
                const day = String(i + 1).padStart(2, '0');
                const dateVal = `2026-01-${day}`;
                return (
                  <option key={dateVal} value={dateVal}>
                    {dateVal} (Day {i + 1})
                  </option>
                );
              })}
            </select>

            <button
              onClick={handleNextDay}
              disabled={isLastDay}
              style={{
                background: 'var(--bg-input)',
                color: isLastDay ? 'var(--text-dim)' : 'var(--text-main)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.375rem 0.5rem',
                display: 'flex',
                alignItems: 'center',
                opacity: isLastDay ? 0.4 : 1,
                cursor: isLastDay ? 'not-allowed' : 'pointer',
              }}
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Cutoff Policy Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.35rem 0.75rem',
            background: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            color: '#C084FC',
          }}>
            <SlidersHorizontal size={13} />
            <span>Policy: <strong>{cutoffRule}</strong></span>
          </div>
        </div>

        {/* View Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-input)',
          padding: '0.25rem',
          borderRadius: 'var(--radius-sm)',
          gap: '0.25rem',
        }}>
          <button
            onClick={() => onTabChange('overview')}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              background: activeTab === 'overview' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'overview' ? '#38BDF8' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              boxShadow: activeTab === 'overview' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            <BarChart3 size={14} />
            Day View & Errors
          </button>

          <button
            onClick={() => onTabChange('accuracy')}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              background: activeTab === 'accuracy' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'accuracy' ? '#38BDF8' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              boxShadow: activeTab === 'accuracy' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            <Filter size={14} />
            Monthly Trends
          </button>

          <button
            onClick={() => onTabChange('history')}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              background: activeTab === 'history' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'history' ? '#38BDF8' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              boxShadow: activeTab === 'history' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            <History size={14} />
            Forecast Versions
          </button>

          <button
            onClick={() => onTabChange('quality')}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              background: activeTab === 'quality' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'quality' ? '#38BDF8' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              boxShadow: activeTab === 'quality' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            <CheckCircle2 size={14} />
            Data Quality
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';

interface AppHeaderProps {
  onOpenMethodology: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenMethodology }) => {
  return (
    <header
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--border-color)',
        height: '68px',
        display: 'flex',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: Product Name & Subtitle */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
          <span
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            WindLens
          </span>
          <span
            style={{
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
              borderLeft: '1px solid var(--border-color)',
              paddingLeft: '0.75rem',
            }}
          >
            UK wind generation analysis
          </span>
        </div>

        {/* Right: Data Source, Period & Methodology link */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
          }}
        >
          <div>
            Data source: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Elexon BMRS</span>
          </div>

          <div style={{ color: 'var(--border-color)' }}>|</div>

          <div>
            Evaluation period: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>January 2026</span>
          </div>

          <div style={{ color: 'var(--border-color)' }}>|</div>

          <button
            onClick={onOpenMethodology}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-actual)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              padding: '0.25rem 0',
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            Methodology
          </button>
        </div>
      </div>
    </header>
  );
};

import React from 'react';

const accentColors = {
  buy: 'var(--buy)',
  sell: 'var(--sell)',
  signal: 'var(--amber)',
  neutral: 'var(--text-hi)',
  'pnl-pos': 'var(--buy)',
  'pnl-neg': 'var(--sell)',
};

export default function StatTile({ label, value, sub, accent = 'neutral' }) {
  return (
    <div className="panel stat-glow" style={{ padding: '12px 16px' }}>
      <div style={{ fontSize: 11.5, color: 'var(--text-lo)', marginBottom: 6 }}>{label}</div>
      <div
        className="mono"
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: accentColors[accent],
          textTransform: accent === 'signal' ? 'capitalize' : 'none',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: 'var(--text-lo)', marginTop: 3 }} className="mono">
          {sub}
        </div>
      )}
    </div>
  );
}
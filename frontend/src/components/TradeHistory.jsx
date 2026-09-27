import React from 'react';

function SideBadge({ side }) {
  const isBuy = side === 'buy';
  return (
    <span
      className="pill"
      style={{
        borderColor: isBuy ? 'rgba(53,201,140,0.35)' : 'rgba(239,93,111,0.35)',
        color: isBuy ? 'var(--buy)' : 'var(--sell)',
        background: isBuy ? 'var(--buy-dim)' : 'var(--sell-dim)',
        textTransform: 'capitalize',
      }}
    >
      {side}
    </span>
  );
}

export default function TradeHistory({ trades }) {
  return (
    <div className="panel">
      <h2 className="panel-title">Trade ledger</h2>

      {trades.length === 0 ? (
        <div
          style={{
            padding: '40px 18px',
            textAlign: 'center',
            color: 'var(--text-lo)',
            fontSize: 13.5,
          }}
        >
          No trades recorded yet. Fills will appear here as soon as the strategy signals.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Time', 'Side', 'Symbol', 'Price', 'Amount', 'Mode'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '10px 16px',
                      color: 'var(--text-lo)',
                      fontWeight: 500,
                      fontSize: 11.5,
                      borderBottom: '1px solid var(--line)',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((t, i) => (
                <tr
                  key={t._id}
                  className={i === 0 ? 'fade-in' : undefined}
                  style={{ borderBottom: '1px solid var(--line-soft)' }}
                >
                  <td className="mono" style={{ padding: '10px 16px', color: 'var(--text-mid)' }}>
                    {new Date(t.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <SideBadge side={t.side} />
                  </td>
                  <td className="mono" style={{ padding: '10px 16px' }}>
                    {t.symbol}
                  </td>
                  <td className="mono" style={{ padding: '10px 16px', fontWeight: 600 }}>
                    {t.price?.toFixed(2)}
                  </td>
                  <td className="mono" style={{ padding: '10px 16px', color: 'var(--text-mid)' }}>
                    {t.amount?.toFixed(6)}
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-mid)' }}>{t.mode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
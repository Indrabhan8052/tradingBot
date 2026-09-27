import React, { useState } from 'react';

function Row({ label, children }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '9px 0',
        borderBottom: '1px solid var(--line-soft)',
        fontSize: 13,
      }}
    >
      <span style={{ color: 'var(--text-lo)' }}>{label}</span>
      <span style={{ color: 'var(--text-hi)', fontWeight: 500 }}>{children}</span>
    </div>
  );
}

export default function BotControls({ status, onStart, onStop, onRefresh }) {
  const [pending, setPending] = useState(null); // 'start' | 'stop' | null

  const handleStart = async () => {
    setPending('start');
    try {
      await onStart();
      await onRefresh();
    } finally {
      setPending(null);
    }
  };

  const handleStop = async () => {
    setPending('stop');
    try {
      await onStop();
      await onRefresh();
    } finally {
      setPending(null);
    }
  };

  const isRunning = !!status?.isRunning;

  return (
    <div className="panel">
      <h2 className="panel-title">Bot control</h2>
      <div style={{ padding: '4px 18px 18px' }}>
        <Row label="Mode">
          <span style={{ color: status?.liveTrading ? 'var(--sell)' : 'var(--text-mid)' }}>
            {status?.liveTrading ? 'Live' : 'Paper (simulated)'}
          </span>
        </Row>
        <Row label="Symbol">
          <span className="mono">{status?.symbol || '—'}</span>
        </Row>
        <Row label="Fast / slow SMA">
          <span className="mono">
            {status?.fastSMA ?? '—'} / {status?.slowSMA ?? '—'}
          </span>
        </Row>
        <Row label="Trade size">
          <span className="mono">
            {status?.tradeAmountUSDT != null ? `${status.tradeAmountUSDT} USDT` : '—'}
          </span>
        </Row>
        <Row label="Last signal">
          <span style={{ textTransform: 'capitalize' }}>{status?.lastSignal || 'none'}</span>
        </Row>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button
            className="btn btn--start"
            onClick={handleStart}
            disabled={isRunning || pending !== null}
            style={{ flex: 1 }}
          >
            {pending === 'start' ? 'Starting…' : 'Start bot'}
          </button>
          <button
            className="btn btn--stop"
            onClick={handleStop}
            disabled={!isRunning || pending !== null}
            style={{ flex: 1 }}
          >
            {pending === 'stop' ? 'Stopping…' : 'Stop bot'}
          </button>
        </div>

        {status?.liveTrading && (
          <div
            style={{
              marginTop: 12,
              padding: '8px 10px',
              borderRadius: 6,
              background: 'var(--sell-dim)',
              border: '1px solid rgba(239,93,111,0.3)',
              color: 'var(--sell)',
              fontSize: 12,
              lineHeight: 1.4,
            }}
          >
            Live trading is enabled — orders placed here use real funds.
          </div>
        )}
      </div>
    </div>
  );
}
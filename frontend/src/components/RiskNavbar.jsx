import React, { useState } from 'react';
import { emergencyStop, resumeBot } from '../api';

function fmt(n, digits = 2) {
  return n != null && !isNaN(n) ? Number(n).toFixed(digits) : '—';
}

function Segment({ label, children, style }) {
  return (
    <div className="risk-nav-segment" style={style}>
      <div className="risk-nav-label">{label}</div>
      <div className="risk-nav-value">{children}</div>
    </div>
  );
}

function MiniBar({ pct, danger }) {
  const clamped = Math.min(Math.max(pct, 0), 100);
  return (
    <div className="risk-bar-track risk-bar-track--sm">
      <div
        className="risk-bar-fill"
        style={{
          width: `${clamped}%`,
          background: danger ? 'var(--sell)' : clamped > 70 ? 'var(--amber)' : 'var(--buy)',
        }}
      />
    </div>
  );
}

export default function RiskNavbar({ status, lastPrice, onRefresh }) {
  const [pending, setPending] = useState(false);

  if (!status) return null;

  const pos = status.position;
  const dailyLimit = status.dailyLossLimitUSDT ?? 0;
  const dailyUsed = status.dailyRealizedLossUSDT ?? 0;
  const dailyPct = dailyLimit > 0 ? (dailyUsed / dailyLimit) * 100 : 0;
  const breached = !!status.dailyLossLimitBreached;
  const halted = !!status.emergencyStop || breached;

  const unrealizedPnL =
    pos?.open && lastPrice != null ? (lastPrice - pos.entryPrice) * pos.amount : null;
  const unrealizedPct =
    pos?.open && lastPrice != null ? ((lastPrice - pos.entryPrice) / pos.entryPrice) * 100 : null;

  const handleEmergency = async () => {
    setPending(true);
    try {
      if (status.emergencyStop) await resumeBot();
      else await emergencyStop();
      await onRefresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <nav className={`risk-navbar ${halted ? 'risk-navbar--halted' : ''}`}>
      <div className="risk-navbar-brand">
        <span className={`dot ${halted ? 'dot--off' : 'dot--live'}`} style={halted ? { background: 'var(--sell)' } : undefined} />
        <span>Risk management</span>
      </div>

      <div className="risk-navbar-scroll">
        <Segment label="Daily loss">
          <span className="mono" style={{ color: breached ? 'var(--sell)' : 'var(--text-hi)' }}>
            ${fmt(dailyUsed)} <span style={{ color: 'var(--text-lo)' }}>/ ${fmt(dailyLimit)}</span>
          </span>
          <MiniBar pct={dailyPct} danger={breached} />
        </Segment>

        <span className="risk-navbar-divider" />

        <Segment label="Position">
          {pos?.open ? (
            <span className="mono" style={{ color: 'var(--text-hi)' }}>
              Long @ ${fmt(pos.entryPrice)}
            </span>
          ) : (
            <span style={{ color: 'var(--text-lo)' }}>Flat</span>
          )}
        </Segment>

        {pos?.open && (
          <>
            <span className="risk-navbar-divider" />
            <Segment label="Stop / Target">
              <span className="mono">
                <span style={{ color: 'var(--sell)' }}>{pos.stopPrice != null ? `$${fmt(pos.stopPrice)}` : '—'}</span>
                {' · '}
                <span style={{ color: 'var(--buy)' }}>{pos.takeProfitPrice != null ? `$${fmt(pos.takeProfitPrice)}` : '—'}</span>
              </span>
            </Segment>

            <span className="risk-navbar-divider" />

            <Segment label="Unrealized P&amp;L">
              <span
                className="mono"
                style={{ fontWeight: 700, color: unrealizedPnL >= 0 ? 'var(--buy)' : 'var(--sell)' }}
              >
                {unrealizedPnL >= 0 ? '+' : ''}${fmt(unrealizedPnL)} ({fmt(unrealizedPct)}%)
              </span>
            </Segment>
          </>
        )}
      </div>

      <button
        className="btn btn--stop risk-navbar-cta"
        onClick={handleEmergency}
        disabled={pending}
      >
        {pending ? 'Working…' : status.emergencyStop ? 'Clear stop' : 'Emergency stop'}
      </button>
    </nav>
  );
}
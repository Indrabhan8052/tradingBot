import React, { useEffect, useMemo, useState } from 'react';
import { getStatus, startBot, stopBot, getTrades, getPnlSummary } from './api';
import Dashboard from './components/Dashboard.jsx';
import TradeHistory from './components/TradeHistory.jsx';
import BotControls from './components/BotControls.jsx';
import StrategySettings from './components/StrategySettings.jsx';
import RiskNavbar from './components/RiskNavbar.jsx';
import StatTile from './components/StatTile.jsx';
import Modal from './components/Modal.jsx';

function fmtSigned(n, digits = 2) {
  if (n == null || isNaN(n)) return '—';
  const s = Number(n).toFixed(digits);
  return n > 0 ? `+${s}` : s;
}

export default function App() {
  const [status, setStatus] = useState(null);
  const [trades, setTrades] = useState([]);
  const [pnl, setPnl] = useState(null);
  const [lastFetchFailed, setLastFetchFailed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const refresh = async () => {
    try {
      const [s, t, p] = await Promise.all([getStatus(), getTrades(), getPnlSummary()]);
      setStatus(s);
      setTrades(t);
      setPnl(p);
      setLastFetchFailed(false);
    } catch (err) {
      console.error('Failed to refresh data:', err.message);
      setLastFetchFailed(true);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const buys = trades.filter((t) => t.side === 'buy').length;
    const sells = trades.filter((t) => t.side === 'sell').length;
    const lastPrice = trades[0]?.price;
    return { buys, sells, lastPrice, total: trades.length };
  }, [trades]);

  const isRunning = !!status?.isRunning;
  const isHalted = !!status?.emergencyStop || !!status?.dailyLossLimitBreached;

  return (
    <div style={{ minHeight: '100vh', padding: '28px 24px 60px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 28,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'linear-gradient(155deg, #e5a13c, #b9762a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: '#0a0e14',
                fontSize: 16,
                flex: 'none',
                boxShadow: '0 4px 16px rgba(229,161,60,0.25)',
              }}
            >
              RGV
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>
                RGV Dashboard
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-lo)' }}>
                {status?.symbol || '—'} · SMA crossover · risk-managed
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {lastFetchFailed && (
              <span className="pill" style={{ borderColor: 'var(--sell)', color: 'var(--sell)' }}>
                connection lost
              </span>
            )}
            <span className="pill">
              <span className={`dot ${isRunning ? 'dot--live' : 'dot--off'}`} />
              {isRunning ? 'Running' : 'Stopped'}
            </span>
            <span
              className="pill"
              style={
                status?.liveTrading
                  ? { borderColor: 'rgba(239,93,111,0.4)', color: 'var(--sell)' }
                  : { color: 'var(--text-mid)' }
              }
            >
              {status?.liveTrading ? 'Live' : 'Paper'}
            </span>
            <button className="icon-btn" onClick={() => setSettingsOpen(true)}>
              ⚙ Strategy settings
            </button>
          </div>
        </header>

        {/* stat row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <StatTile
            label="Last price"
            value={stats.lastPrice != null ? stats.lastPrice.toFixed(2) : '—'}
            accent="neutral"
          />
          <StatTile label="Last signal" value={status?.lastSignal || 'none'} accent="signal" />
          <StatTile
            label="Total P&L"
            value={pnl ? `${fmtSigned(pnl.totalPnL)} USDT` : '—'}
            sub={pnl ? `${pnl.totalClosedTrades} closed trades` : undefined}
            accent={pnl?.totalPnL >= 0 ? 'pnl-pos' : 'pnl-neg'}
          />
          <StatTile
            label="Today's P&L"
            value={pnl ? `${fmtSigned(pnl.todayPnL)} USDT` : '—'}
            accent={pnl?.todayPnL >= 0 ? 'pnl-pos' : 'pnl-neg'}
          />
          <StatTile
            label="Win rate"
            value={pnl ? `${pnl.winRate.toFixed(0)}%` : '—'}
            sub={pnl ? `${pnl.wins}W / ${pnl.losses}L` : undefined}
            accent="neutral"
          />
        </div>

        <RiskNavbar status={status} lastPrice={stats.lastPrice} onRefresh={refresh} />

        {/* main grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 280px',
            gap: 16,
            alignItems: 'start',
          }}
          className="main-grid"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <Dashboard trades={trades} position={status?.position} />
            <TradeHistory trades={trades} />
          </div>
          <div style={{ position: 'sticky', top: 20 }}>
            <BotControls status={status} onStart={startBot} onStop={stopBot} onRefresh={refresh} />
          </div>
        </div>
      </div>

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <StrategySettings
          status={status}
          onSaved={refresh}
          onClose={() => setSettingsOpen(false)}
        />
      </Modal>

      <style>{`
        @media (max-width: 860px) {
          .main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
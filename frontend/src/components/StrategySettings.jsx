import React, { useEffect, useState } from 'react';
import { updateConfig } from '../api';

const FIELD_GROUPS = [
  {
    title: 'Market & strategy',
    fields: [
      { key: 'symbol', label: 'Trading pair', type: 'text' },
      { key: 'fastSMA', label: 'Fast SMA', type: 'number', min: 1 },
      { key: 'slowSMA', label: 'Slow SMA', type: 'number', min: 1 },
    ],
  },
  {
    title: 'Position sizing',
    fields: [
      { key: 'riskPerTradePct', label: 'Risk per trade (%)', type: 'number', min: 0, step: 0.1, help: 'Sizes the trade so hitting your stop-loss loses ~this % of balance. 0 = use flat size below.' },
      { key: 'tradeAmountUSDT', label: 'Flat trade size (USDT)', type: 'number', min: 0, help: 'Used only when risk-per-trade is 0.' },
    ],
  },
  {
    title: 'Risk management',
    fields: [
      { key: 'stopLossPct', label: 'Stop-loss (%)', type: 'number', min: 0, step: 0.1 },
      { key: 'takeProfitPct', label: 'Take-profit (%)', type: 'number', min: 0, step: 0.1 },
      { key: 'trailingStopPct', label: 'Trailing stop (%)', type: 'number', min: 0, step: 0.1, help: '0 = disabled. When set, the stop ratchets up as price rises.' },
      { key: 'maxDailyLossPct', label: 'Max daily loss (%)', type: 'number', min: 0, step: 0.5, help: 'Bot stops opening new trades once realized losses hit this % of balance for the day.' },
    ],
  },
];

function Field({ def, value, onChange }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 5 }}>{def.label}</div>
      <input
        className="input"
        type={def.type}
        min={def.min}
        step={def.step}
        value={value ?? ''}
        onChange={(e) =>
          onChange(def.key, def.type === 'number' ? e.target.value : e.target.value)
        }
      />
      {def.help && (
        <div style={{ fontSize: 11, color: 'var(--text-lo)', marginTop: 4, lineHeight: 1.4 }}>
          {def.help}
        </div>
      )}
    </label>
  );
}

export default function StrategySettings({ status, onSaved, onClose }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (status && !form) {
      setForm({
        symbol: status.symbol,
        fastSMA: status.fastSMA,
        slowSMA: status.slowSMA,
        riskPerTradePct: status.riskPerTradePct,
        tradeAmountUSDT: status.tradeAmountUSDT,
        stopLossPct: status.stopLossPct,
        takeProfitPct: status.takeProfitPct,
        trailingStopPct: status.trailingStopPct,
        maxDailyLossPct: status.maxDailyLossPct,
        liveTrading: status.liveTrading,
      });
    }
  }, [status, form]);

  if (!form) return null;

  const handleChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {};
      for (const [k, v] of Object.entries(form)) {
        payload[k] = typeof v === 'string' && v.trim() !== '' && !isNaN(v) ? Number(v) : v;
      }
      const updated = await updateConfig(payload);
      onSaved?.(updated);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2
        className="panel-title"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <span>Strategy settings</span>
        {onClose && (
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}
      </h2>
      <div style={{ padding: '14px 18px 18px' }}>
        {FIELD_GROUPS.map((group) => (
          <div key={group.title} style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--text-lo)',
                marginBottom: 10,
              }}
            >
              {group.title}
            </div>
            {group.fields.map((f) => (
              <Field key={f.key} def={f} value={form[f.key]} onChange={handleChange} />
            ))}
          </div>
        ))}

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 12px',
            marginBottom: 14,
            borderRadius: 6,
            border: '1px solid ' + (form.liveTrading ? 'rgba(239,93,111,0.4)' : 'var(--line)'),
            background: form.liveTrading ? 'var(--sell-dim)' : 'transparent',
            fontSize: 12.5,
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={!!form.liveTrading}
            onChange={(e) => handleChange('liveTrading', e.target.checked)}
          />
          <span style={{ color: form.liveTrading ? 'var(--sell)' : 'var(--text-mid)' }}>
            Enable real exchange orders (default: paper trading)
          </span>
        </label>

        <button className="btn" type="submit" disabled={saving} style={{ width: '100%' }}>
          {saving ? 'Saving…' : savedFlash ? 'Settings saved ✓' : 'Update settings'}
        </button>
      </div>
    </form>
  );
}
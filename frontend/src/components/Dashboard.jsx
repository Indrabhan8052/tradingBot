import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--ink-700)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        padding: '9px 13px',
        fontSize: 12.5,
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}
    >
      <div style={{ color: 'var(--text-lo)', marginBottom: 3 }}>{label}</div>
      <div className="mono" style={{ color: 'var(--amber)', fontWeight: 700, fontSize: 14 }}>
        ${payload[0].value?.toFixed(2)}
      </div>
    </div>
  );
}

export default function Dashboard({ trades, position }) {
  const chartData = trades
    .slice()
    .reverse()
    .map((t) => ({
      time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: t.price,
    }));

  const hasData = chartData.length > 0;
  const latest = chartData[chartData.length - 1]?.price;
  const prev = chartData[chartData.length - 2]?.price;
  const delta = latest != null && prev != null ? latest - prev : null;
  const deltaPct = delta != null && prev ? (delta / prev) * 100 : null;
  const isUp = delta == null || delta >= 0;

  return (
    <div className="panel">
      <div className="chart-panel-head">
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 4 }}>
            Price · recent fills
          </div>
          {hasData && (
            <div>
              <span className="mono chart-price-now">${latest?.toFixed(2)}</span>
              {delta != null && (
                <span
                  className="mono chart-price-delta"
                  style={{ color: isUp ? 'var(--buy)' : 'var(--sell)' }}
                >
                  {isUp ? '▲' : '▼'} {Math.abs(delta).toFixed(2)} ({Math.abs(deltaPct).toFixed(2)}%)
                </span>
              )}
            </div>
          )}
        </div>
        {hasData && (
          <span className="pill" style={{ borderColor: 'var(--line)' }}>
            <span className="dot dot--live" />
            live
          </span>
        )}
      </div>

      <div style={{ padding: hasData ? '10px 14px 10px' : '0' }}>
        {hasData ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isUp ? '#35c98c' : '#e5a13c'} stopOpacity={0.4} />
                  <stop offset="55%" stopColor={isUp ? '#35c98c' : '#e5a13c'} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={isUp ? '#35c98c' : '#e5a13c'} stopOpacity={0} />
                </linearGradient>
                <filter id="lineGlow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="3.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid stroke="var(--line-soft)" vertical={false} strokeDasharray="2 6" />
              <XAxis
                dataKey="time"
                stroke="var(--text-lo)"
                tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--line)' }}
                minTickGap={28}
              />
              <YAxis
                domain={['auto', 'auto']}
                stroke="var(--text-lo)"
                tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
                tickLine={false}
                axisLine={false}
                width={68}
                tickFormatter={(v) => `$${v.toLocaleString()}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--line)', strokeDasharray: '3 3' }} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isUp ? '#35c98c' : '#e5a13c'}
                strokeWidth={2.4}
                fill="url(#priceFill)"
                dot={false}
                filter="url(#lineGlow)"
                activeDot={{ r: 5, fill: isUp ? '#35c98c' : '#e5a13c', stroke: 'var(--ink-800)', strokeWidth: 2 }}
              />
              {position?.open && (
                <>
                  <ReferenceLine
                    y={position.entryPrice}
                    stroke="var(--text-lo)"
                    strokeDasharray="3 3"
                    label={{ value: 'Entry', position: 'insideTopRight', fill: 'var(--text-lo)', fontSize: 10 }}
                  />
                  {position.stopPrice != null && (
                    <ReferenceLine
                      y={position.stopPrice}
                      stroke="var(--sell)"
                      strokeDasharray="3 3"
                      label={{ value: 'Stop', position: 'insideTopRight', fill: 'var(--sell)', fontSize: 10 }}
                    />
                  )}
                  {position.takeProfitPrice != null && (
                    <ReferenceLine
                      y={position.takeProfitPrice}
                      stroke="var(--buy)"
                      strokeDasharray="3 3"
                      label={{ value: 'Target', position: 'insideTopRight', fill: 'var(--buy)', fontSize: 10 }}
                    />
                  )}
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div
            style={{
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-lo)',
              fontSize: 13.5,
            }}
          >
            No fills yet — start the bot to begin recording price history.
          </div>
        )}
      </div>
    </div>
  );
}
import mongoose from 'mongoose';

const positionSchema = new mongoose.Schema(
  {
    open: { type: Boolean, default: false },
    side: { type: String, enum: ['long', null], default: null },
    entryPrice: Number,
    amount: Number,
    costUSDT: Number,
    stopPrice: Number,
    takeProfitPrice: Number,
    highestPrice: Number, // used for trailing stop
    openedAt: Date,
  },
  { _id: false }
);

const botConfigSchema = new mongoose.Schema({
  isRunning: { type: Boolean, default: false },
  emergencyStop: { type: Boolean, default: false },

  // market / strategy
  symbol: String,
  fastSMA: Number,
  slowSMA: Number,
  lastSignal: { type: String, default: 'none' },

  // sizing
  tradeAmountUSDT: Number, // used only if riskPerTradePct is 0
  riskPerTradePct: { type: Number, default: 1 }, // % of balance risked per trade; sizes position off stopLossPct

  // risk management
  stopLossPct: { type: Number, default: 2 },
  takeProfitPct: { type: Number, default: 4 },
  trailingStopPct: { type: Number, default: 0 }, // 0 = disabled
  maxDailyLossPct: { type: Number, default: 5 },
  maxOpenPositions: { type: Number, default: 1 },

  // paper account
  paperBalance: { type: Number, default: 1000 },
  initialBalance: { type: Number, default: 1000 }, // daily-loss % is measured against this

  // running totals (denormalized cache; source of truth for closed trades is the Trade collection)
  realizedPnLUSDT: { type: Number, default: 0 },
  dailyRealizedLossUSDT: { type: Number, default: 0 },
  dailyLossDate: { type: String, default: '' }, // YYYY-MM-DD, resets dailyRealizedLossUSDT when it rolls over

  position: { type: positionSchema, default: () => ({}) },

  liveTrading: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('BotConfig', botConfigSchema);

import mongoose from 'mongoose';

const tradeSchema = new mongoose.Schema({
  symbol: String,
  side: { type: String, enum: ['buy', 'sell'] },
  amount: Number,
  price: Number,
  cost: Number,
  mode: { type: String, enum: ['paper', 'live'], default: 'paper' },
  strategy: String,
  reason: String,
  // populated on the closing ('sell') leg of a position
  entryPrice: Number,
  pnl: { type: Number, default: null },
  pnlPct: { type: Number, default: null },
  exitReason: {
    type: String,
    enum: ['signal', 'stop_loss', 'take_profit', 'trailing_stop', 'emergency_stop', null],
    default: null,
  },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model('Trade', tradeSchema);

import express from 'express';
import Trade from '../models/Trade.js';
import BotConfig from '../models/BotConfig.js';
import { rollDailyLossIfNewDay, isDailyLossLimitBreached } from '../services/riskManager.js';

const router = express.Router();

const EDITABLE_FIELDS = [
  'symbol',
  'fastSMA',
  'slowSMA',
  'tradeAmountUSDT',
  'riskPerTradePct',
  'stopLossPct',
  'takeProfitPct',
  'trailingStopPct',
  'maxDailyLossPct',
  'maxOpenPositions',
  'liveTrading',
];

router.get('/status', async (req, res) => {
  const config = await BotConfig.findOne();
  if (!config) return res.json(null);
  rollDailyLossIfNewDay(config);
  await config.save();
  const json = config.toObject();
  json.dailyLossLimitBreached = isDailyLossLimitBreached(config);
  json.dailyLossLimitUSDT = config.initialBalance * (config.maxDailyLossPct / 100);
  res.json(json);
});

router.post('/start', async (req, res) => {
  let config = await BotConfig.findOne();
  if (!config) config = new BotConfig({});
  config.isRunning = true;
  config.emergencyStop = false;
  await config.save();
  res.json({ message: 'Bot started', config });
});

router.post('/stop', async (req, res) => {
  const config = await BotConfig.findOne();
  if (config) {
    config.isRunning = false;
    await config.save();
  }
  res.json({ message: 'Bot stopped', config });
});

// Hard kill switch: stops the bot immediately and blocks new entries until
// explicitly resumed, independent of the isRunning toggle. Does not touch an
// already-open position — close it manually on the exchange if needed.
router.post('/emergency-stop', async (req, res) => {
  const config = await BotConfig.findOne();
  if (config) {
    config.emergencyStop = true;
    config.isRunning = false;
    await config.save();
  }
  res.json({ message: 'Emergency stop engaged', config });
});

router.post('/resume', async (req, res) => {
  const config = await BotConfig.findOne();
  if (config) {
    config.emergencyStop = false;
    await config.save();
  }
  res.json({ message: 'Emergency stop cleared', config });
});

router.put('/config', async (req, res) => {
  let config = await BotConfig.findOne();
  if (!config) config = new BotConfig({});

  for (const field of EDITABLE_FIELDS) {
    if (req.body[field] !== undefined) config[field] = req.body[field];
  }

  await config.save();
  res.json(config);
});

router.get('/trades', async (req, res) => {
  const trades = await Trade.find().sort({ timestamp: -1 }).limit(100);
  res.json(trades);
});

router.get('/pnl-summary', async (req, res) => {
  const closedTrades = await Trade.find({ pnl: { $ne: null } }).sort({ timestamp: -1 });

  const totalPnL = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
  const wins = closedTrades.filter((t) => t.pnl > 0).length;
  const losses = closedTrades.filter((t) => t.pnl <= 0).length;
  const winRate = closedTrades.length ? (wins / closedTrades.length) * 100 : 0;

  const today = new Date().toISOString().slice(0, 10);
  const todayPnL = closedTrades
    .filter((t) => new Date(t.timestamp).toISOString().slice(0, 10) === today)
    .reduce((sum, t) => sum + t.pnl, 0);

  res.json({
    totalPnL,
    todayPnL,
    wins,
    losses,
    winRate,
    totalClosedTrades: closedTrades.length,
  });
});

export default router;

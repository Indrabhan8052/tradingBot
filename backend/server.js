import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import connectDB from './config/db.js';
import apiRoutes from './routes/api.js';
import BotConfig from './models/BotConfig.js';
import { runStrategyOnce } from './services/botEngine.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  let config = await BotConfig.findOne();
  if (!config) {
    const paperBalance = Number(process.env.PAPER_BALANCE || 1000);
    config = await BotConfig.create({
      symbol: process.env.SYMBOL || 'BTC/USDT',
      fastSMA: Number(process.env.FAST_SMA || 9),
      slowSMA: Number(process.env.SLOW_SMA || 21),
      tradeAmountUSDT: Number(process.env.TRADE_AMOUNT_USDT || 50),
      riskPerTradePct: Number(process.env.RISK_PER_TRADE_PCT || 1),
      stopLossPct: Number(process.env.STOP_LOSS_PCT || 2),
      takeProfitPct: Number(process.env.TAKE_PROFIT_PCT || 4),
      trailingStopPct: Number(process.env.TRAILING_STOP_PCT || 0),
      maxDailyLossPct: Number(process.env.MAX_DAILY_LOSS_PCT || 5),
      maxOpenPositions: 1,
      paperBalance,
      initialBalance: paperBalance,
      liveTrading: process.env.LIVE_TRADING === 'true',
      isRunning: false,
    });
    console.log('Created default bot config');
  }

  const cronExpr = process.env.POLL_INTERVAL_CRON || '*/1 * * * *';
  cron.schedule(cronExpr, async () => {
    try {
      await runStrategyOnce();
    } catch (err) {
      console.error('Strategy run error:', err.message);
    }
  });

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start();
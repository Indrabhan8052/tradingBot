import { createExchange, fetchOHLCV, fetchTicker, createOrder } from './exchangeService.js';
import { smaCrossoverSignal } from './strategyEngine.js';
import {
  calcPositionSize,
  computeExitPrices,
  updateTrailingStop,
  rollDailyLossIfNewDay,
  isDailyLossLimitBreached,
} from './riskManager.js';
import Trade from '../models/Trade.js';
import BotConfig from '../models/BotConfig.js';

let exchange = null;

function getExchange() {
  if (!exchange) exchange = createExchange();
  return exchange;
}

async function closePosition(config, price, reason) {
  const pos = config.position;
  const pnl = (price - pos.entryPrice) * pos.amount;
  const pnlPct = ((price - pos.entryPrice) / pos.entryPrice) * 100;

  if (config.liveTrading) {
    await createOrder(getExchange(), config.symbol, 'sell', pos.amount);
  }

  await Trade.create({
    symbol: config.symbol,
    side: 'sell',
    amount: pos.amount,
    price,
    cost: pos.costUSDT,
    mode: config.liveTrading ? 'live' : 'paper',
    strategy: 'sma_crossover',
    reason: `position closed (${reason})`,
    entryPrice: pos.entryPrice,
    pnl,
    pnlPct,
    exitReason: reason,
  });

  config.realizedPnLUSDT += pnl;
  config.paperBalance += pnl;
  if (pnl < 0) config.dailyRealizedLossUSDT += Math.abs(pnl);

  config.position = { open: false, side: null };
  console.log(`CLOSE (${reason}) ${config.symbol} @ ${price} · pnl ${pnl.toFixed(2)} USDT`);
}

async function openPosition(config, price) {
  const { positionSizeUSDT, amount } = calcPositionSize({
    balance: config.paperBalance,
    riskPerTradePct: config.riskPerTradePct,
    entryPrice: price,
    stopLossPct: config.stopLossPct,
    tradeAmountUSDT: config.tradeAmountUSDT,
  });

  if (positionSizeUSDT <= 0 || amount <= 0) return;

  const { stopPrice, takeProfitPrice } = computeExitPrices(price, config.stopLossPct, config.takeProfitPct);

  if (config.liveTrading) {
    await createOrder(getExchange(), config.symbol, 'buy', amount);
  }

  await Trade.create({
    symbol: config.symbol,
    side: 'buy',
    amount,
    price,
    cost: positionSizeUSDT,
    mode: config.liveTrading ? 'live' : 'paper',
    strategy: 'sma_crossover',
    reason: 'fast SMA crossed above slow SMA',
  });

  config.position = {
    open: true,
    side: 'long',
    entryPrice: price,
    amount,
    costUSDT: positionSizeUSDT,
    stopPrice,
    takeProfitPrice,
    highestPrice: price,
    openedAt: new Date(),
  };

  console.log(`BUY ${config.symbol} @ ${price} · size ${positionSizeUSDT.toFixed(2)} USDT`);
}

export async function runStrategyOnce() {
  const config = await BotConfig.findOne();
  if (!config || !config.isRunning || config.emergencyStop) return;

  rollDailyLossIfNewDay(config);

  const symbol = config.symbol;
  const ex = getExchange();

  const candles = await fetchOHLCV(ex, symbol, process.env.TIMEFRAME || '5m', 100);
  const closes = candles.map((c) => c[4]);
  const ticker = await fetchTicker(ex, symbol);
  const price = ticker.last;

  const signal = smaCrossoverSignal(closes, config.fastSMA, config.slowSMA);
  config.lastSignal = signal;
  config.updatedAt = new Date();

  if (config.position?.open) {
    // Manage the open position: trailing stop, then stop-loss / take-profit / signal exit.
    if (config.trailingStopPct > 0) {
      const { highestPrice, stopPrice } = updateTrailingStop({
        highestPrice: config.position.highestPrice,
        stopPrice: config.position.stopPrice,
        currentPrice: price,
        trailingStopPct: config.trailingStopPct,
      });
      config.position.highestPrice = highestPrice;
      config.position.stopPrice = stopPrice;
    }

    if (config.position.stopPrice != null && price <= config.position.stopPrice) {
      const reason = config.trailingStopPct > 0 ? 'trailing_stop' : 'stop_loss';
      await closePosition(config, price, reason);
    } else if (config.position.takeProfitPrice != null && price >= config.position.takeProfitPrice) {
      await closePosition(config, price, 'take_profit');
    } else if (signal === 'sell') {
      await closePosition(config, price, 'signal');
    }
  } else {
    const dailyLossBreached = isDailyLossLimitBreached(config);
    const openPositionCount = config.position?.open ? 1 : 0;

    if (signal === 'buy' && !dailyLossBreached && openPositionCount < config.maxOpenPositions) {
      await openPosition(config, price);
    } else if (signal === 'buy' && dailyLossBreached) {
      console.log(`Skipping BUY for ${symbol}: max daily loss limit reached.`);
    }
  }

  await config.save();
}

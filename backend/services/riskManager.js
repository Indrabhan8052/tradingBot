// Pure functions for position sizing, stop/target pricing, trailing stops and
// daily-loss enforcement. Kept side-effect free so they're easy to unit test.

/**
 * Size a position off risk-per-trade rather than a flat USDT amount, so that
 * losing the full stop-loss distance loses ~riskPerTradePct% of the account.
 * Falls back to a flat tradeAmountUSDT if riskPerTradePct is 0/unset.
 */
export function calcPositionSize({ balance, riskPerTradePct, entryPrice, stopLossPct, tradeAmountUSDT }) {
  let positionSizeUSDT;

  if (riskPerTradePct > 0 && stopLossPct > 0) {
    const riskAmountUSDT = balance * (riskPerTradePct / 100);
    const stopDistancePct = stopLossPct / 100;
    positionSizeUSDT = riskAmountUSDT / stopDistancePct;
  } else {
    positionSizeUSDT = tradeAmountUSDT;
  }

  // Never risk more than the account actually has.
  positionSizeUSDT = Math.min(positionSizeUSDT, balance);
  positionSizeUSDT = Math.max(positionSizeUSDT, 0);

  return { positionSizeUSDT, amount: entryPrice > 0 ? positionSizeUSDT / entryPrice : 0 };
}

export function computeExitPrices(entryPrice, stopLossPct, takeProfitPct) {
  const stopPrice = stopLossPct > 0 ? entryPrice * (1 - stopLossPct / 100) : null;
  const takeProfitPrice = takeProfitPct > 0 ? entryPrice * (1 + takeProfitPct / 100) : null;
  return { stopPrice, takeProfitPrice };
}

/**
 * Ratchets the stop price up as price makes new highs. Never moves it down.
 * Returns the (possibly unchanged) { highestPrice, stopPrice }.
 */
export function updateTrailingStop({ highestPrice, stopPrice, currentPrice, trailingStopPct }) {
  if (!trailingStopPct || trailingStopPct <= 0) {
    return { highestPrice, stopPrice };
  }
  const newHighest = Math.max(highestPrice ?? currentPrice, currentPrice);
  const trailedStop = newHighest * (1 - trailingStopPct / 100);
  const newStop = stopPrice == null ? trailedStop : Math.max(stopPrice, trailedStop);
  return { highestPrice: newHighest, stopPrice: newStop };
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/** Resets the daily-loss counter in place if the calendar day has rolled over. */
export function rollDailyLossIfNewDay(config) {
  const today = todayStr();
  if (config.dailyLossDate !== today) {
    config.dailyLossDate = today;
    config.dailyRealizedLossUSDT = 0;
  }
}

export function isDailyLossLimitBreached(config) {
  if (!config.maxDailyLossPct || config.maxDailyLossPct <= 0) return false;
  const limitUSDT = config.initialBalance * (config.maxDailyLossPct / 100);
  return config.dailyRealizedLossUSDT >= limitUSDT;
}

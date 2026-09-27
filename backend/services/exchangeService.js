import ccxt from 'ccxt';

export function createExchange() {
  const exchangeId = process.env.EXCHANGE || 'binance';
  const ExchangeClass = ccxt[exchangeId];

  if (!ExchangeClass) {
    throw new Error(`Exchange "${exchangeId}" not supported by ccxt`);
  }

  const exchange = new ExchangeClass({
    apiKey: process.env.API_KEY,
    secret: process.env.API_SECRET,
    enableRateLimit: true,
  });

  if (process.env.USE_SANDBOX === 'true' && typeof exchange.setSandboxMode === 'function') {
    exchange.setSandboxMode(true);
  }

  return exchange;
}

export async function fetchOHLCV(exchange, symbol, timeframe, limit = 100) {
  return exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
}

export async function fetchTicker(exchange, symbol) {
  return exchange.fetchTicker(symbol);
}

export async function createOrder(exchange, symbol, side, amount) {
  return exchange.createMarketOrder(symbol, side, amount);
}
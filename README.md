# MERN Trading Bot

A starter crypto trading bot built with **MongoDB, Express, React, Node.js**, using
[`ccxt`](https://github.com/ccxt/ccxt) for exchange connectivity and a simple
SMA (moving average) crossover strategy.

**Ships safe by default:** sandbox/testnet mode and paper trading (`LIVE_TRADING=false`)
are both on out of the box. No real orders are placed until you deliberately change that.

## Project structure

```
trading-bot-mern/
  backend/
    config/db.js            MongoDB connection
    models/Trade.js         Trade log schema
    models/BotConfig.js     Bot settings / running state
    services/exchangeService.js   ccxt wrapper (fetch data, place orders)
    services/strategyEngine.js    SMA crossover signal logic
    services/botEngine.js         Ties strategy + execution together
    routes/api.js            REST endpoints
    server.js                 App entrypoint + scheduler
  frontend/
    src/App.jsx               Dashboard shell
    src/components/           Controls, chart, trade history table
    src/api.js                 Axios client for the backend
```

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env with your exchange API keys (use TESTNET keys first!)
npm run dev        # or: npm start
```

You'll need MongoDB running locally (or a connection string to MongoDB Atlas)
in `MONGO_URI`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:3000`).

## How it works

- Every minute (configurable via `POLL_INTERVAL_CRON`), the backend fetches recent
  candles for `SYMBOL`, computes a fast/slow SMA crossover, and records a `buy`/`sell`
  trade in MongoDB when a crossover happens.
- With `USE_SANDBOX=true`, `ccxt` talks to the exchange's testnet — real market data,
  fake money.
- With `LIVE_TRADING=false`, even outside sandbox mode, the bot only **logs** trades
  to the database (paper trading) instead of calling `createOrder`.
- The React dashboard polls `/api/status` and `/api/trades` every 5 seconds to show
  bot state, a price chart, and trade history.

## Going further

- **Backtesting**: before trusting any strategy, test it against historical data.
  This starter doesn't include a backtester — consider validating strategy logic
  in a separate script against downloaded historical OHLCV before wiring it into
  the live loop.
- **More strategies**: add new files in `services/` and swap which one `botEngine.js`
  calls.
- **Risk controls**: this starter does not include position sizing beyond a fixed
  USDT amount, stop-loss, or max-drawdown limits — add these to `botEngine.js`
  before considering live trading.
- **Auth**: the API has no authentication — add it before deploying anywhere public.

## Important

This is a starting template for learning/experimentation, not a production-ready
or profitable trading system. Trading carries real financial risk. Test thoroughly
in sandbox/paper mode, understand the strategy's behavior in different market
conditions, and only enable `LIVE_TRADING` with money you can afford to lose.
This is not financial advice.

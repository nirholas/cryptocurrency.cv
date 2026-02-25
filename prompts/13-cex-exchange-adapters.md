# Prompt 13: CEX Exchange Data Adapters

## Context

The codebase already aggregates data from multiple centralized exchanges:

**Existing exchange usage:**
- `/api/market/orderbook` aggregates order books from: **Binance, Coinbase, Kraken, OKX, Bybit, KuCoin, Huobi, Gemini, Bitfinex, Bitstamp** — all public endpoints, no keys needed
- `/api/market/coins` uses CoinGecko (primary) with CoinCap/CoinPaprika/Binance fallbacks
- Provider framework has 3 market-price adapters: CoinGecko, Binance, CoinCap

**Existing adapter chains** (from `src/lib/providers/`):
- `marketPriceChain` — fallback strategy, 30s TTL (CoinGecko → CoinCap → Binance)
- `marketPriceConsensusChain` — consensus strategy, 15s TTL (all 3 providers)

**All public exchange endpoints — no API keys required for market data.**

**Provider framework categories needing more adapters:**
- `market-price` — has 3, needs more for resilience
- `order-book` — currently no adapters (direct fetch in route)
- `ohlcv` — currently no adapters

## Task

### 1. Add More Market Price Adapters

Expand the `market-price` category for better resilience and data quality:

#### `src/lib/providers/adapters/market-price/coinbase.ts`

```typescript
// Coinbase — largest US exchange
// https://api.coinbase.com/v2/prices/{pair}/spot
// OR https://api.exchange.coinbase.com/products/{pair}/ticker
// No API key needed for public endpoints

export const coinbaseMarketPriceProvider: DataProvider<MarketPriceData> = {
  name: 'coinbase-market-price',
  category: 'market-price',
  priority: 4,
  weight: 0.2,
  baseUrl: 'https://api.exchange.coinbase.com',

  async fetch(params: FetchParams): Promise<ProviderResult<MarketPriceData>> {
    const symbol = params.symbol?.toUpperCase() || 'BTC';
    const pair = `${symbol}-USD`;

    const response = await fetch(`${this.baseUrl}/products/${pair}/ticker`);
    if (!response.ok) throw new Error(`Coinbase error: ${response.status}`);
    const data = await response.json();

    return {
      data: {
        symbol,
        price: parseFloat(data.price),
        volume24h: parseFloat(data.volume),
        bid: parseFloat(data.bid),
        ask: parseFloat(data.ask),
        high24h: 0, // not in ticker, need /stats
        low24h: 0,
        change24h: 0,
        changePercent24h: 0,
        timestamp: data.time || new Date().toISOString(),
      },
      provider: this.name,
      timestamp: Date.now(),
      cached: false,
    };
  },
};
```

#### `src/lib/providers/adapters/market-price/kraken.ts`

```typescript
// Kraken — established exchange, good for EUR pairs
// https://api.kraken.com/0/public/Ticker?pair=XBTUSD
// No API key needed

export const krakenMarketPriceProvider: DataProvider<MarketPriceData> = {
  name: 'kraken-market-price',
  category: 'market-price',
  priority: 5,
  weight: 0.15,
  baseUrl: 'https://api.kraken.com/0/public',

  async fetch(params: FetchParams): Promise<ProviderResult<MarketPriceData>> {
    const symbol = params.symbol?.toUpperCase() || 'BTC';
    const krakenSymbol = symbol === 'BTC' ? 'XBT' : symbol;
    const pair = `${krakenSymbol}USD`;

    const response = await fetch(`${this.baseUrl}/Ticker?pair=${pair}`);
    const data = await response.json();

    if (data.error?.length) throw new Error(data.error[0]);

    const tickerKey = Object.keys(data.result)[0];
    const ticker = data.result[tickerKey];

    return {
      data: {
        symbol,
        price: parseFloat(ticker.c[0]),         // last trade price
        volume24h: parseFloat(ticker.v[1]),      // 24h volume
        bid: parseFloat(ticker.b[0]),
        ask: parseFloat(ticker.a[0]),
        high24h: parseFloat(ticker.h[1]),
        low24h: parseFloat(ticker.l[1]),
        change24h: 0,
        changePercent24h: 0,
        timestamp: new Date().toISOString(),
      },
      provider: this.name,
      timestamp: Date.now(),
      cached: false,
    };
  },
};
```

#### `src/lib/providers/adapters/market-price/kucoin.ts`

```typescript
// KuCoin — popular for altcoins
// https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=BTC-USDT
// No API key needed for public data

export const kucoinMarketPriceProvider: DataProvider<MarketPriceData> = {
  name: 'kucoin-market-price',
  category: 'market-price',
  priority: 6,
  weight: 0.1,
  baseUrl: 'https://api.kucoin.com/api/v1',
};
```

#### `src/lib/providers/adapters/market-price/mexc.ts`

```typescript
// MEXC — large altcoin selection
// https://api.mexc.com/api/v3/ticker/24hr?symbol=BTCUSDT
// No API key needed

export const mexcMarketPriceProvider: DataProvider<MarketPriceData> = {
  name: 'mexc-market-price',
  category: 'market-price',
  priority: 7,
  weight: 0.1,
  baseUrl: 'https://api.mexc.com/api/v3',
};
```

#### `src/lib/providers/adapters/market-price/gate-io.ts`

```typescript
// Gate.io — good altcoin coverage
// https://api.gateio.ws/api/v4/spot/tickers?currency_pair=BTC_USDT
// No API key needed

export const gateioMarketPriceProvider: DataProvider<MarketPriceData> = {
  name: 'gateio-market-price',
  category: 'market-price',
  priority: 8,
  weight: 0.1,
  baseUrl: 'https://api.gateio.ws/api/v4',
};
```

### 2. Create Order Book Adapters

Create `src/lib/providers/adapters/order-book/`:

```typescript
export interface OrderBookData {
  symbol: string;
  exchange: string;
  bids: Array<{ price: number; quantity: number }>;
  asks: Array<{ price: number; quantity: number }>;
  spread: number;
  spreadPercent: number;
  depth: {
    bids1Pct: number;    // total bid volume within 1% of mid
    asks1Pct: number;
    bids5Pct: number;
    asks5Pct: number;
  };
  midPrice: number;
  timestamp: string;
}
```

Create adapters for each major exchange (Binance, Coinbase, Kraken, OKX, Bybit) — all have public order book endpoints.

#### `src/lib/providers/adapters/order-book/binance.ts`

```typescript
// Binance Order Book — most liquid
// https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=100
export const binanceOrderBookProvider: DataProvider<OrderBookData> = {
  name: 'binance-orderbook',
  category: 'order-book',
  priority: 1,
  weight: 0.3,
  baseUrl: 'https://api.binance.com/api/v3',
};
```

Repeat for Coinbase (`/products/{pair}/book?level=2`), Kraken (`/Depth?pair=`), etc.

### 3. Create OHLCV Adapters

Create `src/lib/providers/adapters/ohlcv/`:

```typescript
export interface OHLCVData {
  symbol: string;
  exchange: string;
  interval: string;  // '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w'
  candles: Array<{
    openTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    closeTime: number;
  }>;
  timestamp: string;
}
```

#### Sources:

1. **Binance** — `GET /api/v3/klines?symbol=BTCUSDT&interval=1h&limit=500` (best liquidity, most accurate)
2. **CoinGecko** — `GET /api/v3/coins/{id}/ohlc?vs_currency=usd&days=30` (aggregated, free)
3. **CryptoCompare** — `GET /data/v2/histohour?fsym=BTC&tsym=USD&limit=168` (good for historical)

### 4. Update Market Price Chain

Expand the existing market price chain:

```typescript
// src/lib/providers/chains/market.ts

export const marketPriceChain = createProviderChain('market-price', {
  providers: [
    coingeckoProvider,          // priority 1, weight 0.25 (aggregated)
    binanceProvider,            // priority 2, weight 0.20 (most liquid)
    coinbaseProvider,           // priority 3, weight 0.15 (US reference)
    coincapProvider,            // priority 4, weight 0.15 (aggregated)
    krakenProvider,             // priority 5, weight 0.10
    kucoinProvider,             // priority 6, weight 0.05
    mexcProvider,               // priority 7, weight 0.05
    gateioProvider,             // priority 8, weight 0.05
  ],
  strategy: 'consensus',        // weighted median price
  ttl: 15_000,                 // 15s cache for real-time
  retries: 1,                  // fast failover
});

export const orderBookChain = createProviderChain('order-book', {
  providers: [binanceOBProvider, coinbaseOBProvider, krakenOBProvider, okxOBProvider, bybitOBProvider],
  strategy: 'broadcast',        // get all books for NBBO calculation
  ttl: 5_000,                  // 5s cache — order books change fast
});

export const ohlcvChain = createProviderChain('ohlcv', {
  providers: [binanceOhlcvProvider, coingeckoOhlcvProvider, cryptocompareOhlcvProvider],
  strategy: 'fallback',
  ttl: 60_000,                 // 1min cache
});
```

### 5. NBBO (National Best Bid/Offer) Engine

Migrate the existing order book aggregation from the route handler into the provider framework:

```typescript
// src/lib/exchange/nbbo.ts

export interface NBBO {
  symbol: string;
  bestBid: { price: number; exchange: string; quantity: number };
  bestAsk: { price: number; exchange: string; quantity: number };
  midPrice: number;
  spread: number;
  spreadBps: number;          // basis points
  depth: AggregatedDepth;
  exchanges: string[];
  timestamp: string;
}

export async function computeNBBO(symbol: string): Promise<NBBO> {
  const result = await orderBookChain.execute({ symbol });
  // Aggregate all order books, find best bid/ask across exchanges
  // Calculate aggregated depth at various price levels
}
```

### Environment Variables

```bash
# No new API keys needed — all CEX public endpoints are free
# Existing CoinGecko key is optional (improves rate limits)
COINGECKO_API_KEY=             # Optional, increases rate limits
```

## Success Criteria

- [ ] 5 new market-price adapters (Coinbase, Kraken, KuCoin, MEXC, Gate.io) — total 8
- [ ] 5 order-book adapters (Binance, Coinbase, Kraken, OKX, Bybit)
- [ ] 3 OHLCV adapters (Binance, CoinGecko, CryptoCompare)
- [ ] Market price consensus from 8 exchanges (weighted median)
- [ ] NBBO engine computing cross-exchange best bid/offer
- [ ] Existing `/api/market/orderbook` migrated to use order book chain
- [ ] Order book spread monitoring and alerting
- [ ] OHLCV available at 7 intervals (1m to 1w)
- [ ] Unit tests for all adapters
- [ ] Price deviation > 1% between exchanges triggers anomaly alert

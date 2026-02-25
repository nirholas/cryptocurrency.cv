# Prompt 12: Macro & TradFi Data Adapters

## Context

The codebase currently has minimal macro/traditional finance data. No dedicated `/api/macro/` routes exist. This data is crucial for understanding crypto in the broader financial context — institutional traders rely on macro signals for crypto positioning.

**Why macro matters for crypto:**
- Fed interest rate decisions drive BTC 30-day correlation with NASDAQ > 0.6
- DXY (Dollar Index) inversely correlates with BTC
- Treasury yields affect risk appetite (2Y/10Y spread = recession signal)
- Stock market fear (VIX) correlates with crypto volatility
- Commodity prices (gold, oil) provide safe-haven context

**Provider framework:** No macro category exists — extend the type system.

## Task

### 1. Extend DataCategory

Add to `src/lib/providers/types.ts`:

```typescript
export type DataCategory =
  | 'market-price'
  // ... existing ...
  | 'macro-data';   // NEW: traditional finance + macro indicators
```

### 2. Create Macro Data Types

```typescript
export interface MacroData {
  indicators: MacroIndicator[];
  correlations: CryptoMacroCorrelation[];
  fedWatch: FedWatchData;
  timestamp: string;
}

export interface MacroIndicator {
  name: string;                // 'DXY' | 'VIX' | 'SP500' | 'NASDAQ' | 'GOLD' | 'OIL' | 'US10Y' | 'US2Y'
  value: number;
  change24h: number;
  changePercent24h: number;
  high52w: number;
  low52w: number;
  timestamp: string;
}

export interface CryptoMacroCorrelation {
  pair: string;                // 'BTC/NASDAQ'
  correlation30d: number;      // -1 to 1
  correlation90d: number;
  direction: 'positive' | 'negative' | 'neutral';
}

export interface FedWatchData {
  nextMeeting: string;
  currentRate: number;
  probabilities: Array<{
    rate: number;
    probability: number;
  }>;
}
```

### 3. Create Macro Adapters

Create `src/lib/providers/adapters/macro-data/`:

#### `src/lib/providers/adapters/macro-data/fred.ts` (FRED — Federal Reserve)

```typescript
// FRED — Federal Reserve Economic Data
// https://api.stlouisfed.org/fred/series/observations
// Requires FRED_API_KEY (free at https://fred.stlouisfed.org/docs/api/api_key.html)
// Best for: interest rates, CPI, unemployment, M2 money supply, treasury yields
// Rate limit: 120 req/min

export const fredMacroProvider: DataProvider<MacroData> = {
  name: 'fred-macro',
  category: 'macro-data',
  priority: 1,
  weight: 0.4,
  baseUrl: 'https://api.stlouisfed.org/fred',

  async fetch(params: FetchParams): Promise<ProviderResult<MacroData>> {
    const key = process.env.FRED_API_KEY;
    if (!key) throw new Error('FRED_API_KEY required');

    const seriesIds = {
      'Federal Funds Rate': 'DFF',
      'US 10Y Treasury': 'DGS10',
      'US 2Y Treasury': 'DGS2',
      'CPI YoY': 'CPIAUCSL',
      'M2 Money Supply': 'M2SL',
      'Unemployment Rate': 'UNRATE',
      'Dollar Index': 'DTWEXBGS',
    };

    const indicators: MacroIndicator[] = await Promise.all(
      Object.entries(seriesIds).map(async ([name, id]) => {
        const url = `${this.baseUrl}/series/observations?series_id=${id}&api_key=${key}&file_type=json&sort_order=desc&limit=2`;
        const response = await fetch(url);
        const data = await response.json();
        const observations = data.observations || [];
        const latest = observations[0];
        const previous = observations[1];
        const value = parseFloat(latest?.value || '0');
        const prevValue = parseFloat(previous?.value || '0');

        return {
          name,
          value,
          change24h: value - prevValue,
          changePercent24h: prevValue ? ((value - prevValue) / prevValue) * 100 : 0,
          high52w: 0, // would need more historical data
          low52w: 0,
          timestamp: latest?.date || new Date().toISOString(),
        };
      })
    );

    return {
      data: {
        indicators,
        correlations: [],
        fedWatch: { nextMeeting: '', currentRate: 0, probabilities: [] },
        timestamp: new Date().toISOString(),
      },
      provider: this.name,
      timestamp: Date.now(),
      cached: false,
    };
  },
};
```

#### `src/lib/providers/adapters/macro-data/alpha-vantage.ts` (Stock + Forex)

```typescript
// Alpha Vantage — stocks, forex, commodities, economic indicators
// https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=KEY
// Requires ALPHA_VANTAGE_API_KEY (free tier: 25 req/day, premium: 120 req/min)
// Best for: S&P500, NASDAQ, VIX, Gold, Oil real-time quotes

export const alphaVantageMacroProvider: DataProvider<MacroData> = {
  name: 'alpha-vantage-macro',
  category: 'macro-data',
  priority: 2,
  weight: 0.3,
  baseUrl: 'https://www.alphavantage.co/query',

  async fetch(params: FetchParams): Promise<ProviderResult<MacroData>> {
    const key = process.env.ALPHA_VANTAGE_API_KEY;
    if (!key) throw new Error('ALPHA_VANTAGE_API_KEY required');

    const symbols = [
      { name: 'SP500', symbol: 'SPY', type: 'GLOBAL_QUOTE' },
      { name: 'NASDAQ', symbol: 'QQQ', type: 'GLOBAL_QUOTE' },
      { name: 'VIX', symbol: 'VIX', type: 'GLOBAL_QUOTE' },
      { name: 'GOLD', symbol: 'GLD', type: 'GLOBAL_QUOTE' },
    ];

    // Alpha Vantage has strict rate limits — serialize with delay
    const indicators: MacroIndicator[] = [];
    for (const { name, symbol, type } of symbols) {
      const url = `${this.baseUrl}?function=${type}&symbol=${symbol}&apikey=${key}`;
      const response = await fetch(url);
      const data = await response.json();
      const quote = data['Global Quote'] || {};

      indicators.push({
        name,
        value: parseFloat(quote['05. price'] || '0'),
        change24h: parseFloat(quote['09. change'] || '0'),
        changePercent24h: parseFloat(quote['10. change percent']?.replace('%', '') || '0'),
        high52w: parseFloat(quote['03. high'] || '0'),
        low52w: parseFloat(quote['04. low'] || '0'),
        timestamp: quote['07. latest trading day'] || new Date().toISOString(),
      });

      // Rate limit: wait 500ms between requests (free tier)
      await new Promise(r => setTimeout(r, 500));
    }

    return {
      data: {
        indicators,
        correlations: [],
        fedWatch: { nextMeeting: '', currentRate: 0, probabilities: [] },
        timestamp: new Date().toISOString(),
      },
      provider: this.name,
      timestamp: Date.now(),
      cached: false,
    };
  },
};
```

#### `src/lib/providers/adapters/macro-data/twelve-data.ts` (Real-time)

```typescript
// Twelve Data — real-time and historical market data
// https://api.twelvedata.com/quote?symbol=SPX,NDX,VIX,XAU/USD,DX-Y.NYB
// Requires TWELVE_DATA_API_KEY (free tier: 800 req/day, 8 req/min)
// Better real-time data than Alpha Vantage free tier

export const twelveDataMacroProvider: DataProvider<MacroData> = {
  name: 'twelve-data-macro',
  category: 'macro-data',
  priority: 3,
  weight: 0.3,
  baseUrl: 'https://api.twelvedata.com',

  async fetch(params: FetchParams): Promise<ProviderResult<MacroData>> {
    const key = process.env.TWELVE_DATA_API_KEY;
    if (!key) throw new Error('TWELVE_DATA_API_KEY required');

    // Twelve Data supports batch quotes
    const symbols = 'SPX,NDX,VIX,XAU/USD,CL,DX-Y.NYB';
    const url = `${this.baseUrl}/quote?symbol=${symbols}&apikey=${key}`;
    const response = await fetch(url);
    const data = await response.json();

    const nameMap: Record<string, string> = {
      'SPX': 'SP500',
      'NDX': 'NASDAQ',
      'VIX': 'VIX',
      'XAU/USD': 'GOLD',
      'CL': 'OIL',
      'DX-Y.NYB': 'DXY',
    };

    const indicators: MacroIndicator[] = Object.entries(data).map(([symbol, quote]: [string, any]) => ({
      name: nameMap[symbol] || symbol,
      value: parseFloat(quote.close || '0'),
      change24h: parseFloat(quote.change || '0'),
      changePercent24h: parseFloat(quote.percent_change || '0'),
      high52w: parseFloat(quote.fifty_two_week?.high || '0'),
      low52w: parseFloat(quote.fifty_two_week?.low || '0'),
      timestamp: quote.datetime || new Date().toISOString(),
    }));

    return {
      data: {
        indicators,
        correlations: [],
        fedWatch: { nextMeeting: '', currentRate: 0, probabilities: [] },
        timestamp: new Date().toISOString(),
      },
      provider: this.name,
      timestamp: Date.now(),
      cached: false,
    };
  },
};
```

### 4. Create Correlation Engine

Build a correlation calculator that runs as a background job:

```typescript
// src/lib/macro/correlation.ts
// Computes rolling 30d and 90d Pearson correlation between:
// BTC ↔ S&P500, NASDAQ, Gold, DXY, VIX
// ETH ↔ S&P500, NASDAQ
// Stores in Redis/PostgreSQL, updates daily
// Used by /api/macro/correlations endpoint

export function computePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const sumY2 = y.reduce((a, b) => a + b * b, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  return denominator === 0 ? 0 : numerator / denominator;
}
```

### 5. New API Routes

```
/api/macro                       → macro dashboard (all indicators)
/api/macro/indicators            → individual macro indicators
/api/macro/correlations          → BTC/ETH ↔ TradFi correlations
/api/macro/fed                   → Fed rate probabilities
/api/macro/dxy                   → Dollar Index with BTC overlay
/api/macro/risk-appetite         → composite risk-on/risk-off signal
```

### 6. Register Provider Chain

```typescript
// src/lib/providers/chains/macro.ts

export const macroDataChain = createProviderChain('macro-data', {
  providers: [fredMacroProvider, alphaVantageMacroProvider, twelveDataMacroProvider],
  strategy: 'broadcast',       // collect from all sources
  ttl: 300_000,               // 5min cache (markets close, data doesn't change often)
});
```

### Environment Variables

```bash
# New — sign up for these (all have free tiers)
FRED_API_KEY=                   # Federal Reserve data (free at fred.stlouisfed.org/docs/api/api_key.html)
ALPHA_VANTAGE_API_KEY=          # Stocks/commodities (free: 25 req/day at alphavantage.co)
TWELVE_DATA_API_KEY=            # Real-time market data (free: 800 req/day at twelvedata.com)
```

## Success Criteria

- [ ] 3 macro data adapters (FRED, Alpha Vantage, Twelve Data)
- [ ] DataCategory extended with `macro-data`
- [ ] `/api/macro/*` routes created (6 endpoints)
- [ ] BTC/ETH correlation engine computing 30d/90d correlation daily
- [ ] Fed rate decision impact displayed with next FOMC meeting
- [ ] DXY inverse correlation visualization data
- [ ] Composite risk-appetite signal (VIX + DXY + spreads + funding rates)
- [ ] Unit tests for all adapters
- [ ] Rate limiting respects free tier limits per provider
- [ ] Caches aggressive for FRED data (updates daily max)

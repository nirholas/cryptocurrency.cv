import { beforeEach, describe, expect, it, vi } from 'vitest';

const resilientFetchResponse = vi.hoisted(() => vi.fn());
vi.mock('@/lib/resilient-fetch', () => ({ resilientFetchResponse }));

import { getOHLCVHistorical, getTicker, parseQuotes } from './coinpaprika';

describe('parseQuotes', () => {
  it('defaults to USD', () => {
    expect(parseQuotes(null)).toBe('USD');
    expect(parseQuotes('  ')).toBe('USD');
  });

  it('upper-cases, trims, dedupes and sorts codes', () => {
    expect(parseQuotes(' usd, btc ,USD,eth')).toBe('BTC,ETH,USD');
  });

  it.each(['USD&limit=1', 'USD,', 'U', 'USD,BTC,ETH,EUR,GBP,JPY', 'US D', 'usd%2Cbtc'])('rejects %j', (raw) => {
    expect(parseQuotes(raw)).toBeNull();
  });
});

describe('CoinPaprika URL building', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resilientFetchResponse.mockImplementation(async () => Response.json([]));
  });

  it('encodes the coin ID path segment and quotes', async () => {
    await getTicker('btc-bitcoin/../../global', 'BTC,USD');
    expect(resilientFetchResponse.mock.calls[0][0]).toBe(
      'https://api.coinpaprika.com/v1/tickers/btc-bitcoin%2F..%2F..%2Fglobal?quotes=BTC%2CUSD',
    );
  });

  it('keys the historical OHLCV cache by quote', async () => {
    await getOHLCVHistorical('eth-ethereum', '2024-01-01', undefined, 30, 'usd');
    await getOHLCVHistorical('eth-ethereum', '2024-01-01', undefined, 30, 'btc');
    expect(resilientFetchResponse).toHaveBeenCalledTimes(2);
    expect(String(resilientFetchResponse.mock.calls[1][0])).toContain('quote=btc');
  });
});

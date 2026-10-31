import { describe, expect, it } from 'vitest';

import { isTradingSymbol } from '../symbols';

describe('isTradingSymbol', () => {
  it.each(['BTC', 'btc', 'BTCUSDT', 'BTC-USD', '1000PEPE', 'A'.repeat(30)])('accepts %s', (symbol) => {
    expect(isTradingSymbol(symbol)).toBe(true);
  });

  it.each(['', '-BTC', 'BTC&limit=1', 'BTC/USD', '../x', 'BTC?x', 'BTC#', 'BTC USD', 'A'.repeat(31)])(
    'rejects %s',
    (symbol) => {
      expect(isTradingSymbol(symbol)).toBe(false);
    },
  );
});

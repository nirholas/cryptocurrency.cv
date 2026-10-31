import { describe, expect, it } from 'vitest';

import { intParam } from '../query-params';

const range = { fallback: 20, min: 1, max: 100 };

describe('intParam', () => {
  it.each([
    ['', 20],
    ['limit=', 20],
    ['limit=abc', 20],
    ['limit=NaN', 20],
    ['limit=Infinity', 20],
    ['limit=-5', 1],
    ['limit=0', 1],
    ['limit=50', 50],
    ['limit=50.9', 50],
    ['limit=12abc', 12],
    ['limit=1e9', 1],
    ['limit=99999999999999999999', 100],
  ])('%s → %i', (query, expected) => {
    expect(intParam(new URLSearchParams(query), 'limit', range)).toBe(expected);
  });

  it('allows a zero minimum for offsets', () => {
    expect(intParam(new URLSearchParams('offset=-3'), 'offset', { fallback: 0, min: 0, max: 1000 })).toBe(0);
  });
});

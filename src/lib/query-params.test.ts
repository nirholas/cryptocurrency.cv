import { describe, expect, it } from 'vitest';

import { intParam, numParam, optionalIntParam, optionalNumParam, parseDate } from './query-params';

const params = (query: string) => new URLSearchParams(query);
const bounds = { min: 1, max: 100 };

describe('intParam', () => {
  it.each([
    ['', 20],
    ['n=abc', 20],
    ['n=', 20],
    ['n=0', 1],
    ['n=-5', 1],
    ['n=999', 100],
    ['n=7', 7],
    ['n=7.9', 7],
  ])('%s -> %i', (query, expected) => {
    expect(intParam(params(query), 'n', { fallback: 20, ...bounds })).toBe(expected);
  });
});

describe('numParam', () => {
  it.each([
    ['', 0.4],
    ['n=abc', 0.4],
    ['n=NaN', 0.4],
    ['n=Infinity', 0.4],
    ['n=-1', 0],
    ['n=2', 1],
    ['n=0.75', 0.75],
  ])('%s -> %d', (query, expected) => {
    expect(numParam(params(query), 'n', { fallback: 0.4, min: 0, max: 1 })).toBe(expected);
  });
});

describe('optionalNumParam', () => {
  it.each([
    ['', undefined],
    ['n=abc', undefined],
    ['n=0', 1],
    ['n=2.5', 2.5],
    ['n=1e9', 100],
  ])('%s -> %s', (query, expected) => {
    expect(optionalNumParam(params(query), 'n', bounds)).toBe(expected);
  });
});

describe('optionalIntParam', () => {
  it.each([
    ['', undefined],
    ['n=x', undefined],
    ['n=0', 1],
    ['n=3.7', 3],
    ['n=500', 100],
  ])('%s -> %s', (query, expected) => {
    expect(optionalIntParam(params(query), 'n', bounds)).toBe(expected);
  });
});

describe('parseDate', () => {
  it.each([
    ['2026-01-15', '2026-01-15T00:00:00.000Z'],
    ['2026-01-15T12:30:00Z', '2026-01-15T12:30:00.000Z'],
    [0, '1970-01-01T00:00:00.000Z'],
  ])('%s -> %s', (raw, expected) => {
    expect(parseDate(raw)?.toISOString()).toBe(expected);
  });

  it.each([undefined, null, '', '   ', 'garbage', '2026-13-45', Number.NaN, Number.POSITIVE_INFINITY, {}, true])(
    'rejects %s',
    (raw) => {
      expect(parseDate(raw)).toBeUndefined();
    },
  );
});

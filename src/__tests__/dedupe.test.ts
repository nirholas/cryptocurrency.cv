/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dedupe, getPendingCount, clearPending } from '@/lib/dedupe';

describe('dedupe', () => {
  beforeEach(() => {
    clearPending();
  });

  it('should return the result of the function', async () => {
    const result = await dedupe('key1', () => Promise.resolve('data'));
    expect(result).toBe('data');
  });

  it('should deduplicate concurrent requests for the same key', async () => {
    const fn = vi.fn().mockResolvedValue('shared');
    const [r1, r2, r3] = await Promise.all([
      dedupe('same-key', fn),
      dedupe('same-key', fn),
      dedupe('same-key', fn),
    ]);
    expect(r1).toBe('shared');
    expect(r2).toBe('shared');
    expect(r3).toBe('shared');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('should not deduplicate different keys', async () => {
    const fn1 = vi.fn().mockResolvedValue('a');
    const fn2 = vi.fn().mockResolvedValue('b');
    const [r1, r2] = await Promise.all([dedupe('key-a', fn1), dedupe('key-b', fn2)]);
    expect(r1).toBe('a');
    expect(r2).toBe('b');
    expect(fn1).toHaveBeenCalledOnce();
    expect(fn2).toHaveBeenCalledOnce();
  });

  it('should allow new request after previous completes', async () => {
    const fn = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');
    const r1 = await dedupe('seq-key', fn);
    const r2 = await dedupe('seq-key', fn);
    expect(r1).toBe('first');
    expect(r2).toBe('second');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should clean up pending after error', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(dedupe('err-key', fn)).rejects.toThrow('fail');
    // After error, the key should be removed from pending
    expect(getPendingCount()).toBe(0);
  });

  it('should share rejection across concurrent callers', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('shared-fail'));
    const promises = [dedupe('err-shared', fn), dedupe('err-shared', fn)];
    await expect(promises[0]).rejects.toThrow('shared-fail');
    await expect(promises[1]).rejects.toThrow('shared-fail');
    expect(fn).toHaveBeenCalledOnce();
  });
});

describe('getPendingCount', () => {
  beforeEach(() => {
    clearPending();
  });

  it('should return 0 when no requests pending', () => {
    expect(getPendingCount()).toBe(0);
  });

  it('should track pending requests', async () => {
    let resolveFn: (v: string) => void;
    const promise = dedupe(
      'pending',
      () =>
        new Promise<string>((resolve) => {
          resolveFn = resolve;
        }),
    );
    expect(getPendingCount()).toBe(1);
    resolveFn?.('done');
    await promise;
    expect(getPendingCount()).toBe(0);
  });
});

describe('clearPending', () => {
  it('should clear all pending requests', async () => {
    // Start some async operations that won't resolve immediately
    dedupe('clear-1', () => new Promise(() => {}));
    dedupe('clear-2', () => new Promise(() => {}));
    expect(getPendingCount()).toBe(2);
    clearPending();
    expect(getPendingCount()).toBe(0);
  });
});

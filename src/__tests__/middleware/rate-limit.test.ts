/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Tests for rate-limit utility functions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { record429, isRepeat429Blocked } from '@/middleware/rate-limit';

describe('record429 / isRepeat429Blocked', () => {
  // Use unique IPs per test to avoid state leakage
  let testIp: string;

  beforeEach(() => {
    testIp = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  });

  it('should not block after a single 429', () => {
    const escalated = record429(testIp);
    expect(escalated).toBe(false);
    expect(isRepeat429Blocked(testIp)).toBe(false);
  });

  it('should escalate after threshold hits', () => {
    // Threshold is 10 by default
    for (let i = 0; i < 9; i++) {
      expect(record429(testIp)).toBe(false);
    }
    // 10th hit should trigger escalation
    expect(record429(testIp)).toBe(true);
    expect(isRepeat429Blocked(testIp)).not.toBe(false);
  });

  it('should return blocked-until timestamp after escalation', () => {
    for (let i = 0; i < 10; i++) {
      record429(testIp);
    }
    const blocked = isRepeat429Blocked(testIp);
    expect(typeof blocked).toBe('number');
    expect(blocked as number).toBeGreaterThan(Date.now());
  });

  it('should return false for unknown IPs', () => {
    expect(isRepeat429Blocked('unknown-ip-123')).toBe(false);
  });
});

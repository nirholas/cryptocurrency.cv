import { describe, expect, it } from 'vitest';
import { logSafe } from './log-safe';

describe('logSafe', () => {
  it('replaces line terminators so a value cannot forge a log entry', () => {
    expect(logSafe('ok\r\n[INFO] forged x')).toBe('ok  [INFO] forged x');
  });

  it('replaces other control characters', () => {
    expect(logSafe('a\u0000b\u001bc\u007fd')).toBe('a b c d');
  });

  it('uses the message of an Error', () => {
    expect(logSafe(new Error('bad\nthing'))).toBe('bad thing');
  });

  it('serialises objects and stringifies primitives', () => {
    expect(logSafe({ a: 1 })).toBe('{"a":1}');
    expect(logSafe(42)).toBe('42');
    expect(logSafe(undefined)).toBe('undefined');
  });

  it('caps the length', () => {
    expect(logSafe('x'.repeat(20), 5)).toBe('xxxxx…');
  });
});

import { describe, expect, it } from 'vitest';

import { describeFeedFetchError } from './feed-fetch-error';

function withCause(error: Error, code: string): Error {
  return Object.assign(error, { cause: Object.assign(new Error('socket'), { code }) });
}

describe('describeFeedFetchError', () => {
  it('words an abort as the timeout the caller set', () => {
    const abort = new DOMException('This operation was aborted', 'AbortError');
    expect(describeFeedFetchError(abort, 3000)).toEqual({ network: true, message: 'timeout after 3000ms' });
  });

  it('treats a body cut off mid-stream as a network failure', () => {
    const terminated = withCause(new TypeError('terminated'), 'UND_ERR_SOCKET');
    expect(describeFeedFetchError(terminated, 3000)).toEqual({
      network: true,
      message: 'terminated (UND_ERR_SOCKET)',
    });
  });

  it('treats DNS and reset failures as network failures', () => {
    expect(describeFeedFetchError(withCause(new TypeError('fetch failed'), 'ENOTFOUND'), 3000).network).toBe(true);
    expect(describeFeedFetchError(withCause(new Error('read'), 'ECONNRESET'), 3000).network).toBe(true);
    expect(describeFeedFetchError(new TypeError('terminated'), 3000).network).toBe(true);
  });

  it('keeps unexpected errors visible', () => {
    expect(describeFeedFetchError(new RangeError('Invalid time value'), 3000)).toEqual({
      network: false,
      message: 'Invalid time value',
    });
    expect(describeFeedFetchError(new TypeError('Cannot read properties of undefined'), 3000).network).toBe(false);
    expect(describeFeedFetchError('boom', 3000)).toEqual({ network: false, message: 'boom' });
  });
});

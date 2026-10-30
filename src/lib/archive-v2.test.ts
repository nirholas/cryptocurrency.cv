import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ARCHIVE_BASE_URL } from '@/lib/archive-source';
import { clearArchiveV2MonthCache, getArchiveV2Month } from '@/lib/archive-v2';

const MONTH = '2026-09';

function jsonl(...ids: string[]): string {
  return ids.map((id) => JSON.stringify({ id, title: id })).join('\n') + '\n';
}

describe('getArchiveV2Month', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearArchiveV2MonthCache();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('parses JSONL and skips blank and malformed lines', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(`${jsonl('a')}\n  \nnot json\r\n${jsonl('b')}`));

    const articles = await getArchiveV2Month(MONTH);

    expect(String(fetchSpy.mock.calls[0][0])).toBe(`${ARCHIVE_BASE_URL}/articles/${MONTH}.jsonl`);
    expect(articles.map((a) => a.id)).toEqual(['a', 'b']);
  });

  it('shares one download between concurrent callers and reuses it until it expires', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-30T12:00:00Z'));
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response(jsonl('a', 'b')));

    const [first, second] = await Promise.all([getArchiveV2Month(MONTH), getArchiveV2Month(MONTH)]);
    await getArchiveV2Month(MONTH);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);

    // Past months stay for six hours
    vi.setSystemTime(new Date('2026-10-30T18:00:01Z'));
    await getArchiveV2Month(MONTH);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('refreshes the current month after fifteen minutes', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-30T12:00:00Z'));
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response(jsonl('a')));

    await getArchiveV2Month('2026-10');
    vi.setSystemTime(new Date('2026-10-30T12:14:00Z'));
    await getArchiveV2Month('2026-10');
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date('2026-10-30T12:15:01Z'));
    await getArchiveV2Month('2026-10');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('serves the last good copy when a refresh fails, and does not cache failures', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-30T12:00:00Z'));
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(jsonl('a')))
      .mockResolvedValueOnce(new Response('', { status: 503 }));

    await getArchiveV2Month(MONTH);
    vi.setSystemTime(new Date('2026-10-31T00:00:00Z'));
    expect((await getArchiveV2Month(MONTH)).map((a) => a.id)).toEqual(['a']);

    clearArchiveV2MonthCache();
    fetchSpy.mockRejectedValueOnce(new TypeError('fetch failed'));
    expect(await getArchiveV2Month(MONTH)).toEqual([]);

    fetchSpy.mockResolvedValueOnce(new Response(jsonl('c')));
    expect((await getArchiveV2Month(MONTH)).map((a) => a.id)).toEqual(['c']);
  });

  it('treats a month the archive has not reached as empty', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 404 }));

    expect(await getArchiveV2Month('2027-01')).toEqual([]);
    await getArchiveV2Month('2027-01');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('keeps at most three parsed months', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response(jsonl('a')));

    for (const month of ['2026-06', '2026-07', '2026-08', '2026-09']) await getArchiveV2Month(month);
    await getArchiveV2Month('2026-09');
    await getArchiveV2Month('2026-06');

    expect(fetchSpy.mock.calls.map(([url]) => String(url).slice(-13, -6))).toEqual([
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-06',
    ]);
  });
});

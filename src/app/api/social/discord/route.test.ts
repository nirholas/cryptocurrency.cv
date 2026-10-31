import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { GET } from './route';

const CHANNEL = '123456789012345678';
const GUILD = '987654321098765432';

function request(query: string) {
  return new NextRequest(`http://localhost/api/social/discord?${query}`);
}

describe('GET /api/social/discord', () => {
  let fetchSpy: MockInstance<typeof fetch>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('DISCORD_BOT_TOKEN', 'test-token');
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it.each([
    `channel_id=${CHANNEL}/../../users/@me`,
    'channel_id=../guilds/1/members',
    `guild_id=${GUILD}?with_counts=true`,
    'guild_id=abc',
    `channel_id=${CHANNEL}&guild_id=1`,
  ])('rejects %s without calling Discord', async (query) => {
    const res = await GET(request(query));

    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fetches a valid channel with a page size Discord accepts', async () => {
    fetchSpy.mockResolvedValueOnce(Response.json([]));

    const res = await GET(request(`channel_id=${CHANNEL}&limit=500`));

    expect(res.status).toBe(200);
    expect(String(fetchSpy.mock.calls[0][0])).toBe(
      `https://discord.com/api/v10/channels/${CHANNEL}/messages?limit=100`,
    );
  });

  it('falls back to the default limit when limit is not a number', async () => {
    fetchSpy.mockResolvedValueOnce(Response.json([]));

    const res = await GET(request(`channel_id=${CHANNEL}&limit=lots`));
    const body = await res.json();

    expect(body.filters.limit).toBe(100);
    expect(String(fetchSpy.mock.calls[0][0])).toContain('limit=100');
  });
});

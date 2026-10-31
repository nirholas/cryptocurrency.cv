import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

const lookup = vi.hoisted(() => vi.fn());
vi.mock('node:dns/promises', () => ({ default: { lookup }, lookup }));

import { assertPublicUrl, isPrivateAddress, safeFetch, safeFetchImpl, UnsafeUrlError } from './safe-fetch';

function resolvesTo(...addresses: string[]) {
  lookup.mockResolvedValue(addresses.map((address) => ({ address, family: address.includes(':') ? 6 : 4 })));
}

function redirect(status: number, location: string) {
  return new Response(null, { status, headers: { location } });
}

describe('isPrivateAddress', () => {
  it.each([
    '0.0.0.0',
    '10.1.2.3',
    '100.64.0.1',
    '127.0.0.1',
    '169.254.169.254',
    '172.16.0.1',
    '172.31.255.255',
    '192.0.0.8',
    '192.168.1.1',
    '198.18.0.1',
    '224.0.0.1',
    '255.255.255.255',
    '::',
    '::1',
    '::ffff:169.254.169.254',
    '::ffff:a9fe:a9fe',
    '::127.0.0.1',
    '64:ff9b::a00:1',
    '2002:a00:1::',
    '2001:0:4136:e378::1',
    '2001:db8::1',
    'fc00::1',
    'fd12:3456::1',
    'fe80::1%eth0',
    'ff02::1',
    'not-an-ip',
  ])('blocks %s', (ip) => {
    expect(isPrivateAddress(ip)).toBe(true);
  });

  it.each(['8.8.8.8', '1.1.1.1', '100.128.0.1', '172.32.0.1', '2606:4700::1111', '::ffff:8.8.8.8', '2002:808:808::'])(
    'allows %s',
    (ip) => {
      expect(isPrivateAddress(ip)).toBe(false);
    },
  );
});

describe('assertPublicUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    'ftp://example.com/file',
    'file:///etc/passwd',
    'http://localhost:3000',
    'http://LOCALHOST./',
    'http://api.localhost/',
    'http://metadata.google.internal/computeMetadata/v1/',
    'http://printer.local/',
    'http://169.254.169.254/latest/meta-data/',
    'http://2130706433/',
    'http://[::ffff:a9fe:a9fe]/',
    'not a url',
  ])('rejects %s without resolving DNS', async (input) => {
    await expect(assertPublicUrl(input)).rejects.toBeInstanceOf(UnsafeUrlError);
    expect(lookup).not.toHaveBeenCalled();
  });

  it('rejects a public name that resolves to a private address', async () => {
    resolvesTo('93.184.216.34', '10.0.0.5');
    await expect(assertPublicUrl('https://rebind.example/')).rejects.toThrow('resolves to a private');
    expect(lookup).toHaveBeenCalledWith('rebind.example', { all: true, verbatim: true });
  });

  it('accepts a name whose every address is public', async () => {
    resolvesTo('93.184.216.34', '2606:2800:220:1:248:1893:25c8:1946');
    const url = await assertPublicUrl('https://example.com/a?b=1');
    expect(url.href).toBe('https://example.com/a?b=1');
  });

  it('honours a narrower protocol list', async () => {
    await expect(assertPublicUrl('http://8.8.8.8/', { protocols: ['https:'] })).rejects.toThrow('scheme http:');
  });
});

describe('safeFetch', () => {
  let fetchSpy: MockInstance<typeof fetch>;

  beforeEach(() => {
    vi.clearAllMocks();
    resolvesTo('93.184.216.34');
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('refuses a redirect into private address space', async () => {
    fetchSpy.mockResolvedValueOnce(redirect(302, 'http://169.254.169.254/latest/meta-data/'));

    await expect(safeFetch('https://example.com/')).rejects.toBeInstanceOf(UnsafeUrlError);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('follows public redirects and validates each hop', async () => {
    fetchSpy
      .mockResolvedValueOnce(redirect(301, '/moved'))
      .mockResolvedValueOnce(redirect(307, 'https://cdn.example.net/final'))
      .mockResolvedValueOnce(new Response('ok'));

    const res = await safeFetch('https://example.com/start');

    expect(await res.text()).toBe('ok');
    expect(fetchSpy.mock.calls.map(([url]) => String(url))).toEqual([
      'https://example.com/start',
      'https://example.com/moved',
      'https://cdn.example.net/final',
    ]);
    expect(fetchSpy.mock.calls.every(([, init]) => init?.redirect === 'manual')).toBe(true);
    expect(lookup).toHaveBeenCalledTimes(3);
  });

  it('turns a POST into a GET on 303 and drops credentials across origins', async () => {
    fetchSpy.mockResolvedValueOnce(redirect(303, 'https://other.example/done')).mockResolvedValueOnce(new Response('ok'));

    await safeFetch('https://example.com/hook', {
      method: 'POST',
      body: '{"a":1}',
      headers: { authorization: 'Bearer secret', 'content-type': 'application/json', 'x-trace': '1' },
    });

    const init = fetchSpy.mock.calls[1][1]!;
    const headers = init.headers as Headers;
    expect(init.method).toBe('GET');
    expect(init.body).toBeUndefined();
    expect(headers.get('authorization')).toBeNull();
    expect(headers.get('content-type')).toBeNull();
    expect(headers.get('x-trace')).toBe('1');
  });

  it('keeps method and body on a 307', async () => {
    fetchSpy.mockResolvedValueOnce(redirect(307, '/again')).mockResolvedValueOnce(new Response('ok'));

    await safeFetch('https://example.com/hook', { method: 'POST', body: 'payload' });

    expect(fetchSpy.mock.calls[1][1]).toMatchObject({ method: 'POST', body: 'payload' });
  });

  it('stops after maxRedirects', async () => {
    fetchSpy.mockImplementation(async () => redirect(302, '/loop'));

    await expect(safeFetch('https://example.com/loop', { maxRedirects: 2 })).rejects.toThrow('More than 2 redirects');
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('returns the redirect itself for redirect: manual and throws for redirect: error', async () => {
    fetchSpy.mockResolvedValueOnce(redirect(302, 'http://10.0.0.1/'));
    const res = await safeFetch('https://example.com/', { redirect: 'manual' });
    expect(res.status).toBe(302);

    fetchSpy.mockResolvedValueOnce(redirect(302, 'https://example.com/next'));
    await expect(safeFetch('https://example.com/', { redirect: 'error' })).rejects.toThrow('refused');
  });

  it('never fetches a URL that fails validation', async () => {
    await expect(safeFetch('http://127.0.0.1:6379/')).rejects.toBeInstanceOf(UnsafeUrlError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('safeFetchImpl rejects Request objects', async () => {
    await expect(safeFetchImpl(new Request('https://example.com/'))).rejects.toThrow('not a Request');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

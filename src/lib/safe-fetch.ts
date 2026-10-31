/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

/**
 * Server-side fetch of caller-supplied URLs without SSRF.
 *
 * Several routes fetch a URL a caller hands them (article extraction, webhook
 * tests, the x402 conformance prober). Checking the hostname string alone is
 * not enough: a public name can resolve to 10.0.0.5, `[::ffff:a9fe:a9fe]` is
 * the metadata server written as IPv6, and a public page can redirect to
 * either. `safeFetch` resolves every address a hostname maps to, refuses the
 * request if any of them is private, and re-checks each redirect hop itself.
 *
 * The check and the connection resolve DNS separately, so a resolver that
 * answers differently within milliseconds (DNS rebinding) is not covered.
 * Closing that needs a pinned-address dispatcher, which Node's built-in fetch
 * does not expose without the undici package.
 *
 * @module lib/safe-fetch
 */

import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/** Thrown when a URL, or a redirect it leads to, targets a non-public address. */
export class UnsafeUrlError extends Error {
  override name = 'UnsafeUrlError';
}

const BLOCKED_HOSTNAMES: ReadonlySet<string> = new Set([
  'localhost',
  'metadata',
  'metadata.google',
  'metadata.google.internal',
  'instance-data',
]);

const BLOCKED_SUFFIXES = ['.localhost', '.local', '.localdomain', '.internal', '.home.arpa'];

const REDIRECT_STATUSES: ReadonlySet<number> = new Set([301, 302, 303, 307, 308]);

const DEFAULT_MAX_REDIRECTS = 5;

function isPrivateIPv4(ip: string): boolean {
  const [a, b, c] = ip.split('.').map(Number);
  return (
    a === 0 || // 0.0.0.0/8 "this network"
    a === 10 || // 10.0.0.0/8
    a === 127 || // loopback
    (a === 100 && b >= 64 && b <= 127) || // 100.64.0.0/10 carrier-grade NAT
    (a === 169 && b === 254) || // link-local, cloud metadata
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
    (a === 192 && b === 0 && (c === 0 || c === 2)) || // IETF protocol assignments, TEST-NET-1
    (a === 192 && b === 168) || // 192.168.0.0/16
    (a === 198 && (b === 18 || b === 19)) || // benchmarking
    (a === 198 && b === 51 && c === 100) || // TEST-NET-2
    (a === 203 && b === 0 && c === 113) || // TEST-NET-3
    a >= 224 // multicast, reserved, broadcast
  );
}

/** Expand a valid IPv6 address (as accepted by `net.isIP`) to eight hextets. */
function ipv6Hextets(ip: string): number[] {
  let address = ip.toLowerCase();
  const zone = address.indexOf('%');
  if (zone !== -1) address = address.slice(0, zone);

  const dotted = address.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) {
    const [a, b, c, d] = dotted[2].split('.').map(Number);
    address = `${dotted[1]}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }

  const [head, tail] = address.split('::');
  const parse = (part: string | undefined) =>
    part ? part.split(':').map((group) => Number.parseInt(group, 16)) : [];
  const front = parse(head);
  if (tail === undefined) return front;
  const back = parse(tail);
  return [...front, ...new Array<number>(8 - front.length - back.length).fill(0), ...back];
}

function embeddedIPv4(high: number, low: number): string {
  return [high >> 8, high & 0xff, low >> 8, low & 0xff].join('.');
}

function isPrivateIPv6(ip: string): boolean {
  const h = ipv6Hextets(ip);
  const leadingZeros = (count: number) => h.slice(0, count).every((group) => group === 0);

  if (leadingZeros(8)) return true; // :: unspecified
  if (leadingZeros(7) && h[7] === 1) return true; // ::1 loopback
  if (leadingZeros(5) && h[5] === 0xffff) return isPrivateIPv4(embeddedIPv4(h[6], h[7])); // ::ffff:a.b.c.d
  if (leadingZeros(6)) return isPrivateIPv4(embeddedIPv4(h[6], h[7])); // ::a.b.c.d (deprecated)
  if (h[0] === 0x64 && h[1] === 0xff9b) return isPrivateIPv4(embeddedIPv4(h[6], h[7])); // NAT64
  if (h[0] === 0x2002) return isPrivateIPv4(embeddedIPv4(h[1], h[2])); // 6to4
  if (h[0] === 0x2001 && h[1] === 0) return true; // Teredo
  if (h[0] === 0x2001 && h[1] === 0xdb8) return true; // documentation
  if ((h[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((h[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((h[0] & 0xffc0) === 0xfec0) return true; // fec0::/10 site-local (deprecated)
  if ((h[0] & 0xff00) === 0xff00) return true; // multicast
  return false;
}

/** True for any address a server-side fetch on behalf of a caller must not reach. */
export function isPrivateAddress(ip: string): boolean {
  const family = isIP(ip);
  if (family === 4) return isPrivateIPv4(ip);
  if (family === 6) return isPrivateIPv6(ip);
  return true;
}

function isBlockedHostname(hostname: string): boolean {
  return BLOCKED_HOSTNAMES.has(hostname) || BLOCKED_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
}

export interface PublicUrlOptions {
  /** Schemes to accept. Defaults to http and https. */
  protocols?: readonly string[];
}

/**
 * Parse `input` and confirm it points at a public address: allowed scheme, no
 * internal hostname, and every address the hostname resolves to is public.
 * Throws {@link UnsafeUrlError} otherwise; DNS failures propagate as-is.
 */
export async function assertPublicUrl(input: string | URL, options: PublicUrlOptions = {}): Promise<URL> {
  const protocols = options.protocols ?? ['http:', 'https:'];

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new UnsafeUrlError('URL is not valid');
  }
  if (!protocols.includes(url.protocol)) {
    throw new UnsafeUrlError(`URL scheme ${url.protocol} is not allowed`);
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!hostname || isBlockedHostname(hostname)) {
    throw new UnsafeUrlError('URL targets an internal hostname');
  }

  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new UnsafeUrlError('URL targets a private or reserved address');
    return url;
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new UnsafeUrlError('URL resolves to a private or reserved address');
  }
  return url;
}

export interface SafeFetchInit extends RequestInit {
  /** Redirect hops to follow before failing. Defaults to 5. */
  maxRedirects?: number;
  /** Schemes to accept on the first request and every redirect. */
  protocols?: readonly string[];
}

const CREDENTIAL_HEADERS = ['authorization', 'cookie', 'proxy-authorization'];
const BODY_HEADERS = ['content-type', 'content-length', 'content-encoding', 'content-language', 'content-location'];

/**
 * `fetch` for caller-supplied URLs. Validates the target with
 * {@link assertPublicUrl} and follows redirects manually so each hop is
 * validated too. `redirect: 'manual'` and `redirect: 'error'` keep their
 * standard meaning.
 */
export async function safeFetch(input: string | URL, init: SafeFetchInit = {}): Promise<Response> {
  const { maxRedirects = DEFAULT_MAX_REDIRECTS, protocols, redirect = 'follow', ...rest } = init;

  let url = await assertPublicUrl(input, { protocols });
  let method = (rest.method ?? 'GET').toUpperCase();
  let body = rest.body;
  const headers = new Headers(rest.headers);

  for (let hop = 0; ; hop++) {
    const response = await fetch(url, { ...rest, method, body, headers, redirect: 'manual' });
    const location = response.headers.get('location');
    if (redirect === 'manual' || !REDIRECT_STATUSES.has(response.status) || !location) return response;

    await response.body?.cancel();
    if (redirect === 'error') throw new TypeError(`Redirect to ${location} refused`);
    if (hop >= maxRedirects) throw new TypeError(`More than ${maxRedirects} redirects`);

    const next = await assertPublicUrl(new URL(location, url), { protocols });
    if (next.origin !== url.origin) {
      for (const name of CREDENTIAL_HEADERS) headers.delete(name);
    }
    if (response.status === 303 ? method !== 'HEAD' : response.status <= 302 && method === 'POST') {
      method = 'GET';
      body = undefined;
      for (const name of BODY_HEADERS) headers.delete(name);
    }
    url = next;
  }
}

/**
 * {@link safeFetch} with the `fetch` signature, for libraries that take a
 * `fetchImpl`. Accepts URLs only: a `Request` may carry a body stream that
 * cannot be replayed across redirect hops.
 */
export const safeFetchImpl: typeof fetch = (input, init) => {
  if (input instanceof Request) {
    return Promise.reject(new TypeError('safeFetch takes a URL, not a Request'));
  }
  return safeFetch(input, init);
};

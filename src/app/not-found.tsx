/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Root 404
 *
 * Rendered for any path that matches no route at all, so it sits outside
 * `[locale]/layout.tsx` and has to supply its own `<html>`/`<body>`.
 *
 * Reading a request header makes the render dynamic, which is the point: the
 * page used to be statically prerendered, so the site's strict `script-src`
 * (no `unsafe-inline`) blocked every inline flight script on it. The bootstrap
 * never ran and the browser reported an uncaught "Connection closed." on every
 * 404 the site served.
 */

import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { ThemeScript } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: '404 — Page Not Found | Crypto Vision',
  robots: { index: false, follow: false },
};

const DESTINATIONS = [
  { href: '/', label: 'Home', description: 'Latest crypto headlines' },
  { href: '/markets', label: 'Markets', description: 'Prices, movers and volume' },
  { href: '/defi', label: 'DeFi', description: 'Protocol TVL and yields' },
  { href: '/search', label: 'Search', description: 'Find an article or a coin' },
];

/**
 * The nonce for this render.
 *
 * Prefers the `content-security-policy` request header, which is the same
 * source Next.js reads to nonce its own flight scripts, so this script always
 * carries the nonce that is actually in the response CSP. `x-nonce` (set by the
 * intl middleware, and what the locale layout reads) is the fallback: it does
 * not survive the fall-through to `/_not-found`.
 */
function readNonce(csp: string | null, xNonce: string | null): string | undefined {
  const fromCsp = csp?.match(/'nonce-([^']+)'/)?.[1];
  return fromCsp ?? xNonce ?? undefined;
}

export default async function RootNotFound() {
  const requestHeaders = await headers();
  const nonce = readNonce(
    requestHeaders.get('content-security-policy'),
    requestHeaders.get('x-nonce'),
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-surface text-text-primary antialiased">
        {/*
          The very same component the locale layout renders. Sharing it means
          the script body hashes to the SHA-256 already allow-listed in
          `buildCspHeader`, so it runs even on a render where the nonce header
          does not reach this page.
        */}
        <ThemeScript nonce={nonce} />
        <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-8 px-6 py-20 text-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-text-tertiary">
              Error 404
            </p>
            <h1 className="mt-3 font-serif text-4xl font-bold sm:text-5xl">Page not found</h1>
            <p className="mt-4 text-base text-text-secondary">
              That page does not exist or has moved. Here is where to go instead.
            </p>
          </div>

          <nav aria-label="Suggested pages" className="w-full">
            <ul className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
              {DESTINATIONS.map((d) => (
                <li key={d.href}>
                  <a
                    href={d.href}
                    className="block rounded-lg border border-border bg-surface-secondary px-4 py-3 text-left transition-colors hover:border-accent hover:bg-surface-tertiary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <span className="block text-sm font-semibold">{d.label}</span>
                    <span className="mt-0.5 block text-xs text-text-secondary">
                      {d.description}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </main>
      </body>
    </html>
  );
}

/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

/**
 * Live coin data (client) — derivatives (funding rate + open interest, by
 * symbol) fetched from the aggregated derivatives API, plus on-chain contract
 * addresses rendered from the coin's platform map. Every panel hides itself
 * when it has no data, so the section never shows a broken/empty shell.
 */

import { useEffect, useState } from 'react';

interface FundingRow {
  exchange?: string;
  symbol?: string;
  fundingRate?: number;
  annualizedRate?: number;
}
interface OpenInterestRow {
  exchange?: string;
  openInterestUsd?: number;
  openInterest?: number;
}

function pickArray(json: unknown): Record<string, unknown>[] {
  if (Array.isArray(json)) return json as Record<string, unknown>[];
  if (json && typeof json === 'object') {
    const obj = json as Record<string, unknown>;
    for (const key of ['data', 'results', 'rates', 'items']) {
      if (Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[];
    }
  }
  return [];
}

function fmtUsd(n?: number | null): string {
  if (n == null) return '—';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

/* chain slug (CoinGecko platform key) -> token explorer base */
const EXPLORER: Record<string, { name: string; url: (a: string) => string }> = {
  ethereum: { name: 'Ethereum', url: (a) => `https://etherscan.io/token/${a}` },
  'binance-smart-chain': { name: 'BNB Chain', url: (a) => `https://bscscan.com/token/${a}` },
  'polygon-pos': { name: 'Polygon', url: (a) => `https://polygonscan.com/token/${a}` },
  'arbitrum-one': { name: 'Arbitrum', url: (a) => `https://arbiscan.io/token/${a}` },
  'optimistic-ethereum': { name: 'Optimism', url: (a) => `https://optimistic.etherscan.io/token/${a}` },
  base: { name: 'Base', url: (a) => `https://basescan.org/token/${a}` },
  avalanche: { name: 'Avalanche', url: (a) => `https://snowtrace.io/token/${a}` },
  solana: { name: 'Solana', url: (a) => `https://solscan.io/token/${a}` },
};

function truncate(a: string): string {
  return a.length > 13 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

export function CoinLiveData({
  symbol,
  name,
  contractPlatforms,
}: {
  coinId: string;
  symbol: string;
  name: string;
  contractPlatforms?: Record<string, string>;
}) {
  const [funding, setFunding] = useState<FundingRow[] | null>(null);
  const [oi, setOi] = useState<OpenInterestRow[] | null>(null);

  useEffect(() => {
    const sym = symbol.toUpperCase();
    const ac = new AbortController();
    (async () => {
      try {
        const [fRes, oRes] = await Promise.all([
          fetch(`/api/derivatives/aggregated/funding?symbol=${sym}`, { signal: ac.signal }),
          fetch(`/api/derivatives/aggregated/open-interest?symbol=${sym}`, { signal: ac.signal }),
        ]);
        if (fRes.ok) setFunding(pickArray(await fRes.json()) as FundingRow[]);
        if (oRes.ok) setOi(pickArray(await oRes.json()) as OpenInterestRow[]);
      } catch {
        /* graceful: panels stay hidden */
      }
    })();
    return () => ac.abort();
  }, [symbol]);

  const contracts = Object.entries(contractPlatforms ?? {}).filter(
    ([, addr]) => addr && addr.length > 0,
  );

  const avgFunding =
    funding && funding.length > 0
      ? funding.reduce((s, r) => s + (r.fundingRate ?? 0), 0) / funding.length
      : null;
  const totalOi =
    oi && oi.length > 0
      ? oi.reduce((s, r) => s + (r.openInterestUsd ?? 0), 0)
      : null;

  const hasDerivs = (funding && funding.length > 0) || (oi && oi.length > 0);
  if (!hasDerivs && contracts.length === 0) return null;

  return (
    <>
      {hasDerivs && (
        <div className="mb-10">
          <h2 className="text-text-primary mb-4 font-serif text-xl font-bold">
            Derivatives
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {avgFunding != null && (
              <div className="border-border rounded-lg border bg-(--color-bg-secondary) p-4">
                <p className="text-text-tertiary mb-1 text-xs">Avg Funding Rate</p>
                <p
                  className={`text-base font-semibold ${avgFunding >= 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {(avgFunding * 100).toFixed(4)}%
                </p>
              </div>
            )}
            {totalOi != null && totalOi > 0 && (
              <div className="border-border rounded-lg border bg-(--color-bg-secondary) p-4">
                <p className="text-text-tertiary mb-1 text-xs">Open Interest</p>
                <p className="text-text-primary text-base font-semibold">{fmtUsd(totalOi)}</p>
              </div>
            )}
            {funding && funding.length > 0 && (
              <div className="border-border rounded-lg border bg-(--color-bg-secondary) p-4">
                <p className="text-text-tertiary mb-1 text-xs">Exchanges Tracked</p>
                <p className="text-text-primary text-base font-semibold">{funding.length}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {contracts.length > 0 && (
        <div className="mb-10">
          <h2 className="text-text-primary mb-4 font-serif text-xl font-bold">
            {name} Contracts
          </h2>
          <div className="flex flex-wrap gap-2">
            {contracts.map(([chain, addr]) => {
              const meta = EXPLORER[chain];
              const label = meta?.name ?? chain.replace(/-/g, ' ');
              const inner = (
                <>
                  <span className="text-text-tertiary text-xs capitalize">{label}</span>
                  <span className="text-text-secondary font-mono text-xs">{truncate(addr)}</span>
                </>
              );
              return meta ? (
                <a
                  key={chain}
                  href={meta.url(addr)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-border flex items-center gap-2 rounded-lg border bg-(--color-bg-secondary) px-3 py-2 transition-colors hover:bg-(--color-surface)"
                >
                  {inner} <span className="text-text-tertiary">↗</span>
                </a>
              ) : (
                <div
                  key={chain}
                  className="border-border flex items-center gap-2 rounded-lg border bg-(--color-bg-secondary) px-3 py-2"
                >
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

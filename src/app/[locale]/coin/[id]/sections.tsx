/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Coin detail page sections — server components rendered from the full
 * CoinGecko payload (market data, exchange tickers, developer/community stats,
 * sentiment, categories, links). Pure render, no data fetching.
 */

import { Link } from '@/i18n/navigation';

/* ── shared field shapes (subset of the CoinGecko /coins/{id} response) ── */

export interface MarketData {
  current_price?: { usd?: number };
  market_cap?: { usd?: number };
  fully_diluted_valuation?: { usd?: number };
  total_volume?: { usd?: number };
  high_24h?: { usd?: number };
  low_24h?: { usd?: number };
  market_cap_rank?: number;
  total_value_locked?: { usd?: number } | null;
  price_change_percentage_1h_in_currency?: { usd?: number };
  price_change_percentage_24h_in_currency?: { usd?: number };
  price_change_percentage_7d_in_currency?: { usd?: number };
  price_change_percentage_14d_in_currency?: { usd?: number };
  price_change_percentage_30d_in_currency?: { usd?: number };
  price_change_percentage_1y_in_currency?: { usd?: number };
  price_change_percentage_24h?: number;
  price_change_percentage_7d?: number;
  price_change_percentage_30d?: number;
  circulating_supply?: number;
  total_supply?: number;
  max_supply?: number;
  ath?: { usd?: number };
  ath_change_percentage?: { usd?: number };
  ath_date?: { usd?: string };
  atl?: { usd?: number };
  atl_change_percentage?: { usd?: number };
  atl_date?: { usd?: string };
}

export interface Ticker {
  base?: string;
  target?: string;
  market?: { name?: string; identifier?: string };
  last?: number;
  volume?: number;
  converted_last?: { usd?: number };
  converted_volume?: { usd?: number };
  trust_score?: string | null;
  trade_url?: string | null;
}

export interface DeveloperData {
  forks?: number;
  stars?: number;
  subscribers?: number;
  total_issues?: number;
  closed_issues?: number;
  pull_requests_merged?: number;
  pull_request_contributors?: number;
  commit_count_4_weeks?: number;
}

export interface CommunityData {
  twitter_followers?: number;
  reddit_subscribers?: number;
  reddit_average_posts_48h?: number;
  reddit_accounts_active_48h?: number;
  telegram_channel_user_count?: number | null;
}

export interface CoinLinks {
  homepage?: string[];
  whitepaper?: string;
  blockchain_site?: string[];
  official_forum_url?: string[];
  chat_url?: string[];
  announcement_url?: string[];
  repos_url?: { github?: string[]; bitbucket?: string[] };
  twitter_screen_name?: string;
  subreddit_url?: string;
  telegram_channel_identifier?: string;
}

/* ── formatters (self-contained so this file is standalone) ── */

function fmtUsd(n?: number | null): string {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtPrice(n?: number | null): string {
  if (n == null) return '—';
  if (n >= 1)
    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${n.toPrecision(4)}`;
}

function fmtCount(n?: number | null): string {
  if (n == null) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

function fmtPct(n?: number | null): { text: string; positive: boolean } | null {
  if (n == null) return null;
  const positive = n >= 0;
  return { text: `${positive ? '+' : ''}${n.toFixed(2)}%`, positive };
}

function fmtDate(s?: string): string | undefined {
  if (!s) return undefined;
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ── shared UI atoms ── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-text-primary mb-4 font-serif text-xl font-bold">{children}</h2>;
}

function Pct({ value }: { value?: number | null }) {
  const p = fmtPct(value);
  if (!p) return <span className="text-text-tertiary">—</span>;
  return (
    <span className={p.positive ? 'text-green-500' : 'text-red-500'}>{p.text}</span>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-border rounded-lg border bg-(--color-bg-secondary) p-4">
      <p className="text-text-tertiary mb-1 text-xs">{label}</p>
      <p className="text-text-primary text-base font-semibold">{children}</p>
    </div>
  );
}

/* ── Price performance across time windows ── */

export function PricePerformance({ md }: { md?: MarketData }) {
  if (!md) return null;
  const windows: Array<[string, number | undefined]> = [
    ['1h', md.price_change_percentage_1h_in_currency?.usd],
    ['24h', md.price_change_percentage_24h_in_currency?.usd ?? md.price_change_percentage_24h],
    ['7d', md.price_change_percentage_7d_in_currency?.usd ?? md.price_change_percentage_7d],
    ['14d', md.price_change_percentage_14d_in_currency?.usd],
    ['30d', md.price_change_percentage_30d_in_currency?.usd ?? md.price_change_percentage_30d],
    ['1y', md.price_change_percentage_1y_in_currency?.usd],
  ];
  if (windows.every(([, v]) => v == null)) return null;
  return (
    <div className="mb-10">
      <SectionTitle>Price Performance</SectionTitle>
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {windows.map(([label, v]) => (
          <div
            key={label}
            className="border-border rounded-lg border bg-(--color-bg-secondary) p-4 text-center"
          >
            <p className="text-text-tertiary mb-1 text-xs">{label}</p>
            <p className="text-base font-semibold">
              <Pct value={v} />
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Extended market stats (beyond the basic grid) ── */

export function ExtendedStats({ md }: { md?: MarketData }) {
  if (!md) return null;
  const volMcap =
    md.total_volume?.usd && md.market_cap?.usd && md.market_cap.usd > 0
      ? md.total_volume.usd / md.market_cap.usd
      : null;
  const supplyPct =
    md.circulating_supply && md.max_supply && md.max_supply > 0
      ? (md.circulating_supply / md.max_supply) * 100
      : null;
  return (
    <div className="mb-10">
      <SectionTitle>Market Data</SectionTitle>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {md.market_cap_rank != null && <Cell label="Market Cap Rank">#{md.market_cap_rank}</Cell>}
        <Cell label="Fully Diluted Val.">{fmtUsd(md.fully_diluted_valuation?.usd)}</Cell>
        {volMcap != null && <Cell label="Volume / Market Cap">{volMcap.toFixed(4)}</Cell>}
        {md.total_value_locked?.usd != null && (
          <Cell label="Total Value Locked">{fmtUsd(md.total_value_locked.usd)}</Cell>
        )}
        <Cell label="Max Supply">{md.max_supply ? fmtCount(md.max_supply) : '∞'}</Cell>
        {supplyPct != null && (
          <Cell label="Circulating / Max">
            {supplyPct.toFixed(1)}%
            <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-(--color-surface)">
              <span
                className="block h-full rounded-full bg-blue-500"
                style={{ width: `${Math.min(100, supplyPct)}%` }}
              />
            </span>
          </Cell>
        )}
        <Cell label="From ATH">
          <Pct value={md.ath_change_percentage?.usd} />
          {md.ath?.usd != null && (
            <span className="text-text-tertiary mt-0.5 block text-xs font-normal">
              ATH {fmtPrice(md.ath.usd)} · {fmtDate(md.ath_date?.usd)}
            </span>
          )}
        </Cell>
        <Cell label="From ATL">
          <Pct value={md.atl_change_percentage?.usd} />
          {md.atl?.usd != null && (
            <span className="text-text-tertiary mt-0.5 block text-xs font-normal">
              ATL {fmtPrice(md.atl.usd)} · {fmtDate(md.atl_date?.usd)}
            </span>
          )}
        </Cell>
      </div>
    </div>
  );
}

/* ── Community sentiment votes (CoinGecko up/down %) ── */

export function SentimentBar({ up, down }: { up?: number; down?: number }) {
  if (up == null && down == null) return null;
  const u = up ?? 0;
  const d = down ?? 100 - u;
  return (
    <div className="mb-10">
      <SectionTitle>Community Sentiment</SectionTitle>
      <div className="border-border rounded-lg border bg-(--color-bg-secondary) p-4">
        <div className="mb-2 flex justify-between text-sm font-medium">
          <span className="text-green-500">▲ {u.toFixed(0)}% Bullish</span>
          <span className="text-red-500">{d.toFixed(0)}% Bearish ▼</span>
        </div>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-(--color-surface)">
          <span className="block h-full bg-green-500" style={{ width: `${u}%` }} />
          <span className="block h-full bg-red-500" style={{ width: `${d}%` }} />
        </div>
      </div>
    </div>
  );
}

/* ── Top exchange markets (tickers) ── */

export function ExchangeTickers({ tickers, coinName }: { tickers?: Ticker[]; coinName: string }) {
  if (!tickers || tickers.length === 0) return null;
  const top = [...tickers]
    .filter((t) => (t.converted_volume?.usd ?? 0) > 0)
    .sort((a, b) => (b.converted_volume?.usd ?? 0) - (a.converted_volume?.usd ?? 0))
    .slice(0, 10);
  if (top.length === 0) return null;
  return (
    <div className="mb-10">
      <SectionTitle>Top {coinName} Markets</SectionTitle>
      <div className="border-border overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border text-text-tertiary border-b text-left text-xs">
              <th className="px-4 py-2.5 font-medium">Exchange</th>
              <th className="px-4 py-2.5 font-medium">Pair</th>
              <th className="px-4 py-2.5 text-right font-medium">Price</th>
              <th className="px-4 py-2.5 text-right font-medium">Volume (24h)</th>
              <th className="px-4 py-2.5 text-center font-medium">Trust</th>
            </tr>
          </thead>
          <tbody>
            {top.map((t, i) => {
              const trust =
                t.trust_score === 'green'
                  ? 'bg-green-500'
                  : t.trust_score === 'yellow'
                    ? 'bg-yellow-500'
                    : t.trust_score === 'red'
                      ? 'bg-red-500'
                      : 'bg-gray-400';
              const row = (
                <>
                  <td className="text-text-primary px-4 py-2.5 font-medium">{t.market?.name ?? '—'}</td>
                  <td className="text-text-secondary px-4 py-2.5">
                    {t.base}/{t.target}
                  </td>
                  <td className="text-text-primary px-4 py-2.5 text-right">
                    {fmtPrice(t.converted_last?.usd)}
                  </td>
                  <td className="text-text-secondary px-4 py-2.5 text-right">
                    {fmtUsd(t.converted_volume?.usd)}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-block h-2 w-2 rounded-full ${trust}`} />
                  </td>
                </>
              );
              return (
                <tr
                  key={`${t.market?.identifier}-${t.base}-${t.target}-${i}`}
                  className="border-border/50 hover:bg-(--color-bg-secondary) border-b last:border-0"
                >
                  {row}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Developer / GitHub activity ── */

export function DeveloperStats({ dev }: { dev?: DeveloperData }) {
  if (!dev) return null;
  const items = ([
    ['GitHub Stars', dev.stars],
    ['Forks', dev.forks],
    ['Watchers', dev.subscribers],
    ['Contributors', dev.pull_request_contributors],
    ['Merged PRs', dev.pull_requests_merged],
    ['Commits (4w)', dev.commit_count_4_weeks],
    ['Total Issues', dev.total_issues],
    ['Closed Issues', dev.closed_issues],
  ] as Array<[string, number | undefined]>).filter(
    ([, v]) => v != null && v > 0,
  ) as Array<[string, number]>;
  if (items.length === 0) return null;
  return (
    <div className="mb-10">
      <SectionTitle>Developer Activity</SectionTitle>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map(([label, v]) => (
          <Cell key={label} label={label}>
            {fmtCount(v)}
          </Cell>
        ))}
      </div>
    </div>
  );
}

/* ── Community stats (socials) ── */

export function CommunityStats({ community }: { community?: CommunityData }) {
  if (!community) return null;
  const items = ([
    ['Twitter Followers', community.twitter_followers],
    ['Reddit Subscribers', community.reddit_subscribers],
    ['Reddit Active (48h)', community.reddit_accounts_active_48h],
    ['Telegram Members', community.telegram_channel_user_count],
  ] as Array<[string, number | null | undefined]>).filter(
    ([, v]) => v != null && v > 0,
  ) as Array<[string, number]>;
  if (items.length === 0) return null;
  return (
    <div className="mb-10">
      <SectionTitle>Community</SectionTitle>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map(([label, v]) => (
          <Cell key={label} label={label}>
            {fmtCount(v)}
          </Cell>
        ))}
      </div>
    </div>
  );
}

/* ── Category chips ── */

export function Categories({ categories }: { categories?: string[] }) {
  const cats = (categories ?? []).filter(Boolean).slice(0, 12);
  if (cats.length === 0) return null;
  return (
    <div className="mb-10">
      <SectionTitle>Categories</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {cats.map((c) => (
          <span
            key={c}
            className="border-border text-text-secondary rounded-full border bg-(--color-bg-secondary) px-3 py-1 text-sm"
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Rich links (explorers, repos, whitepaper, forums, socials) ── */

function LinkPill({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="border-border text-text-secondary inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors hover:bg-(--color-bg-secondary)"
    >
      {label} ↗
    </a>
  );
}

export function RichLinks({ links, coinName }: { links?: CoinLinks; coinName: string }) {
  if (!links) return null;
  const github = (links.repos_url?.github ?? []).filter(Boolean);
  const explorers = (links.blockchain_site ?? []).filter(Boolean).slice(0, 3);
  const forums = (links.official_forum_url ?? []).filter(Boolean).slice(0, 2);
  const chats = (links.chat_url ?? []).filter(Boolean).slice(0, 2);
  const hostLabel = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return 'Link';
    }
  };
  return (
    <div className="mb-8">
      <SectionTitle>{coinName} Links</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {links.homepage?.[0] && <LinkPill href={links.homepage[0]} label="Website" />}
        {links.whitepaper && <LinkPill href={links.whitepaper} label="Whitepaper" />}
        {links.twitter_screen_name && (
          <LinkPill href={`https://twitter.com/${links.twitter_screen_name}`} label="Twitter" />
        )}
        {links.subreddit_url && <LinkPill href={links.subreddit_url} label="Reddit" />}
        {links.telegram_channel_identifier && (
          <LinkPill href={`https://t.me/${links.telegram_channel_identifier}`} label="Telegram" />
        )}
        {github.slice(0, 2).map((url) => (
          <LinkPill key={url} href={url} label="GitHub" />
        ))}
        {explorers.map((url) => (
          <LinkPill key={url} href={url} label={hostLabel(url)} />
        ))}
        {forums.map((url) => (
          <LinkPill key={url} href={url} label="Forum" />
        ))}
        {chats.map((url) => (
          <LinkPill key={url} href={url} label="Chat" />
        ))}
      </div>
    </div>
  );
}

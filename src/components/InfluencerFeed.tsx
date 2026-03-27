/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Twitter, Youtube, User, ExternalLink, RefreshCw } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface InfluencerEntry {
  id: string;
  name: string;
  username: string;
  platform: 'twitter' | 'youtube' | 'discord' | 'telegram';
  avatar?: string;
  followers: number;
  reliabilityScore: number;
  recentPost?: string;
  postUrl?: string;
  lastActive?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function PlatformBadge({ platform }: { platform: string }) {
  const config: Record<string, { icon: React.ReactNode; bg: string; label: string }> = {
    twitter: {
      icon: <Twitter className="h-3 w-3" />,
      bg: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
      label: 'X / Twitter',
    },
    youtube: {
      icon: <Youtube className="h-3 w-3" />,
      bg: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
      label: 'YouTube',
    },
    discord: {
      icon: <User className="h-3 w-3" />,
      bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
      label: 'Discord',
    },
    telegram: {
      icon: <User className="h-3 w-3" />,
      bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      label: 'Telegram',
    },
  };

  const c = config[platform] ?? config.twitter;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
        c.bg,
      )}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

function ReliabilityDot({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <span
      className={cn('inline-block h-2 w-2 rounded-full', color)}
      title={`Reliability: ${score}/100`}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

function generateMockInfluencers(): InfluencerEntry[] {
  return [
    {
      id: '1',
      name: 'Crypto Whale',
      username: '@CryptoWhale',
      platform: 'twitter',
      followers: 1_250_000,
      reliabilityScore: 78,
      recentPost:
        'BTC breakout incoming — watch the $72K resistance level. Accumulation zone looking strong.',
      lastActive: '2h ago',
    },
    {
      id: '2',
      name: 'DeFi Dad',
      username: '@DeFiDad',
      platform: 'youtube',
      followers: 890_000,
      reliabilityScore: 82,
      recentPost:
        'New video: Top 5 yield farming strategies for March 2026. SOL ecosystem has the best risk-adjusted APYs right now.',
      lastActive: '4h ago',
    },
    {
      id: '3',
      name: 'The Moon Carl',
      username: '@TheMoonCarl',
      platform: 'youtube',
      followers: 1_100_000,
      reliabilityScore: 55,
      recentPost: 'ETH to $10K this cycle? Technical analysis says yes. Key support at $3,800.',
      lastActive: '1h ago',
    },
    {
      id: '4',
      name: 'Altcoin Sherpa',
      username: '@AltcoinSherpa',
      platform: 'twitter',
      followers: 750_000,
      reliabilityScore: 85,
      recentPost:
        'Layer 2 tokens looking very promising here. ARB and OP approaching key breakout levels.',
      lastActive: '3h ago',
    },
    {
      id: '5',
      name: 'Lark Davis',
      username: '@TheCryptoLark',
      platform: 'twitter',
      followers: 980_000,
      reliabilityScore: 71,
      recentPost: 'AI + crypto narrative is heating up. Keep an eye on FET, RNDR, and TAO.',
      lastActive: '5h ago',
    },
    {
      id: '6',
      name: 'Coin Bureau',
      username: '@CoinBureau',
      platform: 'youtube',
      followers: 2_400_000,
      reliabilityScore: 88,
      recentPost:
        'Institutional adoption is accelerating. BlackRock spot ETH ETF inflows hit new records this week.',
      lastActive: '6h ago',
    },
    {
      id: '7',
      name: 'Crypto Banter',
      username: '@CryptoBanter',
      platform: 'youtube',
      followers: 1_050_000,
      reliabilityScore: 62,
      recentPost: 'Meme coins are back! DOGE and SHIB seeing massive volume spikes.',
      lastActive: '30m ago',
    },
    {
      id: '8',
      name: 'On-Chain Wizard',
      username: '@OnChainWizard',
      platform: 'twitter',
      followers: 420_000,
      reliabilityScore: 91,
      recentPost:
        'Smart money is quietly accumulating LINK. On-chain data shows whale wallets up 15% this week.',
      lastActive: '1h ago',
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  InfluencerFeed Component                                           */
/* ------------------------------------------------------------------ */

export default function InfluencerFeed({ className }: { className?: string }) {
  const [influencers, setInfluencers] = useState<InfluencerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/influencers?sortBy=reliability&limit=20');
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();

        if (json.success && json.data?.influencers?.length > 0) {
          const mapped: InfluencerEntry[] = json.data.influencers
            .slice(0, 10)
            .map((inf: Record<string, unknown>) => ({
              id: inf.id || String(Math.random()),
              name: inf.displayName || inf.username || 'Unknown',
              username: `@${inf.username || 'unknown'}`,
              platform: inf.platform || 'twitter',
              followers: (inf.followers as number) || 0,
              reliabilityScore: (inf.reliabilityScore as number) || 50,
              recentPost: null,
              lastActive: inf.lastActive ? String(inf.lastActive) : undefined,
            }));

          if (!cancelled && mapped.length > 0) {
            setInfluencers(mapped);
            setLoading(false);
            return;
          }
        }

        // Fallback to mock
        if (!cancelled) setInfluencers(generateMockInfluencers());
      } catch {
        if (!cancelled) setInfluencers(generateMockInfluencers());
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card className={cn('overflow-hidden p-0', className)}>
      <div className="divide-border divide-y">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-4">
                <div className="bg-border h-10 w-10 animate-pulse rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="bg-border h-4 w-32 animate-pulse rounded" />
                  <div className="bg-border h-3 w-full animate-pulse rounded" />
                  <div className="bg-border h-3 w-2/3 animate-pulse rounded" />
                </div>
              </div>
            ))
          : influencers.map((inf) => (
              <div
                key={inf.id}
                className="flex items-start gap-3 p-4 transition-colors hover:bg-(--color-surface-hover,var(--color-border))/20"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="bg-accent/10 text-accent flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold">
                    {inf.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -right-0.5 -bottom-0.5">
                    <ReliabilityDot score={inf.reliabilityScore} />
                  </div>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-text-primary truncate text-sm font-semibold">
                      {inf.name}
                    </span>
                    <span className="text-text-tertiary text-xs">{inf.username}</span>
                    <PlatformBadge platform={inf.platform} />
                  </div>

                  {inf.recentPost && (
                    <p className="text-text-secondary mt-1 line-clamp-2 text-sm leading-relaxed">
                      {inf.recentPost}
                    </p>
                  )}

                  <div className="text-text-tertiary mt-1.5 flex items-center gap-3 text-[10px]">
                    <span>{formatFollowers(inf.followers)} followers</span>
                    <span>Reliability: {inf.reliabilityScore}/100</span>
                    {inf.lastActive && <span>{inf.lastActive}</span>}
                    {inf.postUrl && (
                      <a
                        href={inf.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-accent inline-flex items-center gap-0.5"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        View
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
      </div>

      {!loading && influencers.length === 0 && (
        <div className="text-text-secondary p-12 text-center">
          <RefreshCw className="mx-auto mb-2 h-6 w-6 opacity-40" />
          No influencer data available.
        </div>
      )}
    </Card>
  );
}

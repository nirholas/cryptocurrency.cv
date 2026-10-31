import { describe, expect, it } from 'vitest';

import type { NewsArticle } from '@/lib/crypto-news';

import { keywordNarratives, MAX_KEYWORD_NARRATIVES } from './keyword-narratives';

const BASE = Date.parse('2026-10-30T00:00:00Z');

function article(title: string, hoursAfterBase: number, extra: Partial<NewsArticle> = {}): NewsArticle {
  return {
    title,
    link: `https://example.com/${encodeURIComponent(title)}`,
    source: 'Example',
    pubDate: new Date(BASE + hoursAfterBase * 3_600_000).toISOString(),
    timeAgo: '',
    ...extra,
  } as NewsArticle;
}

describe('keywordNarratives', () => {
  it('returns nothing for an empty batch', () => {
    expect(keywordNarratives([])).toEqual([]);
  });

  it('groups headlines by shared theme, strongest first', () => {
    const articles = [
      article('Spot ETF inflows surge as BlackRock fund hits record', 1),
      article('Grayscale ETF sees inflows rally for Bitcoin', 2),
      article('Fidelity ETF adds BTC as inflows soar', 3),
      article('New regulation bill advances in Senate', 4),
      article('Regulatory clarity bill passes committee', 5),
      article('Weather is mild today', 6),
    ];

    const narratives = keywordNarratives(articles);
    const etf = narratives.find((n) => n.id === 'etf');

    expect(narratives[0].id).toBe('etf');
    expect(etf).toMatchObject({ strength: 50, sentiment: 'bullish' });
    expect(etf?.articles).toHaveLength(3);
    expect(etf?.articles[0]).toEqual({
      title: articles[0].title,
      link: articles[0].link,
      source: 'Example',
    });
    expect(etf?.relatedTickers).toContain('BTC');
    expect(etf?.keyPhrases[0]).toBe('etf');
    expect(etf?.description).toMatch(/^3 of 6 recent headlines\./);
    expect(narratives.some((n) => n.id === 'regulation')).toBe(true);
  });

  it('drops a theme mentioned only once', () => {
    const narratives = keywordNarratives([
      article('New regulation bill advances', 1),
      article('Exchange hack drains hot wallet', 2),
      article('Another regulation hearing is scheduled', 3),
    ]);

    expect(narratives.map((n) => n.id)).toContain('regulation');
    expect(narratives.map((n) => n.id)).not.toContain('hack');
  });

  it('lists a story told under two tags only once', () => {
    const narratives = keywordNarratives([
      article('Protocol exploit: hackers drain $10M from lending pool', 1),
      article('Bridge hack: attacker uses exploit to drain funds', 2),
      article('Exploit hits DEX in hack, funds drained', 3),
    ]);

    const ids = narratives.map((n) => n.id);
    expect(ids.filter((id) => id === 'hack' || id === 'exploit')).toHaveLength(1);
    expect(narratives[0].sentiment).toBe('bearish');
  });

  it('marks a theme concentrated in the newer half as emerging', () => {
    const narratives = keywordNarratives([
      article('Old regulation news one', 1),
      article('Old regulation news two', 2),
      article('Quiet market day', 3),
      article('Quiet trading session', 4),
      article('Fresh exploit hits protocol', 10),
      article('Another exploit drains vault', 11),
    ]);

    expect(narratives.find((n) => n.id === 'regulation')?.emerging).toBe(false);
    expect(narratives.find((n) => n.id === 'exploit' || n.id === 'hack')?.emerging).toBe(true);
  });

  it('never calls a theme emerging when the dates are estimated', () => {
    const narratives = keywordNarratives([
      article('Old regulation news', 1, { dateEstimated: true }),
      article('New regulation news', 10, { dateEstimated: true }),
    ]);

    expect(narratives[0]?.emerging).toBe(false);
  });

  it('caps the number of narratives', () => {
    const themes = ['regulation', 'exploit', 'etf', 'airdrop', 'staking', 'mining', 'nft', 'dao', 'layer 2', 'stablecoin'];
    const articles = themes.flatMap((theme, i) => [
      article(`${theme} story one`, i),
      article(`${theme} story two`, i + 0.5),
    ]);

    expect(keywordNarratives(articles).length).toBeLessThanOrEqual(MAX_KEYWORD_NARRATIVES);
  });
});

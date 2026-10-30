import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { staleCache } from '@/lib/cache';

import {
  activityFromChart,
  categorizeL2Type,
  getL2Activity,
  getL2RiskAssessment,
  getL2Summary,
  mapDefiLlamaChains,
  mapL2BeatSummary,
  riskAssessmentFromSummary,
  riskLevelFromRisks,
  totalTvsChange24h,
  type L2BeatSummaryResponse,
} from './l2beat';

const HOUR = 3600;
const T0 = 1_793_318_400; // 2026-10-30T00:00:00Z

const good = (name: string) => ({ name, value: '', sentiment: 'good' });
const bad = (name: string) => ({ name, value: '', sentiment: 'bad' });

// Shape of GET https://l2beat.com/api/scaling/summary (trimmed)
const summary: L2BeatSummaryResponse = {
  chart: {
    types: ['timestamp', 'native', 'canonical', 'external', 'ethPrice'],
    data: [
      [T0 - 26 * HOUR, 10, 70, 20, 3000],
      [T0 - 24 * HOUR, 10, 80, 10, 3000],
      [T0 - 18 * HOUR, 10, 90, 10, 3000],
      [T0 - 4 * HOUR, 10, 95, 10, 3000],
      [T0, 15, 95, 10, 3000],
    ],
  },
  projects: {
    arbitrum: {
      id: 'arbitrum',
      name: 'Arbitrum One',
      slug: 'arbitrum',
      category: 'Optimistic Rollup',
      stage: 'Stage 1',
      purposes: ['Universal'],
      risks: [good('Sequencer Failure'), good('State Validation'), bad('Exit Window')],
      tvs: { breakdown: { total: 9_000, native: 1_000, canonical: 7_000, external: 1_000 }, change7d: -0.0465 },
    },
    base: {
      id: 'base',
      name: 'Base Chain',
      slug: 'base',
      category: 'Optimistic Rollup',
      stage: 'Stage 1',
      purposes: ['Universal'],
      risks: [good('Sequencer Failure'), good('State Validation')],
      tvs: { breakdown: { total: 14_000, native: 2_000, canonical: 10_000, external: 2_000 }, change7d: 0.02 },
    },
    'op-mainnet-id': {
      id: 'optimism',
      name: 'OP Mainnet',
      slug: 'op-mainnet',
      category: 'Optimium',
      stage: 'Stage 1',
      risks: [
        {
          name: 'State Validation',
          value: 'Fraud proofs (INT)',
          sentiment: 'good',
          description: 'Fraud proofs allow actors watching the chain to prove that the state is incorrect.',
        },
        { name: 'Data Availability', value: 'Onchain', sentiment: 'warning' },
        { name: 'Exit Window', value: 'None', sentiment: 'bad', description: 'Upgrades have no delay.' },
        { name: 'Proposer Failure', value: 'Self propose', sentiment: 'UnderReview' },
      ],
      tvs: { breakdown: { total: 1_000 }, change7d: 0 },
    },
    hyperliquid: {
      id: 'hyperliquid',
      name: 'Hyperliquid',
      slug: 'hyperliquid',
      category: 'Other',
      stage: 'Not applicable',
      purposes: ['Exchange'],
      risks: [bad('a'), bad('b'), bad('c'), bad('d'), bad('e')],
      tvs: { breakdown: { total: 6_000 }, change7d: -0.034 },
    },
    oldchain: {
      id: 'oldchain',
      name: 'Old Chain',
      slug: 'oldchain',
      category: 'ZK Rollup',
      isArchived: true,
      tvs: { breakdown: { total: 50_000 }, change7d: 0 },
    },
  },
};

// Shape of GET https://l2beat.com/api/scaling/activity[/<slug>]
const activity = (counts: number[]) => ({
  success: true,
  data: {
    chart: {
      types: ['timestamp', 'count', 'uopsCount'],
      data: counts.map((c, i) => [T0 - (counts.length - 1 - i) * 86_400, c, c + 100]),
    },
  },
});

function respond(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
}

describe('mapL2BeatSummary', () => {
  it('reads TVS, converts change7d from a fraction to percent, drops archived projects and sorts by TVS', () => {
    const projects = mapL2BeatSummary(summary);

    expect(projects.map(p => p.id)).toEqual(['base', 'arbitrum', 'hyperliquid', 'optimism']);
    const arb = projects[1];
    expect(arb.tvl).toBe(9_000);
    expect(arb.canonicalTvl).toBe(7_000);
    expect(arb.externalTvl).toBe(1_000);
    expect(arb.nativeTvl).toBe(1_000);
    expect(arb.tvlChange7d).toBeCloseTo(-4.65);
    expect(arb.stage).toBe('Stage 1');
    expect(arb.tvlChange24h).toBeUndefined();
    expect(projects[2].category).toBe('Other');
    expect(projects.map(p => p.type)).toEqual(['rollup', 'rollup', 'other', 'optimium']);
  });
});

describe('mapDefiLlamaChains', () => {
  it("keeps L2Beat's id, category and stage for chains under DefiLlama's current names", () => {
    const projects = mapDefiLlamaChains(
      [
        { name: 'Ethereum', tvl: 50_000 },
        { name: 'Optimism', tvl: 0 },
        { name: 'OP Mainnet', tvl: 400 },
        { name: 'ZKsync Era', tvl: 10 },
        { name: 'Blast', tvl: 3 },
        { name: 'Base', tvl: 5_000 },
      ],
      new Date(T0 * 1000),
    );

    expect(projects.map((p) => p.id)).toEqual(['base', 'op-mainnet', 'zksync-era', 'blast']);
    expect(projects[0]).toMatchObject({ slug: 'base', stage: 'Stage 1', type: 'rollup', tvl: 5_000 });
    expect(projects[2]).toMatchObject({ category: 'ZK Rollup', type: 'rollup' });
    expect(projects[3]).toMatchObject({ category: 'Other', type: 'other', riskLevel: 'high' });
  });
});

describe('categorizeL2Type', () => {
  it('maps each L2Beat category to its own type instead of defaulting to rollup', () => {
    expect(categorizeL2Type('ZK Rollup')).toBe('rollup');
    expect(categorizeL2Type('Optimistic Rollup')).toBe('rollup');
    expect(categorizeL2Type('Validium')).toBe('validium');
    expect(categorizeL2Type('Optimium')).toBe('optimium');
    expect(categorizeL2Type('Plasma')).toBe('plasma');
    expect(categorizeL2Type('Other')).toBe('other');
  });
});

describe('riskAssessmentFromSummary', () => {
  it('reads the risk rosette L2Beat reports, matched by id or slug', () => {
    const bySlug = riskAssessmentFromSummary(summary, 'OP-Mainnet');

    expect(riskAssessmentFromSummary(summary, 'optimism')).toEqual(bySlug);
    expect(bySlug).toEqual({
      projectId: 'optimism',
      projectName: 'OP Mainnet',
      stage: 'Stage 1',
      stateValidation: {
        value: 'Fraud proofs (INT)',
        sentiment: 'good',
        description: 'Fraud proofs allow actors watching the chain to prove that the state is incorrect.',
      },
      dataAvailability: { value: 'Onchain', sentiment: 'warning', description: '' },
      exitWindow: { value: 'None', sentiment: 'bad', description: 'Upgrades have no delay.' },
      sequencerFailure: null,
      proposerFailure: { value: 'Self propose', sentiment: 'neutral', description: '' },
      // (warning 1 + bad 2) of a possible 4 factors x 2
      overallRiskScore: 38,
    });
  });

  it('covers projects outside any hardcoded list and returns null for unknown ones', () => {
    expect(riskAssessmentFromSummary(summary, 'hyperliquid')?.overallRiskScore).toBe(100);
    expect(riskAssessmentFromSummary(summary, 'not-a-chain')).toBeNull();
  });
});

describe('riskLevelFromRisks', () => {
  it('weights bad risks twice as heavily as warnings', () => {
    expect(riskLevelFromRisks([good('a'), good('b')])).toBe('low');
    expect(riskLevelFromRisks([good('a'), bad('b')])).toBe('medium');
    expect(riskLevelFromRisks([bad('a'), bad('b'), bad('c')])).toBe('high');
    expect(riskLevelFromRisks(undefined)).toBe('medium');
  });
});

describe('totalTvsChange24h', () => {
  it('compares the latest point with the newest point at least 24h older', () => {
    // latest = 15 + 95 + 10 = 120; 24h earlier = 10 + 80 + 10 = 100
    expect(totalTvsChange24h(summary.chart)).toBeCloseTo(20);
  });

  it('returns null without a point 24h back', () => {
    expect(totalTvsChange24h({ types: summary.chart!.types, data: summary.chart!.data.slice(-2) })).toBeNull();
    expect(totalTvsChange24h(undefined)).toBeNull();
  });
});

describe('activityFromChart', () => {
  it('derives daily, weekly, change and TPS figures from the last day', () => {
    const counts = [100, 200, 300, 400, 500, 600, 700, 864_000, 432_000];
    const result = activityFromChart({ id: 'base', name: 'Base Chain' }, activity(counts));

    expect(result).toMatchObject({
      projectId: 'base',
      dailyTransactions: 432_000,
      dailyTransactionsChange: -50,
      weeklyTransactions: 300 + 400 + 500 + 600 + 700 + 864_000 + 432_000,
      averageTps: 5,
      peakTps: 10,
      userOperations: 432_100,
      timestamp: new Date(T0 * 1000).toISOString(),
    });
  });

  it('returns null for projects L2Beat does not track', () => {
    expect(activityFromChart({ id: 'x', name: 'X' }, { success: false })).toBeNull();
    expect(activityFromChart({ id: 'x', name: 'X' }, null)).toBeNull();
  });
});

describe('L2Beat fetchers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockImplementation(async input => {
      const url = String(input instanceof Request ? input.url : input);
      if (url.endsWith('/scaling/summary')) return respond(summary);
      if (url.endsWith('/scaling/activity')) return respond(activity([8_640_000, 17_280_000]));
      if (url.endsWith('/scaling/activity/base')) return respond(activity([864_000]));
      if (url.endsWith('/scaling/activity/arbitrum')) return respond(activity([1_728_000]));
      return respond({ success: false, error: 'Project not found.' });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getL2Summary reports real TVS totals, ecosystem activity and risk distribution', async () => {
    const result = await getL2Summary();

    expect(result.totalTvl).toBe(30_000);
    expect(result.totalProjects).toBe(4);
    expect(result.topProjects.map(p => p.id)).toEqual(['base', 'arbitrum', 'hyperliquid', 'optimism']);
    expect(result.dominance['Base Chain']).toBeCloseTo((14_000 / 30_000) * 100);
    expect(result.totalTvlChange24h).toBeCloseTo(20);
    expect(result.activityMetrics).toEqual({ totalDailyTx: 17_280_000, totalTps: 200 });
    expect(result.riskDistribution).toEqual({ low: 1, medium: 2, high: 1 });
  });

  it('getL2RiskAssessment reads live L2Beat risks and fails loudly when L2Beat is down', async () => {
    expect((await getL2RiskAssessment('arbitrum'))?.exitWindow?.sentiment).toBe('bad');

    vi.mocked(globalThis.fetch).mockResolvedValue(new Response('down', { status: 503 }));
    staleCache.clear();
    await expect(getL2RiskAssessment('arbitrum')).rejects.toThrow('L2Beat summary unavailable');
  });

  it('getL2Activity returns tracked projects only, busiest first', async () => {
    const result = await getL2Activity();

    expect(result.map(a => [a.projectId, a.averageTps])).toEqual([
      ['arbitrum', 20],
      ['base', 10],
    ]);
  });
});

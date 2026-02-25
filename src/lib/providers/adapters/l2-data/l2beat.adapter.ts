/**
 * L2BEAT Adapter
 *
 * L2BEAT is the definitive L2 analytics source:
 * - TVL by rollup type (canonical, external, native)
 * - Risk analysis with stage classification
 * - Activity and throughput data
 *
 * @module providers/adapters/l2-data/l2beat
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { L2Stats } from './types';

const BASE = 'https://l2beat.com/api';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 30, windowMs: 60_000 };

export const l2beatAdapter: DataProvider<L2Stats[]> = {
  name: 'l2beat',
  description: 'L2BEAT — definitive L2 analytics with risk analysis',
  priority: 1,
  weight: 0.60,
  rateLimit: RATE_LIMIT,
  capabilities: ['l2-data'],

  async fetch(params: FetchParams): Promise<L2Stats[]> {
    const limit = params.limit ?? 30;

    const [tvlRes, activityRes] = await Promise.allSettled([
      fetch(`${BASE}/scaling/tvl`),
      fetch(`${BASE}/scaling/activity`),
    ]);

    const tvlData = tvlRes.status === 'fulfilled' && tvlRes.value.ok
      ? await tvlRes.value.json()
      : { projects: {} };

    const activityData = activityRes.status === 'fulfilled' && activityRes.value.ok
      ? await activityRes.value.json()
      : { projects: {} };

    const projects = tvlData.projects ?? {};
    const activity = activityData.projects ?? {};
    const now = new Date().toISOString();

    const entries = Object.entries(projects) as [string, L2BeatProject][];

    return entries
      .map(([slug, project]): L2Stats => {
        const tvlCharts = project.charts?.tvl ?? [];
        const latestTvl = tvlCharts.length > 0 ? tvlCharts[tvlCharts.length - 1] : null;
        const weekAgoTvl = tvlCharts.length > 7 ? tvlCharts[tvlCharts.length - 8] : latestTvl;

        const totalTvl = (latestTvl?.[1] ?? 0) + (latestTvl?.[2] ?? 0) + (latestTvl?.[3] ?? 0);
        const weekAgoTotal = (weekAgoTvl?.[1] ?? 0) + (weekAgoTvl?.[2] ?? 0) + (weekAgoTvl?.[3] ?? 0);
        const tvlChange7d = weekAgoTotal > 0 ? ((totalTvl - weekAgoTotal) / weekAgoTotal) * 100 : 0;

        const act = (activity as Record<string, L2BeatActivity>)[slug];
        const latestActivity = act?.data?.[act.data.length - 1];

        return {
          name: project.name ?? slug,
          slug,
          tvl: totalTvl,
          tvlChange7d,
          tps: latestActivity ? latestActivity[1] / 86400 : 0,
          type: project.type ?? 'unknown',
          stage: project.stage ?? 'N/A',
          dailyTxCount: latestActivity?.[1] ?? 0,
          dailyActiveAddresses: 0,
          dailyCost: 0,
          canonicalTvl: latestTvl?.[1] ?? 0,
          externalTvl: latestTvl?.[2] ?? 0,
          source: 'l2beat',
          timestamp: now,
        };
      })
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, limit);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/scaling/tvl`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: L2Stats[]): boolean {
    return Array.isArray(data) && data.length > 0;
  },
};

interface L2BeatProject {
  name?: string;
  type?: string;
  stage?: string;
  charts?: {
    tvl?: [number, number, number, number][]; // [timestamp, canonical, external, native]
  };
}

interface L2BeatActivity {
  data?: [number, number][]; // [timestamp, txCount]
}

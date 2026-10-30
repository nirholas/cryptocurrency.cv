/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * L2Beat Layer 2 Analytics API
 * 
 * Comprehensive data on Ethereum Layer 2 scaling solutions.
 * TVL, risk assessments, and activity metrics.
 * 
 * @see https://l2beat.com/
 * @module lib/apis/l2beat
 */

import { resilientFetch } from '@/lib/resilient-fetch';
import { staleCache } from '@/lib/cache';

const BASE_URL = 'https://l2beat.com/api';

// =============================================================================
// Types
// =============================================================================

export interface L2Project {
  id: string;
  name: string;
  slug: string;
  type: 'rollup' | 'validium' | 'optimium' | 'plasma' | 'state-channel';
  category: 'Optimistic Rollup' | 'ZK Rollup' | 'Validium' | 'Optimium' | 'Plasma' | 'Other';
  /** Total value secured (L2Beat's TVS: canonical + external + native), USD */
  tvl: number;
  /** Percent; L2Beat's summary only reports a 7-day change, so this is absent for L2Beat data */
  tvlChange24h?: number;
  /** Percent */
  tvlChange7d: number;
  /** Percent; not reported by L2Beat's summary */
  tvlChange30d?: number;
  canonicalTvl: number;
  externalTvl: number;
  nativeTvl: number;
  stage: 'Stage 0' | 'Stage 1' | 'Stage 2' | 'Not applicable';
  riskLevel: 'low' | 'medium' | 'high';
  purposes: string[];
  website: string;
  explorer: string;
  timestamp: string;
}

export interface L2RiskAssessment {
  projectId: string;
  projectName: string;
  stateValidation: {
    value: 'ZK proofs' | 'Fraud proofs' | 'None';
    sentiment: 'good' | 'warning' | 'bad';
    description: string;
  };
  dataAvailability: {
    value: 'On-chain' | 'DAC' | 'External';
    sentiment: 'good' | 'warning' | 'bad';
    description: string;
  };
  upgradeability: {
    value: string;
    sentiment: 'good' | 'warning' | 'bad';
    description: string;
  };
  sequencerFailure: {
    value: string;
    sentiment: 'good' | 'warning' | 'bad';
    description: string;
  };
  proposerFailure: {
    value: string;
    sentiment: 'good' | 'warning' | 'bad';
    description: string;
  };
  overallRiskScore: number; // 0-100, higher = riskier
}

export interface L2Activity {
  projectId: string;
  projectName: string;
  dailyTransactions: number;
  dailyTransactionsChange: number;
  weeklyTransactions: number;
  averageTps: number;
  peakTps: number;
  userOperations: number;
  timestamp: string;
}

export interface L2Summary {
  totalTvl: number;
  totalTvlChange24h: number;
  totalProjects: number;
  dominance: Record<string, number>;
  topProjects: L2Project[];
  activityMetrics: {
    totalDailyTx: number;
    totalTps: number;
  };
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  timestamp: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch data from L2Beat API
 */
async function l2beatFetch<T>(endpoint: string): Promise<T | null> {
  try {
    const { data, stale } = await resilientFetch<T>(`${BASE_URL}${endpoint}`, {
      service: 'l2beat',
      timeoutMs: 10_000,
      retries: 1,
      staleCache,
      staleCacheKey: `l2beat:${endpoint}`,
      next: { revalidate: 600 }, // Cache for 10 minutes
    });
    if (stale) console.warn(`L2Beat API: upstream failed, serving last known good payload for ${endpoint}`);
    return data;
  } catch (error) {
    console.error('L2Beat API request failed:', error);
    return null;
  }
}

interface L2BeatRisk {
  name: string;
  value: string;
  sentiment: 'good' | 'warning' | 'bad' | string;
}

interface L2BeatSummaryProject {
  id: string;
  name: string;
  slug: string;
  category: string;
  stage?: string;
  purposes?: string[];
  isArchived?: boolean;
  risks?: L2BeatRisk[];
  tvs?: {
    breakdown?: {
      total?: number;
      native?: number;
      canonical?: number;
      external?: number;
    };
    /** Fraction, e.g. -0.045 for -4.5% */
    change7d?: number;
  };
}

export interface L2BeatSummaryResponse {
  /** Columns: timestamp, native, canonical, external, ethPrice */
  chart?: { types: string[]; data: number[][] };
  projects: Record<string, L2BeatSummaryProject>;
}

const L2_STAGES: ReadonlyArray<L2Project['stage']> = ['Stage 0', 'Stage 1', 'Stage 2', 'Not applicable'];
const L2_CATEGORIES: ReadonlyArray<L2Project['category']> = [
  'Optimistic Rollup',
  'ZK Rollup',
  'Validium',
  'Optimium',
  'Plasma',
  'Other',
];

/** Weighted count of L2Beat's risk rosette: bad = 2, warning = 1. */
export function riskLevelFromRisks(risks: L2BeatRisk[] | undefined): L2Project['riskLevel'] {
  if (!risks?.length) return 'medium';
  const score = risks.reduce(
    (sum, r) => sum + (r.sentiment === 'bad' ? 2 : r.sentiment === 'warning' ? 1 : 0),
    0,
  );
  if (score <= 1) return 'low';
  if (score <= 5) return 'medium';
  return 'high';
}

export function mapL2BeatSummary(data: L2BeatSummaryResponse, now = new Date()): L2Project[] {
  const timestamp = now.toISOString();
  return Object.values(data.projects)
    .filter(project => !project.isArchived)
    .map(project => {
      const breakdown = project.tvs?.breakdown;
      const stage = L2_STAGES.find(s => s === project.stage) ?? 'Not applicable';
      const category = L2_CATEGORIES.find(c => c === project.category) ?? 'Other';
      return {
        id: project.id,
        name: project.name,
        slug: project.slug,
        type: categorizeL2Type(project.category),
        category,
        tvl: breakdown?.total ?? 0,
        tvlChange7d: (project.tvs?.change7d ?? 0) * 100,
        canonicalTvl: breakdown?.canonical ?? 0,
        externalTvl: breakdown?.external ?? 0,
        nativeTvl: breakdown?.native ?? 0,
        stage,
        riskLevel: riskLevelFromRisks(project.risks),
        purposes: project.purposes ?? [],
        website: '',
        explorer: '',
        timestamp,
      };
    })
    .sort((a, b) => b.tvl - a.tvl);
}

/**
 * Percent change of the aggregate TVS over the last 24h, from the summary chart.
 * Chart points are irregular (6h buckets plus a latest point), so compare the
 * latest point with the newest one at least 24h older.
 */
export function totalTvsChange24h(chart: L2BeatSummaryResponse['chart']): number | null {
  if (!chart?.data?.length) return null;
  const valueCols = ['native', 'canonical', 'external']
    .map(name => chart.types.indexOf(name))
    .filter(i => i > 0);
  if (!valueCols.length) return null;
  const total = (row: number[]) => valueCols.reduce((sum, i) => sum + (row[i] ?? 0), 0);

  const latest = chart.data[chart.data.length - 1];
  const cutoff = latest[0] - 86_400;
  let previous: number[] | undefined;
  for (let i = chart.data.length - 2; i >= 0; i--) {
    if (chart.data[i][0] <= cutoff) {
      previous = chart.data[i];
      break;
    }
  }
  if (!previous) return null;
  const prev = total(previous);
  return prev > 0 ? ((total(latest) - prev) / prev) * 100 : null;
}

async function getL2BeatSummary(): Promise<L2BeatSummaryResponse | null> {
  const data = await l2beatFetch<L2BeatSummaryResponse>('/scaling/summary');
  return data?.projects ? data : null;
}

/**
 * Get all L2 projects with TVS data, largest first
 */
export async function getL2Projects(): Promise<L2Project[]> {
  const data = await getL2BeatSummary();
  if (!data) return getL2ProjectsFallback();
  return mapL2BeatSummary(data);
}

/**
 * Fallback: Get L2 projects from DefiLlama if L2Beat API fails
 */
async function getL2ProjectsFallback(): Promise<L2Project[]> {
  try {
    const { data: chains } = await resilientFetch<Array<{ name: string; tvl: number; chainId?: string }>>(
      'https://api.llama.fi/v2/chains',
      {
        service: 'defillama',
        timeoutMs: 10_000,
        retries: 1,
        staleCache,
        staleCacheKey: 'defillama:/v2/chains',
        next: { revalidate: 600 },
      },
    );
    
    // Filter for L2s
    const l2Chains = chains.filter((c: { name: string }) => 
      ['Arbitrum', 'Optimism', 'Base', 'zkSync Era', 'Linea', 'Scroll', 'Starknet', 'Polygon zkEVM', 'Mantle', 'Manta', 'Blast'].includes(c.name)
    );

    return l2Chains.map((chain: { name: string; tvl: number; chainId?: string }) => ({
      id: chain.name.toLowerCase().replace(/\s+/g, '-'),
      name: chain.name,
      slug: chain.name.toLowerCase().replace(/\s+/g, '-'),
      type: inferL2Type(chain.name),
      category: inferCategory(chain.name),
      tvl: chain.tvl || 0,
      tvlChange7d: 0,
      canonicalTvl: 0,
      externalTvl: 0,
      nativeTvl: 0,
      stage: inferStage(chain.name),
      riskLevel: 'medium' as const,
      purposes: ['Universal'],
      website: '',
      explorer: '',
      timestamp: new Date().toISOString(),
    })).sort((a, b) => b.tvl - a.tvl);
  } catch {
    return [];
  }
}

function categorizeL2Type(category: string): L2Project['type'] {
  if (category.includes('ZK')) return 'rollup';
  if (category.includes('Optimistic')) return 'rollup';
  if (category.includes('Validium')) return 'validium';
  if (category.includes('Plasma')) return 'plasma';
  return 'rollup';
}

function inferL2Type(name: string): L2Project['type'] {
  if (['zkSync Era', 'Starknet', 'Polygon zkEVM', 'Scroll', 'Linea'].includes(name)) return 'rollup';
  if (['Arbitrum', 'Optimism', 'Base', 'Blast', 'Mantle'].includes(name)) return 'rollup';
  return 'rollup';
}

function inferCategory(name: string): L2Project['category'] {
  if (['zkSync Era', 'Starknet', 'Polygon zkEVM', 'Scroll', 'Linea'].includes(name)) return 'ZK Rollup';
  return 'Optimistic Rollup';
}

function inferStage(name: string): L2Project['stage'] {
  if (['Arbitrum', 'Optimism'].includes(name)) return 'Stage 1';
  return 'Stage 0';
}

/**
 * Get risk assessment for a specific L2
 */
export async function getL2RiskAssessment(projectId: string): Promise<L2RiskAssessment | null> {
  // Risk assessments based on L2Beat's criteria
  const riskProfiles: Record<string, Partial<L2RiskAssessment>> = {
    arbitrum: {
      stateValidation: { value: 'Fraud proofs', sentiment: 'good', description: 'Uses interactive fraud proofs' },
      dataAvailability: { value: 'On-chain', sentiment: 'good', description: 'All data posted to Ethereum' },
      upgradeability: { value: '12h delay', sentiment: 'warning', description: 'Security council can upgrade' },
      sequencerFailure: { value: 'Self-sequence', sentiment: 'good', description: 'Users can submit L1 transactions' },
      proposerFailure: { value: 'Self-propose', sentiment: 'good', description: 'Anyone can propose state roots' },
      overallRiskScore: 25,
    },
    optimism: {
      stateValidation: { value: 'Fraud proofs', sentiment: 'good', description: 'Uses fault proofs' },
      dataAvailability: { value: 'On-chain', sentiment: 'good', description: 'All data posted to Ethereum' },
      upgradeability: { value: 'Multisig', sentiment: 'warning', description: 'Can be upgraded by multisig' },
      sequencerFailure: { value: 'Self-sequence', sentiment: 'good', description: 'Users can submit L1 transactions' },
      proposerFailure: { value: 'Permissioned', sentiment: 'warning', description: 'Only specific addresses can propose' },
      overallRiskScore: 35,
    },
    'zksync-era': {
      stateValidation: { value: 'ZK proofs', sentiment: 'good', description: 'Uses ZK-SNARKs' },
      dataAvailability: { value: 'On-chain', sentiment: 'good', description: 'State diffs posted to Ethereum' },
      upgradeability: { value: 'Instant', sentiment: 'bad', description: 'Can be upgraded instantly' },
      sequencerFailure: { value: 'No escape', sentiment: 'bad', description: 'No forced transaction mechanism yet' },
      proposerFailure: { value: 'Centralized', sentiment: 'bad', description: 'Single proposer' },
      overallRiskScore: 55,
    },
    starknet: {
      stateValidation: { value: 'ZK proofs', sentiment: 'good', description: 'Uses STARKs' },
      dataAvailability: { value: 'On-chain', sentiment: 'good', description: 'All data on Ethereum' },
      upgradeability: { value: 'Upgradeable', sentiment: 'warning', description: 'Contracts are upgradeable' },
      sequencerFailure: { value: 'No escape', sentiment: 'bad', description: 'No forced exit mechanism' },
      proposerFailure: { value: 'Centralized', sentiment: 'bad', description: 'Single prover' },
      overallRiskScore: 50,
    },
    base: {
      stateValidation: { value: 'Fraud proofs', sentiment: 'good', description: 'OP Stack with fault proofs' },
      dataAvailability: { value: 'On-chain', sentiment: 'good', description: 'All data posted to Ethereum' },
      upgradeability: { value: 'Multisig', sentiment: 'warning', description: 'Coinbase multisig' },
      sequencerFailure: { value: 'Self-sequence', sentiment: 'good', description: 'L1 forced inclusion' },
      proposerFailure: { value: 'Permissioned', sentiment: 'warning', description: 'Coinbase as proposer' },
      overallRiskScore: 40,
    },
  };

  const profile = riskProfiles[projectId.toLowerCase()];
  if (!profile) return null;

  return {
    projectId,
    projectName: projectId.charAt(0).toUpperCase() + projectId.slice(1),
    stateValidation: profile.stateValidation!,
    dataAvailability: profile.dataAvailability!,
    upgradeability: profile.upgradeability!,
    sequencerFailure: profile.sequencerFailure!,
    proposerFailure: profile.proposerFailure!,
    overallRiskScore: profile.overallRiskScore!,
  };
}

interface L2BeatActivityResponse {
  success: boolean;
  data?: {
    /** Columns: timestamp, count, uopsCount — one row per UTC day */
    chart?: { types: string[]; data: number[][] };
  };
}

/** How many of the largest projects get a per-project activity lookup */
const ACTIVITY_PROJECT_LIMIT = 15;

/**
 * Activity metrics from an L2Beat daily activity chart. The last row is the
 * most recent complete day. Returns null when the chart is missing or empty.
 */
export function activityFromChart(
  project: { id: string; name: string },
  response: L2BeatActivityResponse | null,
): L2Activity | null {
  const chart = response?.success ? response.data?.chart : undefined;
  if (!chart?.data?.length) return null;
  const countCol = chart.types.indexOf('count');
  const uopsCol = chart.types.indexOf('uopsCount');
  if (countCol < 0) return null;

  const rows = chart.data;
  const last = rows[rows.length - 1];
  const prior = rows.length > 1 ? rows[rows.length - 2] : undefined;
  const daily = last[countCol] ?? 0;
  const priorDaily = prior?.[countCol] ?? 0;
  const lastWeek = rows.slice(-7);

  return {
    projectId: project.id,
    projectName: project.name,
    dailyTransactions: daily,
    dailyTransactionsChange: priorDaily > 0 ? ((daily - priorDaily) / priorDaily) * 100 : 0,
    weeklyTransactions: lastWeek.reduce((sum, r) => sum + (r[countCol] ?? 0), 0),
    averageTps: daily / 86_400,
    // Busiest day in the returned window, as an average over that day
    peakTps: Math.max(...rows.map(r => r[countCol] ?? 0)) / 86_400,
    userOperations: uopsCol >= 0 ? last[uopsCol] ?? 0 : 0,
    timestamp: new Date(last[0] * 1000).toISOString(),
  };
}

/**
 * Get L2 activity metrics for the largest projects, busiest first.
 * Projects L2Beat does not track activity for are omitted.
 */
export async function getL2Activity(): Promise<L2Activity[]> {
  const summary = await getL2BeatSummary();
  if (!summary) return [];
  const projects = mapL2BeatSummary(summary).slice(0, ACTIVITY_PROJECT_LIMIT);

  const results = await Promise.all(
    projects.map(async project =>
      activityFromChart(
        project,
        await l2beatFetch<L2BeatActivityResponse>(`/scaling/activity/${encodeURIComponent(project.slug)}`),
      ),
    ),
  );

  return results
    .filter((a): a is L2Activity => a !== null)
    .sort((a, b) => b.dailyTransactions - a.dailyTransactions);
}

/**
 * Ecosystem-wide daily transactions and TPS across every project L2Beat tracks
 */
async function getL2ActivityTotals(): Promise<L2Summary['activityMetrics']> {
  const totals = activityFromChart(
    { id: 'all', name: 'All projects' },
    await l2beatFetch<L2BeatActivityResponse>('/scaling/activity'),
  );
  return {
    totalDailyTx: totals?.dailyTransactions ?? 0,
    totalTps: totals?.averageTps ?? 0,
  };
}

/**
 * Get comprehensive L2 ecosystem summary
 */
export async function getL2Summary(): Promise<L2Summary> {
  const [summary, activityMetrics] = await Promise.all([getL2BeatSummary(), getL2ActivityTotals()]);
  const projects = summary ? mapL2BeatSummary(summary) : await getL2ProjectsFallback();

  const totalTvl = projects.reduce((sum, p) => sum + p.tvl, 0);
  const totalTvlChange24h = (summary && totalTvsChange24h(summary.chart)) ?? 0;

  const topProjects = projects.slice(0, 10);
  const dominance: Record<string, number> = {};
  for (const p of topProjects) {
    dominance[p.name] = totalTvl > 0 ? (p.tvl / totalTvl) * 100 : 0;
  }

  const riskDistribution = { low: 0, medium: 0, high: 0 };
  for (const project of projects) riskDistribution[project.riskLevel]++;

  return {
    totalTvl,
    totalTvlChange24h,
    totalProjects: projects.length,
    dominance,
    topProjects,
    activityMetrics,
    riskDistribution,
    timestamp: new Date().toISOString(),
  };
}

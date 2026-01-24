/**
 * L2Beat Layer 2 Analytics API
 * 
 * Comprehensive data on Ethereum Layer 2 scaling solutions.
 * TVL, risk assessments, and activity metrics.
 * 
 * @see https://l2beat.com/
 * @module lib/apis/l2beat
 */

const BASE_URL = 'https://l2beat.com/api';

// =============================================================================
// Types
// =============================================================================

export interface L2Project {
  id: string;
  name: string;
  slug: string;
  type: 'rollup' | 'validium' | 'optimium' | 'plasma' | 'state-channel';
  category: 'Optimistic Rollup' | 'ZK Rollup' | 'Validium' | 'Optimium' | 'Plasma';
  tvl: number;
  tvlChange24h: number;
  tvlChange7d: number;
  tvlChange30d: number;
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
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      next: { revalidate: 600 }, // Cache for 10 minutes
    });

    if (!response.ok) {
      console.error(`L2Beat API error: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('L2Beat API request failed:', error);
    return null;
  }
}

/**
 * Get all L2 projects with TVL data
 */
export async function getL2Projects(): Promise<L2Project[]> {
  // L2Beat doesn't have a public API, so we'll construct from their public data
  // Using their scaling summary endpoint
  const data = await l2beatFetch<{
    projects: Record<string, {
      id: string;
      name: string;
      slug: string;
      category: string;
      tvl: { value: number; change24h: number; change7d: number };
      stage?: string;
      purposes: string[];
    }>;
  }>('/scaling/summary');

  if (!data?.projects) {
    // Return curated list of major L2s with estimated data
    return getL2ProjectsFallback();
  }

  return Object.values(data.projects).map(project => ({
    id: project.id,
    name: project.name,
    slug: project.slug,
    type: categorizeL2Type(project.category),
    category: project.category as L2Project['category'],
    tvl: project.tvl?.value || 0,
    tvlChange24h: project.tvl?.change24h || 0,
    tvlChange7d: project.tvl?.change7d || 0,
    tvlChange30d: 0,
    canonicalTvl: 0,
    externalTvl: 0,
    nativeTvl: 0,
    stage: (project.stage as L2Project['stage']) || 'Not applicable',
    riskLevel: 'medium',
    purposes: project.purposes || [],
    website: '',
    explorer: '',
    timestamp: new Date().toISOString(),
  }));
}

/**
 * Fallback: Get L2 projects from DefiLlama if L2Beat API fails
 */
async function getL2ProjectsFallback(): Promise<L2Project[]> {
  try {
    const response = await fetch('https://api.llama.fi/v2/chains', {
      next: { revalidate: 600 },
    });

    if (!response.ok) return [];

    const chains = await response.json();
    
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
      tvlChange24h: 0,
      tvlChange7d: 0,
      tvlChange30d: 0,
      canonicalTvl: 0,
      externalTvl: 0,
      nativeTvl: 0,
      stage: inferStage(chain.name),
      riskLevel: 'medium' as const,
      purposes: ['Universal'],
      website: '',
      explorer: '',
      timestamp: new Date().toISOString(),
    }));
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

/**
 * Get L2 activity metrics
 */
export async function getL2Activity(): Promise<L2Activity[]> {
  // Activity data from public sources
  const activities: L2Activity[] = [
    {
      projectId: 'arbitrum',
      projectName: 'Arbitrum One',
      dailyTransactions: 0,
      dailyTransactionsChange: 0,
      weeklyTransactions: 0,
      averageTps: 0,
      peakTps: 0,
      userOperations: 0,
      timestamp: new Date().toISOString(),
    },
  ];

  // Try to fetch real activity data from L2Beat or alternative sources
  try {
    const response = await fetch('https://l2beat.com/api/activity', {
      next: { revalidate: 600 },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.projects) {
        interface L2BeatProject {
          name: string;
          daily: number;
          weekly: number;
          tps: number;
        }
        return Object.entries(data.projects as Record<string, L2BeatProject>).map(([id, project]) => ({
          projectId: id,
          projectName: project.name,
          dailyTransactions: project.daily || 0,
          dailyTransactionsChange: 0,
          weeklyTransactions: project.weekly || 0,
          averageTps: project.tps || 0,
          peakTps: 0,
          userOperations: 0,
          timestamp: new Date().toISOString(),
        }));
      }
    }
  } catch {
    // Return empty activities
  }

  return activities;
}

/**
 * Get comprehensive L2 ecosystem summary
 */
export async function getL2Summary(): Promise<L2Summary> {
  const projects = await getL2Projects();
  const activities = await getL2Activity();

  const totalTvl = projects.reduce((sum, p) => sum + p.tvl, 0);
  const prevTvl = projects.reduce((sum, p) => sum + p.tvl / (1 + p.tvlChange24h / 100), 0);
  const totalTvlChange24h = prevTvl > 0 ? ((totalTvl - prevTvl) / prevTvl) * 100 : 0;

  // Calculate dominance
  const dominance: Record<string, number> = {};
  projects.slice(0, 10).forEach(p => {
    dominance[p.name] = totalTvl > 0 ? (p.tvl / totalTvl) * 100 : 0;
  });

  // Calculate risk distribution
  let lowRisk = 0, mediumRisk = 0, highRisk = 0;
  for (const project of projects) {
    const risk = await getL2RiskAssessment(project.id);
    if (risk) {
      if (risk.overallRiskScore < 30) lowRisk++;
      else if (risk.overallRiskScore < 60) mediumRisk++;
      else highRisk++;
    }
  }

  // Activity metrics
  const totalDailyTx = activities.reduce((sum, a) => sum + a.dailyTransactions, 0);
  const totalTps = activities.reduce((sum, a) => sum + a.averageTps, 0);

  return {
    totalTvl,
    totalTvlChange24h,
    totalProjects: projects.length,
    dominance,
    topProjects: projects.sort((a, b) => b.tvl - a.tvl).slice(0, 10),
    activityMetrics: {
      totalDailyTx,
      totalTps,
    },
    riskDistribution: {
      low: lowRisk,
      medium: mediumRisk,
      high: highRisk,
    },
    timestamp: new Date().toISOString(),
  };
}

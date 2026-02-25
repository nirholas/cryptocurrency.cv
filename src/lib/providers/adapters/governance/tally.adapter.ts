/**
 * Tally Adapter
 *
 * Tally is the leading on-chain governance tracker:
 * - Tracks 200+ DAOs
 * - Public GraphQL API
 * - Detailed proposal data
 *
 * @module providers/adapters/governance/tally
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { GovernanceProposal } from './types';

const BASE = 'https://api.tally.xyz/query';
const API_KEY = process.env.TALLY_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: API_KEY ? 20 : 0,
  windowMs: 60_000,
};

const GOVERNANCE_QUERY = `
  query Proposals($input: ProposalsInput!) {
    proposals(input: $input) {
      nodes {
        id
        title
        description
        statusChanges {
          type
        }
        voteStats {
          type
          votesCount
          votersCount
          percent
        }
        start {
          timestamp
        }
        end {
          timestamp
        }
        governor {
          name
          slug
        }
      }
    }
  }
`;

export const tallyAdapter: DataProvider<GovernanceProposal[]> = {
  name: 'tally',
  description: 'Tally — on-chain governance tracker for 200+ DAOs',
  priority: 1,
  weight: 0.50,
  rateLimit: RATE_LIMIT,
  capabilities: ['governance'],

  async fetch(params: FetchParams): Promise<GovernanceProposal[]> {
    if (!API_KEY) throw new Error('TALLY_API_KEY not configured');

    const limit = params.limit ?? 20;

    const res = await fetch(BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': API_KEY,
      },
      body: JSON.stringify({
        query: GOVERNANCE_QUERY,
        variables: {
          input: {
            sort: { isDescending: true, sortBy: 'START_BLOCK' },
            page: { limit },
          },
        },
      }),
    });

    if (!res.ok) throw new Error(`Tally API: ${res.status}`);

    const json = await res.json();
    const proposals = json.data?.proposals?.nodes ?? [];
    const now = new Date().toISOString();

    return proposals.map((p: TallyProposal): GovernanceProposal => {
      const forVotes = p.voteStats?.find((v: TallyVoteStat) => v.type === 'FOR')?.votesCount ?? 0;
      const againstVotes = p.voteStats?.find((v: TallyVoteStat) => v.type === 'AGAINST')?.votesCount ?? 0;
      const abstainVotes = p.voteStats?.find((v: TallyVoteStat) => v.type === 'ABSTAIN')?.votesCount ?? 0;

      const latestStatus = p.statusChanges?.[p.statusChanges.length - 1]?.type?.toLowerCase() ?? 'pending';

      return {
        id: p.id ?? '',
        title: p.title ?? 'Unknown Proposal',
        description: (p.description ?? '').slice(0, 500),
        protocol: p.governor?.name ?? 'Unknown',
        status: mapTallyStatus(latestStatus),
        forVotes: parseFloat(String(forVotes)) || 0,
        againstVotes: parseFloat(String(againstVotes)) || 0,
        abstainVotes: parseFloat(String(abstainVotes)) || 0,
        quorum: 0,
        quorumReached: false,
        startTime: p.start?.timestamp ?? '',
        endTime: p.end?.timestamp ?? '',
        url: `https://www.tally.xyz/gov/${p.governor?.slug}/proposal/${p.id}`,
        source: 'tally',
        timestamp: now,
      };
    });
  },

  async healthCheck(): Promise<boolean> {
    if (!API_KEY) return false;
    try {
      const res = await fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Api-Key': API_KEY },
        body: JSON.stringify({ query: '{ __typename }' }),
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: GovernanceProposal[]): boolean {
    return Array.isArray(data) && data.length > 0;
  },
};

function mapTallyStatus(status: string): GovernanceProposal['status'] {
  if (status.includes('active') || status.includes('voting')) return 'active';
  if (status.includes('passed') || status.includes('succeeded')) return 'passed';
  if (status.includes('defeated') || status.includes('failed')) return 'defeated';
  if (status.includes('queued')) return 'queued';
  if (status.includes('executed')) return 'executed';
  return 'pending';
}

interface TallyProposal {
  id?: string;
  title?: string;
  description?: string;
  statusChanges?: Array<{ type: string }>;
  voteStats?: TallyVoteStat[];
  start?: { timestamp?: string };
  end?: { timestamp?: string };
  governor?: { name?: string; slug?: string };
}

interface TallyVoteStat {
  type: string;
  votesCount: number | string;
  votersCount: number;
  percent: number;
}

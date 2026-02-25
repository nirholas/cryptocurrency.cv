/**
 * Snapshot Adapter
 *
 * Snapshot is the most popular off-chain governance platform:
 * - Used by 30,000+ spaces
 * - Public GraphQL API
 * - Off-chain voting (gasless)
 *
 * @module providers/adapters/governance/snapshot
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { GovernanceProposal } from './types';

const BASE = 'https://hub.snapshot.org/graphql';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 30, windowMs: 60_000 };

const PROPOSALS_QUERY = `
  query Proposals($first: Int!, $state: String, $space_in: [String]) {
    proposals(
      first: $first
      orderBy: "created"
      orderDirection: desc
      where: { state: $state, space_in: $space_in }
    ) {
      id
      title
      body
      start
      end
      state
      scores
      scores_total
      quorum
      votes
      space {
        id
        name
      }
      link
    }
  }
`;

const TOP_SPACES = [
  'aave.eth', 'uniswapgovernance.eth', 'ens.eth', 'gitcoindao.eth',
  'balancer.eth', 'lido-snapshot.eth', 'safe.eth', 'arbitrumfoundation.eth',
  'opcollective.eth', 'starknet.eth', 'apecoin.eth', 'sushigov.eth',
];

export const snapshotAdapter: DataProvider<GovernanceProposal[]> = {
  name: 'snapshot',
  description: 'Snapshot — off-chain governance, 30K+ DAOs',
  priority: 2,
  weight: 0.40,
  rateLimit: RATE_LIMIT,
  capabilities: ['governance'],

  async fetch(params: FetchParams): Promise<GovernanceProposal[]> {
    const limit = params.limit ?? 20;
    const state = (params.extra?.state as string) ?? 'active';
    const spaces = (params.extra?.spaces as string[]) ?? TOP_SPACES;

    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: PROPOSALS_QUERY,
        variables: { first: limit, state, space_in: spaces },
      }),
    });

    if (!res.ok) throw new Error(`Snapshot API: ${res.status}`);

    const json = await res.json();
    const proposals: SnapshotProposal[] = json.data?.proposals ?? [];
    const now = new Date().toISOString();

    return proposals.map((p): GovernanceProposal => {
      const scores = p.scores ?? [];
      const forVotes = scores[0] ?? 0;
      const againstVotes = scores[1] ?? 0;
      const abstainVotes = scores.slice(2).reduce((a: number, b: number) => a + b, 0);

      return {
        id: p.id ?? '',
        title: p.title ?? 'Unknown',
        description: (p.body ?? '').slice(0, 500),
        protocol: p.space?.name ?? p.space?.id ?? 'Unknown',
        status: mapSnapshotState(p.state ?? ''),
        forVotes,
        againstVotes,
        abstainVotes,
        quorum: p.quorum ?? 0,
        quorumReached: (p.scores_total ?? 0) >= (p.quorum ?? 0),
        startTime: p.start ? new Date(p.start * 1000).toISOString() : '',
        endTime: p.end ? new Date(p.end * 1000).toISOString() : '',
        url: p.link ?? `https://snapshot.org/#/${p.space?.id}/proposal/${p.id}`,
        source: 'snapshot',
        timestamp: now,
      };
    });
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ space(id: "aave.eth") { id } }' }),
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

function mapSnapshotState(state: string): GovernanceProposal['status'] {
  switch (state) {
    case 'active': return 'active';
    case 'closed': return 'passed'; // Snapshot doesn't distinguish pass/fail in state field
    case 'pending': return 'pending';
    default: return 'pending';
  }
}

interface SnapshotProposal {
  id?: string;
  title?: string;
  body?: string;
  start?: number;
  end?: number;
  state?: string;
  scores?: number[];
  scores_total?: number;
  quorum?: number;
  votes?: number;
  space?: { id?: string; name?: string };
  link?: string;
}

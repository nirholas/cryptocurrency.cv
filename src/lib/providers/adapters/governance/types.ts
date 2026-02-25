/**
 * Governance Types
 *
 * @module providers/adapters/governance/types
 */

export interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  /** Protocol / DAO name */
  protocol: string;
  /** Current status */
  status: 'pending' | 'active' | 'passed' | 'defeated' | 'queued' | 'executed';
  /** Votes for */
  forVotes: number;
  /** Votes against */
  againstVotes: number;
  /** Abstain votes */
  abstainVotes: number;
  /** Quorum requirement */
  quorum: number;
  /** Has quorum been met */
  quorumReached: boolean;
  /** Start block or timestamp */
  startTime: string;
  /** End block or timestamp */
  endTime: string;
  /** Link to the proposal */
  url: string;
  source: string;
  timestamp: string;
}

export interface GovernanceStats {
  protocol: string;
  totalProposals: number;
  activeProposals: number;
  totalVoters: number;
  treasuryValueUsd: number;
  source: string;
  timestamp: string;
}

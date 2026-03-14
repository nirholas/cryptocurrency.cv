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
 * Canonical News Source Tier Definitions
 *
 * Single source of truth for source quality across the codebase:
 *   - src/lib/crypto-news.ts        → SOURCE_REPUTATION_SCORES (trending feed)
 *   - src/lib/rag/reranker.ts       → SOURCE_CREDIBILITY (RAG re-ranking)
 *   - scripts/archive/services/source-reliability.js → SOURCE_CATEGORIES
 *
 * Tiers
 * ──────────────────────────────────────────────────────────────
 * tier1    Mainstream / institutional media      credibility 0.88–0.98  reputation  90–100
 * tier2    Premium crypto-native outlets         credibility 0.86–0.95  reputation  65–90
 * tier3    Established crypto news               credibility 0.68–0.82  reputation  60–80
 * research Institutional research firms          credibility 0.90–0.94  reputation  70–72
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SourceTier = 'tier1' | 'tier2' | 'tier3' | 'research';

export interface SourceTierEntry {
  tier: SourceTier;
  /** Human-readable display name used in UI and SOURCE_REPUTATION_SCORES */
  displayName: string;
  /** Credibility score 0–1 — used by the RAG re-ranking pipeline */
  credibility: number;
  /** Reputation score 0–100 — used by the trending feed scoring pipeline */
  reputation: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Canonical source map  (key = lowercase RSS_SOURCES key)
// ─────────────────────────────────────────────────────────────────────────────

export const SOURCE_TIERS: Record<string, SourceTierEntry> = {
  // ═══════════════════════════════════════════════════════════════
  // Tier 1 — Mainstream / institutional media
  // ═══════════════════════════════════════════════════════════════
  bloomberg: { tier: 'tier1', displayName: 'Bloomberg Crypto', credibility: 0.98, reputation: 100 },
  reuters: { tier: 'tier1', displayName: 'Reuters Crypto', credibility: 0.98, reputation: 100 },
  wsj: { tier: 'tier1', displayName: 'WSJ Crypto', credibility: 0.97, reputation: 100 },
  ft: { tier: 'tier1', displayName: 'Financial Times', credibility: 0.97, reputation: 98 },
  cnbc: { tier: 'tier1', displayName: 'CNBC Crypto', credibility: 0.93, reputation: 95 },
  forbes: { tier: 'tier1', displayName: 'Forbes Crypto', credibility: 0.9, reputation: 95 },
  yahoofinance: {
    tier: 'tier1',
    displayName: 'Yahoo Finance Crypto',
    credibility: 0.88,
    reputation: 90,
  },
  techcrunch: { tier: 'tier1', displayName: 'TechCrunch Crypto', credibility: 0.9, reputation: 92 },
  wired: { tier: 'tier1', displayName: 'Wired Crypto', credibility: 0.88, reputation: 88 },

  // ═══════════════════════════════════════════════════════════════
  // Tier 2 — Premium crypto-native outlets
  // ═══════════════════════════════════════════════════════════════
  coindesk: { tier: 'tier2', displayName: 'CoinDesk', credibility: 0.95, reputation: 90 },
  theblock: { tier: 'tier2', displayName: 'The Block', credibility: 0.93, reputation: 88 },
  blockworks: { tier: 'tier2', displayName: 'Blockworks', credibility: 0.9, reputation: 85 },
  decrypt: { tier: 'tier2', displayName: 'Decrypt', credibility: 0.88, reputation: 85 },
  unchained: { tier: 'tier2', displayName: 'Unchained Crypto', credibility: 0.88, reputation: 68 },
  defiant: { tier: 'tier2', displayName: 'The Defiant', credibility: 0.87, reputation: 75 },
  dlnews: { tier: 'tier2', displayName: 'DL News', credibility: 0.86, reputation: 68 },

  // ═══════════════════════════════════════════════════════════════
  // Tier 3 — Established crypto news
  // ═══════════════════════════════════════════════════════════════
  bitcoinmagazine: {
    tier: 'tier3',
    displayName: 'Bitcoin Magazine',
    credibility: 0.82,
    reputation: 78,
  },
  cointelegraph: { tier: 'tier3', displayName: 'CoinTelegraph', credibility: 0.78, reputation: 80 },
  bankless: { tier: 'tier3', displayName: 'Bankless', credibility: 0.78, reputation: 68 },
  cryptoslate: { tier: 'tier3', displayName: 'CryptoSlate', credibility: 0.75, reputation: 75 },
  bitcoinist: { tier: 'tier3', displayName: 'Bitcoinist', credibility: 0.72, reputation: 68 },
  beincrypto: { tier: 'tier3', displayName: 'BeInCrypto', credibility: 0.7, reputation: 60 },
  newsbtc: { tier: 'tier3', displayName: 'NewsBTC', credibility: 0.7, reputation: 65 },

  // ═══════════════════════════════════════════════════════════════
  // Research — Institutional research & investor publications
  // ═══════════════════════════════════════════════════════════════
  messari: { tier: 'research', displayName: 'Messari', credibility: 0.92, reputation: 72 },
  delphi: { tier: 'research', displayName: 'Delphi Digital', credibility: 0.9, reputation: 70 },
  paradigm: { tier: 'research', displayName: 'Paradigm', credibility: 0.94, reputation: 72 },
  a16z: { tier: 'research', displayName: 'a16z Crypto', credibility: 0.93, reputation: 72 },
  nansen: { tier: 'research', displayName: 'Nansen', credibility: 0.9, reputation: 70 },
  dune: { tier: 'research', displayName: 'Dune Analytics', credibility: 0.88, reputation: 68 },
  artemis: { tier: 'research', displayName: 'Artemis', credibility: 0.88, reputation: 68 },
  coinmarketcap: {
    tier: 'research',
    displayName: 'CoinMarketCap',
    credibility: 0.85,
    reputation: 70,
  },
  coingecko: { tier: 'research', displayName: 'CoinGecko', credibility: 0.85, reputation: 70 },

  // ═══════════════════════════════════════════════════════════════
  // Tier 1 — Wave 4 mainstream additions
  // ═══════════════════════════════════════════════════════════════
  guardian_tech: {
    tier: 'tier1',
    displayName: 'The Guardian Tech',
    credibility: 0.95,
    reputation: 96,
  },
  bbc_business: { tier: 'tier1', displayName: 'BBC Business', credibility: 0.96, reputation: 97 },
  cnn_business: { tier: 'tier1', displayName: 'CNN Business', credibility: 0.92, reputation: 93 },
  barrons_crypto: {
    tier: 'tier1',
    displayName: "Barron's Crypto",
    credibility: 0.94,
    reputation: 95,
  },
  fortune_crypto: {
    tier: 'tier1',
    displayName: 'Fortune Crypto',
    credibility: 0.92,
    reputation: 93,
  },
  axios_crypto: { tier: 'tier1', displayName: 'Axios Crypto', credibility: 0.91, reputation: 92 },
  business_insider_crypto: {
    tier: 'tier1',
    displayName: 'Business Insider',
    credibility: 0.88,
    reputation: 88,
  },

  // ═══════════════════════════════════════════════════════════════
  // Tier 1 — Wave 4 geopolitical/institutional additions
  // ═══════════════════════════════════════════════════════════════
  bis_innovation: {
    tier: 'tier1',
    displayName: 'BIS Innovation Hub',
    credibility: 0.97,
    reputation: 98,
  },
  imf_fintech: {
    tier: 'tier1',
    displayName: 'IMF Fintech Notes',
    credibility: 0.97,
    reputation: 98,
  },
  ecb_digital: {
    tier: 'tier1',
    displayName: 'ECB Digital Euro',
    credibility: 0.97,
    reputation: 98,
  },
  us_treasury: { tier: 'tier1', displayName: 'US Treasury', credibility: 0.98, reputation: 99 },
  boe_fintech: { tier: 'tier1', displayName: 'Bank of England', credibility: 0.97, reputation: 98 },
  atlantic_council: {
    tier: 'tier1',
    displayName: 'Atlantic Council',
    credibility: 0.93,
    reputation: 94,
  },

  // ═══════════════════════════════════════════════════════════════
  // Research — Wave 4 on-chain/research additions
  // ═══════════════════════════════════════════════════════════════
  santiment_blog: { tier: 'research', displayName: 'Santiment', credibility: 0.9, reputation: 70 },
  messari_research: {
    tier: 'research',
    displayName: 'Messari Research',
    credibility: 0.92,
    reputation: 72,
  },

  // ═══════════════════════════════════════════════════════════════
  // Tier 2 — Wave 4 notable additions
  // ═══════════════════════════════════════════════════════════════
  fidelity_digital: {
    tier: 'tier2',
    displayName: 'Fidelity Digital',
    credibility: 0.92,
    reputation: 88,
  },
  securitize_blog: { tier: 'tier2', displayName: 'Securitize', credibility: 0.85, reputation: 72 },
  blackrock_digital: {
    tier: 'tier2',
    displayName: 'BlackRock Digital',
    credibility: 0.95,
    reputation: 95,
  },
  franklin_templeton: {
    tier: 'tier2',
    displayName: 'Franklin Templeton',
    credibility: 0.93,
    reputation: 92,
  },
  coinbase_institutional: {
    tier: 'tier2',
    displayName: 'Coinbase Institutional',
    credibility: 0.9,
    reputation: 85,
  },
  ripple_insights: {
    tier: 'tier2',
    displayName: 'Ripple Insights',
    credibility: 0.85,
    reputation: 75,
  },
  coffeezilla: { tier: 'tier2', displayName: 'Coffeezilla', credibility: 0.88, reputation: 78 },
  molly_white: { tier: 'tier2', displayName: 'Molly White', credibility: 0.86, reputation: 75 },

  // ═══════════════════════════════════════════════════════════════
  // Tier 3 — Wave 4 additions
  // ═══════════════════════════════════════════════════════════════
  farcaster_blog: { tier: 'tier3', displayName: 'Farcaster', credibility: 0.78, reputation: 70 },
  lens_blog: { tier: 'tier3', displayName: 'Lens Protocol', credibility: 0.78, reputation: 68 },
  thestreet_crypto: {
    tier: 'tier3',
    displayName: 'TheStreet Crypto',
    credibility: 0.8,
    reputation: 72,
  },
  benzinga_crypto: {
    tier: 'tier3',
    displayName: 'Benzinga Crypto',
    credibility: 0.78,
    reputation: 70,
  },
  kitco_crypto: { tier: 'tier3', displayName: 'Kitco Crypto', credibility: 0.78, reputation: 70 },
  blocktempo: { tier: 'tier3', displayName: 'BlockTempo', credibility: 0.75, reputation: 65 },
  coinpost: { tier: 'tier3', displayName: 'CoinPost', credibility: 0.75, reputation: 65 },
  chaincatcher: { tier: 'tier3', displayName: 'Chain Catcher', credibility: 0.72, reputation: 62 },

  // ═══════════════════════════════════════════════════════════════
  // Tier 3 — Notable new sources
  // ═══════════════════════════════════════════════════════════════
  protos: { tier: 'tier3', displayName: 'Protos', credibility: 0.75, reputation: 68 },
  dailyhodl: { tier: 'tier3', displayName: 'The Daily Hodl', credibility: 0.72, reputation: 65 },
  u_today: { tier: 'tier3', displayName: 'U.Today', credibility: 0.7, reputation: 62 },
  watcherguru: { tier: 'tier3', displayName: 'Watcher Guru', credibility: 0.68, reputation: 60 },
  cryptopolitan: { tier: 'tier3', displayName: 'Cryptopolitan', credibility: 0.68, reputation: 60 },
};

// ─────────────────────────────────────────────────────────────────────────────
// Fallback defaults
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_CREDIBILITY = 0.6;
export const DEFAULT_REPUTATION = 50;

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get credibility score (0–1) for a source key.
 * Used by the RAG re-ranking pipeline.
 */
export function getSourceCredibility(sourceKey: string): number {
  return SOURCE_TIERS[sourceKey.toLowerCase()]?.credibility ?? DEFAULT_CREDIBILITY;
}

/**
 * Get reputation score (0–100) for a display name or source key.
 * Used by the trending feed scoring pipeline.
 */
export function getSourceReputation(sourceNameOrKey: string): number {
  const lower = sourceNameOrKey.toLowerCase();
  if (SOURCE_TIERS[lower]) return SOURCE_TIERS[lower].reputation;
  // Fall back to display-name match
  const entry = Object.values(SOURCE_TIERS).find((e) => e.displayName.toLowerCase() === lower);
  return entry?.reputation ?? DEFAULT_REPUTATION;
}

/**
 * Get the tier label for a source key, or null if unknown.
 */
export function getSourceTier(sourceKey: string): SourceTier | null {
  return SOURCE_TIERS[sourceKey.toLowerCase()]?.tier ?? null;
}

/**
 * Returns the set of tiers included at a given quality level.
 * - 'premium'  → tier1 + research
 * - 'high'     → tier1 + tier2 + research
 * - 'all' / undefined → all tiers
 */
export function getTiersForQuality(quality?: string): Set<SourceTier> {
  switch (quality) {
    case 'premium':
      return new Set(['tier1', 'research']);
    case 'high':
      return new Set(['tier1', 'tier2', 'research']);
    default:
      return new Set(['tier1', 'tier2', 'tier3', 'research']);
  }
}

/**
 * Returns true if the given source key passes the quality filter.
 */
export function sourcePassesQuality(sourceKey: string, quality?: string): boolean {
  if (!quality || quality === 'all') return true;
  const tier = getSourceTier(sourceKey);
  if (!tier) return quality !== 'premium'; // Unknown sources pass unless premium filter
  return getTiersForQuality(quality).has(tier);
}

// ─────────────────────────────────────────────────────────────────────────────
// Backward-compatible derived records
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Drop-in replacement for the old SOURCE_REPUTATION_SCORES constant
 * (display-name → 0–100).  Used by crypto-news.ts.
 */
export const SOURCE_REPUTATION_SCORES: Record<string, number> = {
  ...Object.fromEntries(Object.values(SOURCE_TIERS).map((e) => [e.displayName, e.reputation])),
  default: DEFAULT_REPUTATION,
};

/**
 * Drop-in replacement for the old SOURCE_CREDIBILITY constant
 * (lowercase key → 0–1).  Used by rag/reranker.ts.
 */
export const SOURCE_CREDIBILITY: Record<string, number> = {
  ...Object.fromEntries(Object.entries(SOURCE_TIERS).map(([k, e]) => [k, e.credibility])),
  default: DEFAULT_CREDIBILITY,
};

/**
 * Database module — Public API
 *
 * @module database
 */

export { db, isDatabaseConfigured, withDb, sql, schema } from './client';
export type { Database } from './client';
export {
  articles,
  coins,
  prices,
  marketSnapshots,
  providerHealth,
  alerts,
  predictions,
  socialMetrics,
  articleSearchQuery,
  articleSearchRank,
} from './schema';

/**
 * Inngest Functions — Index
 *
 * Re-exports all Inngest functions from their individual modules.
 * Used by the serve handler in src/app/api/inngest/route.ts.
 */

export {
  archiveArticlesCron,
  archiveArticleOnPublish,
} from './archive-articles';

export { dailyDigest } from './daily-digest';

export { sentimentAnalysis } from './sentiment-analysis';

export { coverageGapDetection } from './coverage-gap-detection';

export { predictions } from './predictions';

export { tagScoreRecalculation } from './tag-score-recalculation';

export { enrichArticlesCron, enrichArticleOnEvent } from './enrich-article';

/**
 * Flat array of all functions for serve().
 * Import this in the route handler.
 */
import { archiveArticlesCron, archiveArticleOnPublish } from './archive-articles';
import { dailyDigest } from './daily-digest';
import { sentimentAnalysis } from './sentiment-analysis';
import { coverageGapDetection } from './coverage-gap-detection';
import { predictions } from './predictions';
import { tagScoreRecalculation } from './tag-score-recalculation';
import { enrichArticlesCron, enrichArticleOnEvent } from './enrich-article';

export const allFunctions = [
  archiveArticlesCron,
  archiveArticleOnPublish,
  dailyDigest,
  sentimentAnalysis,
  coverageGapDetection,
  predictions,
  tagScoreRecalculation,
  enrichArticlesCron,
  enrichArticleOnEvent,
];

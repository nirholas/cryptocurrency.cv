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

export { sendDailyEmailDigest } from './send-email-digest';

export { derivativesSnapshot } from './derivatives-snapshot';

export { stablecoinSnapshot, gasFeeSnapshot } from './market-data-snapshot';

export {
  solanaSnapshot,
  predictionMarketsSnapshot,
  governanceSnapshot,
  l2DataSnapshot,
  mevSnapshot,
  bridgeSnapshot,
  btcETFSnapshot,
  miningSnapshot,
  protocolRevenueSnapshot,
} from './data-collection';

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
import { derivativesSnapshot } from './derivatives-snapshot';
import { stablecoinSnapshot, gasFeeSnapshot } from './market-data-snapshot';
import {
  solanaSnapshot,
  predictionMarketsSnapshot,
  governanceSnapshot,
  l2DataSnapshot,
  mevSnapshot,
  bridgeSnapshot,
  btcETFSnapshot,
  miningSnapshot,
  protocolRevenueSnapshot,
} from './data-collection';

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
  sendDailyEmailDigest,
  derivativesSnapshot,
  stablecoinSnapshot,
  gasFeeSnapshot,
  solanaSnapshot,
  predictionMarketsSnapshot,
  governanceSnapshot,
  l2DataSnapshot,
  mevSnapshot,
  bridgeSnapshot,
  btcETFSnapshot,
  miningSnapshot,
  protocolRevenueSnapshot,
];

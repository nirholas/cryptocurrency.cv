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
 * Inngest Client
 *
 * Centralised Inngest client used by all background functions.
 * Replace Vercel Cron with reliable, retryable background jobs.
 *
 * Environment variables:
 *   INNGEST_EVENT_KEY  — Inngest event key (production)
 *   INNGEST_SIGNING_KEY — Inngest signing key for webhook verification
 *   INNGEST_DEV=1       — run against the local Inngest Dev Server (v4
 *                          defaults to cloud mode, which needs the signing key)
 *
 * @see https://www.inngest.com/docs
 */

import { Inngest, eventType, staticSchema } from 'inngest';

// =============================================================================
// TYPED EVENT SCHEMAS
// =============================================================================

/**
 * All Inngest events emitted or consumed by the app. Each one is exposed below
 * as an `eventType()` trigger so functions get a typed `event.data`.
 */
export type Events = {
  /** Fired when a new article is fetched from an RSS source */
  'article/published': {
    data: {
      articleId: string;
      title: string;
      link: string;
      source: string;
      category: string;
      tickers?: string[];
    };
  };
  /** Fired when an article needs AI enrichment (sentiment, entities, tags) */
  'article/needs-enrichment': {
    data: {
      articleId: string;
      link: string;
      title: string;
      description?: string;
      source: string;
      priority?: 'breaking' | 'normal';
    };
  };
  /** Fired when coverage gap detection identifies missing topics */
  'article/needs-coverage': {
    data: {
      topic: string;
      lastCoverageAt: string;
      gapHours: number;
    };
  };
  /** Fired when a price alert threshold is crossed */
  'market/price-alert': {
    data: {
      ticker: string;
      currentPrice: number;
      previousPrice: number;
      changePercent: number;
      direction: 'up' | 'down';
    };
  };
  /** Fired to request a sentiment refresh for specific sources */
  'sentiment/refresh': {
    data: {
      sources?: string[];
      force?: boolean;
    };
  };
};

// =============================================================================
// EVENT TRIGGERS
// =============================================================================

function defineEvent<TName extends keyof Events>(name: TName) {
  return eventType(name, { schema: staticSchema<Events[TName]['data']>() });
}

export const articlePublished = defineEvent('article/published');
export const articleNeedsEnrichment = defineEvent('article/needs-enrichment');
export const articleNeedsCoverage = defineEvent('article/needs-coverage');
export const marketPriceAlert = defineEvent('market/price-alert');
export const sentimentRefresh = defineEvent('sentiment/refresh');

// =============================================================================
// CLIENT INSTANCE
// =============================================================================

/**
 * Event key is optional in dev (Inngest Dev Server doesn't require it).
 * In production Inngest reads INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY
 * automatically.
 *
 * Checkpointing (on by default in v4) runs consecutive steps inside one
 * request; capping it below the 300 s Cloud Run request timeout (and the
 * route's maxDuration) hands the run back to Inngest before the platform
 * kills the request mid-step.
 */
export const inngest = new Inngest({
  id: 'free-crypto-news',
  checkpointing: { maxRuntime: '240s' },
});

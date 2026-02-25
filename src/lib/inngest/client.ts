/**
 * Inngest Client
 *
 * Centralised Inngest client used by all background functions.
 * Replace Vercel Cron with reliable, retryable background jobs.
 *
 * Environment variables:
 *   INNGEST_EVENT_KEY  — Inngest event key (production)
 *   INNGEST_SIGNING_KEY — Inngest signing key for webhook verification
 *
 * @see https://www.inngest.com/docs
 */

import { Inngest } from 'inngest';

// =============================================================================
// TYPED EVENT SCHEMAS
// =============================================================================

/**
 * All Inngest events emitted or consumed by the app.
 * Using a string-literal map ensures type safety across send() and createFunction().
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
// CLIENT INSTANCE
// =============================================================================

export const inngest = new Inngest({
  id: 'free-crypto-news',
  schemas: new Map() as never, // Type inference from Events
  /**
   * Event key is optional in dev (Inngest Dev Server doesn't require it).
   * In production Inngest reads INNGEST_EVENT_KEY automatically.
   */
});


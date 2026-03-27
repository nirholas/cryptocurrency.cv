/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { NEWS_VERTICALS } from './verticals';

// Example Article type (adjust as needed)
export interface Article {
  url: string;
  title: string;
  description: string;
  categories?: string[];
  source?: string;
}

function matchesVerticalPath(url: string, verticalSlug: string): boolean {
  // Simple path match: /business/, /tech/, etc.
  return url.includes(`/${verticalSlug}`);
}

export function classifyArticle(article: Article): string[] {
  const verticals: string[] = [];

  for (const vertical of NEWS_VERTICALS) {
    // Path-based classification
    if (matchesVerticalPath(article.url, vertical.slug)) {
      verticals.push(vertical.slug);
      continue;
    }

    // Keyword-based classification (title + description)
    const text = `${article.title} ${article.description}`.toLowerCase();
    const matchCount = vertical.keywords.filter((k) => text.includes(k.toLowerCase())).length;
    if (matchCount >= 2) {
      verticals.push(vertical.slug);
    }
  }

  return verticals.length > 0 ? verticals : ['general'];
}

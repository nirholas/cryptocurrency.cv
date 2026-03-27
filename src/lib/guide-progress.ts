/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

const STORAGE_KEY = 'guide-progress';

export interface GuideProgressData {
  /** Map of seriesSlug -> Set of completed article slugs */
  [seriesSlug: string]: string[];
}

export function getProgress(): GuideProgressData {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function markArticleComplete(seriesSlug: string, articleSlug: string): void {
  if (typeof window === 'undefined') return;
  const data = getProgress();
  const completed = new Set(data[seriesSlug] ?? []);
  completed.add(articleSlug);
  data[seriesSlug] = [...completed];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function markArticleIncomplete(seriesSlug: string, articleSlug: string): void {
  if (typeof window === 'undefined') return;
  const data = getProgress();
  const completed = new Set(data[seriesSlug] ?? []);
  completed.delete(articleSlug);
  data[seriesSlug] = [...completed];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function isArticleComplete(seriesSlug: string, articleSlug: string): boolean {
  const data = getProgress();
  return (data[seriesSlug] ?? []).includes(articleSlug);
}

export function getSeriesProgress(seriesSlug: string, totalArticles: number): number {
  const data = getProgress();
  const completed = (data[seriesSlug] ?? []).length;
  return totalArticles > 0 ? Math.round((completed / totalArticles) * 100) : 0;
}

export function getCompletedCount(seriesSlug: string): number {
  const data = getProgress();
  return (data[seriesSlug] ?? []).length;
}

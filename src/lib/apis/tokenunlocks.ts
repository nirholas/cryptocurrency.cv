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
 * Token Unlocks API
 *
 * Track upcoming token unlock schedules, vesting cliffs,
 * and emission calendars for major crypto projects.
 *
 * Requires TOKEN_UNLOCKS_API_KEY environment variable.
 *
 * @see https://token.unlocks.app/api
 * @module lib/apis/tokenunlocks
 */

import { resilientFetch } from '@/lib/resilient-fetch';
import { staleCache } from '@/lib/cache';

const BASE_URL = 'https://token.unlocks.app/api';
const API_KEY = process.env.TOKEN_UNLOCKS_API_KEY || '';

// =============================================================================
// Types
// =============================================================================

export interface TokenUnlock {
  id: string;
  name: string;
  symbol: string;
  icon?: string;
  nextUnlockDate: string;
  nextUnlockAmount: number;
  nextUnlockValueUsd: number;
  nextUnlockPercentCirculating: number;
  totalLocked: number;
  totalLockedUsd: number;
  circulatingSupply: number;
  maxSupply: number;
  price: number;
  impact: 'low' | 'medium' | 'high';
}

export interface UnlockScheduleEntry {
  date: string;
  amount: number;
  valueUsd: number;
  percentOfTotal: number;
  category: string;
  description?: string;
}

export interface TokenUnlockSchedule {
  projectId: string;
  name: string;
  symbol: string;
  totalAllocation: number;
  totalLocked: number;
  totalUnlocked: number;
  percentUnlocked: number;
  schedule: UnlockScheduleEntry[];
  categories: Array<{
    name: string;
    allocation: number;
    unlocked: number;
    remaining: number;
  }>;
}

export interface UnlockCalendarEntry {
  date: string;
  projects: Array<{
    name: string;
    symbol: string;
    amount: number;
    valueUsd: number;
    percentCirculating: number;
  }>;
  totalValueUsd: number;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch from Token Unlocks API with bearer auth.
 */
async function unlocksFetch<T>(path: string): Promise<T | null> {
  if (!API_KEY) {
    console.warn('Token Unlocks: TOKEN_UNLOCKS_API_KEY not set — skipping request');
    return null;
  }

  try {
    const { data, stale } = await resilientFetch<T>(`${BASE_URL}${path}`, {
      service: 'tokenunlocks',
      timeoutMs: 10_000,
      retries: 1,
      staleCache,
      staleCacheKey: `tokenunlocks:${path}`,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: 'application/json',
      },
      next: { revalidate: 3600 }, // 1 hour cache
    });
    if (stale) console.warn(`Token Unlocks API: upstream failed, serving last known good payload for ${path}`);
    return data;
  } catch (error) {
    console.error('Token Unlocks API request failed:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Unlock Data
// ---------------------------------------------------------------------------

/**
 * Get upcoming token unlocks sorted by date.
 *
 * Returns the soonest unlocks first, with impact scoring based on
 * unlock size relative to circulating supply.
 */
export async function getUpcomingUnlocks(): Promise<TokenUnlock[]> {
  const data = await unlocksFetch<
    Array<{
      id: string;
      name: string;
      symbol: string;
      icon?: string;
      next_event?: {
        date: string;
        amount: number;
        value_usd: number;
        percent_circulating: number;
      };
      total_locked: number;
      total_locked_usd: number;
      circulating_supply: number;
      max_supply: number;
      price: number;
    }>
  >('/upcoming');

  if (!data) return [];

  return data
    .filter((p) => p.next_event)
    .map((p) => {
      const pct = p.next_event!.percent_circulating || 0;
      return {
        id: p.id,
        name: p.name,
        symbol: p.symbol,
        icon: p.icon,
        nextUnlockDate: p.next_event!.date,
        nextUnlockAmount: p.next_event!.amount || 0,
        nextUnlockValueUsd: p.next_event!.value_usd || 0,
        nextUnlockPercentCirculating: pct,
        totalLocked: p.total_locked || 0,
        totalLockedUsd: p.total_locked_usd || 0,
        circulatingSupply: p.circulating_supply || 0,
        maxSupply: p.max_supply || 0,
        price: p.price || 0,
        impact: (pct > 5 ? 'high' : pct > 2 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
      };
    })
    .sort(
      (a, b) =>
        new Date(a.nextUnlockDate).getTime() - new Date(b.nextUnlockDate).getTime(),
    );
}

/**
 * Get the full unlock/vesting schedule for a project.
 *
 * @param projectId - Project slug or ID (e.g. "arbitrum", "optimism")
 */
export async function getTokenUnlockSchedule(
  projectId: string,
): Promise<TokenUnlockSchedule | null> {
  const data = await unlocksFetch<{
    project_id: string;
    name: string;
    symbol: string;
    total_allocation: number;
    total_locked: number;
    total_unlocked: number;
    percent_unlocked: number;
    schedule: Array<{
      date: string;
      amount: number;
      value_usd: number;
      percent_of_total: number;
      category: string;
      description?: string;
    }>;
    categories: Array<{
      name: string;
      allocation: number;
      unlocked: number;
      remaining: number;
    }>;
  }>(`/project/${encodeURIComponent(projectId)}`);

  if (!data) return null;

  return {
    projectId: data.project_id || projectId,
    name: data.name,
    symbol: data.symbol,
    totalAllocation: data.total_allocation || 0,
    totalLocked: data.total_locked || 0,
    totalUnlocked: data.total_unlocked || 0,
    percentUnlocked: data.percent_unlocked || 0,
    schedule: (data.schedule || []).map((e) => ({
      date: e.date,
      amount: e.amount || 0,
      valueUsd: e.value_usd || 0,
      percentOfTotal: e.percent_of_total || 0,
      category: e.category || 'Unknown',
      description: e.description,
    })),
    categories: (data.categories || []).map((c) => ({
      name: c.name,
      allocation: c.allocation || 0,
      unlocked: c.unlocked || 0,
      remaining: c.remaining || 0,
    })),
  };
}

/**
 * Get unlock calendar — aggregated unlock events by date.
 *
 * Returns a day-by-day calendar of all scheduled unlocks,
 * useful for identifying high-impact dates.
 */
export async function getUnlockCalendar(): Promise<UnlockCalendarEntry[]> {
  const data = await unlocksFetch<
    Array<{
      date: string;
      projects: Array<{
        name: string;
        symbol: string;
        amount: number;
        value_usd: number;
        percent_circulating: number;
      }>;
      total_value_usd: number;
    }>
  >('/calendar');

  if (!data) return [];

  return data.map((entry) => ({
    date: entry.date,
    projects: (entry.projects || []).map((p) => ({
      name: p.name,
      symbol: p.symbol,
      amount: p.amount || 0,
      valueUsd: p.value_usd || 0,
      percentCirculating: p.percent_circulating || 0,
    })),
    totalValueUsd: entry.total_value_usd || 0,
  }));
}

/**
 * Historical Archive System
 * Stores and retrieves historical crypto news data
 */

import { NewsArticle } from './crypto-news';

export interface ArchiveEntry {
  date: string; // YYYY-MM-DD format
  fetchedAt: string;
  articleCount: number;
  articles: NewsArticle[];
}

export interface ArchiveIndex {
  lastUpdated: string;
  totalArticles: number;
  dateRange: {
    earliest: string;
    latest: string;
  };
  availableDates: string[];
}

export interface ArchiveQueryOptions {
  startDate?: string;
  endDate?: string;
  source?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// GitHub raw content URL for archive files
const GITHUB_ARCHIVE_BASE = 'https://raw.githubusercontent.com/nirholas/free-crypto-news/main/archive';

/**
 * Fetch archive index from GitHub
 */
export async function getArchiveIndex(): Promise<ArchiveIndex | null> {
  try {
    const response = await fetch(`${GITHUB_ARCHIVE_BASE}/index.json`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Fetch archived articles for a specific date
 */
export async function getArchiveByDate(date: string): Promise<ArchiveEntry | null> {
  try {
    // Date format: YYYY-MM-DD -> archive/2024/01/2024-01-15.json
    const [year, month] = date.split('-');
    const response = await fetch(`${GITHUB_ARCHIVE_BASE}/${year}/${month}/${date}.json`, {
      next: { revalidate: 86400 } // Cache for 24 hours (historical data doesn't change)
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Query archived articles with filters
 */
export async function queryArchive(options: ArchiveQueryOptions): Promise<{
  articles: NewsArticle[];
  total: number;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}> {
  const {
    startDate,
    endDate,
    source,
    search,
    limit = 50,
    offset = 0
  } = options;

  // Get index to know available dates
  const index = await getArchiveIndex();
  if (!index) {
    return {
      articles: [],
      total: 0,
      pagination: { limit, offset, hasMore: false }
    };
  }

  // Filter dates within range
  let targetDates = index.availableDates;
  
  if (startDate) {
    targetDates = targetDates.filter(d => d >= startDate);
  }
  if (endDate) {
    targetDates = targetDates.filter(d => d <= endDate);
  }

  // Sort dates descending (newest first)
  targetDates.sort((a, b) => b.localeCompare(a));

  // Fetch articles from each date (limited to avoid too many requests)
  const maxDatesToFetch = 30;
  const datesToFetch = targetDates.slice(0, maxDatesToFetch);
  
  const archivePromises = datesToFetch.map(date => getArchiveByDate(date));
  const archives = await Promise.all(archivePromises);

  // Combine all articles
  let allArticles: NewsArticle[] = [];
  for (const archive of archives) {
    if (archive) {
      allArticles.push(...archive.articles);
    }
  }

  // Apply filters
  if (source) {
    allArticles = allArticles.filter(a => 
      a.source.toLowerCase().includes(source.toLowerCase())
    );
  }

  if (search) {
    const searchLower = search.toLowerCase();
    allArticles = allArticles.filter(a =>
      a.title.toLowerCase().includes(searchLower) ||
      (a.description?.toLowerCase().includes(searchLower))
    );
  }

  // Sort by date descending
  allArticles.sort((a, b) => 
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  const total = allArticles.length;
  const paginatedArticles = allArticles.slice(offset, offset + limit);

  return {
    articles: paginatedArticles,
    total,
    pagination: {
      limit,
      offset,
      hasMore: offset + limit < total
    }
  };
}

/**
 * Get archive statistics
 */
export async function getArchiveStats(): Promise<{
  totalArticles: number;
  dateRange: { earliest: string; latest: string };
  daysArchived: number;
  averagePerDay: number;
} | null> {
  const index = await getArchiveIndex();
  if (!index) return null;

  return {
    totalArticles: index.totalArticles,
    dateRange: index.dateRange,
    daysArchived: index.availableDates.length,
    averagePerDay: Math.round(index.totalArticles / index.availableDates.length)
  };
}

/**
 * Generate archive entry from current news (for GitHub Action)
 */
export function createArchiveEntry(articles: NewsArticle[], date: string): ArchiveEntry {
  return {
    date,
    fetchedAt: new Date().toISOString(),
    articleCount: articles.length,
    articles
  };
}

/**
 * Update archive index (for GitHub Action)
 */
export function updateArchiveIndex(
  currentIndex: ArchiveIndex | null,
  newEntry: ArchiveEntry
): ArchiveIndex {
  const existingDates = currentIndex?.availableDates || [];
  const allDates = [...new Set([...existingDates, newEntry.date])].sort();
  
  return {
    lastUpdated: new Date().toISOString(),
    totalArticles: (currentIndex?.totalArticles || 0) + newEntry.articleCount,
    dateRange: {
      earliest: allDates[0],
      latest: allDates[allDates.length - 1]
    },
    availableDates: allDates
  };
}

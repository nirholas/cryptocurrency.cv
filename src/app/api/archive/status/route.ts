/**
 * Archive Status & Health Check
 *
 * GET /api/archive/status - Check archive health and statistics
 *
 * No authentication required for status check.
 */

import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface ArchiveStats {
  healthy: boolean;
  storage: 'vercel-kv' | 'github' | 'none';
  lastArchived?: string;
  totalDays?: number;
  totalArticles?: number;
  dateRange?: {
    earliest: string;
    latest: string;
  };
  recentDays?: string[];
}

/**
 * Check KV store for archive data
 */
async function checkKvArchive(): Promise<Partial<ArchiveStats> | null> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null;
  }

  try {
    const { kv } = await import('@vercel/kv');

    // Get index of archived dates
    const index = await kv.get<string[]>('archive:index');

    if (!index || index.length === 0) {
      return {
        storage: 'vercel-kv',
        totalDays: 0,
        totalArticles: 0,
      };
    }

    // Get latest archive to count articles
    const latestDate = index[index.length - 1];
    const latestArchive = await kv.get<{ id: string }[]>(`archive:${latestDate}`);

    return {
      storage: 'vercel-kv',
      lastArchived: latestDate,
      totalDays: index.length,
      dateRange: {
        earliest: index[0],
        latest: latestDate,
      },
      recentDays: index.slice(-7),
      totalArticles: latestArchive?.length,
    };
  } catch (error) {
    console.error('KV check failed:', error);
    return null;
  }
}

/**
 * Check GitHub raw content for archive data
 */
async function checkGitHubArchive(): Promise<Partial<ArchiveStats> | null> {
  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/nirholas/free-crypto-news/main/archive/index.json',
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );

    if (!response.ok) {
      return null;
    }

    const index = await response.json();

    return {
      storage: 'github',
      lastArchived: index.dateRange?.latest,
      totalDays: index.availableDates?.length || 0,
      totalArticles: index.totalArticles,
      dateRange: index.dateRange,
      recentDays: index.availableDates?.slice(-7),
    };
  } catch {
    return null;
  }
}

/**
 * GET /api/archive/status
 */
export async function GET() {
  const stats: ArchiveStats = {
    healthy: false,
    storage: 'none',
  };

  // Check KV first (preferred)
  const kvStats = await checkKvArchive();
  if (kvStats) {
    Object.assign(stats, kvStats);
    stats.healthy = true;
  } else {
    // Fall back to GitHub archive
    const githubStats = await checkGitHubArchive();
    if (githubStats) {
      Object.assign(stats, githubStats);
      stats.healthy = true;
    }
  }

  // Check if archive is stale (>24 hours old)
  if (stats.lastArchived) {
    const lastDate = new Date(stats.lastArchived);
    const now = new Date();
    const hoursSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);

    if (hoursSince > 24) {
      stats.healthy = false;
    }
  }

  return NextResponse.json({
    ...stats,
    timestamp: new Date().toISOString(),
    endpoints: {
      archive: '/api/cron/archive',
      webhook: '/api/archive/webhook',
      query: '/api/archive',
      status: '/api/archive/status',
    },
    zeroConfigMode: !process.env.CRON_SECRET,
    setupInstructions: {
      zeroConfig: {
        description: 'No configuration needed! Endpoints work without any API keys.',
        testNow: 'Visit /api/cron/archive in your browser to trigger archiving',
      },
      cronJobOrg: {
        url: 'https://cron-job.org (FREE)',
        steps: [
          '1. Create free account at cron-job.org',
          '2. Click "CREATE CRONJOB"',
          '3. URL: https://cryptocurrency.cv/api/cron/archive',
          '4. Schedule: Every hour (0 * * * *)',
          '5. Save - done!',
        ],
      },
      uptimeRobot: {
        url: 'https://uptimerobot.com (FREE)',
        steps: [
          '1. Create free account',
          '2. Add New Monitor → HTTP(s)',
          '3. URL: https://cryptocurrency.cv/api/cron/archive',
          '4. Monitoring Interval: 1 hour',
          '5. Save',
        ],
      },
      manual: 'curl https://cryptocurrency.cv/api/cron/archive',
      withAuth: 'Set CRON_SECRET env var, then use ?secret=YOUR_SECRET',
    },
  });
}

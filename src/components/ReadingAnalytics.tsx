'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Clock, Eye, BookOpen, TrendingUp, Calendar, FileText } from 'lucide-react';

interface ReadingStats {
  totalArticles: number;
  totalTime: number; // in minutes
  streak: number;
  longestStreak: number;
  categoriesRead: { [key: string]: number };
  readingHistory: {
    date: string;
    articles: number;
    minutes: number;
  }[];
  recentArticles: {
    title: string;
    url: string;
    readAt: Date;
    timeSpent: number;
  }[];
}

function StatCard({ icon: Icon, label, value, subtext }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 dark:bg-gray-800/30 rounded-lg">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          {subtext && (
            <p className="text-xs text-gray-500">{subtext}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ReadingAnalytics() {
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load stats from localStorage
    const loadStats = () => {
      const saved = localStorage.getItem('reading-stats');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setStats({
            ...parsed,
            recentArticles: parsed.recentArticles?.map((a: { readAt: string | Date }) => ({
              ...a,
              readAt: new Date(a.readAt),
            })) || [],
          });
        } catch {
          // Initialize with defaults
          setStats(getDefaultStats());
        }
      } else {
        setStats(getDefaultStats());
      }
      setLoading(false);
    };

    loadStats();
  }, []);

  const getDefaultStats = (): ReadingStats => ({
    totalArticles: 0,
    totalTime: 0,
    streak: 0,
    longestStreak: 0,
    categoriesRead: {},
    readingHistory: [],
    recentArticles: [],
  });

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getTopCategory = (): string => {
    if (!stats || Object.keys(stats.categoriesRead).length === 0) return 'None';
    const entries = Object.entries(stats.categoriesRead);
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p>No reading data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-gray-400" />
        Your Reading Stats
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Articles Read"
          value={stats.totalArticles}
          subtext="All time"
        />
        <StatCard
          icon={Clock}
          label="Time Reading"
          value={formatTime(stats.totalTime)}
          subtext="Total"
        />
        <StatCard
          icon={TrendingUp}
          label="Current Streak"
          value={`${stats.streak} days`}
          subtext={`Best: ${stats.longestStreak} days`}
        />
        <StatCard
          icon={Eye}
          label="Top Category"
          value={getTopCategory()}
          subtext={stats.categoriesRead[getTopCategory()] ? `${stats.categoriesRead[getTopCategory()]} articles` : ''}
        />
      </div>

      {/* Reading History Chart */}
      {stats.readingHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Reading Activity (Last 7 Days)
          </h3>
          <div className="h-32 flex items-end gap-2">
            {stats.readingHistory.slice(-7).map((day, i) => {
              const maxArticles = Math.max(...stats.readingHistory.map(d => d.articles));
              const height = maxArticles > 0 ? (day.articles / maxArticles) * 100 : 0;
              
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-gray-400 rounded-t transition-all hover:bg-gray-500"
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${day.articles} articles, ${day.minutes}m`}
                  />
                  <span className="text-xs text-gray-500">
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Categories Breakdown */}
      {Object.keys(stats.categoriesRead).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Categories
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.categoriesRead)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([category, count]) => {
                const total = Object.values(stats.categoriesRead).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;
                
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{category}</span>
                      <span className="text-gray-500">{count} articles</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-400 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Recent Articles */}
      {stats.recentArticles.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Recently Read</h3>
          <div className="space-y-3">
            {stats.recentArticles.slice(0, 5).map((article, i) => (
              <a
                key={i}
                href={article.url}
                className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <p className="font-medium text-sm line-clamp-1">{article.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {article.readAt.toLocaleDateString()} • {article.timeSpent}m read
                </p>
              </a>
            ))}
          </div>
        </div>
      )}

      {stats.totalArticles === 0 && (
        <div className="text-center py-8 text-gray-500 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Start reading articles to see your stats!</p>
          <p className="text-sm">Your reading history is stored locally and never shared.</p>
        </div>
      )}
    </div>
  );
}

// Hook to track reading
export function useReadingTracker(articleId: string, category: string) {
  useEffect(() => {
    const startTime = Date.now();

    return () => {
      const timeSpent = Math.round((Date.now() - startTime) / 60000); // minutes
      if (timeSpent < 1) return; // Ignore very short visits

      // Update stats
      const saved = localStorage.getItem('reading-stats');
      const stats: ReadingStats = saved ? JSON.parse(saved) : {
        totalArticles: 0,
        totalTime: 0,
        streak: 0,
        longestStreak: 0,
        categoriesRead: {},
        readingHistory: [],
        recentArticles: [],
      };

      stats.totalArticles += 1;
      stats.totalTime += timeSpent;
      stats.categoriesRead[category] = (stats.categoriesRead[category] || 0) + 1;

      // Update streak
      const today = new Date().toDateString();
      const lastRead = localStorage.getItem('last-read-date');
      
      if (lastRead === today) {
        // Same day, no streak change
      } else if (lastRead === new Date(Date.now() - 86400000).toDateString()) {
        // Yesterday, continue streak
        stats.streak += 1;
        stats.longestStreak = Math.max(stats.streak, stats.longestStreak);
      } else {
        // Streak broken
        stats.streak = 1;
      }
      
      localStorage.setItem('last-read-date', today);

      // Update reading history
      const historyDate = new Date().toISOString().split('T')[0];
      const historyIndex = stats.readingHistory.findIndex(h => h.date === historyDate);
      
      if (historyIndex >= 0) {
        stats.readingHistory[historyIndex].articles += 1;
        stats.readingHistory[historyIndex].minutes += timeSpent;
      } else {
        stats.readingHistory.push({
          date: historyDate,
          articles: 1,
          minutes: timeSpent,
        });
      }

      // Keep only last 30 days
      stats.readingHistory = stats.readingHistory.slice(-30);

      localStorage.setItem('reading-stats', JSON.stringify(stats));
    };
  }, [articleId, category]);
}

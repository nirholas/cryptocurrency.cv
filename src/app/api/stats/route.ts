import { NextResponse } from 'next/server';
import { getLatestNews, getSources } from '@/lib/crypto-news';

export const runtime = 'edge';
export const revalidate = 300; // 5 minutes

interface HourlyCount {
  hour: string;
  count: number;
}

interface SourceStats {
  source: string;
  articleCount: number;
  percentage: number;
  latestArticle?: string;
  latestTime?: string;
}

export async function GET() {
  try {
    const [newsData, sourcesData] = await Promise.all([
      getLatestNews(100),
      getSources(),
    ]);
    
    const articles = newsData.articles;
    const totalArticleCount = newsData.totalCount || articles.length;
    const now = new Date();
    
    // Articles per source
    const sourceCountMap = new Map<string, { count: number; latest?: { title: string; time: string } }>();
    
    for (const article of articles) {
      const existing = sourceCountMap.get(article.source) || { count: 0 };
      existing.count++;
      if (!existing.latest) {
        existing.latest = { title: article.title, time: article.pubDate };
      }
      sourceCountMap.set(article.source, existing);
    }
    
    const bySource: SourceStats[] = Array.from(sourceCountMap.entries())
      .map(([source, data]) => ({
        source,
        articleCount: data.count,
        percentage: Math.round((data.count / articles.length) * 100),
        latestArticle: data.latest?.title,
        latestTime: data.latest?.time,
      }))
      .sort((a, b) => b.articleCount - a.articleCount);
    
    // Hourly distribution (last 24 hours)
    const hourlyMap = new Map<string, number>();
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const key = hour.toISOString().slice(0, 13) + ':00';
      hourlyMap.set(key, 0);
    }
    
    for (const article of articles) {
      const pubDate = new Date(article.pubDate);
      const key = pubDate.toISOString().slice(0, 13) + ':00';
      if (hourlyMap.has(key)) {
        hourlyMap.set(key, (hourlyMap.get(key) || 0) + 1);
      }
    }
    
    const hourlyDistribution: HourlyCount[] = Array.from(hourlyMap.entries())
      .map(([hour, count]) => ({ hour, count }));
    
    // Category breakdown
    const categoryMap = new Map<string, number>();
    for (const article of articles) {
      const cat = article.category || 'general';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    }
    
    const byCategory = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
    
    // Average articles per hour (use total count, not capped sample)
    const totalHours = 24;
    const avgPerHour = Math.round((totalArticleCount / totalHours) * 10) / 10;
    
    // Active sources count
    const activeSources = sourcesData.sources.filter(s => s.status === 'active').length;
    
    return NextResponse.json({
      summary: {
        totalArticles: totalArticleCount,
        activeSources,
        totalSources: sourcesData.sources.length,
        avgArticlesPerHour: avgPerHour,
        timeRange: '24h',
      },
      bySource,
      byCategory,
      hourlyDistribution,
      fetchedAt: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get stats', message: String(error) },
      { status: 500 }
    );
  }
}

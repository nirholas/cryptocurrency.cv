import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews, NewsArticle } from '@/lib/crypto-news';

export const runtime = 'edge';

/**
 * Known original sources and their patterns
 * Maps aggregator sources to potential original sources
 */
const ORIGINAL_SOURCE_PATTERNS: Record<string, {
  patterns: RegExp[];
  sourceName: string;
  type: 'official' | 'press-release' | 'social' | 'blog' | 'government';
}[]> = {
  // Company/Project announcements
  company: [
    { patterns: [/announced/i, /launches/i, /unveils/i, /introduces/i], sourceName: 'Company PR', type: 'press-release' },
    { patterns: [/according to .+ blog/i, /blog post/i], sourceName: 'Official Blog', type: 'blog' },
  ],
  // Regulatory/Government
  regulatory: [
    { patterns: [/SEC /i, /securities and exchange/i], sourceName: 'SEC', type: 'government' },
    { patterns: [/CFTC/i, /commodity futures/i], sourceName: 'CFTC', type: 'government' },
    { patterns: [/Federal Reserve/i, /Fed /i, /Jerome Powell/i], sourceName: 'Federal Reserve', type: 'government' },
    { patterns: [/Treasury/i, /Janet Yellen/i], sourceName: 'US Treasury', type: 'government' },
    { patterns: [/EU /i, /European Commission/i, /MiCA/i], sourceName: 'EU Regulators', type: 'government' },
    { patterns: [/DOJ/i, /Department of Justice/i], sourceName: 'DOJ', type: 'government' },
  ],
  // Social media origins
  social: [
    { patterns: [/tweeted/i, /on X/i, /on Twitter/i, /posted on X/i], sourceName: 'X (Twitter)', type: 'social' },
    { patterns: [/Discord/i, /Discord server/i], sourceName: 'Discord', type: 'social' },
    { patterns: [/Telegram/i, /Telegram group/i], sourceName: 'Telegram', type: 'social' },
    { patterns: [/Reddit/i, /subreddit/i, /r\//i], sourceName: 'Reddit', type: 'social' },
  ],
  // Exchanges
  exchanges: [
    { patterns: [/Binance/i], sourceName: 'Binance', type: 'official' },
    { patterns: [/Coinbase/i], sourceName: 'Coinbase', type: 'official' },
    { patterns: [/Kraken/i], sourceName: 'Kraken', type: 'official' },
    { patterns: [/FTX/i], sourceName: 'FTX', type: 'official' },
    { patterns: [/OKX/i], sourceName: 'OKX', type: 'official' },
    { patterns: [/Bybit/i], sourceName: 'Bybit', type: 'official' },
  ],
  // Blockchain/Protocol
  protocols: [
    { patterns: [/Ethereum Foundation/i], sourceName: 'Ethereum Foundation', type: 'official' },
    { patterns: [/Bitcoin Core/i], sourceName: 'Bitcoin Core', type: 'official' },
    { patterns: [/Solana Labs/i, /Solana Foundation/i], sourceName: 'Solana', type: 'official' },
    { patterns: [/Polygon/i, /Polygon Labs/i], sourceName: 'Polygon', type: 'official' },
    { patterns: [/Arbitrum/i, /Offchain Labs/i], sourceName: 'Arbitrum', type: 'official' },
    { patterns: [/Optimism/i, /OP Labs/i], sourceName: 'Optimism', type: 'official' },
    { patterns: [/Chainlink/i], sourceName: 'Chainlink', type: 'official' },
    { patterns: [/Uniswap/i, /Uniswap Labs/i], sourceName: 'Uniswap', type: 'official' },
    { patterns: [/Aave/i], sourceName: 'Aave', type: 'official' },
    { patterns: [/MakerDAO/i, /Maker/i], sourceName: 'MakerDAO', type: 'official' },
  ],
  // Research/Data
  research: [
    { patterns: [/Glassnode/i], sourceName: 'Glassnode', type: 'official' },
    { patterns: [/Chainalysis/i], sourceName: 'Chainalysis', type: 'official' },
    { patterns: [/Messari/i], sourceName: 'Messari', type: 'official' },
    { patterns: [/Dune/i, /Dune Analytics/i], sourceName: 'Dune Analytics', type: 'official' },
    { patterns: [/DefiLlama/i], sourceName: 'DefiLlama', type: 'official' },
    { patterns: [/CoinGecko/i], sourceName: 'CoinGecko', type: 'official' },
    { patterns: [/CoinMarketCap/i], sourceName: 'CoinMarketCap', type: 'official' },
  ],
  // Notable figures
  figures: [
    { patterns: [/Vitalik Buterin/i, /Vitalik/i], sourceName: 'Vitalik Buterin', type: 'social' },
    { patterns: [/CZ/i, /Changpeng Zhao/i], sourceName: 'CZ (Binance)', type: 'social' },
    { patterns: [/Michael Saylor/i, /MicroStrategy/i], sourceName: 'Michael Saylor', type: 'social' },
    { patterns: [/Elon Musk/i], sourceName: 'Elon Musk', type: 'social' },
    { patterns: [/Gary Gensler/i], sourceName: 'SEC Chair', type: 'government' },
  ],
};

interface OriginalSourceResult {
  found: boolean;
  sources: {
    name: string;
    type: 'official' | 'press-release' | 'social' | 'blog' | 'government';
    confidence: 'high' | 'medium' | 'low';
    matchedText?: string;
  }[];
  article: NewsArticle;
}

/**
 * Find potential original sources for an article
 */
function findOriginalSources(article: NewsArticle): OriginalSourceResult {
  const text = `${article.title} ${article.description || ''}`;
  const foundSources: OriginalSourceResult['sources'] = [];
  
  // Check all pattern categories
  for (const category of Object.values(ORIGINAL_SOURCE_PATTERNS)) {
    for (const sourcePattern of category) {
      for (const pattern of sourcePattern.patterns) {
        const match = text.match(pattern);
        if (match) {
          // Avoid duplicates
          if (!foundSources.find(s => s.name === sourcePattern.sourceName)) {
            foundSources.push({
              name: sourcePattern.sourceName,
              type: sourcePattern.type,
              confidence: determineConfidence(match[0], text),
              matchedText: match[0]
            });
          }
          break; // Found match for this source, move to next
        }
      }
    }
  }
  
  return {
    found: foundSources.length > 0,
    sources: foundSources,
    article
  };
}

/**
 * Determine confidence level based on match context
 */
function determineConfidence(matchedText: string, fullText: string): 'high' | 'medium' | 'low' {
  // High confidence indicators
  const highConfidence = [
    /announced/i, /confirmed/i, /stated/i, /according to/i,
    /official/i, /press release/i, /blog post/i
  ];
  
  for (const pattern of highConfidence) {
    if (pattern.test(fullText)) {
      return 'high';
    }
  }
  
  // Medium confidence - direct mention
  const mediumConfidence = [/said/i, /reported/i, /revealed/i, /disclosed/i];
  
  for (const pattern of mediumConfidence) {
    if (pattern.test(fullText)) {
      return 'medium';
    }
  }
  
  return 'low';
}

/**
 * GET /api/origins - Find original sources for news articles
 * 
 * Query Parameters:
 * - limit: Number of articles to analyze (1-50)
 * - q: Search query to filter articles first
 * - source_type: Filter by source type (official, press-release, social, blog, government)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const query = searchParams.get('q') || '';
    const sourceType = searchParams.get('source_type') || '';
    
    // Fetch articles
    const newsData = await getLatestNews(100);
    let articles: NewsArticle[] = newsData.articles;
    
    // Filter by search query if provided
    if (query) {
      const queryLower = query.toLowerCase();
      articles = articles.filter((a: NewsArticle) => 
        a.title.toLowerCase().includes(queryLower) ||
        (a.description?.toLowerCase().includes(queryLower))
      );
    }
    
    // Analyze each article for original sources
    const results: OriginalSourceResult[] = [];
    
    for (const article of articles.slice(0, limit)) {
      const result = findOriginalSources(article);
      
      // Filter by source type if specified
      if (sourceType) {
        result.sources = result.sources.filter(s => s.type === sourceType);
        result.found = result.sources.length > 0;
      }
      
      results.push(result);
    }
    
    // Separate articles with and without found origins
    const withOrigins = results.filter(r => r.found);
    const withoutOrigins = results.filter(r => !r.found);
    
    // Aggregate source statistics
    const sourceStats: Record<string, { count: number; type: string }> = {};
    for (const result of withOrigins) {
      for (const source of result.sources) {
        if (!sourceStats[source.name]) {
          sourceStats[source.name] = { count: 0, type: source.type };
        }
        sourceStats[source.name].count++;
      }
    }
    
    const topSources = Object.entries(sourceStats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return NextResponse.json({
      success: true,
      analyzed: results.length,
      summary: {
        withOriginsFound: withOrigins.length,
        withoutOriginsFound: withoutOrigins.length,
        percentageTracked: Math.round((withOrigins.length / results.length) * 100),
      },
      topOriginalSources: topSources,
      articles: withOrigins.map(r => ({
        title: r.article.title,
        aggregatorSource: r.article.source,
        link: r.article.link,
        pubDate: r.article.pubDate,
        originalSources: r.sources
      })),
      untracked: withoutOrigins.slice(0, 10).map(r => ({
        title: r.article.title,
        source: r.article.source,
        link: r.article.link,
        reason: 'No identifiable original source pattern found'
      }))
    });
    
  } catch (error) {
    console.error('Origins API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze origins',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/origins - Analyze a specific article URL
 * 
 * Body:
 * {
 *   "title": "Article title",
 *   "description": "Article description or content"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description } = body;
    
    if (!title) {
      return NextResponse.json({
        success: false,
        error: 'Missing title'
      }, { status: 400 });
    }
    
    const mockArticle = {
      title,
      description: description || '',
      link: '',
      pubDate: new Date().toISOString(),
      source: 'Custom',
      sourceKey: 'custom',
      category: 'general',
      timeAgo: 'just now'
    } as NewsArticle;
    
    const result = findOriginalSources(mockArticle);
    
    return NextResponse.json({
      success: true,
      found: result.found,
      originalSources: result.sources,
      tips: result.found ? null : [
        'No original source detected. The article may be:',
        '• Original reporting by the aggregator',
        '• Based on anonymous sources',
        '• Compiled from multiple sources',
        '• Missing attribution in the excerpt'
      ]
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';

export const runtime = 'edge';
export const revalidate = 300; // 5 minutes

interface TrendingTopic {
  topic: string;
  count: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  recentHeadlines: string[];
}

// Common crypto topics to track
const TRACKED_TOPICS = [
  { pattern: /bitcoin|btc/i, name: 'Bitcoin' },
  { pattern: /ethereum|eth(?!er)/i, name: 'Ethereum' },
  { pattern: /solana|sol(?!id|ution)/i, name: 'Solana' },
  { pattern: /xrp|ripple/i, name: 'XRP' },
  { pattern: /cardano|ada/i, name: 'Cardano' },
  { pattern: /dogecoin|doge/i, name: 'Dogecoin' },
  { pattern: /polygon|matic/i, name: 'Polygon' },
  { pattern: /avalanche|avax/i, name: 'Avalanche' },
  { pattern: /chainlink|link/i, name: 'Chainlink' },
  { pattern: /defi|decentralized finance/i, name: 'DeFi' },
  { pattern: /nft|non.?fungible/i, name: 'NFTs' },
  { pattern: /etf/i, name: 'ETF' },
  { pattern: /sec|securities/i, name: 'SEC/Regulation' },
  { pattern: /stablecoin|usdt|usdc|tether/i, name: 'Stablecoins' },
  { pattern: /layer.?2|l2|rollup/i, name: 'Layer 2' },
  { pattern: /ai|artificial intelligence/i, name: 'AI' },
  { pattern: /hack|exploit|breach/i, name: 'Security' },
  { pattern: /airdrop/i, name: 'Airdrops' },
  { pattern: /memecoin|meme coin/i, name: 'Memecoins' },
  { pattern: /binance|bnb/i, name: 'Binance' },
  { pattern: /coinbase/i, name: 'Coinbase' },
  { pattern: /blackrock|fidelity|grayscale/i, name: 'Institutions' },
];

// Sentiment keywords
const BULLISH_WORDS = ['surge', 'soar', 'rally', 'bullish', 'gains', 'ath', 'high', 'pump', 'moon', 'breakthrough', 'adoption', 'approval', 'launch', 'partnership'];
const BEARISH_WORDS = ['crash', 'plunge', 'bearish', 'dump', 'decline', 'drop', 'low', 'sell', 'fear', 'hack', 'exploit', 'lawsuit', 'ban', 'delay', 'reject'];

function analyzeSentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
  const lowerText = text.toLowerCase();
  let bullishScore = 0;
  let bearishScore = 0;
  
  for (const word of BULLISH_WORDS) {
    if (lowerText.includes(word)) bullishScore++;
  }
  for (const word of BEARISH_WORDS) {
    if (lowerText.includes(word)) bearishScore++;
  }
  
  if (bullishScore > bearishScore + 1) return 'bullish';
  if (bearishScore > bullishScore + 1) return 'bearish';
  return 'neutral';
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);
  const hours = Math.min(parseInt(searchParams.get('hours') || '24'), 72);
  
  try {
    // Fetch recent news
    const data = await getLatestNews(100);
    
    // Filter by time window
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentArticles = data.articles.filter(a => new Date(a.pubDate) > cutoffTime);
    
    // Count topic mentions
    const topicCounts = new Map<string, { count: number; headlines: string[]; texts: string[] }>();
    
    for (const article of recentArticles) {
      const searchText = `${article.title} ${article.description || ''}`;
      
      for (const { pattern, name } of TRACKED_TOPICS) {
        if (pattern.test(searchText)) {
          const existing = topicCounts.get(name) || { count: 0, headlines: [], texts: [] };
          existing.count++;
          if (existing.headlines.length < 3) {
            existing.headlines.push(article.title);
          }
          existing.texts.push(searchText);
          topicCounts.set(name, existing);
        }
      }
    }
    
    // Convert to array and sort by count
    const trending: TrendingTopic[] = Array.from(topicCounts.entries())
      .map(([topic, data]) => ({
        topic,
        count: data.count,
        sentiment: analyzeSentiment(data.texts.join(' ')),
        recentHeadlines: data.headlines,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return NextResponse.json({
      trending,
      timeWindow: `${hours}h`,
      articlesAnalyzed: recentArticles.length,
      fetchedAt: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get trending topics', message: String(error) },
      { status: 500 }
    );
  }
}

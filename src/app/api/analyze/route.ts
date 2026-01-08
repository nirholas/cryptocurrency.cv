import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';

export const runtime = 'edge';
export const revalidate = 300;

// Topic classification patterns
const TOPICS = {
  'Bitcoin': /bitcoin|btc|satoshi|lightning network|halving|ordinals/i,
  'Ethereum': /ethereum|eth(?!er)|vitalik|eip|layer 2|rollup/i,
  'DeFi': /defi|yield|lending|liquidity|amm|dex|aave|uniswap|compound|curve|lido|staking|tvl/i,
  'NFTs': /nft|non.?fungible|opensea|blur|ordinals|inscription/i,
  'Regulation': /sec|cftc|regulation|lawsuit|legal|compliance|license|ban|congress|senate/i,
  'Exchange': /binance|coinbase|kraken|okx|bybit|exchange|trading|listing/i,
  'Stablecoins': /stablecoin|usdt|usdc|tether|dai|circle|paxos/i,
  'Layer 1': /solana|cardano|avalanche|polygon|bnb chain|cosmos|near|aptos|sui/i,
  'Layer 2': /arbitrum|optimism|base|zksync|starknet|polygon zkevm|l2|rollup/i,
  'AI & Crypto': /ai|artificial intelligence|machine learning|chatgpt|openai/i,
  'Gaming': /gamefi|gaming|metaverse|play.?to.?earn|axie|sandbox|decentraland/i,
  'Security': /hack|exploit|breach|vulnerability|scam|rug.?pull|phishing/i,
  'Mining': /mining|miner|hashrate|difficulty|asic|pow/i,
  'Institutions': /blackrock|fidelity|grayscale|institutional|etf|wall street|bank/i,
  'Memecoins': /memecoin|meme coin|doge|shib|pepe|bonk|wif/i,
};

// Sentiment analysis
const BULLISH_WORDS = ['surge', 'soar', 'rally', 'bullish', 'gains', 'ath', 'all-time high', 'pump', 'moon', 'breakthrough', 'adoption', 'approval', 'launch', 'partnership', 'growth', 'record', 'milestone'];
const BEARISH_WORDS = ['crash', 'plunge', 'bearish', 'dump', 'decline', 'drop', 'low', 'sell-off', 'fear', 'hack', 'exploit', 'lawsuit', 'ban', 'delay', 'reject', 'investigation', 'fraud', 'collapse'];

function classifyTopics(text: string): string[] {
  const topics: string[] = [];
  for (const [topic, pattern] of Object.entries(TOPICS)) {
    if (pattern.test(text)) {
      topics.push(topic);
    }
  }
  return topics.length > 0 ? topics : ['General'];
}

function analyzeSentiment(text: string): { sentiment: 'bullish' | 'bearish' | 'neutral'; score: number } {
  const lowerText = text.toLowerCase();
  let bullishScore = 0;
  let bearishScore = 0;
  
  for (const word of BULLISH_WORDS) {
    if (lowerText.includes(word)) bullishScore++;
  }
  for (const word of BEARISH_WORDS) {
    if (lowerText.includes(word)) bearishScore++;
  }
  
  const totalScore = bullishScore + bearishScore;
  if (totalScore === 0) {
    return { sentiment: 'neutral', score: 0 };
  }
  
  const normalizedScore = (bullishScore - bearishScore) / totalScore;
  
  if (normalizedScore > 0.3) return { sentiment: 'bullish', score: normalizedScore };
  if (normalizedScore < -0.3) return { sentiment: 'bearish', score: normalizedScore };
  return { sentiment: 'neutral', score: normalizedScore };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const topic = searchParams.get('topic') || undefined;
  const sentiment = searchParams.get('sentiment') as 'bullish' | 'bearish' | 'neutral' | undefined;
  
  try {
    const data = await getLatestNews(100);
    
    // Classify and analyze each article
    let classifiedArticles = data.articles.map(article => {
      const text = `${article.title} ${article.description || ''}`;
      const topics = classifyTopics(text);
      const sentimentAnalysis = analyzeSentiment(text);
      
      return {
        ...article,
        topics,
        sentiment: sentimentAnalysis.sentiment,
        sentimentScore: Math.round(sentimentAnalysis.score * 100) / 100,
      };
    });
    
    // Filter by topic if specified
    if (topic) {
      const topicLower = topic.toLowerCase();
      classifiedArticles = classifiedArticles.filter(a => 
        a.topics.some(t => t.toLowerCase().includes(topicLower))
      );
    }
    
    // Filter by sentiment if specified
    if (sentiment) {
      classifiedArticles = classifiedArticles.filter(a => a.sentiment === sentiment);
    }
    
    // Calculate aggregates
    const topicCounts: Record<string, number> = {};
    const sentimentCounts = { bullish: 0, bearish: 0, neutral: 0 };
    
    for (const article of classifiedArticles) {
      for (const t of article.topics) {
        topicCounts[t] = (topicCounts[t] || 0) + 1;
      }
      sentimentCounts[article.sentiment]++;
    }
    
    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));
    
    return NextResponse.json({
      articles: classifiedArticles.slice(0, limit),
      totalCount: classifiedArticles.length,
      analysis: {
        topTopics,
        sentimentBreakdown: sentimentCounts,
        overallSentiment: sentimentCounts.bullish > sentimentCounts.bearish ? 'bullish' : 
                          sentimentCounts.bearish > sentimentCounts.bullish ? 'bearish' : 'neutral',
      },
      availableTopics: Object.keys(TOPICS),
      fetchedAt: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to analyze news', message: String(error) },
      { status: 500 }
    );
  }
}

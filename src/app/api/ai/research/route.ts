/**
 * AI Research Agent API
 * 
 * Deep-dive research on any crypto topic.
 * 
 * GET /api/ai/research?topic=Bitcoin
 * GET /api/ai/research?topic=Solana&mode=quick
 * GET /api/ai/research?compare=BTC,ETH
 * GET /api/ai/research?contrarian=true
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { getTopCoins } from '@/lib/market-data';
import { 
  generateResearchReport,
  generateQuickTake,
  compareAssets,
  findContrarianOpportunities,
} from '@/lib/ai-research-agent';
import { isGroqConfigured } from '@/lib/groq';

export const runtime = 'edge';
export const revalidate = 300; // 5 minutes

// Topic patterns
const TOPIC_PATTERNS: Record<string, RegExp> = {
  'bitcoin': /bitcoin|btc/i,
  'ethereum': /ethereum|eth(?!er)/i,
  'solana': /solana|sol(?!id|ution)/i,
  'xrp': /xrp|ripple/i,
  'cardano': /cardano|ada/i,
  'polygon': /polygon|matic/i,
  'avalanche': /avalanche|avax/i,
  'chainlink': /chainlink|link/i,
  'defi': /defi|decentralized finance/i,
  'nft': /nft|non.?fungible/i,
  'etf': /etf/i,
  'layer2': /layer.?2|l2|rollup/i,
  'ai': /\bai\b|artificial intelligence/i,
};

export async function GET(request: NextRequest) {
  if (!isGroqConfigured()) {
    return NextResponse.json(
      { error: 'AI features require GROQ_API_KEY configuration' },
      { status: 503 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const topic = searchParams.get('topic');
  const mode = searchParams.get('mode'); // 'quick' for quick take
  const compare = searchParams.get('compare'); // 'BTC,ETH'
  const contrarian = searchParams.get('contrarian') === 'true';

  try {
    // Fetch news and market data in parallel
    const [newsData, priceData] = await Promise.all([
      getLatestNews(100),
      getTopCoins(50).catch(() => []),
    ]);

    // Contrarian opportunities mode
    if (contrarian) {
      // Determine market sentiment from fear & greed or price action
      const btc = priceData.find(c => c.symbol.toLowerCase() === 'btc');
      const marketSentiment: 'fearful' | 'neutral' | 'greedy' = 
        btc && btc.price_change_percentage_24h < -5 ? 'fearful' :
        btc && btc.price_change_percentage_24h > 5 ? 'greedy' : 'neutral';

      const opportunities = await findContrarianOpportunities(
        newsData.articles.map(a => a.title),
        marketSentiment
      );

      return NextResponse.json({
        success: true,
        ...opportunities,
      });
    }

    // Compare mode
    if (compare) {
      const [asset1Name, asset2Name] = compare.split(',').map(s => s.trim());
      if (!asset1Name || !asset2Name) {
        return NextResponse.json(
          { error: 'compare parameter must be in format "BTC,ETH"' },
          { status: 400 }
        );
      }

      const pattern1 = TOPIC_PATTERNS[asset1Name.toLowerCase()] || new RegExp(asset1Name, 'i');
      const pattern2 = TOPIC_PATTERNS[asset2Name.toLowerCase()] || new RegExp(asset2Name, 'i');

      const asset1Headlines = newsData.articles
        .filter(a => pattern1.test(a.title) || pattern1.test(a.description || ''))
        .map(a => a.title);
      const asset2Headlines = newsData.articles
        .filter(a => pattern2.test(a.title) || pattern2.test(a.description || ''))
        .map(a => a.title);

      if (asset1Headlines.length === 0 || asset2Headlines.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Not enough news found for one or both assets',
          asset1Count: asset1Headlines.length,
          asset2Count: asset2Headlines.length,
        });
      }

      const comparison = await compareAssets(
        { name: asset1Name, headlines: asset1Headlines },
        { name: asset2Name, headlines: asset2Headlines }
      );

      return NextResponse.json({
        success: true,
        ...comparison,
      });
    }

    // Topic research mode
    if (!topic) {
      return NextResponse.json({
        error: 'topic parameter is required',
        examples: [
          '/api/ai/research?topic=Bitcoin',
          '/api/ai/research?topic=DeFi&mode=quick',
          '/api/ai/research?compare=BTC,ETH',
          '/api/ai/research?contrarian=true',
        ],
        availableTopics: Object.keys(TOPIC_PATTERNS),
      }, { status: 400 });
    }

    // Find relevant headlines
    const pattern = TOPIC_PATTERNS[topic.toLowerCase()] || new RegExp(topic, 'i');
    const relevantArticles = newsData.articles.filter(a => 
      pattern.test(a.title) || pattern.test(a.description || '')
    );

    if (relevantArticles.length === 0) {
      return NextResponse.json({
        success: false,
        error: `No recent news found for "${topic}"`,
        suggestion: 'Try a broader topic or one from the available list',
        availableTopics: Object.keys(TOPIC_PATTERNS),
      });
    }

    const headlines = relevantArticles.map(a => a.title);

    // Get price data if available
    const coin = priceData.find(c => 
      pattern.test(c.name) || pattern.test(c.symbol)
    );

    const additionalContext = coin ? {
      priceData: {
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h || 0,
        change7d: coin.price_change_percentage_7d_in_currency || 0,
      },
      marketCap: coin.market_cap,
      volume: coin.total_volume,
    } : undefined;

    // Quick take mode
    if (mode === 'quick') {
      const quickTake = await generateQuickTake(topic, headlines);
      return NextResponse.json({
        success: true,
        quickTake,
        articlesAnalyzed: relevantArticles.length,
      });
    }

    // Full research report
    const report = await generateResearchReport(topic, headlines, additionalContext);

    return NextResponse.json({
      success: true,
      report,
      articlesAnalyzed: relevantArticles.length,
    });
  } catch (error) {
    console.error('Research API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate research', details: String(error) },
      { status: 500 }
    );
  }
}

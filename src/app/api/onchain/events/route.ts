import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { promptGroqJsonCached, isGroqConfigured } from '@/lib/groq';
import { groqNotConfiguredResponse } from '@/app/api/_utils';

export const runtime = 'edge';
export const revalidate = 300; // 5 minute cache

/**
 * On-Chain Events Linking API
 * 
 * Links crypto news articles to on-chain events like:
 * - Large transfers and whale movements
 * - Smart contract deployments
 * - Token launches and burns
 * - Governance votes and proposals
 * - Exchange deposits/withdrawals
 * - Bridge transactions
 * - Protocol upgrades
 */

interface OnChainEvent {
  type: 'transfer' | 'deployment' | 'mint' | 'burn' | 'governance' | 'exchange' | 'bridge' | 'upgrade' | 'hack' | 'other';
  chain: string;
  asset?: string;
  protocol?: string;
  valueUsd?: number;
  txHash?: string;
  blockNumber?: number;
  timestamp?: string;
  fromAddress?: string;
  toAddress?: string;
  description: string;
}

interface NewsOnChainLink {
  articleTitle: string;
  articleLink: string;
  articleSource: string;
  publishedAt: string;
  events: OnChainEvent[];
  confidence: number;
  relevanceScore: number;
}

interface OnChainAnalysisResponse {
  links: {
    articleTitle: string;
    events: OnChainEvent[];
    confidence: number;
  }[];
}

const SYSTEM_PROMPT = `You are an on-chain event detection system specialized in cryptocurrency.

Analyze crypto news articles and identify any on-chain events mentioned or implied.

For each article, extract on-chain events including:

1. Event Type:
   - transfer: Large token transfers, whale movements
   - deployment: Smart contract deployments
   - mint: Token minting, NFT creation
   - burn: Token burning, supply reduction
   - governance: DAO votes, proposal submissions
   - exchange: CEX deposits/withdrawals
   - bridge: Cross-chain transfers
   - upgrade: Protocol upgrades, hard forks
   - hack: Exploits, hacks, security incidents
   - other: Other on-chain activity

2. Chain: Ethereum, Bitcoin, Solana, Polygon, Arbitrum, Base, etc.

3. Asset: Token involved (BTC, ETH, USDC, etc.)

4. Protocol: DeFi protocol if applicable (Uniswap, Aave, Lido, etc.)

5. Value: USD value if mentioned

6. Transaction details if mentioned:
   - txHash: Transaction hash
   - fromAddress/toAddress: Wallet addresses
   - blockNumber: Block number

7. Confidence (0-100): How confident we are this event occurred on-chain

Only extract events that are explicitly on-chain (blockchain transactions).
Don't include off-chain events like company announcements unless they reference on-chain activity.

Respond with JSON: { "links": [...] }`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 50);
  const chain = searchParams.get('chain');
  const eventType = searchParams.get('type');
  const minValue = parseFloat(searchParams.get('min_value') || '0');
  const minConfidence = parseInt(searchParams.get('min_confidence') || '50');

  if (!isGroqConfigured()) return groqNotConfiguredResponse();

  try {
    const data = await getLatestNews(limit);

    if (data.articles.length === 0) {
      return NextResponse.json({ 
        links: [], 
        message: 'No articles to analyze' 
      });
    }

    const articlesText = data.articles
      .map((a, i) => `[${i + 1}] "${a.title}" (${a.source}) - ${new Date(a.pubDate).toISOString()}\n${a.description || ''}`)
      .join('\n\n');

    const userPrompt = `Identify all on-chain events mentioned in these ${data.articles.length} crypto news articles:

${articlesText}

For each article, list any on-chain events it references.`;

    const result = await promptGroqJsonCached<OnChainAnalysisResponse>(
      'onchain-events',
      SYSTEM_PROMPT,
      userPrompt,
      { maxTokens: 4000 }
    );

    // Process and merge with article metadata
    let links: NewsOnChainLink[] = (result.links || []).map((link, index) => {
      const article = data.articles[index % data.articles.length];
      
      return {
        articleTitle: article.title,
        articleLink: article.link,
        articleSource: article.source,
        publishedAt: article.pubDate,
        events: (link.events || []).map(e => ({
          ...e,
          type: e.type || 'other',
          chain: e.chain || 'unknown',
          description: e.description || '',
        })),
        confidence: link.confidence || 50,
        relevanceScore: calculateRelevanceScore(link.events || []),
      };
    }).filter(link => link.events.length > 0);

    // Apply filters
    if (chain) {
      links = links.map(link => ({
        ...link,
        events: link.events.filter(e => 
          e.chain.toLowerCase() === chain.toLowerCase()
        ),
      })).filter(link => link.events.length > 0);
    }

    if (eventType) {
      links = links.map(link => ({
        ...link,
        events: link.events.filter(e => e.type === eventType),
      })).filter(link => link.events.length > 0);
    }

    if (minValue > 0) {
      links = links.map(link => ({
        ...link,
        events: link.events.filter(e => (e.valueUsd || 0) >= minValue),
      })).filter(link => link.events.length > 0);
    }

    if (minConfidence > 0) {
      links = links.filter(link => link.confidence >= minConfidence);
    }

    // Sort by relevance score
    links.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Calculate statistics
    const allEvents = links.flatMap(l => l.events);
    const stats = {
      totalLinks: links.length,
      totalEvents: allEvents.length,
      byChain: allEvents.reduce((acc, e) => {
        acc[e.chain] = (acc[e.chain] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byType: allEvents.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalValueUsd: allEvents.reduce((sum, e) => sum + (e.valueUsd || 0), 0),
      avgConfidence: Math.round(
        links.reduce((sum, l) => sum + l.confidence, 0) / Math.max(links.length, 1)
      ),
      topProtocols: getTopProtocols(allEvents),
    };

    // Identify significant events (high value or security incidents)
    const significantEvents = allEvents.filter(e => 
      (e.valueUsd && e.valueUsd > 1000000) || 
      e.type === 'hack' || 
      e.type === 'upgrade'
    );

    return NextResponse.json({
      links,
      stats,
      significantEvents,
      filters: {
        chain,
        type: eventType,
        min_value: minValue,
        min_confidence: minConfidence,
        limit,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('On-chain event linking error:', error);
    return NextResponse.json(
      { error: 'Failed to link on-chain events' },
      { status: 500 }
    );
  }
}

function calculateRelevanceScore(events: OnChainEvent[]): number {
  if (events.length === 0) return 0;
  
  let score = events.length * 10;
  
  for (const event of events) {
    // High-value events
    if (event.valueUsd) {
      if (event.valueUsd > 10000000) score += 50;
      else if (event.valueUsd > 1000000) score += 30;
      else if (event.valueUsd > 100000) score += 15;
    }
    
    // Security incidents are very relevant
    if (event.type === 'hack') score += 40;
    
    // Protocol upgrades are significant
    if (event.type === 'upgrade') score += 25;
    
    // Having transaction hash means verified on-chain
    if (event.txHash) score += 10;
  }
  
  return Math.min(score, 100);
}

function getTopProtocols(events: OnChainEvent[]): { protocol: string; count: number }[] {
  const protocolCounts = new Map<string, number>();
  
  for (const event of events) {
    if (event.protocol) {
      const normalized = event.protocol.toLowerCase();
      protocolCounts.set(normalized, (protocolCounts.get(normalized) || 0) + 1);
    }
  }
  
  return Array.from(protocolCounts.entries())
    .map(([protocol, count]) => ({ protocol, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

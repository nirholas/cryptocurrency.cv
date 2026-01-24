import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface OracleRequest {
  query: string;
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

interface NewsArticle {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

interface MarketData {
  bitcoin?: { price: number; change24h: number };
  ethereum?: { price: number; change24h: number };
  fearGreed?: { value: number; classification: string };
  topMovers?: Array<{ symbol: string; name: string; change: number }>;
}

// Fetch relevant context based on query
async function getContext(query: string): Promise<{
  news: NewsArticle[];
  market: MarketData;
}> {
  const lowerQuery = query.toLowerCase();
  
  // Determine what data to fetch
  const needsNews = /news|headline|article|story|happen|latest|recent|update/i.test(query);
  const needsPrices = /price|cost|worth|value|btc|eth|bitcoin|ethereum/i.test(query);
  const needsFearGreed = /fear|greed|sentiment|mood|market.*feel/i.test(query);
  const needsMovers = /mover|gainer|loser|up|down|performing|change/i.test(query);
  
  const [newsData, marketData] = await Promise.all([
    needsNews ? fetchNews(lowerQuery) : Promise.resolve([]),
    fetchMarketData(needsPrices, needsFearGreed, needsMovers),
  ]);

  return {
    news: newsData,
    market: marketData,
  };
}

async function fetchNews(query: string): Promise<NewsArticle[]> {
  try {
    // Extract potential search terms
    const searchTerms = query.match(/bitcoin|ethereum|eth|btc|etf|sec|regulation|defi|nft|solana|ripple|xrp/gi);
    const searchQuery = searchTerms?.join(' ') || '';
    
    const url = searchQuery 
      ? `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/news?limit=5&search=${encodeURIComponent(searchQuery)}`
      : `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/news?limit=5`;
    
    const response = await fetch(url, { next: { revalidate: 60 } });
    if (!response.ok) return [];
    
    const data = await response.json();
    return (data.articles || []).slice(0, 5).map((a: { title: string; url: string; source: string; publishedAt: string }) => ({
      title: a.title,
      url: a.url,
      source: a.source,
      publishedAt: a.publishedAt,
    }));
  } catch {
    return [];
  }
}

async function fetchMarketData(
  needsPrices: boolean,
  needsFearGreed: boolean,
  needsMovers: boolean
): Promise<MarketData> {
  const data: MarketData = {};

  try {
    if (needsPrices) {
      const priceRes = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true',
        { next: { revalidate: 60 } }
      );
      if (priceRes.ok) {
        const prices = await priceRes.json();
        data.bitcoin = {
          price: prices.bitcoin?.usd || 0,
          change24h: prices.bitcoin?.usd_24h_change || 0,
        };
        data.ethereum = {
          price: prices.ethereum?.usd || 0,
          change24h: prices.ethereum?.usd_24h_change || 0,
        };
      }
    }

    if (needsFearGreed) {
      const fgRes = await fetch('https://api.alternative.me/fng/', { next: { revalidate: 300 } });
      if (fgRes.ok) {
        const fg = await fgRes.json();
        data.fearGreed = {
          value: parseInt(fg.data?.[0]?.value || '50'),
          classification: fg.data?.[0]?.value_classification || 'Neutral',
        };
      }
    }

    if (needsMovers) {
      const moversRes = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=percent_change_24h_desc&per_page=10&page=1',
        { next: { revalidate: 120 } }
      );
      if (moversRes.ok) {
        const movers = await moversRes.json();
        data.topMovers = movers.slice(0, 5).map((coin: { symbol: string; name: string; price_change_percentage_24h: number }) => ({
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          change: coin.price_change_percentage_24h,
        }));
      }
    }
  } catch {
    // Ignore errors, return partial data
  }

  return data;
}

// Generate AI response
async function generateResponse(
  query: string,
  context: { news: NewsArticle[]; market: MarketData },
  history: OracleRequest['history']
): Promise<string> {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  
  if (!GROQ_API_KEY) {
    // Fallback response without AI
    return generateFallbackResponse(query, context);
  }

  // Build context string
  let contextStr = '';
  
  if (context.market.bitcoin) {
    contextStr += `\nBitcoin: $${context.market.bitcoin.price.toLocaleString()} (${context.market.bitcoin.change24h >= 0 ? '+' : ''}${context.market.bitcoin.change24h.toFixed(2)}% 24h)`;
  }
  if (context.market.ethereum) {
    contextStr += `\nEthereum: $${context.market.ethereum.price.toLocaleString()} (${context.market.ethereum.change24h >= 0 ? '+' : ''}${context.market.ethereum.change24h.toFixed(2)}% 24h)`;
  }
  if (context.market.fearGreed) {
    contextStr += `\nFear & Greed Index: ${context.market.fearGreed.value} (${context.market.fearGreed.classification})`;
  }
  if (context.market.topMovers?.length) {
    contextStr += `\nTop Movers (24h): ${context.market.topMovers.map(m => `${m.symbol} ${m.change >= 0 ? '+' : ''}${m.change.toFixed(1)}%`).join(', ')}`;
  }
  if (context.news.length) {
    contextStr += `\n\nRecent Headlines:\n${context.news.map((n, i) => `${i + 1}. "${n.title}" - ${n.source}`).join('\n')}`;
  }

  const messages = [
    {
      role: 'system',
      content: `You are The Oracle, an AI assistant specialized in cryptocurrency markets and news. You have access to real-time data and news from Free Crypto News.

Current market context:${contextStr || '\nNo specific market data available.'}

Guidelines:
- Be concise but informative (2-4 paragraphs max)
- Cite specific data when available
- Don't make price predictions
- Acknowledge uncertainty when appropriate
- If asked about something you don't have data for, say so
- Use a professional but approachable tone`,
    },
    ...(history || []).map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
    {
      role: 'user',
      content: query,
    },
  ];

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      return generateFallbackResponse(query, context);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || generateFallbackResponse(query, context);
  } catch {
    return generateFallbackResponse(query, context);
  }
}

function generateFallbackResponse(
  query: string,
  context: { news: NewsArticle[]; market: MarketData }
): string {
  const parts: string[] = [];
  
  // Check what the user is asking about
  const lowerQuery = query.toLowerCase();
  
  if (context.market.fearGreed && /fear|greed|sentiment/i.test(lowerQuery)) {
    const fg = context.market.fearGreed;
    parts.push(`The current Fear & Greed Index is at ${fg.value}, indicating "${fg.classification}" in the market.`);
  }
  
  if (context.market.bitcoin && /bitcoin|btc|price/i.test(lowerQuery)) {
    const btc = context.market.bitcoin;
    parts.push(`Bitcoin is currently trading at $${btc.price.toLocaleString()}, ${btc.change24h >= 0 ? 'up' : 'down'} ${Math.abs(btc.change24h).toFixed(2)}% in the last 24 hours.`);
  }
  
  if (context.market.ethereum && /ethereum|eth/i.test(lowerQuery)) {
    const eth = context.market.ethereum;
    parts.push(`Ethereum is at $${eth.price.toLocaleString()}, ${eth.change24h >= 0 ? 'up' : 'down'} ${Math.abs(eth.change24h).toFixed(2)}% in the last 24 hours.`);
  }
  
  if (context.market.topMovers?.length && /mover|gainer|top|perform/i.test(lowerQuery)) {
    const movers = context.market.topMovers;
    parts.push(`Top movers today: ${movers.map(m => `${m.name} (${m.symbol}) ${m.change >= 0 ? '+' : ''}${m.change.toFixed(1)}%`).join(', ')}.`);
  }
  
  if (context.news.length && /news|headline|happen|latest/i.test(lowerQuery)) {
    parts.push(`Here are the latest headlines:\n${context.news.map((n, i) => `${i + 1}. ${n.title}`).join('\n')}`);
  }
  
  if (parts.length === 0) {
    parts.push("I can help you with crypto market data, news, and trends. Try asking about Bitcoin prices, market sentiment, or the latest headlines!");
  }
  
  return parts.join('\n\n');
}

export async function POST(request: NextRequest) {
  try {
    const body: OracleRequest = await request.json();
    const { query, history } = body;

    if (!query?.trim()) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Get context
    const context = await getContext(query);
    
    // Generate response
    const answer = await generateResponse(query, context, history);
    
    return NextResponse.json({
      answer,
      sources: context.news.length > 0 ? context.news : undefined,
      data: Object.keys(context.market).length > 0 ? {
        type: 'market',
        value: context.market,
      } : undefined,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
}

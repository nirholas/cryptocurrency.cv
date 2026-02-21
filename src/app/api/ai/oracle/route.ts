import { NextRequest, NextResponse } from 'next/server';
import { COINGECKO_BASE, SITE_URL } from '@/lib/constants';
import { getAIConfigOrNull } from '@/lib/ai-provider';

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

interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
}

interface MarketData {
  bitcoin?: CoinPrice;
  ethereum?: CoinPrice;
  solana?: CoinPrice;
  fearGreed?: { value: number; classification: string };
  topGainers?: Array<{ symbol: string; name: string; change: number }>;
  topLosers?: Array<{ symbol: string; name: string; change: number }>;
  trending?: Array<{ name: string; symbol: string; rank: number }>;
  globalMarket?: {
    totalMarketCap: number;
    totalVolume: number;
    btcDominance: number;
    ethDominance: number;
    marketCapChange24h: number;
  };
  gasPrice?: {
    low: number;
    average: number;
    high: number;
  };
  defiTvl?: {
    total: number;
    change24h: number;
  };
}

interface OracleContext {
  news: NewsArticle[];
  market: MarketData;
}

// Determine what data to fetch based on query
function analyzeQuery(query: string): {
  needsNews: boolean;
  needsPrices: boolean;
  needsFearGreed: boolean;
  needsMovers: boolean;
  needsTrending: boolean;
  needsGlobal: boolean;
  needsGas: boolean;
  needsDefi: boolean;
  specificCoins: string[];
} {
  const lowerQuery = query.toLowerCase();
  
  // Extract specific coin mentions
  const coinPatterns = [
    { pattern: /bitcoin|btc/i, id: 'bitcoin' },
    { pattern: /ethereum|eth(?!er)/i, id: 'ethereum' },
    { pattern: /solana|sol/i, id: 'solana' },
    { pattern: /ripple|xrp/i, id: 'ripple' },
    { pattern: /cardano|ada/i, id: 'cardano' },
    { pattern: /dogecoin|doge/i, id: 'dogecoin' },
    { pattern: /polkadot|dot/i, id: 'polkadot' },
    { pattern: /chainlink|link/i, id: 'chainlink' },
    { pattern: /avalanche|avax/i, id: 'avalanche-2' },
    { pattern: /polygon|matic/i, id: 'matic-network' },
  ];
  
  const specificCoins = coinPatterns
    .filter(p => p.pattern.test(query))
    .map(p => p.id);
  
  return {
    needsNews: /news|headline|article|story|happen|latest|recent|update|announce/i.test(query),
    needsPrices: specificCoins.length > 0 || /price|cost|worth|value|trading|trade/i.test(query),
    needsFearGreed: /fear|greed|sentiment|mood|market.*feel|emotion/i.test(query),
    needsMovers: /mover|gainer|loser|up|down|performing|winner|pump|dump|rally/i.test(query),
    needsTrending: /trend|hot|popular|buzz|viral|hype/i.test(query),
    needsGlobal: /market\s*(cap|size)|total|dominance|overall|global|crypto\s*market/i.test(query),
    needsGas: /gas|fee|transaction\s*cost|gwei|eth.*gas/i.test(query),
    needsDefi: /defi|tvl|total\s*value|locked|yield|lending|borrow/i.test(query),
    specificCoins,
  };
}

// Fetch news articles
async function fetchNews(query: string): Promise<NewsArticle[]> {
  try {
    const searchTerms = query.match(
      /bitcoin|ethereum|eth|btc|etf|sec|regulation|defi|nft|solana|ripple|xrp|cardano|polygon|avalanche|chainlink|dogecoin|binance|coinbase|tether|stablecoin/gi
    );
    const searchQuery = searchTerms?.join(' ') || '';
    
    const baseUrl = SITE_URL;
    const url = searchQuery 
      ? `${baseUrl}/api/news?limit=8&search=${encodeURIComponent(searchQuery)}`
      : `${baseUrl}/api/news?limit=8`;
    
    const response = await fetch(url, { next: { revalidate: 60 } });
    if (!response.ok) return [];
    
    const data = await response.json();
    return (data.articles || []).slice(0, 8).map((a: { 
      title: string; 
      url: string; 
      source: string; 
      publishedAt: string 
    }) => ({
      title: a.title,
      url: a.url,
      source: a.source,
      publishedAt: a.publishedAt,
    }));
  } catch {
    return [];
  }
}

// Fetch coin prices
async function fetchCoinPrices(coinIds: string[]): Promise<Map<string, CoinPrice>> {
  const prices = new Map<string, CoinPrice>();
  
  if (coinIds.length === 0) {
    coinIds = ['bitcoin', 'ethereum', 'solana'];
  }
  
  try {
    const response = await fetch(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${coinIds.join(',')}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`,
      { next: { revalidate: 60 } }
    );
    
    if (response.ok) {
      const data = await response.json();
      data.forEach((coin: {
        id: string;
        symbol: string;
        name: string;
        current_price: number;
        price_change_percentage_24h: number;
        market_cap: number;
        total_volume: number;
      }) => {
        prices.set(coin.id, {
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          price: coin.current_price,
          change24h: coin.price_change_percentage_24h || 0,
          marketCap: coin.market_cap,
          volume24h: coin.total_volume,
        });
      });
    }
  } catch {
    // Ignore errors
  }
  
  return prices;
}

// Fetch Fear & Greed Index
async function fetchFearGreed(): Promise<{ value: number; classification: string } | null> {
  try {
    const response = await fetch('https://api.alternative.me/fng/', { 
      next: { revalidate: 300 } 
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        value: parseInt(data.data?.[0]?.value || '50'),
        classification: data.data?.[0]?.value_classification || 'Neutral',
      };
    }
  } catch {
    // Ignore errors
  }
  
  return null;
}

// Fetch top gainers and losers
async function fetchMovers(): Promise<{
  gainers: Array<{ symbol: string; name: string; change: number }>;
  losers: Array<{ symbol: string; name: string; change: number }>;
}> {
  try {
    const response = await fetch(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`,
      { next: { revalidate: 120 } }
    );
    
    if (response.ok) {
      const coins = await response.json();
      const sorted = [...coins].sort((a, b) => 
        (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)
      );
      
      return {
        gainers: sorted.slice(0, 5).map((c: { symbol: string; name: string; price_change_percentage_24h: number }) => ({
          symbol: c.symbol.toUpperCase(),
          name: c.name,
          change: c.price_change_percentage_24h || 0,
        })),
        losers: sorted.slice(-5).reverse().map((c: { symbol: string; name: string; price_change_percentage_24h: number }) => ({
          symbol: c.symbol.toUpperCase(),
          name: c.name,
          change: c.price_change_percentage_24h || 0,
        })),
      };
    }
  } catch {
    // Ignore errors
  }
  
  return { gainers: [], losers: [] };
}

// Fetch trending coins
async function fetchTrending(): Promise<Array<{ name: string; symbol: string; rank: number }>> {
  try {
    const response = await fetch(`${COINGECKO_BASE}/search/trending`, { 
      next: { revalidate: 300 } 
    });
    
    if (response.ok) {
      const data = await response.json();
      return (data.coins || []).slice(0, 7).map((c: { item: { name: string; symbol: string; market_cap_rank: number } }, i: number) => ({
        name: c.item.name,
        symbol: c.item.symbol.toUpperCase(),
        rank: c.item.market_cap_rank || i + 1,
      }));
    }
  } catch {
    // Ignore errors
  }
  
  return [];
}

// Fetch global market data
async function fetchGlobalMarket(): Promise<MarketData['globalMarket'] | null> {
  try {
    const response = await fetch(`${COINGECKO_BASE}/global`, { 
      next: { revalidate: 300 } 
    });
    
    if (response.ok) {
      const data = await response.json();
      const d = data.data;
      return {
        totalMarketCap: d.total_market_cap?.usd || 0,
        totalVolume: d.total_volume?.usd || 0,
        btcDominance: d.market_cap_percentage?.btc || 0,
        ethDominance: d.market_cap_percentage?.eth || 0,
        marketCapChange24h: d.market_cap_change_percentage_24h_usd || 0,
      };
    }
  } catch {
    // Ignore errors
  }
  
  return null;
}

// Fetch gas prices
async function fetchGasPrice(): Promise<MarketData['gasPrice'] | null> {
  try {
    const response = await fetch(
      'https://api.etherscan.io/api?module=gastracker&action=gasoracle',
      { cache: 'no-store' }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === '1') {
        return {
          low: parseInt(data.result.SafeGasPrice) || 0,
          average: parseInt(data.result.ProposeGasPrice) || 0,
          high: parseInt(data.result.FastGasPrice) || 0,
        };
      }
    }
  } catch {
    // Ignore errors
  }
  
  return null;
}

// Fetch DeFi TVL from DeFiLlama
async function fetchDefiTvl(): Promise<MarketData['defiTvl'] | null> {
  try {
    const response = await fetch('https://api.llama.fi/v2/historicalChainTvl', { 
      next: { revalidate: 3600 } 
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.length >= 2) {
        const latest = data[data.length - 1];
        const yesterday = data[data.length - 2];
        const change = yesterday.tvl > 0 
          ? ((latest.tvl - yesterday.tvl) / yesterday.tvl) * 100 
          : 0;
        
        return {
          total: latest.tvl,
          change24h: change,
        };
      }
    }
  } catch {
    // Ignore errors
  }
  
  return null;
}

// Fetch all relevant context based on query analysis
async function getContext(query: string): Promise<OracleContext> {
  const analysis = analyzeQuery(query);
  const market: MarketData = {};
  
  // Parallel fetch based on what's needed
  const promises: Promise<void>[] = [];
  
  // Always fetch basic prices if any coin is mentioned or prices needed
  if (analysis.needsPrices || analysis.specificCoins.length > 0) {
    const coinsToFetch = analysis.specificCoins.length > 0 
      ? analysis.specificCoins 
      : ['bitcoin', 'ethereum', 'solana'];
    
    promises.push(
      fetchCoinPrices(coinsToFetch).then(prices => {
        prices.forEach((price, id) => {
          if (id === 'bitcoin') market.bitcoin = price;
          else if (id === 'ethereum') market.ethereum = price;
          else if (id === 'solana') market.solana = price;
        });
      })
    );
  }
  
  if (analysis.needsFearGreed) {
    promises.push(
      fetchFearGreed().then(fg => {
        if (fg) market.fearGreed = fg;
      })
    );
  }
  
  if (analysis.needsMovers) {
    promises.push(
      fetchMovers().then(({ gainers, losers }) => {
        market.topGainers = gainers;
        market.topLosers = losers;
      })
    );
  }
  
  if (analysis.needsTrending) {
    promises.push(
      fetchTrending().then(trending => {
        market.trending = trending;
      })
    );
  }
  
  if (analysis.needsGlobal) {
    promises.push(
      fetchGlobalMarket().then(global => {
        if (global) market.globalMarket = global;
      })
    );
  }
  
  if (analysis.needsGas) {
    promises.push(
      fetchGasPrice().then(gas => {
        if (gas) market.gasPrice = gas;
      })
    );
  }
  
  if (analysis.needsDefi) {
    promises.push(
      fetchDefiTvl().then(tvl => {
        if (tvl) market.defiTvl = tvl;
      })
    );
  }
  
  // Fetch news in parallel
  const newsPromise = analysis.needsNews ? fetchNews(query) : Promise.resolve([]);
  
  await Promise.all([...promises, newsPromise.then(n => n)]);
  const news = await newsPromise;
  
  return { news, market };
}

// Format market data for the AI context
function formatMarketContext(market: MarketData): string {
  const parts: string[] = [];
  
  // Prices
  const prices = [market.bitcoin, market.ethereum, market.solana].filter(Boolean);
  if (prices.length > 0) {
    parts.push('CURRENT PRICES:');
    prices.forEach(p => {
      if (p) {
        parts.push(`- ${p.name} (${p.symbol}): $${p.price.toLocaleString()} (${p.change24h >= 0 ? '+' : ''}${p.change24h.toFixed(2)}% 24h)`);
        parts.push(`  Market Cap: $${(p.marketCap / 1e9).toFixed(2)}B | Volume: $${(p.volume24h / 1e9).toFixed(2)}B`);
      }
    });
  }
  
  // Fear & Greed
  if (market.fearGreed) {
    parts.push(`\nMARKET SENTIMENT: Fear & Greed Index at ${market.fearGreed.value}/100 (${market.fearGreed.classification})`);
  }
  
  // Global market
  if (market.globalMarket) {
    const g = market.globalMarket;
    parts.push(`\nGLOBAL MARKET:`);
    parts.push(`- Total Market Cap: $${(g.totalMarketCap / 1e12).toFixed(2)}T (${g.marketCapChange24h >= 0 ? '+' : ''}${g.marketCapChange24h.toFixed(2)}% 24h)`);
    parts.push(`- 24h Volume: $${(g.totalVolume / 1e9).toFixed(1)}B`);
    parts.push(`- BTC Dominance: ${g.btcDominance.toFixed(1)}% | ETH Dominance: ${g.ethDominance.toFixed(1)}%`);
  }
  
  // Top movers
  if (market.topGainers?.length) {
    parts.push(`\nTOP GAINERS (24h): ${market.topGainers.map(m => `${m.symbol} +${m.change.toFixed(1)}%`).join(', ')}`);
  }
  if (market.topLosers?.length) {
    parts.push(`TOP LOSERS (24h): ${market.topLosers.map(m => `${m.symbol} ${m.change.toFixed(1)}%`).join(', ')}`);
  }
  
  // Trending
  if (market.trending?.length) {
    parts.push(`\nTRENDING: ${market.trending.map(t => `${t.name} (${t.symbol})`).join(', ')}`);
  }
  
  // Gas
  if (market.gasPrice) {
    parts.push(`\nETHEREUM GAS: Low ${market.gasPrice.low} | Average ${market.gasPrice.average} | Fast ${market.gasPrice.high} gwei`);
  }
  
  // DeFi
  if (market.defiTvl) {
    parts.push(`\nDEFI TVL: $${(market.defiTvl.total / 1e9).toFixed(2)}B (${market.defiTvl.change24h >= 0 ? '+' : ''}${market.defiTvl.change24h.toFixed(2)}% 24h)`);
  }
  
  return parts.join('\n');
}

// Generate AI response
async function generateResponse(
  query: string,
  context: OracleContext,
  history: OracleRequest['history']
): Promise<string> {
  // Use shared provider config — supports OpenAI, Groq, OpenRouter (OpenAI-compatible)
  // Anthropic uses a different multi-turn format; fall back gracefully if it's the only option
  const config = getAIConfigOrNull(true /* preferGroq */);

  if (!config || config.provider === 'anthropic') {
    return generateFallbackResponse(query, context);
  }

  const baseUrl = config.baseUrl ?? 'https://api.openai.com/v1';

  const marketContext = formatMarketContext(context.market);
  const newsContext = context.news.length > 0 
    ? `\nRECENT NEWS:\n${context.news.map((n, i) => `${i + 1}. "${n.title}" - ${n.source}`).join('\n')}`
    : '';

  const systemPrompt = `You are The Oracle, a knowledgeable AI assistant specialized in cryptocurrency markets, blockchain technology, and crypto news. You provide accurate, data-driven insights while acknowledging uncertainty.

CURRENT MARKET DATA:
${marketContext || 'No specific market data available for this query.'}
${newsContext}

GUIDELINES:
- Be concise and informative (2-4 paragraphs max)
- Always cite specific numbers and data when available
- NEVER make specific price predictions or investment advice
- Acknowledge when data is limited or unavailable
- Use a professional but approachable tone
- If asked about something outside your data, acknowledge the limitation
- For news queries, summarize the key themes from available headlines
- For price queries, provide context about recent changes and trends
- For market analysis, focus on observable data patterns`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...(history || []).map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: 'user', content: query },
  ];

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...(config.provider === 'openrouter' && {
          'HTTP-Referer': process.env.VERCEL_URL ?? 'https://cryptocurrency.cv',
          'X-Title': 'Crypto News Oracle',
        }),
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('AI Oracle error:', response.status);
      return generateFallbackResponse(query, context);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || generateFallbackResponse(query, context);
  } catch (error) {
    console.error('AI generation error:', error);
    return generateFallbackResponse(query, context);
  }
}

// Fallback response when AI is unavailable
function generateFallbackResponse(query: string, context: OracleContext): string {
  const parts: string[] = [];
  const lowerQuery = query.toLowerCase();
  
  // Price responses
  if (context.market.bitcoin && /bitcoin|btc/i.test(lowerQuery)) {
    const btc = context.market.bitcoin;
    parts.push(`**Bitcoin (BTC)** is trading at **$${btc.price.toLocaleString()}**, ${btc.change24h >= 0 ? 'up' : 'down'} ${Math.abs(btc.change24h).toFixed(2)}% in the last 24 hours. Market cap is $${(btc.marketCap / 1e9).toFixed(2)} billion.`);
  }
  
  if (context.market.ethereum && /ethereum|eth/i.test(lowerQuery)) {
    const eth = context.market.ethereum;
    parts.push(`**Ethereum (ETH)** is at **$${eth.price.toLocaleString()}**, ${eth.change24h >= 0 ? 'up' : 'down'} ${Math.abs(eth.change24h).toFixed(2)}% over 24 hours.`);
  }
  
  // Sentiment
  if (context.market.fearGreed) {
    const fg = context.market.fearGreed;
    parts.push(`The **Fear & Greed Index** is at ${fg.value}/100, indicating "${fg.classification}" sentiment in the market.`);
  }
  
  // Movers
  if (context.market.topGainers?.length && /gainer|winner|up|pump/i.test(lowerQuery)) {
    parts.push(`**Top gainers today:** ${context.market.topGainers.map(m => `${m.name} (${m.symbol}) +${m.change.toFixed(1)}%`).join(', ')}`);
  }
  
  if (context.market.topLosers?.length && /loser|down|dump/i.test(lowerQuery)) {
    parts.push(`**Top losers today:** ${context.market.topLosers.map(m => `${m.name} (${m.symbol}) ${m.change.toFixed(1)}%`).join(', ')}`);
  }
  
  // Trending
  if (context.market.trending?.length && /trend|hot|popular/i.test(lowerQuery)) {
    parts.push(`**Trending coins:** ${context.market.trending.map(t => `${t.name} (${t.symbol})`).join(', ')}`);
  }
  
  // Gas
  if (context.market.gasPrice && /gas|fee/i.test(lowerQuery)) {
    const g = context.market.gasPrice;
    parts.push(`**Ethereum gas prices:** Low: ${g.low} gwei | Standard: ${g.average} gwei | Fast: ${g.high} gwei`);
  }
  
  // News
  if (context.news.length) {
    parts.push(`\n**Latest headlines:**\n${context.news.slice(0, 5).map((n, i) => `${i + 1}. ${n.title}`).join('\n')}`);
  }
  
  if (parts.length === 0) {
    return "I can help you with crypto market data, prices, trends, and news. Try asking about Bitcoin's price, market sentiment, trending coins, or the latest headlines!";
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

    if (query.length > 2000) {
      return NextResponse.json(
        { error: 'Query too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    // Get context
    const context = await getContext(query);
    
    // Generate response
    const answer = await generateResponse(query, context, history);
    
    // Build response with available data
    const responseData: {
      answer: string;
      sources?: NewsArticle[];
      data?: {
        type: string;
        value: MarketData;
      };
    } = { answer };
    
    if (context.news.length > 0) {
      responseData.sources = context.news;
    }
    
    if (Object.keys(context.market).length > 0) {
      responseData.data = {
        type: 'market',
        value: context.market,
      };
    }
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Oracle API error:', error);
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
}

// Also support GET for simple queries
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  
  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }
  
  // Reuse POST logic
  const context = await getContext(query);
  const answer = await generateResponse(query, context, undefined);
  
  return NextResponse.json({
    answer,
    sources: context.news.length > 0 ? context.news : undefined,
  });
}

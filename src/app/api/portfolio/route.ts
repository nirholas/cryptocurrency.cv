import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews, NewsArticle } from '@/lib/crypto-news';

export const runtime = 'edge';

// DexScreener API (FREE - no key needed, supports ANY token on any DEX)
const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex';

// CoinGecko API as fallback for major coins
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Common aliases for news matching (expand search terms)
const COIN_ALIASES: Record<string, string[]> = {
  bitcoin: ['btc', 'bitcoin', 'xbt', 'sats'],
  ethereum: ['eth', 'ethereum', 'ether'],
  solana: ['sol', 'solana'],
  bnb: ['bnb', 'binance'],
  xrp: ['xrp', 'ripple'],
  dogecoin: ['doge', 'dogecoin'],
  cardano: ['ada', 'cardano'],
  // Add more as needed - but now we can find ANY token dynamically!
};

interface TokenInfo {
  symbol: string;
  name: string;
  address?: string;
  chain?: string;
  priceUsd?: number;
  priceChange24h?: number;
  volume24h?: number;
  liquidity?: number;
  marketCap?: number;
  fdv?: number;
  pairAddress?: string;
  dexId?: string;
  url?: string;
  source: 'dexscreener' | 'coingecko';
}

interface PortfolioCoin {
  query: string;
  token: TokenInfo | null;
  newsCount: number;
  articles: NewsArticle[];
}

// Sanitize user-provided token query before using it in external requests
function sanitizeSearchQuery(rawQuery: string): { value: string; isAddress: boolean } | null {
  const query = rawQuery.trim();

  // Reject empty or unreasonably long queries early to limit impact of tainted input
  if (!query || query.length > 100) {
    return null;
  }

  // Detect and validate contract addresses (EVM-style 0x-prefixed 40-hex chars)
  const addressPattern = /^0x[0-9a-fA-F]{40}$/;
  if (addressPattern.test(query)) {
    return { value: query, isAddress: true };
  }

  // For non-address searches, only allow expected token name/symbol characters.
  // This prevents unexpected path/query manipulation in downstream requests.
  const safePattern = /^[a-zA-Z0-9 _-]+$/;
  if (!safePattern.test(query)) {
    return null;
  }

  const normalized = query.toLowerCase().trim();

  // Require at least 2 characters after normalization to avoid meaningless lookups.
  if (normalized.length < 2) {
    return null;
  }

  return { value: normalized, isAddress: false };
}

// Search DexScreener for any token
async function searchDexScreener(query: string): Promise<TokenInfo | null> {
  try {
    const sanitized = sanitizeSearchQuery(query);
    if (!sanitized) {
      return null;
    }

    let url: string;
    if (sanitized.isAddress) {
      url = `${DEXSCREENER_API}/tokens/${sanitized.value}`;
    } else {
      url = `${DEXSCREENER_API}/search?q=${encodeURIComponent(sanitized.value)}`;
    }
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const pairs = data.pairs || [];
    
    if (pairs.length === 0) return null;
    
    // Get the pair with highest liquidity
    const bestPair = pairs.sort((a: { liquidity?: { usd?: number } }, b: { liquidity?: { usd?: number } }) => 
      (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
    )[0];
    
    return {
      symbol: bestPair.baseToken?.symbol || query.toUpperCase(),
      name: bestPair.baseToken?.name || query,
      address: bestPair.baseToken?.address,
      chain: bestPair.chainId,
      priceUsd: parseFloat(bestPair.priceUsd) || undefined,
      priceChange24h: bestPair.priceChange?.h24 || undefined,
      volume24h: bestPair.volume?.h24 || undefined,
      liquidity: bestPair.liquidity?.usd || undefined,
      marketCap: bestPair.marketCap || undefined,
      fdv: bestPair.fdv || undefined,
      pairAddress: bestPair.pairAddress,
      dexId: bestPair.dexId,
      url: bestPair.url,
      source: 'dexscreener',
    };
  } catch (error) {
    console.error('DexScreener error:', error);
    return null;
  }
}

// Fallback to CoinGecko for major coins
async function searchCoinGecko(query: string): Promise<TokenInfo | null> {
  try {
    // Search for the coin
    const searchResponse = await fetch(
      `${COINGECKO_API}/search?query=${encodeURIComponent(query)}`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!searchResponse.ok) return null;
    
    const searchData = await searchResponse.json();
    const coin = searchData.coins?.[0];
    
    if (!coin) return null;
    
    // Get price data
    const priceResponse = await fetch(
      `${COINGECKO_API}/simple/price?ids=${coin.id}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    const priceData = priceResponse.ok ? await priceResponse.json() : {};
    const price = priceData[coin.id] || {};
    
    return {
      symbol: coin.symbol?.toUpperCase() || query.toUpperCase(),
      name: coin.name || query,
      priceUsd: price.usd,
      priceChange24h: price.usd_24h_change,
      volume24h: price.usd_24h_vol,
      marketCap: price.usd_market_cap,
      source: 'coingecko',
    };
  } catch (error) {
    console.error('CoinGecko error:', error);
    return null;
  }
}

// Search for token info - try DexScreener first, then CoinGecko
async function findToken(query: string): Promise<TokenInfo | null> {
  // Try DexScreener first (better for new/dex tokens)
  const dexResult = await searchDexScreener(query);
  if (dexResult) return dexResult;
  
  // Fallback to CoinGecko for major coins
  const cgResult = await searchCoinGecko(query);
  return cgResult;
}

// Get search terms for news matching
function getSearchTerms(query: string, token: TokenInfo | null): string[] {
  const terms: string[] = [query.toLowerCase()];
  
  if (token) {
    terms.push(token.symbol.toLowerCase());
    terms.push(token.name.toLowerCase());
  }
  
  // Add known aliases
  for (const [id, aliases] of Object.entries(COIN_ALIASES)) {
    if (aliases.some(a => terms.includes(a))) {
      terms.push(...aliases);
    }
  }
  
  return [...new Set(terms)];
}

// Check if article mentions any of the search terms
function articleMatchesCoin(article: NewsArticle, searchTerms: string[]): boolean {
  const text = `${article.title} ${article.description || ''}`.toLowerCase();
  
  return searchTerms.some(term => {
    // Use word boundary matching to avoid false positives
    const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(text);
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Get parameters
  const coinsParam = searchParams.get('coins');
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10'), 1), 50);
  const includePrices = searchParams.get('prices') !== 'false';
  
  if (!coinsParam) {
    return NextResponse.json({
      error: 'Missing required parameter: coins',
      usage: '/api/portfolio?coins=btc,eth,sol',
      examples: [
        '/api/portfolio?coins=bitcoin,ethereum&limit=10',
        '/api/portfolio?coins=pepe,wojak,brett',
        '/api/portfolio?coins=0x6982508145454Ce325dDbE47a25d4ec3d2311933', // PEPE by address
      ],
      note: 'Supports ANY token on any DEX! Search by symbol, name, or contract address.',
      dataSources: ['DexScreener (DEX tokens)', 'CoinGecko (major coins)'],
    }, { status: 400 });
  }
  
  // Parse coins
  const inputCoins = coinsParam.split(',').map(c => c.trim()).filter(Boolean);
  
  if (inputCoins.length === 0) {
    return NextResponse.json({ error: 'No valid coins provided' }, { status: 400 });
  }
  
  // Limit to 10 coins to avoid rate limits
  const coinsToSearch = inputCoins.slice(0, 10);
  
  // Fetch news
  const newsResponse = await getLatestNews(100);
  const allNews = newsResponse.articles || [];
  
  // Process each coin
  const portfolio: PortfolioCoin[] = [];
  const allMatchedArticles: Array<NewsArticle & { matchedCoin: string }> = [];
  
  // Fetch token data in parallel
  const tokenPromises = includePrices 
    ? coinsToSearch.map(coin => findToken(coin))
    : coinsToSearch.map(() => Promise.resolve(null));
  
  const tokens = await Promise.all(tokenPromises);
  
  for (let i = 0; i < coinsToSearch.length; i++) {
    const query = coinsToSearch[i];
    const token = tokens[i];
    
    const searchTerms = getSearchTerms(query, token);
    const matchedArticles = allNews.filter(article => 
      articleMatchesCoin(article, searchTerms)
    );
    
    // Track matched articles
    matchedArticles.forEach(article => {
      allMatchedArticles.push({ ...article, matchedCoin: query });
    });
    
    portfolio.push({
      query,
      token,
      newsCount: matchedArticles.length,
      articles: matchedArticles.slice(0, limit),
    });
  }
  
  // Sort all matched articles by date and dedupe
  const seenLinks = new Set<string>();
  const combinedFeed = allMatchedArticles
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .filter(article => {
      if (seenLinks.has(article.link)) return false;
      seenLinks.add(article.link);
      return true;
    })
    .slice(0, limit);
  
  // Calculate summary
  const totalNewsCount = portfolio.reduce((sum, c) => sum + c.newsCount, 0);
  const tokensFound = portfolio.filter(c => c.token !== null).length;
  const tokensWithNews = portfolio.filter(c => c.newsCount > 0).length;
  
  // Market summary
  const tokensWithPrices = portfolio.filter(c => c.token?.priceChange24h !== undefined);
  const avgChange = tokensWithPrices.length > 0
    ? tokensWithPrices.reduce((sum, c) => sum + (c.token?.priceChange24h || 0), 0) / tokensWithPrices.length
    : undefined;
  
  return NextResponse.json({
    portfolio,
    combinedFeed,
    summary: {
      coinsRequested: inputCoins,
      coinsSearched: coinsToSearch,
      tokensFound,
      tokensWithNews,
      totalNewsCount,
      articlesReturned: combinedFeed.length,
      ...(avgChange !== undefined && {
        market: {
          average24hChange: Math.round(avgChange * 100) / 100,
          tokensTracked: tokensWithPrices.length,
        },
      }),
    },
    dataSources: {
      prices: 'DexScreener + CoinGecko',
      news: 'Aggregated from 7 sources',
    },
    fetchedAt: new Date().toISOString(),
  });
}

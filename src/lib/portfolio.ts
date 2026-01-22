/**
 * Portfolio Tracker
 * 
 * Features:
 * - Track coin holdings
 * - Calculate portfolio value
 * - News correlation with holdings
 * - Performance analytics
 */

import { getTopCoins, TokenPrice } from '@/lib/market-data';

// Types
export interface Holding {
  coinId: string;
  symbol: string;
  name: string;
  amount: number;
  averageBuyPrice: number;
  addedAt: string;
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  holdings: Holding[];
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioValue {
  totalValue: number;
  totalCost: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  holdings: Array<{
    coinId: string;
    symbol: string;
    name: string;
    amount: number;
    currentPrice: number;
    value: number;
    averageBuyPrice: number;
    cost: number;
    profitLoss: number;
    profitLossPercent: number;
    allocation: number;
    change24h: number;
    change7d?: number;
  }>;
  lastUpdated: string;
}

// In-memory store (replace with DB in production)
const portfolios = new Map<string, Portfolio>();

// Generate IDs
function generateId(): string {
  return `pf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new portfolio
 */
export async function createPortfolio(
  userId: string,
  name: string = 'My Portfolio'
): Promise<Portfolio> {
  const portfolio: Portfolio = {
    id: generateId(),
    userId,
    name,
    holdings: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  portfolios.set(portfolio.id, portfolio);
  return portfolio;
}

/**
 * Get user's portfolios
 */
export function getUserPortfolios(userId: string): Portfolio[] {
  return Array.from(portfolios.values()).filter(p => p.userId === userId);
}

/**
 * Get portfolio by ID
 */
export function getPortfolio(portfolioId: string): Portfolio | null {
  return portfolios.get(portfolioId) || null;
}

/**
 * Add holding to portfolio
 */
export async function addHolding(
  portfolioId: string,
  holding: {
    coinId: string;
    symbol: string;
    name: string;
    amount: number;
    averageBuyPrice: number;
  }
): Promise<Portfolio | null> {
  const portfolio = portfolios.get(portfolioId);
  if (!portfolio) return null;

  // Check if coin already exists
  const existingIndex = portfolio.holdings.findIndex(h => h.coinId === holding.coinId);
  
  if (existingIndex >= 0) {
    // Update existing holding (average the buy price)
    const existing = portfolio.holdings[existingIndex];
    const totalAmount = existing.amount + holding.amount;
    const totalCost = (existing.amount * existing.averageBuyPrice) + (holding.amount * holding.averageBuyPrice);
    
    portfolio.holdings[existingIndex] = {
      ...existing,
      amount: totalAmount,
      averageBuyPrice: totalCost / totalAmount,
    };
  } else {
    // Add new holding
    portfolio.holdings.push({
      ...holding,
      addedAt: new Date().toISOString(),
    });
  }

  portfolio.updatedAt = new Date().toISOString();
  portfolios.set(portfolioId, portfolio);
  
  return portfolio;
}

/**
 * Remove holding from portfolio
 */
export async function removeHolding(
  portfolioId: string,
  coinId: string
): Promise<Portfolio | null> {
  const portfolio = portfolios.get(portfolioId);
  if (!portfolio) return null;

  portfolio.holdings = portfolio.holdings.filter(h => h.coinId !== coinId);
  portfolio.updatedAt = new Date().toISOString();
  portfolios.set(portfolioId, portfolio);

  return portfolio;
}

/**
 * Update holding amount
 */
export async function updateHolding(
  portfolioId: string,
  coinId: string,
  updates: { amount?: number; averageBuyPrice?: number }
): Promise<Portfolio | null> {
  const portfolio = portfolios.get(portfolioId);
  if (!portfolio) return null;

  const holdingIndex = portfolio.holdings.findIndex(h => h.coinId === coinId);
  if (holdingIndex < 0) return null;

  if (updates.amount !== undefined) {
    portfolio.holdings[holdingIndex].amount = updates.amount;
  }
  if (updates.averageBuyPrice !== undefined) {
    portfolio.holdings[holdingIndex].averageBuyPrice = updates.averageBuyPrice;
  }

  portfolio.updatedAt = new Date().toISOString();
  portfolios.set(portfolioId, portfolio);

  return portfolio;
}

/**
 * Calculate portfolio value with current prices
 */
export async function calculatePortfolioValue(
  portfolioId: string
): Promise<PortfolioValue | null> {
  const portfolio = portfolios.get(portfolioId);
  if (!portfolio) return null;

  if (portfolio.holdings.length === 0) {
    return {
      totalValue: 0,
      totalCost: 0,
      totalProfitLoss: 0,
      totalProfitLossPercent: 0,
      holdings: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  // Fetch current prices
  const coins = await getTopCoins(250);
  const priceMap = new Map<string, TokenPrice>();
  coins.forEach(c => priceMap.set(c.id, c));

  let totalValue = 0;
  let totalCost = 0;

  const holdingsWithValue = portfolio.holdings.map(holding => {
    const coinData = priceMap.get(holding.coinId);
    const currentPrice = coinData?.current_price || 0;
    const value = holding.amount * currentPrice;
    const cost = holding.amount * holding.averageBuyPrice;
    const profitLoss = value - cost;
    const profitLossPercent = cost > 0 ? ((value - cost) / cost) * 100 : 0;

    totalValue += value;
    totalCost += cost;

    return {
      coinId: holding.coinId,
      symbol: holding.symbol,
      name: holding.name,
      amount: holding.amount,
      currentPrice,
      value,
      averageBuyPrice: holding.averageBuyPrice,
      cost,
      profitLoss,
      profitLossPercent,
      allocation: 0, // Calculate after we have total
      change24h: coinData?.price_change_percentage_24h || 0,
      change7d: coinData?.price_change_percentage_7d_in_currency,
    };
  });

  // Calculate allocations
  holdingsWithValue.forEach(h => {
    h.allocation = totalValue > 0 ? (h.value / totalValue) * 100 : 0;
  });

  // Sort by value
  holdingsWithValue.sort((a, b) => b.value - a.value);

  const totalProfitLoss = totalValue - totalCost;
  const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

  return {
    totalValue,
    totalCost,
    totalProfitLoss,
    totalProfitLossPercent,
    holdings: holdingsWithValue,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get news related to portfolio holdings
 */
export async function getPortfolioNews(
  portfolioId: string,
  limit = 20
): Promise<{ articles: any[]; relevantCoins: string[] }> {
  const portfolio = portfolios.get(portfolioId);
  if (!portfolio || portfolio.holdings.length === 0) {
    return { articles: [], relevantCoins: [] };
  }

  // Get coin symbols/names for search
  const searchTerms = portfolio.holdings.flatMap(h => [
    h.symbol.toLowerCase(),
    h.name.toLowerCase(),
  ]);

  // Import dynamically to avoid circular deps
  const { getLatestNews } = await import('@/lib/crypto-news');
  const news = await getLatestNews(100);

  // Filter news that mentions any of the portfolio coins
  const relevantArticles = news.articles.filter(article => {
    const titleLower = article.title.toLowerCase();
    const descLower = (article.description || '').toLowerCase();
    
    return searchTerms.some(term => 
      titleLower.includes(term) || descLower.includes(term)
    );
  });

  // Track which coins were mentioned
  const mentionedCoins = new Set<string>();
  relevantArticles.forEach(article => {
    const text = (article.title + ' ' + (article.description || '')).toLowerCase();
    portfolio.holdings.forEach(h => {
      if (text.includes(h.symbol.toLowerCase()) || text.includes(h.name.toLowerCase())) {
        mentionedCoins.add(h.symbol);
      }
    });
  });

  return {
    articles: relevantArticles.slice(0, limit),
    relevantCoins: Array.from(mentionedCoins),
  };
}

/**
 * Delete portfolio
 */
export async function deletePortfolio(portfolioId: string): Promise<boolean> {
  return portfolios.delete(portfolioId);
}

/**
 * Get portfolio stats for admin
 */
export function getPortfolioStats(): {
  totalPortfolios: number;
  totalHoldings: number;
  avgHoldingsPerPortfolio: number;
  topCoins: Array<{ coinId: string; count: number }>;
} {
  const all = Array.from(portfolios.values());
  const coinCounts = new Map<string, number>();

  let totalHoldings = 0;
  all.forEach(p => {
    totalHoldings += p.holdings.length;
    p.holdings.forEach(h => {
      coinCounts.set(h.coinId, (coinCounts.get(h.coinId) || 0) + 1);
    });
  });

  const topCoins = Array.from(coinCounts.entries())
    .map(([coinId, count]) => ({ coinId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalPortfolios: all.length,
    totalHoldings,
    avgHoldingsPerPortfolio: all.length > 0 ? totalHoldings / all.length : 0,
    topCoins,
  };
}

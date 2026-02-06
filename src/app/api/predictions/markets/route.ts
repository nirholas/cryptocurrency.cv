/**
 * 🎰 Prediction Markets API
 * 
 * Bet on news outcomes and track prediction accuracy.
 * 
 * GET /api/predictions/markets - Active prediction markets
 * POST /api/predictions/markets - Create/bet on markets
 */

import { NextRequest, NextResponse } from 'next/server';

interface PredictionMarket {
  id: string;
  question: string;
  description: string;
  category: 'price' | 'regulatory' | 'adoption' | 'technology' | 'general';
  status: 'open' | 'closed' | 'resolved';
  createdAt: string;
  resolvesAt: string;
  resolvedAt?: string;
  outcome?: boolean;
  options: {
    yes: { odds: number; totalBets: number; volume: number };
    no: { odds: number; totalBets: number; volume: number };
  };
  totalVolume: number;
  relatedNews?: { title: string; source: string; link: string }[];
}

// Sample prediction markets
const MARKETS: PredictionMarket[] = [
  {
    id: 'mkt_btc_100k_jan',
    question: 'Will Bitcoin reach $100,000 by end of January 2026?',
    description: 'Bitcoin must touch $100,000 on any major exchange',
    category: 'price',
    status: 'resolved',
    createdAt: '2025-12-01T00:00:00Z',
    resolvesAt: '2026-01-31T23:59:59Z',
    resolvedAt: '2026-01-22T14:30:00Z',
    outcome: true,
    options: {
      yes: { odds: 1.45, totalBets: 15234, volume: 2450000 },
      no: { odds: 2.80, totalBets: 4521, volume: 890000 },
    },
    totalVolume: 3340000,
    relatedNews: [
      { title: 'Bitcoin Breaks $100K Barrier', source: 'CoinDesk', link: 'https://coindesk.com/...' },
    ],
  },
  {
    id: 'mkt_eth_etf_q1',
    question: 'Will a spot ETH ETF be approved by Q1 2026?',
    description: 'SEC approves at least one spot Ethereum ETF application',
    category: 'regulatory',
    status: 'open',
    createdAt: '2025-11-15T00:00:00Z',
    resolvesAt: '2026-03-31T23:59:59Z',
    options: {
      yes: { odds: 1.85, totalBets: 8934, volume: 1890000 },
      no: { odds: 2.10, totalBets: 7123, volume: 1560000 },
    },
    totalVolume: 3450000,
  },
  {
    id: 'mkt_btc_150k_2026',
    question: 'Will Bitcoin reach $150,000 in 2026?',
    description: 'Bitcoin touches $150,000 before December 31, 2026',
    category: 'price',
    status: 'open',
    createdAt: '2026-01-01T00:00:00Z',
    resolvesAt: '2026-12-31T23:59:59Z',
    options: {
      yes: { odds: 2.20, totalBets: 12456, volume: 3200000 },
      no: { odds: 1.75, totalBets: 8901, volume: 2100000 },
    },
    totalVolume: 5300000,
  },
  {
    id: 'mkt_msft_btc',
    question: 'Will Microsoft add Bitcoin to treasury in 2026?',
    description: 'Microsoft announces BTC purchase for corporate treasury',
    category: 'adoption',
    status: 'open',
    createdAt: '2026-01-15T00:00:00Z',
    resolvesAt: '2026-12-31T23:59:59Z',
    options: {
      yes: { odds: 3.50, totalBets: 2345, volume: 450000 },
      no: { odds: 1.35, totalBets: 6789, volume: 890000 },
    },
    totalVolume: 1340000,
  },
  {
    id: 'mkt_sol_eth_flip',
    question: 'Will Solana flip Ethereum in daily transactions in Feb 2026?',
    description: 'Solana has higher daily tx count than Ethereum for a full day',
    category: 'technology',
    status: 'open',
    createdAt: '2026-02-01T00:00:00Z',
    resolvesAt: '2026-02-28T23:59:59Z',
    options: {
      yes: { odds: 2.80, totalBets: 3456, volume: 670000 },
      no: { odds: 1.50, totalBets: 5678, volume: 780000 },
    },
    totalVolume: 1450000,
  },
];

// User bets (in production, use DB)
const USER_BETS: { [userId: string]: any[] } = {};

// Leaderboard
const LEADERBOARD = [
  { userId: 'user_001', username: 'CryptoOracle', wins: 45, losses: 12, accuracy: 0.789, profit: 15400 },
  { userId: 'user_002', username: 'ChartMaster', wins: 38, losses: 15, accuracy: 0.717, profit: 12300 },
  { userId: 'user_003', username: 'WhaleWatcher', wins: 32, losses: 10, accuracy: 0.762, profit: 9800 },
  { userId: 'user_004', username: 'NewsTrader', wins: 28, losses: 14, accuracy: 0.667, profit: 7600 },
  { userId: 'user_005', username: 'SatoshiDisciple', wins: 25, losses: 8, accuracy: 0.758, profit: 6900 },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'list';
  
  // Get leaderboard
  if (action === 'leaderboard') {
    return NextResponse.json({
      success: true,
      leaderboard: LEADERBOARD,
      period: 'all-time',
    });
  }
  
  // Get user bets
  if (action === 'user-bets') {
    const userId = searchParams.get('userId') || 'demo_user';
    return NextResponse.json({
      success: true,
      bets: USER_BETS[userId] || [],
      stats: {
        totalBets: 0,
        wins: 0,
        losses: 0,
        pending: 0,
        totalWagered: 0,
        totalWon: 0,
      },
    });
  }
  
  // Get single market
  const marketId = searchParams.get('id');
  if (marketId) {
    const market = MARKETS.find(m => m.id === marketId);
    if (!market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, market });
  }
  
  // List markets
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  
  let markets = [...MARKETS];
  
  if (status) {
    markets = markets.filter(m => m.status === status);
  }
  if (category) {
    markets = markets.filter(m => m.category === category);
  }
  
  // Sort by volume
  markets.sort((a, b) => b.totalVolume - a.totalVolume);
  
  return NextResponse.json({
    success: true,
    markets,
    stats: {
      totalMarkets: MARKETS.length,
      openMarkets: MARKETS.filter(m => m.status === 'open').length,
      totalVolume: MARKETS.reduce((sum, m) => sum + m.totalVolume, 0),
    },
    categories: ['price', 'regulatory', 'adoption', 'technology', 'general'],
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    // Place a bet
    if (action === 'bet') {
      const { marketId, position, amount, userId } = body;
      
      const market = MARKETS.find(m => m.id === marketId);
      if (!market) {
        return NextResponse.json({ error: 'Market not found' }, { status: 404 });
      }
      
      if (market.status !== 'open') {
        return NextResponse.json({ error: 'Market is not open for betting' }, { status: 400 });
      }
      
      const option = position === 'yes' ? market.options.yes : market.options.no;
      const potentialPayout = amount * option.odds;
      
      const bet = {
        id: `bet_${Date.now()}`,
        marketId,
        userId: userId || 'anonymous',
        position,
        amount,
        odds: option.odds,
        potentialPayout,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };
      
      // Store bet
      if (!USER_BETS[userId || 'anonymous']) {
        USER_BETS[userId || 'anonymous'] = [];
      }
      USER_BETS[userId || 'anonymous'].push(bet);
      
      // Update market (in production, this would be atomic)
      option.totalBets++;
      option.volume += amount;
      market.totalVolume += amount;
      
      return NextResponse.json({
        success: true,
        bet,
        market: {
          id: market.id,
          currentOdds: market.options,
        },
      });
    }
    
    // Create new market
    if (action === 'create') {
      const { question, description, category, resolvesAt } = body;
      
      const newMarket: PredictionMarket = {
        id: `mkt_${Date.now()}`,
        question,
        description,
        category: category || 'general',
        status: 'open',
        createdAt: new Date().toISOString(),
        resolvesAt,
        options: {
          yes: { odds: 2.0, totalBets: 0, volume: 0 },
          no: { odds: 2.0, totalBets: 0, volume: 0 },
        },
        totalVolume: 0,
      };
      
      MARKETS.push(newMarket);
      
      return NextResponse.json({
        success: true,
        market: newMarket,
      });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

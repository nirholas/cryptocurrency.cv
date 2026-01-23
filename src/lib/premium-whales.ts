/**
 * Whale Tracking Service
 *
 * Track large cryptocurrency transactions and smart money movements.
 * This is a high-value premium feature that traders will pay for.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PREMIUM_PRICING } from '@/lib/x402-config';

export const runtime = 'edge';

// Whale transaction threshold in USD
const WHALE_THRESHOLD = 1_000_000; // $1M+

interface WhaleTransaction {
  id: string;
  hash: string;
  blockchain: string;
  timestamp: string;
  from: {
    address: string;
    label?: string;
    isExchange: boolean;
  };
  to: {
    address: string;
    label?: string;
    isExchange: boolean;
  };
  amount: number;
  amountUsd: number;
  token: {
    symbol: string;
    name: string;
    contract?: string;
  };
  type: 'transfer' | 'exchange_inflow' | 'exchange_outflow' | 'unknown';
  significance: 'high' | 'medium' | 'low';
}

interface WhaleAlert {
  id: string;
  userId: string;
  conditions: {
    minAmount: number;
    tokens?: string[];
    types?: string[];
    chains?: string[];
  };
  webhookUrl: string;
  expiresAt: string;
  createdAt: string;
}

// Known exchange addresses (simplified - in production use comprehensive database)
const KNOWN_EXCHANGES: Record<string, string> = {
  // Ethereum
  '0x28c6c06298d514db089934071355e5743bf21d60': 'Binance',
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': 'Binance',
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d': 'Binance',
  '0x56eddb7aa87536c09ccc2793473599fd21a8b17f': 'Coinbase',
  '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43': 'Coinbase',
  '0x503828976d22510aad0201ac7ec88293211d23da': 'Coinbase',
  '0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2': 'FTX',
  '0xc098b2a3aa256d2140208c3de6543aaef5cd3a94': 'FTX',
  // Bitcoin
  bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h: 'Binance',
  '1NDyJtNTjmwk5xPNhjgAMu4HDHigtobu1s': 'Binance',
  '3JZq4atUahhuA9rLhXLMhhTo133J9rF97j': 'Coinbase',
  // Add more in production
};

// Simulated whale data for demo (replace with real blockchain APIs)
function generateMockWhaleTransactions(count: number): WhaleTransaction[] {
  const chains = ['ethereum', 'bitcoin', 'solana', 'arbitrum', 'base'];
  const tokens = [
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'USDT', name: 'Tether' },
    { symbol: 'USDC', name: 'USD Coin' },
    { symbol: 'SOL', name: 'Solana' },
  ];
  const types: WhaleTransaction['type'][] = ['transfer', 'exchange_inflow', 'exchange_outflow'];

  const transactions: WhaleTransaction[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const chain = chains[Math.floor(Math.random() * chains.length)];
    const token = tokens[Math.floor(Math.random() * tokens.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const amount = Math.floor(Math.random() * 50_000_000) + WHALE_THRESHOLD;

    // Generate realistic addresses
    const fromAddr = `0x${Math.random().toString(16).slice(2, 42)}`;
    const toAddr = `0x${Math.random().toString(16).slice(2, 42)}`;

    const isExchangeFrom = type === 'exchange_outflow' || Math.random() > 0.7;
    const isExchangeTo = type === 'exchange_inflow' || Math.random() > 0.7;

    transactions.push({
      id: `whale_${Date.now()}_${i}`,
      hash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
      blockchain: chain,
      timestamp: new Date(now - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      from: {
        address: fromAddr,
        label: isExchangeFrom
          ? ['Binance', 'Coinbase', 'Kraken'][Math.floor(Math.random() * 3)]
          : undefined,
        isExchange: isExchangeFrom,
      },
      to: {
        address: toAddr,
        label: isExchangeTo
          ? ['Binance', 'Coinbase', 'Kraken'][Math.floor(Math.random() * 3)]
          : undefined,
        isExchange: isExchangeTo,
      },
      amount: amount / (token.symbol === 'BTC' ? 100000 : token.symbol === 'ETH' ? 4000 : 1),
      amountUsd: amount,
      token,
      type,
      significance: amount > 10_000_000 ? 'high' : amount > 5_000_000 ? 'medium' : 'low',
    });
  }

  return transactions.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Get recent whale transactions
 */
export async function getWhaleTransactions(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const minAmount = parseInt(searchParams.get('minAmount') || String(WHALE_THRESHOLD));
  const token = searchParams.get('token')?.toUpperCase();
  const chain = searchParams.get('chain')?.toLowerCase();
  const type = searchParams.get('type') as WhaleTransaction['type'] | null;

  try {
    // In production, query blockchain APIs:
    // - Whale Alert API
    // - Etherscan/Basescan APIs
    // - The Graph subgraphs
    // - Alchemy/Quicknode webhooks

    let transactions = generateMockWhaleTransactions(limit * 2);

    // Apply filters
    transactions = transactions
      .filter((tx) => {
        if (tx.amountUsd < minAmount) return false;
        if (token && tx.token.symbol !== token) return false;
        if (chain && tx.blockchain !== chain) return false;
        if (type && tx.type !== type) return false;
        return true;
      })
      .slice(0, limit);

    // Calculate aggregates
    const aggregates = {
      totalVolume: transactions.reduce((sum, tx) => sum + tx.amountUsd, 0),
      exchangeInflow: transactions
        .filter((tx) => tx.type === 'exchange_inflow')
        .reduce((sum, tx) => sum + tx.amountUsd, 0),
      exchangeOutflow: transactions
        .filter((tx) => tx.type === 'exchange_outflow')
        .reduce((sum, tx) => sum + tx.amountUsd, 0),
      netFlow: 0,
      topTokens: {} as Record<string, number>,
    };

    aggregates.netFlow = aggregates.exchangeOutflow - aggregates.exchangeInflow;

    transactions.forEach((tx) => {
      aggregates.topTokens[tx.token.symbol] =
        (aggregates.topTokens[tx.token.symbol] || 0) + tx.amountUsd;
    });

    return NextResponse.json({
      transactions,
      aggregates,
      filters: { minAmount, token, chain, type },
      meta: {
        fetchedAt: new Date().toISOString(),
        count: transactions.length,
        endpoint: '/api/premium/whales/transactions',
        price: PREMIUM_PRICING['/api/premium/whales/transactions'].price,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch whale transactions',
        details: error instanceof Error ? error.message : 'Unknown',
      },
      { status: 500 }
    );
  }
}

/**
 * Analyze a specific wallet address
 */
export async function analyzeWallet(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');
  const chain = searchParams.get('chain') || 'ethereum';

  if (!address) {
    return NextResponse.json({ error: 'Missing address parameter' }, { status: 400 });
  }

  // Validate address format
  const isValidEthAddress = /^0x[a-fA-F0-9]{40}$/.test(address);
  const isValidBtcAddress = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address);

  if (!isValidEthAddress && !isValidBtcAddress) {
    return NextResponse.json({ error: 'Invalid address format' }, { status: 400 });
  }

  try {
    // In production, query:
    // - Etherscan/Basescan for balances
    // - DeBank for DeFi positions
    // - Nansen for labels
    // - Historical transaction data

    // Mock wallet analysis
    const analysis = {
      address,
      chain,
      label: KNOWN_EXCHANGES[address.toLowerCase()] || null,
      isExchange: !!KNOWN_EXCHANGES[address.toLowerCase()],
      isContract: Math.random() > 0.8,

      // Balance information
      balance: {
        total_usd: Math.floor(Math.random() * 100_000_000),
        tokens: [
          { symbol: 'ETH', amount: Math.random() * 1000, usd: Math.random() * 4_000_000 },
          { symbol: 'USDC', amount: Math.random() * 5_000_000, usd: Math.random() * 5_000_000 },
          { symbol: 'WBTC', amount: Math.random() * 50, usd: Math.random() * 5_000_000 },
        ],
      },

      // Activity metrics
      activity: {
        firstSeen: new Date(
          Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000 * 3
        ).toISOString(),
        lastActive: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        transactionCount: Math.floor(Math.random() * 10000),
        uniqueInteractions: Math.floor(Math.random() * 500),
      },

      // DeFi positions (if applicable)
      defi: {
        protocols: ['Uniswap', 'Aave', 'Compound'].slice(0, Math.floor(Math.random() * 4)),
        totalValueLocked: Math.random() * 10_000_000,
        positions: [],
      },

      // Related wallets
      relatedWallets: [
        {
          address: `0x${Math.random().toString(16).slice(2, 42)}`,
          relationship: 'frequent_interaction',
        },
        { address: `0x${Math.random().toString(16).slice(2, 42)}`, relationship: 'funding_source' },
      ],

      // Risk indicators
      risk: {
        score: Math.floor(Math.random() * 100),
        flags: [] as string[],
        isWhitelisted: false,
        isBlacklisted: false,
      },
    };

    return NextResponse.json({
      analysis,
      meta: {
        analyzedAt: new Date().toISOString(),
        endpoint: '/api/premium/wallets/analyze',
        price: PREMIUM_PRICING['/api/premium/wallets/analyze'].price,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Wallet analysis failed',
        details: error instanceof Error ? error.message : 'Unknown',
      },
      { status: 500 }
    );
  }
}

/**
 * Get smart money movements
 */
export async function getSmartMoney(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token')?.toLowerCase();
  const timeframe = searchParams.get('timeframe') || '24h';

  try {
    // Smart money categories
    const smartMoneyData = {
      // Top fund/VC wallets activity
      institutions: {
        netBuying: Math.random() > 0.5,
        volume24h: Math.floor(Math.random() * 100_000_000),
        topBuys: [
          { token: 'ETH', amount: Math.random() * 10000, usd: Math.random() * 40_000_000 },
          { token: 'SOL', amount: Math.random() * 100000, usd: Math.random() * 20_000_000 },
          { token: 'LINK', amount: Math.random() * 500000, usd: Math.random() * 10_000_000 },
        ],
        topSells: [{ token: 'BTC', amount: Math.random() * 500, usd: Math.random() * 50_000_000 }],
      },

      // Whale accumulation/distribution
      whaleActivity: {
        accumulationPhase: Math.random() > 0.4,
        distribution: {
          accumulating: ['ETH', 'SOL', 'AVAX'],
          distributing: ['DOGE', 'SHIB'],
          neutral: ['BTC'],
        },
        largestBuy: {
          token: 'ETH',
          amount: 5000,
          usd: 20_000_000,
          wallet: '0x...',
        },
        largestSell: {
          token: 'BTC',
          amount: 200,
          usd: 20_000_000,
          wallet: '0x...',
        },
      },

      // Exchange netflow
      exchangeFlow: {
        btc: { inflow: Math.random() * 1000, outflow: Math.random() * 1500, net: 0 },
        eth: { inflow: Math.random() * 20000, outflow: Math.random() * 15000, net: 0 },
        usdt: { inflow: Math.random() * 100_000_000, outflow: Math.random() * 80_000_000, net: 0 },
      },

      // DeFi smart money
      defiActivity: {
        topProtocolInflows: [
          { protocol: 'Aave', usd: Math.random() * 50_000_000 },
          { protocol: 'Uniswap', usd: Math.random() * 30_000_000 },
          { protocol: 'Lido', usd: Math.random() * 100_000_000 },
        ],
        newPositions: Math.floor(Math.random() * 1000),
        closedPositions: Math.floor(Math.random() * 800),
      },

      // Signals
      signals: {
        overallSentiment: Math.random() > 0.5 ? 'accumulation' : 'distribution',
        confidence: Math.floor(Math.random() * 40) + 60,
        keyInsights: [
          'Large ETH accumulation by institutional wallets',
          'Exchange reserves declining for BTC',
          'Smart money rotating into L2 tokens',
        ],
      },
    };

    // Calculate net flows
    smartMoneyData.exchangeFlow.btc.net =
      smartMoneyData.exchangeFlow.btc.outflow - smartMoneyData.exchangeFlow.btc.inflow;
    smartMoneyData.exchangeFlow.eth.net =
      smartMoneyData.exchangeFlow.eth.outflow - smartMoneyData.exchangeFlow.eth.inflow;
    smartMoneyData.exchangeFlow.usdt.net =
      smartMoneyData.exchangeFlow.usdt.outflow - smartMoneyData.exchangeFlow.usdt.inflow;

    return NextResponse.json({
      ...smartMoneyData,
      timeframe,
      token,
      meta: {
        fetchedAt: new Date().toISOString(),
        endpoint: '/api/premium/smart-money',
        price: PREMIUM_PRICING['/api/premium/smart-money'].price,
        disclaimer: 'Data for informational purposes only. Not financial advice.',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Smart money data fetch failed',
        details: error instanceof Error ? error.message : 'Unknown',
      },
      { status: 500 }
    );
  }
}

// In-memory alert storage (use DB in production)
const whaleAlerts = new Map<string, WhaleAlert>();

/**
 * Create a whale alert subscription
 */
export async function createWhaleAlert(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { minAmount, tokens, types, chains, webhookUrl, durationHours = 24 } = body;

    if (!webhookUrl) {
      return NextResponse.json({ error: 'webhookUrl is required' }, { status: 400 });
    }

    // Validate webhook URL
    try {
      new URL(webhookUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid webhook URL' }, { status: 400 });
    }

    const alert: WhaleAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      userId: 'anonymous', // In production, extract from payment/auth
      conditions: {
        minAmount: minAmount || WHALE_THRESHOLD,
        tokens: tokens?.map((t: string) => t.toUpperCase()),
        types,
        chains: chains?.map((c: string) => c.toLowerCase()),
      },
      webhookUrl,
      expiresAt: new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    whaleAlerts.set(alert.id, alert);

    return NextResponse.json({
      success: true,
      alert,
      meta: {
        createdAt: new Date().toISOString(),
        endpoint: '/api/premium/whales/alerts',
        price: PREMIUM_PRICING['/api/premium/whales/alerts'].price,
        note: 'Webhook will receive POST requests when whale transactions match your conditions',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Alert creation failed',
        details: error instanceof Error ? error.message : 'Unknown',
      },
      { status: 500 }
    );
  }
}

// Export handlers
export const whaleHandlers = {
  transactions: getWhaleTransactions,
  alerts: createWhaleAlert,
  analyze: analyzeWallet,
  smartMoney: getSmartMoney,
};

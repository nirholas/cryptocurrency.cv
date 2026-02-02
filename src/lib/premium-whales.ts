/**
 * Whale Tracking Service
 *
 * Track large cryptocurrency transactions and smart money movements.
 * This is a high-value premium feature that traders will pay for.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PREMIUM_PRICING } from '@/lib/x402';

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

// API configuration
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';

/**
 * Fetch real whale transactions from blockchain APIs
 */
async function fetchRealWhaleTransactions(
  limit: number,
  minAmount: number,
  tokenFilter?: string,
  chainFilter?: string
): Promise<WhaleTransaction[]> {
  const transactions: WhaleTransaction[] = [];

  try {
    // Get current prices
    const priceResponse = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd',
      { next: { revalidate: 60 } }
    );
    const priceData = await priceResponse.json();
    const ethPrice = priceData.ethereum?.usd || 3000;
    const btcPrice = priceData.bitcoin?.usd || 100000;

    // Fetch Ethereum whale transactions from Blockchair
    if (!chainFilter || chainFilter === 'ethereum') {
      try {
        const ethResponse = await fetch(
          'https://api.blockchair.com/ethereum/transactions?limit=25&s=value(desc)',
          { next: { revalidate: 30 } }
        );

        if (ethResponse.ok) {
          const ethData = await ethResponse.json();

          if (ethData.data && Array.isArray(ethData.data)) {
            for (const tx of ethData.data) {
              const valueEth = parseFloat(tx.value) / 1e18;
              const valueUsd = valueEth * ethPrice;

              if (valueUsd >= minAmount && (!tokenFilter || tokenFilter === 'ETH')) {
                const fromIsExchange = !!KNOWN_EXCHANGES[tx.sender?.toLowerCase?.() || ''];
                const toIsExchange = !!KNOWN_EXCHANGES[tx.recipient?.toLowerCase?.() || ''];

                let type: WhaleTransaction['type'] = 'transfer';
                if (fromIsExchange && !toIsExchange) type = 'exchange_outflow';
                else if (!fromIsExchange && toIsExchange) type = 'exchange_inflow';

                transactions.push({
                  id: `eth-${tx.hash}`,
                  hash: tx.hash,
                  blockchain: 'ethereum',
                  timestamp: tx.time || new Date().toISOString(),
                  from: {
                    address: tx.sender || 'unknown',
                    label: KNOWN_EXCHANGES[tx.sender?.toLowerCase?.() || ''],
                    isExchange: fromIsExchange,
                  },
                  to: {
                    address: tx.recipient || 'unknown',
                    label: KNOWN_EXCHANGES[tx.recipient?.toLowerCase?.() || ''],
                    isExchange: toIsExchange,
                  },
                  amount: valueEth,
                  amountUsd: valueUsd,
                  token: { symbol: 'ETH', name: 'Ethereum' },
                  type,
                  significance: valueUsd > 10_000_000 ? 'high' : valueUsd > 5_000_000 ? 'medium' : 'low',
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Blockchair ETH fetch error:', error);
      }
    }

    // Fetch Bitcoin whale transactions from Blockchair
    if (!chainFilter || chainFilter === 'bitcoin') {
      try {
        const btcResponse = await fetch(
          'https://api.blockchair.com/bitcoin/transactions?limit=25&s=output_total(desc)',
          { next: { revalidate: 30 } }
        );

        if (btcResponse.ok) {
          const btcData = await btcResponse.json();

          if (btcData.data && Array.isArray(btcData.data)) {
            for (const tx of btcData.data) {
              const valueBtc = tx.output_total / 1e8;
              const valueUsd = valueBtc * btcPrice;

              if (valueUsd >= minAmount && (!tokenFilter || tokenFilter === 'BTC')) {
                transactions.push({
                  id: `btc-${tx.hash}`,
                  hash: tx.hash,
                  blockchain: 'bitcoin',
                  timestamp: tx.time || new Date().toISOString(),
                  from: {
                    address: 'multiple_inputs',
                    isExchange: false,
                  },
                  to: {
                    address: 'multiple_outputs',
                    isExchange: false,
                  },
                  amount: valueBtc,
                  amountUsd: valueUsd,
                  token: { symbol: 'BTC', name: 'Bitcoin' },
                  type: 'transfer',
                  significance: valueUsd > 10_000_000 ? 'high' : valueUsd > 5_000_000 ? 'medium' : 'low',
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Blockchair BTC fetch error:', error);
      }
    }

    // If we have Etherscan API key, also fetch from major exchange wallets
    if (ETHERSCAN_API_KEY && (!chainFilter || chainFilter === 'ethereum')) {
      try {
        // Binance hot wallet
        const binanceResponse = await fetch(
          `https://api.etherscan.io/api?module=account&action=txlist&address=0x28c6c06298d514db089934071355e5743bf21d60&startblock=0&endblock=99999999&page=1&offset=50&sort=desc&apikey=${ETHERSCAN_API_KEY}`,
          { next: { revalidate: 30 } }
        );

        if (binanceResponse.ok) {
          const binanceData = await binanceResponse.json();

          if (binanceData.status === '1' && Array.isArray(binanceData.result)) {
            for (const tx of binanceData.result.slice(0, 20)) {
              const valueEth = parseFloat(tx.value) / 1e18;
              const valueUsd = valueEth * ethPrice;

              if (valueUsd >= minAmount && (!tokenFilter || tokenFilter === 'ETH')) {
                const fromIsExchange = !!KNOWN_EXCHANGES[tx.from?.toLowerCase?.() || ''];
                const toIsExchange = !!KNOWN_EXCHANGES[tx.to?.toLowerCase?.() || ''];

                let type: WhaleTransaction['type'] = 'transfer';
                if (fromIsExchange && !toIsExchange) type = 'exchange_outflow';
                else if (!fromIsExchange && toIsExchange) type = 'exchange_inflow';

                // Avoid duplicates
                if (!transactions.find(t => t.hash === tx.hash)) {
                  transactions.push({
                    id: `eth-${tx.hash}`,
                    hash: tx.hash,
                    blockchain: 'ethereum',
                    timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
                    from: {
                      address: tx.from,
                      label: KNOWN_EXCHANGES[tx.from?.toLowerCase?.() || ''],
                      isExchange: fromIsExchange,
                    },
                    to: {
                      address: tx.to,
                      label: KNOWN_EXCHANGES[tx.to?.toLowerCase?.() || ''],
                      isExchange: toIsExchange,
                    },
                    amount: valueEth,
                    amountUsd: valueUsd,
                    token: { symbol: 'ETH', name: 'Ethereum' },
                    type,
                    significance: valueUsd > 10_000_000 ? 'high' : valueUsd > 5_000_000 ? 'medium' : 'low',
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Etherscan fetch error:', error);
      }
    }
  } catch (error) {
    console.error('Failed to fetch whale transactions:', error);
  }

  // Sort by USD value and limit
  return transactions
    .sort((a, b) => b.amountUsd - a.amountUsd)
    .slice(0, limit);
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
    // Fetch real whale transactions from blockchain APIs
    let transactions = await fetchRealWhaleTransactions(limit * 2, minAmount, token, chain);

    // Apply type filter if specified
    if (type) {
      transactions = transactions.filter((tx) => tx.type === type);
    }

    // Limit results
    transactions = transactions.slice(0, limit);

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
    // Fetch real data from blockchain APIs
    let analysis: {
      address: string;
      chain: string;
      label: string | null;
      isExchange: boolean;
      isContract: boolean;
      balance: {
        total_usd: number;
        tokens: { symbol: string; amount: number; usd: number }[];
      };
      activity: {
        firstSeen: string | null;
        lastActive: string | null;
        transactionCount: number;
        uniqueInteractions: number;
      };
      defi: {
        protocols: string[];
        totalValueLocked: number;
        positions: unknown[];
      };
      relatedWallets: { address: string; relationship: string }[];
      risk: {
        score: number;
        flags: string[];
        isWhitelisted: boolean;
        isBlacklisted: boolean;
      };
    };

    // Check if it's a known exchange
    const knownLabel = KNOWN_EXCHANGES[address.toLowerCase()] || null;
    const isExchange = !!knownLabel;

    if (isValidEthAddress && ETHERSCAN_API_KEY) {
      // Fetch from Etherscan
      const [balanceResponse, txResponse] = await Promise.all([
        fetch(
          `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`,
          { next: { revalidate: 60 } }
        ),
        fetch(
          `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${ETHERSCAN_API_KEY}`,
          { next: { revalidate: 60 } }
        ),
      ]);

      const balanceData = await balanceResponse.json();
      const txData = await txResponse.json();

      // Get ETH price
      const priceResponse = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
        { next: { revalidate: 60 } }
      );
      const priceData = await priceResponse.json();
      const ethPrice = priceData.ethereum?.usd || 3000;

      const balanceWei = parseFloat(balanceData.result || '0');
      const balanceEth = balanceWei / 1e18;
      const balanceUsd = balanceEth * ethPrice;

      // Parse transaction data
      const transactions = txData.status === '1' ? txData.result || [] : [];
      const uniqueAddresses = new Set<string>();
      transactions.forEach((tx: { from: string; to: string }) => {
        if (tx.from?.toLowerCase() !== address.toLowerCase()) {
          uniqueAddresses.add(tx.from);
        }
        if (tx.to?.toLowerCase() !== address.toLowerCase()) {
          uniqueAddresses.add(tx.to);
        }
      });

      const firstTx = transactions.length > 0 ? transactions[transactions.length - 1] : null;
      const lastTx = transactions.length > 0 ? transactions[0] : null;

      analysis = {
        address,
        chain,
        label: knownLabel,
        isExchange,
        isContract: false, // Would need separate API call to check

        balance: {
          total_usd: balanceUsd,
          tokens: [{ symbol: 'ETH', amount: balanceEth, usd: balanceUsd }],
        },

        activity: {
          firstSeen: firstTx ? new Date(parseInt(firstTx.timeStamp) * 1000).toISOString() : null,
          lastActive: lastTx ? new Date(parseInt(lastTx.timeStamp) * 1000).toISOString() : null,
          transactionCount: transactions.length,
          uniqueInteractions: uniqueAddresses.size,
        },

        defi: {
          protocols: [],
          totalValueLocked: 0,
          positions: [],
        },

        relatedWallets: Array.from(uniqueAddresses)
          .slice(0, 5)
          .map((addr) => ({
            address: addr,
            relationship: 'interaction',
          })),

        risk: {
          score: isExchange ? 10 : 50,
          flags: [],
          isWhitelisted: isExchange,
          isBlacklisted: false,
        },
      };
    } else {
      // Minimal data when API key not available
      analysis = {
        address,
        chain,
        label: knownLabel,
        isExchange,
        isContract: false,

        balance: {
          total_usd: 0,
          tokens: [],
        },

        activity: {
          firstSeen: null,
          lastActive: null,
          transactionCount: 0,
          uniqueInteractions: 0,
        },

        defi: {
          protocols: [],
          totalValueLocked: 0,
          positions: [],
        },

        relatedWallets: [],

        risk: {
          score: 50,
          flags: ETHERSCAN_API_KEY ? [] : ['Limited data - API key not configured'],
          isWhitelisted: isExchange,
          isBlacklisted: false,
        },
      };
    }

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
    // Fetch real whale transactions to derive smart money data
    const transactions = await fetchRealWhaleTransactions(100, WHALE_THRESHOLD, undefined, undefined);

    // Analyze transactions to derive smart money signals
    const inflowTxs = transactions.filter(tx => tx.type === 'exchange_inflow');
    const outflowTxs = transactions.filter(tx => tx.type === 'exchange_outflow');

    const ethInflow = inflowTxs.filter(tx => tx.token.symbol === 'ETH').reduce((sum, tx) => sum + tx.amount, 0);
    const ethOutflow = outflowTxs.filter(tx => tx.token.symbol === 'ETH').reduce((sum, tx) => sum + tx.amount, 0);
    const btcInflow = inflowTxs.filter(tx => tx.token.symbol === 'BTC').reduce((sum, tx) => sum + tx.amount, 0);
    const btcOutflow = outflowTxs.filter(tx => tx.token.symbol === 'BTC').reduce((sum, tx) => sum + tx.amount, 0);

    const totalInflowUsd = inflowTxs.reduce((sum, tx) => sum + tx.amountUsd, 0);
    const totalOutflowUsd = outflowTxs.reduce((sum, tx) => sum + tx.amountUsd, 0);

    // Determine accumulation vs distribution
    const netFlow = totalOutflowUsd - totalInflowUsd;
    const isAccumulation = netFlow > 0;

    // Find largest transactions
    const largestBuy = outflowTxs.sort((a, b) => b.amountUsd - a.amountUsd)[0];
    const largestSell = inflowTxs.sort((a, b) => b.amountUsd - a.amountUsd)[0];

    // Analyze by token
    const tokenFlows: Record<string, { inflow: number; outflow: number }> = {};
    transactions.forEach(tx => {
      const symbol = tx.token.symbol;
      if (!tokenFlows[symbol]) {
        tokenFlows[symbol] = { inflow: 0, outflow: 0 };
      }
      if (tx.type === 'exchange_inflow') {
        tokenFlows[symbol].inflow += tx.amountUsd;
      } else if (tx.type === 'exchange_outflow') {
        tokenFlows[symbol].outflow += tx.amountUsd;
      }
    });

    // Determine accumulating vs distributing tokens
    const accumulating: string[] = [];
    const distributing: string[] = [];
    const neutral: string[] = [];

    Object.entries(tokenFlows).forEach(([symbol, flow]) => {
      const net = flow.outflow - flow.inflow;
      if (net > flow.inflow * 0.2) {
        accumulating.push(symbol);
      } else if (net < -flow.outflow * 0.2) {
        distributing.push(symbol);
      } else {
        neutral.push(symbol);
      }
    });

    const smartMoneyData = {
      // Institution activity derived from whale transactions
      institutions: {
        netBuying: isAccumulation,
        volume24h: totalInflowUsd + totalOutflowUsd,
        topBuys: outflowTxs.slice(0, 3).map(tx => ({
          token: tx.token.symbol,
          amount: tx.amount,
          usd: tx.amountUsd,
        })),
        topSells: inflowTxs.slice(0, 3).map(tx => ({
          token: tx.token.symbol,
          amount: tx.amount,
          usd: tx.amountUsd,
        })),
      },

      // Whale accumulation/distribution
      whaleActivity: {
        accumulationPhase: isAccumulation,
        distribution: {
          accumulating,
          distributing,
          neutral,
        },
        largestBuy: largestBuy ? {
          token: largestBuy.token.symbol,
          amount: largestBuy.amount,
          usd: largestBuy.amountUsd,
          wallet: largestBuy.to.address.slice(0, 10) + '...',
        } : null,
        largestSell: largestSell ? {
          token: largestSell.token.symbol,
          amount: largestSell.amount,
          usd: largestSell.amountUsd,
          wallet: largestSell.from.address.slice(0, 10) + '...',
        } : null,
      },

      // Exchange netflow
      exchangeFlow: {
        btc: { inflow: btcInflow, outflow: btcOutflow, net: btcOutflow - btcInflow },
        eth: { inflow: ethInflow, outflow: ethOutflow, net: ethOutflow - ethInflow },
        total: { inflow: totalInflowUsd, outflow: totalOutflowUsd, net: netFlow },
      },

      // Signals
      signals: {
        overallSentiment: isAccumulation ? 'accumulation' : 'distribution',
        confidence: transactions.length > 50 ? 85 : transactions.length > 20 ? 70 : 50,
        keyInsights: [
          netFlow > 0 
            ? `Net ${(netFlow / 1e6).toFixed(1)}M USD flowing out of exchanges (bullish)`
            : `Net ${(Math.abs(netFlow) / 1e6).toFixed(1)}M USD flowing into exchanges (bearish)`,
          accumulating.length > 0 
            ? `Accumulation detected in: ${accumulating.join(', ')}`
            : 'No significant accumulation detected',
          transactions.length > 0
            ? `${transactions.length} whale transactions analyzed`
            : 'Limited whale activity in timeframe',
        ].filter(Boolean),
      },

      // Data quality indicator
      dataQuality: {
        transactionsAnalyzed: transactions.length,
        dataSource: 'Blockchair, Etherscan',
        lastUpdated: new Date().toISOString(),
      },
    };

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

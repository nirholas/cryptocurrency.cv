#!/usr/bin/env node

/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * On-Chain Event Tracker
 * 
 * Tracks significant on-chain events to correlate with news:
 * - Whale movements (large transfers)
 * - Exchange flows
 * - DeFi liquidations
 * - Smart contract deployments
 * - Major protocol events
 * 
 * Uses free APIs with rate limiting.
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const BLOCKCHAIN_INFO_API = 'https://blockchain.info';

// Thresholds for "significant" events
const THRESHOLDS = {
  btc_whale: 100,        // 100+ BTC
  eth_whale: 1000,       // 1000+ ETH
  usd_significant: 10000000  // $10M+
};

// Rate limiting
const RATE_LIMITS = {
  whale_alert: { minInterval: 2000, lastCall: 0 },
  blockchain: { minInterval: 1000, lastCall: 0 }
};

// =============================================================================
// UTILITIES
// =============================================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function rateLimitedFetch(service, url, options = {}, timeout = 10000) {
  const limit = RATE_LIMITS[service];
  if (limit) {
    const now = Date.now();
    const timeSinceLastCall = now - limit.lastCall;
    if (timeSinceLastCall < limit.minInterval) {
      await sleep(limit.minInterval - timeSinceLastCall);
    }
    limit.lastCall = Date.now();
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...options.headers
      }
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// =============================================================================
// BLOCKCHAIN.INFO SERVICE (Bitcoin)
// =============================================================================

const BlockchainInfoService = {
  /**
   * Get recent large Bitcoin transactions (mempool + confirmed)
   */
  async getRecentLargeTxs() {
    try {
      // Get unconfirmed transactions
      const data = await rateLimitedFetch(
        'blockchain',
        `${BLOCKCHAIN_INFO_API}/unconfirmed-transactions?format=json`,
        {},
        15000
      );
      
      const largeTxs = (data.txs || [])
        .filter(tx => {
          const totalOutput = tx.out?.reduce((sum, o) => sum + (o.value || 0), 0) || 0;
          return totalOutput >= THRESHOLDS.btc_whale * 100000000; // satoshis
        })
        .slice(0, 20)
        .map(tx => ({
          hash: tx.hash,
          time: tx.time * 1000,
          total_btc: tx.out?.reduce((sum, o) => sum + (o.value || 0), 0) / 100000000,
          input_count: tx.inputs?.length || 0,
          output_count: tx.out?.length || 0
        }));
      
      return largeTxs;
    } catch (error) {
      console.error('BlockchainInfo getLargeTxs failed:', error.message);
      return [];
    }
  },

  /**
   * Get current Bitcoin network stats
   */
  async getNetworkStats() {
    try {
      const [statsData, poolData] = await Promise.all([
        rateLimitedFetch('blockchain', `${BLOCKCHAIN_INFO_API}/stats?format=json`),
        rateLimitedFetch('blockchain', `${BLOCKCHAIN_INFO_API}/pools?timespan=24hours&format=json`).catch(() => ({}))
      ]);
      
      return {
        market_price_usd: statsData.market_price_usd,
        hash_rate: statsData.hash_rate,
        difficulty: statsData.difficulty,
        block_height: statsData.n_blocks_total,
        total_btc: statsData.totalbc / 100000000,
        mempool_size: statsData.mempool_size,
        miners_revenue_usd: statsData.miners_revenue_usd,
        estimated_btc_sent_24h: statsData.estimated_btc_sent / 100000000,
        mining_pools: poolData
      };
    } catch (error) {
      console.error('BlockchainInfo getNetworkStats failed:', error.message);
      return null;
    }
  }
};

// =============================================================================
// SIMULATED WHALE TRACKER (for demo - would need paid API for real data)
// =============================================================================

const WhaleTracker = {
  /**
   * Get recent whale movements
   * Note: In production, use Whale Alert API with paid key
   * This provides structure for integration
   */
  async getRecentWhaleMovements() {
    // This would use Whale Alert API in production:
    // const data = await rateLimitedFetch('whale_alert', 
    //   `https://api.whale-alert.io/v1/transactions?api_key=${WHALE_ALERT_KEY}&min_value=${THRESHOLDS.usd_significant}`
    // );
    
    // For now, return empty with schema
    return {
      available: false,
      note: 'Whale Alert API requires paid subscription. Structure ready for integration.',
      movements: [],
      schema: {
        type: 'whale_movement',
        fields: ['blockchain', 'symbol', 'amount', 'amount_usd', 'from', 'to', 'transaction_type', 'timestamp']
      }
    };
  }
};

// =============================================================================
// DEFI EVENT TRACKER
// =============================================================================

const DeFiEventTracker = {
  /**
   * Get recent liquidations from DeFi protocols
   * Uses DeFiLlama liquidations endpoint
   */
  async getRecentLiquidations() {
    try {
      const response = await fetch('https://api.llama.fi/overview/options/ethereum', { 
        signal: AbortSignal.timeout(10000) 
      });
      
      if (!response.ok) {
        return { available: false, liquidations: [] };
      }
      
      // DeFiLlama doesn't have a direct liquidations feed
      // In production, integrate with Dune Analytics or TheGraph
      return {
        available: false,
        note: 'Liquidation tracking requires Dune Analytics or TheGraph integration',
        liquidations: [],
        schema: {
          type: 'liquidation',
          fields: ['protocol', 'chain', 'collateral', 'debt', 'amount_usd', 'liquidator', 'timestamp']
        }
      };
    } catch (error) {
      return { available: false, liquidations: [] };
    }
  },

  /**
   * Get bridge flows (cross-chain movements)
   */
  async getBridgeVolumes() {
    try {
      const response = await fetch('https://bridges.llama.fi/bridges', { 
        signal: AbortSignal.timeout(10000) 
      });
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return (data.bridges || []).slice(0, 15).map(b => ({
        name: b.name,
        chains: b.chains,
        volume_24h: b.currentDayVolume,
        volume_prev_day: b.prevDayVolume,
        change_24h: b.currentDayVolume && b.prevDayVolume 
          ? ((b.currentDayVolume - b.prevDayVolume) / b.prevDayVolume * 100) 
          : null
      }));
    } catch (error) {
      console.error('Bridge volumes fetch failed:', error.message);
      return [];
    }
  },

  /**
   * Get DEX volumes
   */
  async getDexVolumes() {
    try {
      const response = await fetch('https://api.llama.fi/overview/dexs', { 
        signal: AbortSignal.timeout(10000) 
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      return {
        total_24h: data.totalDataChart?.[data.totalDataChart.length - 1]?.[1],
        protocols: (data.protocols || []).slice(0, 20).map(p => ({
          name: p.name,
          volume_24h: p.total24h,
          change_24h: p.change_1d,
          chains: p.chains
        }))
      };
    } catch (error) {
      console.error('DEX volumes fetch failed:', error.message);
      return null;
    }
  }
};

// =============================================================================
// EXCHANGE FLOW TRACKER
// =============================================================================

const ExchangeFlowTracker = {
  /**
   * Track exchange inflows/outflows
   * Note: Requires CryptoQuant or Glassnode API for real data
   */
  async getExchangeFlows() {
    return {
      available: false,
      note: 'Exchange flow tracking requires CryptoQuant or Glassnode API',
      flows: [],
      schema: {
        type: 'exchange_flow',
        fields: ['exchange', 'coin', 'inflow', 'outflow', 'netflow', 'timestamp']
      }
    };
  },

  /**
   * Get exchange reserves (approximation from DeFiLlama CEX data)
   */
  async getExchangeReserves() {
    try {
      const response = await fetch('https://api.llama.fi/protocols', { 
        signal: AbortSignal.timeout(15000) 
      });
      
      if (!response.ok) return [];
      
      const data = await response.json();
      const cexes = data.filter(p => p.category === 'CEX');
      
      return cexes.slice(0, 10).map(c => ({
        name: c.name,
        tvl: c.tvl,
        change_1d: c.change_1d,
        change_7d: c.change_7d
      }));
    } catch (error) {
      console.error('Exchange reserves fetch failed:', error.message);
      return [];
    }
  }
};

// =============================================================================
// UNIFIED ON-CHAIN SERVICE
// =============================================================================

const OnChainService = {
  /**
   * Get complete on-chain snapshot
   */
  async getOnChainSnapshot() {
    console.log('⛓️ Fetching on-chain data...');
    const startTime = Date.now();

    const [btcNetwork, bridgeVolumes, dexVolumes, exchangeReserves, largeBtcTxs] = await Promise.all([
      BlockchainInfoService.getNetworkStats(),
      DeFiEventTracker.getBridgeVolumes(),
      DeFiEventTracker.getDexVolumes(),
      ExchangeFlowTracker.getExchangeReserves(),
      BlockchainInfoService.getRecentLargeTxs()
    ]);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ On-chain snapshot complete in ${elapsed}s`);

    return {
      timestamp: new Date().toISOString(),
      
      // Bitcoin network
      bitcoin: {
        network: btcNetwork,
        large_transactions: largeBtcTxs
      },
      
      // DeFi activity
      defi: {
        dex_volumes: dexVolumes,
        bridge_volumes: bridgeVolumes
      },
      
      // Exchange data
      exchanges: {
        reserves: exchangeReserves
      },
      
      // Placeholder for premium data sources
      premium_data: {
        whale_movements: await WhaleTracker.getRecentWhaleMovements(),
        liquidations: await DeFiEventTracker.getRecentLiquidations(),
        exchange_flows: await ExchangeFlowTracker.getExchangeFlows()
      },
      
      meta: {
        fetch_duration_ms: Date.now() - startTime,
        sources: ['blockchain.info', 'defillama'],
        notes: 'Some data requires premium API access for full functionality'
      }
    };
  }
};

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  OnChainService,
  BlockchainInfoService,
  WhaleTracker,
  DeFiEventTracker,
  ExchangeFlowTracker,
  THRESHOLDS
};

// CLI execution
if (require.main === module) {
  (async () => {
    console.log('🚀 Testing On-Chain Event Tracker...\n');
    
    const snapshot = await OnChainService.getOnChainSnapshot();
    
    console.log('\n⛓️ ON-CHAIN SNAPSHOT SUMMARY:');
    console.log('─'.repeat(50));
    
    if (snapshot.bitcoin.network) {
      console.log(`\n₿ Bitcoin Network:`);
      console.log(`   Block Height: ${snapshot.bitcoin.network.block_height?.toLocaleString()}`);
      console.log(`   Hash Rate: ${(snapshot.bitcoin.network.hash_rate / 1e18).toFixed(2)} EH/s`);
      console.log(`   Mempool: ${snapshot.bitcoin.network.mempool_size?.toLocaleString()} bytes`);
      console.log(`   24h Sent: ${snapshot.bitcoin.network.estimated_btc_sent_24h?.toLocaleString()} BTC`);
    }
    
    if (snapshot.bitcoin.large_transactions.length > 0) {
      console.log(`\n🐋 Large BTC Transactions (${snapshot.bitcoin.large_transactions.length}):`);
      snapshot.bitcoin.large_transactions.slice(0, 3).forEach(tx => {
        console.log(`   ${tx.total_btc?.toFixed(2)} BTC - ${tx.hash.slice(0, 16)}...`);
      });
    }
    
    if (snapshot.defi.dex_volumes) {
      console.log(`\n📊 DEX Volumes:`);
      console.log(`   24h Total: $${(snapshot.defi.dex_volumes.total_24h / 1e9).toFixed(2)}B`);
      snapshot.defi.dex_volumes.protocols?.slice(0, 3).forEach(p => {
        console.log(`   ${p.name}: $${(p.volume_24h / 1e9).toFixed(2)}B`);
      });
    }
    
    if (snapshot.defi.bridge_volumes.length > 0) {
      console.log(`\n🌉 Bridge Activity:`);
      snapshot.defi.bridge_volumes.slice(0, 3).forEach(b => {
        console.log(`   ${b.name}: $${(b.volume_24h / 1e6).toFixed(2)}M (${b.change_24h?.toFixed(1)}%)`);
      });
    }
    
    console.log('\n' + '─'.repeat(50));
    console.log('✅ On-chain tracking complete');
  })();
}

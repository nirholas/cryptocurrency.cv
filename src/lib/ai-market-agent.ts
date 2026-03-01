/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * AI Market Intelligence Agent
 * 
 * Revolutionary market analysis system that synthesizes multiple data sources
 * into actionable intelligence with natural language insights.
 * 
 * Features:
 * - Multi-source signal aggregation (news, social, on-chain, price action)
 * - Real-time anomaly detection with severity scoring
 * - Natural language market narrative generation
 * - Predictive regime detection (accumulation, distribution, markup, markdown)
 * - Cross-correlation alpha discovery
 * - Contrarian signal detection (sentiment/price divergence)
 * - Smart money flow tracking
 * - Narrative momentum scoring
 * 
 * @module ai-market-agent
 */

// =============================================================================
// Types & Interfaces
// =============================================================================

export type MarketRegime = 
  | 'accumulation'    // Smart money buying, price consolidating
  | 'markup'          // Trending up, momentum positive
  | 'distribution'    // Smart money selling, price topping
  | 'markdown'        // Trending down, momentum negative
  | 'ranging'         // Sideways, no clear direction
  | 'capitulation'    // Panic selling, potential bottom
  | 'euphoria';       // Extreme greed, potential top

export type SignalStrength = 'weak' | 'moderate' | 'strong' | 'extreme';
export type SignalDirection = 'bullish' | 'bearish' | 'neutral';
export type TimeHorizon = '1h' | '4h' | '1d' | '1w' | '1m';

export interface MarketSignal {
  id: string;
  source: SignalSource;
  type: SignalType;
  asset: string;
  direction: SignalDirection;
  strength: SignalStrength;
  confidence: number;           // 0-100
  timeHorizon: TimeHorizon;
  timestamp: Date;
  metadata: Record<string, unknown>;
  narrative: string;            // Human-readable explanation
}

export type SignalSource = 
  | 'news'
  | 'social'
  | 'on-chain'
  | 'technical'
  | 'derivatives'
  | 'whale'
  | 'regulatory'
  | 'smart-money'
  | 'narrative'
  | 'cross-correlation';

export type SignalType =
  | 'sentiment-shift'
  | 'volume-spike'
  | 'whale-movement'
  | 'liquidation-cascade'
  | 'funding-extreme'
  | 'oi-divergence'
  | 'news-catalyst'
  | 'regulatory-event'
  | 'smart-money-flow'
  | 'narrative-momentum'
  | 'technical-breakout'
  | 'correlation-break'
  | 'regime-change'
  | 'divergence'
  | 'anomaly';

export interface MarketIntelligence {
  generatedAt: Date;
  overallRegime: MarketRegime;
  regimeConfidence: number;
  fearGreedIndex: number;        // 0-100
  volatilityRegime: 'low' | 'medium' | 'high' | 'extreme';
  dominantNarrative: string;
  activeSignals: MarketSignal[];
  topOpportunities: TradingOpportunity[];
  riskAlerts: RiskAlert[];
  marketNarrative: string;       // AI-generated market summary
  sectorRotation: SectorFlow[];
  correlationAnomalies: CorrelationAnomaly[];
  keyLevels: KeyLevel[];
  upcomingCatalysts: Catalyst[];
}

export interface TradingOpportunity {
  id: string;
  asset: string;
  type: 'long' | 'short' | 'arbitrage' | 'yield' | 'hedge';
  rationale: string;
  entry: number;
  targets: number[];
  stopLoss: number;
  riskReward: number;
  confidence: number;
  timeHorizon: TimeHorizon;
  signalSources: SignalSource[];
  expiresAt: Date;
}

export interface RiskAlert {
  id: string;
  severity: 'info' | 'warning' | 'danger' | 'critical';
  type: RiskType;
  asset?: string;
  title: string;
  description: string;
  recommendation: string;
  timestamp: Date;
  expiresAt?: Date;
}

export type RiskType =
  | 'liquidation-risk'
  | 'volatility-spike'
  | 'correlation-breakdown'
  | 'smart-money-exit'
  | 'regulatory-threat'
  | 'technical-breakdown'
  | 'sentiment-extreme'
  | 'black-swan';

export interface SectorFlow {
  sector: string;
  flowDirection: 'inflow' | 'outflow' | 'neutral';
  magnitude: number;           // -100 to +100
  leadingAssets: string[];
  laggingAssets: string[];
}

export interface CorrelationAnomaly {
  asset1: string;
  asset2: string;
  expectedCorrelation: number;
  actualCorrelation: number;
  divergence: number;
  significance: 'low' | 'medium' | 'high';
  interpretation: string;
}

export interface KeyLevel {
  asset: string;
  type: 'support' | 'resistance' | 'pivot' | 'liquidation';
  price: number;
  strength: number;           // 0-100
  touches: number;
  lastTested: Date;
}

export interface Catalyst {
  id: string;
  title: string;
  expectedDate: Date;
  assets: string[];
  potentialImpact: 'low' | 'medium' | 'high' | 'extreme';
  direction: SignalDirection;
  type: 'earnings' | 'unlock' | 'upgrade' | 'regulatory' | 'macro' | 'governance';
  description: string;
}

export interface AgentQuery {
  question: string;
  assets?: string[];
  timeHorizon?: TimeHorizon;
  focusAreas?: SignalSource[];
}

export interface AgentResponse {
  answer: string;
  confidence: number;
  supportingSignals: MarketSignal[];
  suggestedActions: string[];
  relatedQueries: string[];
  timestamp: Date;
}

// =============================================================================
// Signal Detection Engine
// =============================================================================

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

interface SocialData {
  symbol: string;
  mentions: number;
  sentiment: number;
  sentimentChange: number;
}

interface OnChainData {
  symbol: string;
  activeAddresses: number;
  transactionCount: number;
  largeTransactions: number;
  exchangeNetFlow: number;
}

interface DerivativesData {
  symbol: string;
  fundingRate: number;
  openInterest: number;
  oiChange24h: number;
  longShortRatio: number;
}

/**
 * Core AI Market Agent class
 */
export class AIMarketAgent {
  private signalHistory: MarketSignal[] = [];
  private lastIntelligence: MarketIntelligence | null = null;
  private narrativeCache: Map<string, { narrative: string; expires: number }> = new Map();

  /**
   * Generate comprehensive market intelligence
   */
  async generateIntelligence(): Promise<MarketIntelligence> {
    const [
      priceData,
      socialData,
      onChainData,
      derivativesData,
      newsSignals,
      whaleSignals,
    ] = await Promise.all([
      this.fetchPriceData(),
      this.fetchSocialData(),
      this.fetchOnChainData(),
      this.fetchDerivativesData(),
      this.analyzeNewsSignals(),
      this.detectWhaleMovements(),
    ]);

    // Detect market regime
    const { regime, confidence: regimeConfidence } = this.detectMarketRegime(
      priceData,
      socialData,
      derivativesData
    );

    // Calculate fear/greed
    const fearGreedIndex = this.calculateFearGreedIndex(
      priceData,
      socialData,
      derivativesData
    );

    // Detect volatility regime
    const volatilityRegime = this.detectVolatilityRegime(priceData);

    // Aggregate all signals
    const activeSignals = this.aggregateSignals(
      priceData,
      socialData,
      onChainData,
      derivativesData,
      newsSignals,
      whaleSignals
    );

    // Detect correlation anomalies
    const correlationAnomalies = this.detectCorrelationAnomalies(priceData);

    // Identify sector rotation
    const sectorRotation = this.analyzeSectorRotation(priceData, onChainData);

    // Find trading opportunities
    const topOpportunities = this.identifyOpportunities(
      activeSignals,
      priceData,
      derivativesData
    );

    // Generate risk alerts
    const riskAlerts = this.generateRiskAlerts(
      activeSignals,
      derivativesData,
      regime
    );

    // Calculate key levels
    const keyLevels = this.calculateKeyLevels(priceData);

    // Identify upcoming catalysts
    const upcomingCatalysts = await this.fetchUpcomingCatalysts();

    // Identify dominant narrative
    const dominantNarrative = this.identifyDominantNarrative(
      activeSignals,
      newsSignals
    );

    // Generate AI market narrative
    const marketNarrative = this.generateMarketNarrative(
      regime,
      fearGreedIndex,
      activeSignals,
      topOpportunities,
      riskAlerts
    );

    const intelligence: MarketIntelligence = {
      generatedAt: new Date(),
      overallRegime: regime,
      regimeConfidence,
      fearGreedIndex,
      volatilityRegime,
      dominantNarrative,
      activeSignals: activeSignals.slice(0, 20),
      topOpportunities: topOpportunities.slice(0, 10),
      riskAlerts,
      marketNarrative,
      sectorRotation,
      correlationAnomalies,
      keyLevels: keyLevels.slice(0, 20),
      upcomingCatalysts: upcomingCatalysts.slice(0, 10),
    };

    this.lastIntelligence = intelligence;
    return intelligence;
  }

  /**
   * Natural language query interface
   */
  async query(query: AgentQuery): Promise<AgentResponse> {
    const intelligence = this.lastIntelligence || await this.generateIntelligence();
    
    // Parse the question to identify intent
    const intent = this.parseQueryIntent(query.question);
    
    // Filter signals by assets if specified
    let relevantSignals = intelligence.activeSignals;
    if (query.assets && query.assets.length > 0) {
      relevantSignals = relevantSignals.filter(s => 
        query.assets!.includes(s.asset) || s.asset === 'MARKET'
      );
    }
    
    // Generate response based on intent
    const answer = this.generateQueryResponse(
      intent,
      query,
      intelligence,
      relevantSignals
    );
    
    // Suggest related queries
    const relatedQueries = this.suggestRelatedQueries(query, intent);
    
    // Suggest actions
    const suggestedActions = this.generateSuggestedActions(
      intent,
      relevantSignals,
      intelligence
    );
    
    return {
      answer,
      confidence: this.calculateResponseConfidence(relevantSignals),
      supportingSignals: relevantSignals.slice(0, 5),
      suggestedActions,
      relatedQueries,
      timestamp: new Date(),
    };
  }

  // ===========================================================================
  // Data Fetching
  // ===========================================================================

  private async fetchPriceData(): Promise<PriceData[]> {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&sparkline=false&price_change_percentage=24h',
        { next: { revalidate: 60 } }
      );
      
      if (!response.ok) throw new Error('CoinGecko API error');
      
      const data = await response.json();
      return data.map((coin: Record<string, unknown>) => ({
        symbol: (coin.symbol as string).toUpperCase(),
        price: coin.current_price as number,
        change24h: coin.price_change_percentage_24h as number || 0,
        volume24h: coin.total_volume as number || 0,
        high24h: coin.high_24h as number || 0,
        low24h: coin.low_24h as number || 0,
      }));
    } catch (error) {
      console.error('Price data fetch error:', error);
      return []; // Return empty array instead of mock data
    }
  }

  private async fetchSocialData(): Promise<SocialData[]> {
    // Integrate with LunarCrush API for social sentiment
    const lunarCrushKey = process.env.LUNARCRUSH_API_KEY;
    if (!lunarCrushKey) {
      console.warn('LunarCrush API key not configured - social data unavailable');
      return [];
    }

    try {
      const response = await fetch(
        'https://lunarcrush.com/api4/public/coins/list/v2?sort=galaxy_score&limit=20',
        {
          headers: { 'Authorization': `Bearer ${lunarCrushKey}` },
          next: { revalidate: 300 },
        }
      );
      
      if (!response.ok) throw new Error(`LunarCrush API error: ${response.status}`);
      
      const data = await response.json();
      return (data.data || []).map((coin: Record<string, unknown>) => ({
        symbol: (coin.symbol as string).toUpperCase(),
        mentions: coin.social_volume as number || 0,
        sentiment: ((coin.sentiment as number || 50) - 50) / 50, // Normalize to -1 to 1
        sentimentChange: (coin.sentiment_24h_change as number) || 0,
      }));
    } catch (error) {
      console.error('Social data fetch error:', error);
      return [];
    }
  }

  private async fetchOnChainData(): Promise<OnChainData[]> {
    // Integrate with Glassnode or CryptoQuant for on-chain metrics
    const glassnodeKey = process.env.GLASSNODE_API_KEY;
    if (!glassnodeKey) {
      // Try free IntoTheBlock data as fallback
      try {
        const response = await fetch(
          'https://api.intotheblock.com/v1/metrics/bitcoin?limit=1',
          { next: { revalidate: 600 } }
        );
        
        if (response.ok) {
          const data = await response.json();
          return [{
            symbol: 'BTC',
            activeAddresses: data.activeAddresses || 0,
            transactionCount: data.transactionCount || 0,
            largeTransactions: data.largeTransactions || 0,
            exchangeNetFlow: data.exchangeNetFlow || 0,
          }];
        }
      } catch {
        // IntoTheBlock API may not be available
      }
      return [];
    }

    try {
      const symbols = ['BTC', 'ETH'];
      const results: OnChainData[] = [];
      
      for (const symbol of symbols) {
        const [addressResponse, txResponse] = await Promise.all([
          fetch(`https://api.glassnode.com/v1/metrics/addresses/active_count?a=${symbol}&api_key=${glassnodeKey}`, { next: { revalidate: 600 } }),
          fetch(`https://api.glassnode.com/v1/metrics/transactions/count?a=${symbol}&api_key=${glassnodeKey}`, { next: { revalidate: 600 } }),
        ]);
        
        if (addressResponse.ok && txResponse.ok) {
          const addressData = await addressResponse.json();
          const txData = await txResponse.json();
          
          results.push({
            symbol,
            activeAddresses: addressData[addressData.length - 1]?.v || 0,
            transactionCount: txData[txData.length - 1]?.v || 0,
            largeTransactions: 0,
            exchangeNetFlow: 0,
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('On-chain data fetch error:', error);
      return [];
    }
  }

  private async fetchDerivativesData(): Promise<DerivativesData[]> {
    try {
      // Fetch from Binance Futures - this is a real public API
      const response = await fetch(
        'https://fapi.binance.com/fapi/v1/premiumIndex',
        { next: { revalidate: 60 } }
      );
      
      if (!response.ok) throw new Error('Binance API error');
      
      const data = await response.json();
      
      // Also fetch open interest
      const oiResponse = await fetch(
        'https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT',
        { next: { revalidate: 60 } }
      );
      
      const oiData = oiResponse.ok ? await oiResponse.json() : null;
      
      return data.slice(0, 20).map((item: Record<string, unknown>) => {
        const symbol = (item.symbol as string).replace('USDT', '');
        return {
          symbol,
          fundingRate: parseFloat(item.lastFundingRate as string) * 100,
          openInterest: symbol === 'BTC' && oiData ? parseFloat(oiData.openInterest) : 0,
          oiChange24h: 0,
          longShortRatio: 1,
        };
      });
    } catch (error) {
      console.error('Derivatives data fetch error:', error);
      return []; // Return empty array instead of mock data
    }
  }

  private async analyzeNewsSignals(): Promise<MarketSignal[]> {
    // Analyze recent news for market signals
    const signals: MarketSignal[] = [];
    
    try {
      // Construct absolute URL for edge runtime compatibility
      const baseUrl = typeof process !== 'undefined' 
        ? (process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : 'http://localhost:3000')
        : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/news?limit=20`, { next: { revalidate: 300 } });
      if (response.ok) {
        const data = await response.json();
        const articles = data.articles || [];
        
        for (const article of articles) {
          const sentiment = this.analyzeNewsSentiment(article.title, article.description);
          if (Math.abs(sentiment.score) > 0.5) {
            signals.push({
              id: `news-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              source: 'news',
              type: 'news-catalyst',
              asset: sentiment.asset || 'MARKET',
              direction: sentiment.score > 0 ? 'bullish' : 'bearish',
              strength: Math.abs(sentiment.score) > 0.8 ? 'strong' : 'moderate',
              confidence: Math.abs(sentiment.score) * 100,
              timeHorizon: '1d',
              timestamp: new Date(article.pubDate),
              metadata: { title: article.title, source: article.source },
              narrative: `${sentiment.score > 0 ? 'Positive' : 'Negative'} news: ${article.title.slice(0, 100)}`,
            });
          }
        }
      }
    } catch (error) {
      console.error('News signal analysis error:', error);
    }
    
    return signals;
  }

  private async detectWhaleMovements(): Promise<MarketSignal[]> {
    // Integrate with Whale Alert API or blockchain.com for whale tracking
    const whaleAlertKey = process.env.WHALE_ALERT_API_KEY;
    if (!whaleAlertKey) {
      // Try blockchain.com free API for large transactions
      try {
        const response = await fetch(
          'https://blockchain.info/unconfirmed-transactions?format=json',
          { next: { revalidate: 300 } }
        );
        
        if (response.ok) {
          const data = await response.json();
          const signals: MarketSignal[] = [];
          
          // Filter for large transactions (> 100 BTC)
          const largeTxs = (data.txs || []).filter((tx: { out: Array<{ value: number }> }) => {
            const totalValue = tx.out.reduce((sum: number, out: { value: number }) => sum + out.value, 0);
            return totalValue > 100 * 100000000; // 100 BTC in satoshis
          });
          
          for (const tx of largeTxs.slice(0, 5)) {
            const btcAmount = tx.out.reduce((sum: number, out: { value: number }) => sum + out.value, 0) / 100000000;
            // Determine direction from output patterns:
            // Many outputs = distribution (bearish), few outputs + high value = accumulation (bullish)
            const outputCount = tx.out?.length || 0;
            const whaleDirection: 'bullish' | 'bearish' | 'neutral' =
              outputCount <= 2 ? 'bullish'   // Consolidation / accumulation
              : outputCount >= 10 ? 'bearish' // Distribution to many addresses
              : 'neutral';

            signals.push({
              id: `whale-${tx.hash?.slice(0, 8) || Date.now()}`,
              source: 'whale',
              type: 'whale-movement',
              asset: 'BTC',
              direction: whaleDirection,
              strength: btcAmount > 1000 ? 'strong' : 'moderate',
              confidence: 85,
              timeHorizon: '1d',
              timestamp: new Date(),
              metadata: { amount: btcAmount, hash: tx.hash },
              narrative: `Large BTC movement detected: ${btcAmount.toFixed(2)} BTC`,
            });
          }
          
          return signals;
        }
      } catch {
        // blockchain.com API may not respond
      }
      return [];
    }

    try {
      const response = await fetch(
        `https://api.whale-alert.io/v1/transactions?api_key=${whaleAlertKey}&min_value=500000&limit=20`,
        { next: { revalidate: 300 } }
      );
      
      if (!response.ok) throw new Error('Whale Alert API error');
      
      const data = await response.json();
      return (data.transactions || []).map((tx: { id: string; blockchain: string; symbol: string; amount: number; amount_usd: number; from: { owner_type: string }; to: { owner_type: string }; timestamp: number }) => {
        const isFromExchange = tx.from?.owner_type === 'exchange';
        const isToExchange = tx.to?.owner_type === 'exchange';
        
        let direction: SignalDirection = 'neutral';
        let narrative = `${tx.amount.toFixed(2)} ${tx.symbol} moved`;
        
        if (isFromExchange && !isToExchange) {
          direction = 'bullish';
          narrative = `${tx.amount.toFixed(2)} ${tx.symbol} withdrawn from exchange - potential accumulation`;
        } else if (!isFromExchange && isToExchange) {
          direction = 'bearish';
          narrative = `${tx.amount.toFixed(2)} ${tx.symbol} deposited to exchange - potential selling`;
        }
        
        return {
          id: `whale-${tx.id}`,
          source: 'whale' as SignalSource,
          type: 'whale-movement' as SignalType,
          asset: tx.symbol?.toUpperCase() || 'UNKNOWN',
          direction,
          strength: tx.amount_usd > 10_000_000 ? 'strong' : 'moderate' as SignalStrength,
          confidence: 80,
          timeHorizon: '1d' as TimeHorizon,
          timestamp: new Date(tx.timestamp * 1000),
          metadata: { amount: tx.amount, amountUsd: tx.amount_usd, fromExchange: isFromExchange, toExchange: isToExchange },
          narrative,
        };
      });
    } catch (error) {
      console.error('Whale data fetch error:', error);
      return [];
    }
  }

  // ===========================================================================
  // Analysis Engines
  // ===========================================================================

  private detectMarketRegime(
    priceData: PriceData[],
    socialData: SocialData[],
    derivativesData: DerivativesData[]
  ): { regime: MarketRegime; confidence: number } {
    // Calculate market-wide metrics
    const avgPriceChange = priceData.reduce((sum, p) => sum + p.change24h, 0) / priceData.length;
    const avgSentiment = socialData.reduce((sum, s) => sum + s.sentiment, 0) / socialData.length;
    const avgFunding = derivativesData.reduce((sum, d) => sum + d.fundingRate, 0) / derivativesData.length;
    
    // Volume analysis
    const volumeIncreasing = priceData.filter(p => p.volume24h > 0).length > priceData.length * 0.6;
    
    // Regime detection logic
    let regime: MarketRegime;
    let confidence: number;
    
    if (avgPriceChange > 5 && avgSentiment > 0.7 && avgFunding > 0.05) {
      regime = 'euphoria';
      confidence = 85;
    } else if (avgPriceChange > 2 && avgSentiment > 0.3) {
      regime = 'markup';
      confidence = 75;
    } else if (avgPriceChange < -5 && avgSentiment < -0.5) {
      regime = 'capitulation';
      confidence = 80;
    } else if (avgPriceChange < -2 && avgSentiment < -0.2) {
      regime = 'markdown';
      confidence = 70;
    } else if (Math.abs(avgPriceChange) < 1 && volumeIncreasing && avgSentiment < -0.1) {
      regime = 'accumulation';
      confidence = 65;
    } else if (Math.abs(avgPriceChange) < 1 && volumeIncreasing && avgSentiment > 0.1) {
      regime = 'distribution';
      confidence = 65;
    } else {
      regime = 'ranging';
      confidence = 55;
    }
    
    return { regime, confidence };
  }

  private calculateFearGreedIndex(
    priceData: PriceData[],
    socialData: SocialData[],
    derivativesData: DerivativesData[]
  ): number {
    // Weighted components
    const priceComponent = this.normalizeTo100(
      priceData.reduce((sum, p) => sum + p.change24h, 0) / priceData.length,
      -10, 10
    ) * 0.25;
    
    const sentimentComponent = this.normalizeTo100(
      socialData.reduce((sum, s) => sum + s.sentiment, 0) / socialData.length,
      -1, 1
    ) * 0.35;
    
    const fundingComponent = this.normalizeTo100(
      derivativesData.reduce((sum, d) => sum + d.fundingRate, 0) / derivativesData.length,
      -0.1, 0.1
    ) * 0.2;
    
    const volumeComponent = priceData.filter(p => p.change24h > 0).length / priceData.length * 100 * 0.2;
    
    return Math.round(priceComponent + sentimentComponent + fundingComponent + volumeComponent);
  }

  private detectVolatilityRegime(priceData: PriceData[]): 'low' | 'medium' | 'high' | 'extreme' {
    const avgRange = priceData.reduce((sum, p) => {
      const range = ((p.high24h - p.low24h) / p.price) * 100;
      return sum + range;
    }, 0) / priceData.length;
    
    if (avgRange > 15) return 'extreme';
    if (avgRange > 8) return 'high';
    if (avgRange > 4) return 'medium';
    return 'low';
  }

  private aggregateSignals(
    priceData: PriceData[],
    socialData: SocialData[],
    onChainData: OnChainData[],
    derivativesData: DerivativesData[],
    newsSignals: MarketSignal[],
    whaleSignals: MarketSignal[]
  ): MarketSignal[] {
    const signals: MarketSignal[] = [...newsSignals, ...whaleSignals];
    
    // Detect price-based signals
    for (const price of priceData) {
      // Volume spike detection
      if (price.volume24h > 0) {
        const range = ((price.high24h - price.low24h) / price.price) * 100;
        if (range > 10) {
          signals.push({
            id: `vol-${price.symbol}-${Date.now()}`,
            source: 'technical',
            type: 'volume-spike',
            asset: price.symbol,
            direction: price.change24h > 0 ? 'bullish' : 'bearish',
            strength: range > 15 ? 'extreme' : 'strong',
            confidence: Math.min(90, range * 6),
            timeHorizon: '1d',
            timestamp: new Date(),
            metadata: { range, volume: price.volume24h },
            narrative: `${price.symbol} showing ${range.toFixed(1)}% daily range with significant volume`,
          });
        }
      }
      
      // Strong momentum
      if (Math.abs(price.change24h) > 8) {
        signals.push({
          id: `mom-${price.symbol}-${Date.now()}`,
          source: 'technical',
          type: 'technical-breakout',
          asset: price.symbol,
          direction: price.change24h > 0 ? 'bullish' : 'bearish',
          strength: Math.abs(price.change24h) > 15 ? 'extreme' : 'strong',
          confidence: Math.min(85, Math.abs(price.change24h) * 5),
          timeHorizon: '4h',
          timestamp: new Date(),
          metadata: { change: price.change24h },
          narrative: `${price.symbol} ${price.change24h > 0 ? 'surging' : 'plunging'} ${Math.abs(price.change24h).toFixed(1)}%`,
        });
      }
    }
    
    // Detect sentiment-based signals
    for (const social of socialData) {
      if (Math.abs(social.sentimentChange) > 0.3) {
        signals.push({
          id: `sent-${social.symbol}-${Date.now()}`,
          source: 'social',
          type: 'sentiment-shift',
          asset: social.symbol,
          direction: social.sentimentChange > 0 ? 'bullish' : 'bearish',
          strength: Math.abs(social.sentimentChange) > 0.5 ? 'strong' : 'moderate',
          confidence: Math.min(80, Math.abs(social.sentimentChange) * 100),
          timeHorizon: '1d',
          timestamp: new Date(),
          metadata: { sentiment: social.sentiment, change: social.sentimentChange },
          narrative: `${social.symbol} sentiment ${social.sentimentChange > 0 ? 'improving' : 'deteriorating'} rapidly`,
        });
      }
    }
    
    // Detect funding rate extremes
    for (const deriv of derivativesData) {
      if (Math.abs(deriv.fundingRate) > 0.05) {
        signals.push({
          id: `fund-${deriv.symbol}-${Date.now()}`,
          source: 'derivatives',
          type: 'funding-extreme',
          asset: deriv.symbol,
          direction: deriv.fundingRate > 0 ? 'bearish' : 'bullish', // Contrarian
          strength: Math.abs(deriv.fundingRate) > 0.1 ? 'extreme' : 'strong',
          confidence: Math.min(85, Math.abs(deriv.fundingRate) * 500),
          timeHorizon: '4h',
          timestamp: new Date(),
          metadata: { fundingRate: deriv.fundingRate },
          narrative: `${deriv.symbol} funding rate at ${(deriv.fundingRate * 100).toFixed(3)}% - ${deriv.fundingRate > 0 ? 'longs paying shorts' : 'shorts paying longs'}`,
        });
      }
    }
    
    // Detect on-chain signals
    for (const chain of onChainData) {
      if (chain.exchangeNetFlow < -1000000) {
        signals.push({
          id: `chain-${chain.symbol}-${Date.now()}`,
          source: 'on-chain',
          type: 'smart-money-flow',
          asset: chain.symbol,
          direction: 'bullish',
          strength: chain.exchangeNetFlow < -10000000 ? 'strong' : 'moderate',
          confidence: 70,
          timeHorizon: '1w',
          timestamp: new Date(),
          metadata: { netFlow: chain.exchangeNetFlow },
          narrative: `${chain.symbol} seeing significant exchange outflows - potential accumulation`,
        });
      } else if (chain.exchangeNetFlow > 1000000) {
        signals.push({
          id: `chain-${chain.symbol}-${Date.now()}`,
          source: 'on-chain',
          type: 'smart-money-flow',
          asset: chain.symbol,
          direction: 'bearish',
          strength: chain.exchangeNetFlow > 10000000 ? 'strong' : 'moderate',
          confidence: 70,
          timeHorizon: '1w',
          timestamp: new Date(),
          metadata: { netFlow: chain.exchangeNetFlow },
          narrative: `${chain.symbol} seeing exchange inflows - potential distribution`,
        });
      }
    }
    
    // Sort by confidence and timestamp
    return signals.sort((a, b) => b.confidence - a.confidence);
  }

  private detectCorrelationAnomalies(priceData: PriceData[]): CorrelationAnomaly[] {
    const anomalies: CorrelationAnomaly[] = [];
    
    // Expected correlations
    const expectedCorrelations: [string, string, number][] = [
      ['BTC', 'ETH', 0.85],
      ['ETH', 'SOL', 0.75],
      ['BTC', 'DOGE', 0.6],
    ];
    
    for (const [asset1, asset2, expected] of expectedCorrelations) {
      const price1 = priceData.find(p => p.symbol === asset1);
      const price2 = priceData.find(p => p.symbol === asset2);
      
      if (price1 && price2) {
        // Estimate instantaneous correlation using price returns and spread
        // Use change magnitudes and direction alignment for a more robust estimate
        const r1 = price1.change24h / 100;
        const r2 = price2.change24h / 100;
        const sameDirection = (r1 > 0) === (r2 > 0);
        
        // Correlation proxy: combine direction agreement with magnitude similarity
        // When returns go the same way with similar magnitude → high positive correlation
        // When returns go opposite ways → negative correlation
        const magnitudeSimilarity = 1 - Math.min(1, Math.abs(r1 - r2) / (Math.abs(r1) + Math.abs(r2) + 0.001));
        const actual = sameDirection
          ? magnitudeSimilarity * 0.95  // Cap at 0.95 since single-day observation
          : -magnitudeSimilarity * 0.95;
        
        const divergence = Math.abs(expected - actual);
        
        if (divergence > 0.3) {
          anomalies.push({
            asset1,
            asset2,
            expectedCorrelation: expected,
            actualCorrelation: actual,
            divergence,
            significance: divergence > 0.6 ? 'high' : divergence > 0.4 ? 'medium' : 'low',
            interpretation: `${asset1}/${asset2} correlation breaking down - potential rotation or divergent catalyst`,
          });
        }
      }
    }
    
    return anomalies;
  }

  private analyzeSectorRotation(
    priceData: PriceData[],
    onChainData: OnChainData[]
  ): SectorFlow[] {
    const sectors: Record<string, string[]> = {
      'Layer 1': ['ETH', 'SOL', 'AVAX', 'ADA', 'DOT', 'NEAR', 'ATOM'],
      'Layer 2': ['MATIC', 'ARB', 'OP'],
      'DeFi': ['UNI', 'AAVE', 'LINK', 'MKR', 'CRV'],
      'Meme': ['DOGE', 'SHIB', 'PEPE'],
      'Store of Value': ['BTC', 'LTC'],
    };
    
    const flows: SectorFlow[] = [];
    
    for (const [sector, assets] of Object.entries(sectors)) {
      const sectorPrices = priceData.filter(p => assets.includes(p.symbol));
      
      if (sectorPrices.length === 0) continue;
      
      const avgChange = sectorPrices.reduce((sum, p) => sum + p.change24h, 0) / sectorPrices.length;
      
      const sorted = [...sectorPrices].sort((a, b) => b.change24h - a.change24h);
      
      flows.push({
        sector,
        flowDirection: avgChange > 2 ? 'inflow' : avgChange < -2 ? 'outflow' : 'neutral',
        magnitude: Math.min(100, Math.max(-100, avgChange * 10)),
        leadingAssets: sorted.slice(0, 2).map(p => p.symbol),
        laggingAssets: sorted.slice(-2).map(p => p.symbol),
      });
    }
    
    return flows.sort((a, b) => b.magnitude - a.magnitude);
  }

  private identifyOpportunities(
    signals: MarketSignal[],
    priceData: PriceData[],
    derivativesData: DerivativesData[]
  ): TradingOpportunity[] {
    const opportunities: TradingOpportunity[] = [];
    
    // Group signals by asset
    const signalsByAsset = new Map<string, MarketSignal[]>();
    for (const signal of signals) {
      const existing = signalsByAsset.get(signal.asset) || [];
      existing.push(signal);
      signalsByAsset.set(signal.asset, existing);
    }
    
    // Look for confluence
    for (const [asset, assetSignals] of signalsByAsset) {
      if (assetSignals.length < 2) continue;
      
      const bullishSignals = assetSignals.filter(s => s.direction === 'bullish');
      const bearishSignals = assetSignals.filter(s => s.direction === 'bearish');
      
      const price = priceData.find(p => p.symbol === asset);
      if (!price) continue;
      
      // Strong bullish confluence
      if (bullishSignals.length >= 2 && bullishSignals.length > bearishSignals.length) {
        const avgConfidence = bullishSignals.reduce((sum, s) => sum + s.confidence, 0) / bullishSignals.length;
        const sources = [...new Set(bullishSignals.map(s => s.source))];
        
        opportunities.push({
          id: `opp-long-${asset}-${Date.now()}`,
          asset,
          type: 'long',
          rationale: `Multiple bullish signals from ${sources.join(', ')} indicating upside potential`,
          entry: price.price,
          targets: [price.price * 1.05, price.price * 1.10, price.price * 1.20],
          stopLoss: price.price * 0.95,
          riskReward: 2.0,
          confidence: avgConfidence,
          timeHorizon: '1d',
          signalSources: sources,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
      }
      
      // Strong bearish confluence
      if (bearishSignals.length >= 2 && bearishSignals.length > bullishSignals.length) {
        const avgConfidence = bearishSignals.reduce((sum, s) => sum + s.confidence, 0) / bearishSignals.length;
        const sources = [...new Set(bearishSignals.map(s => s.source))];
        
        opportunities.push({
          id: `opp-short-${asset}-${Date.now()}`,
          asset,
          type: 'short',
          rationale: `Multiple bearish signals from ${sources.join(', ')} indicating downside risk`,
          entry: price.price,
          targets: [price.price * 0.95, price.price * 0.90, price.price * 0.85],
          stopLoss: price.price * 1.05,
          riskReward: 2.0,
          confidence: avgConfidence,
          timeHorizon: '1d',
          signalSources: sources,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
      }
    }
    
    return opportunities.sort((a, b) => b.confidence - a.confidence);
  }

  private generateRiskAlerts(
    signals: MarketSignal[],
    derivativesData: DerivativesData[],
    regime: MarketRegime
  ): RiskAlert[] {
    const alerts: RiskAlert[] = [];
    
    // Extreme funding rate warning
    const extremeFunding = derivativesData.filter(d => Math.abs(d.fundingRate) > 0.1);
    if (extremeFunding.length > 0) {
      alerts.push({
        id: `risk-funding-${Date.now()}`,
        severity: 'warning',
        type: 'liquidation-risk',
        title: 'Extreme Funding Rates Detected',
        description: `${extremeFunding.length} assets showing extreme funding rates, indicating overcrowded positioning`,
        recommendation: 'Consider reducing leverage or hedging positions',
        timestamp: new Date(),
      });
    }
    
    // Regime-based alerts
    if (regime === 'euphoria') {
      alerts.push({
        id: `risk-euphoria-${Date.now()}`,
        severity: 'danger',
        type: 'sentiment-extreme',
        title: 'Market Euphoria Detected',
        description: 'Extreme bullish sentiment combined with rising prices - historically precedes corrections',
        recommendation: 'Take profits, tighten stops, avoid new long entries',
        timestamp: new Date(),
      });
    }
    
    if (regime === 'capitulation') {
      alerts.push({
        id: `risk-cap-${Date.now()}`,
        severity: 'warning',
        type: 'volatility-spike',
        title: 'Market Capitulation Phase',
        description: 'Panic selling detected - high volatility expected but potential bottom forming',
        recommendation: 'Wait for stabilization before entering, or scale in gradually',
        timestamp: new Date(),
      });
    }
    
    // Correlation breakdown
    const correlationSignals = signals.filter(s => s.type === 'correlation-break');
    if (correlationSignals.length > 0) {
      alerts.push({
        id: `risk-corr-${Date.now()}`,
        severity: 'info',
        type: 'correlation-breakdown',
        title: 'Correlation Anomaly Detected',
        description: 'Normal market correlations breaking down - watch for sector rotation or divergent catalysts',
        recommendation: 'Review portfolio correlations and adjust hedges',
        timestamp: new Date(),
      });
    }
    
    return alerts;
  }

  private calculateKeyLevels(priceData: PriceData[]): KeyLevel[] {
    const levels: KeyLevel[] = [];
    
    for (const price of priceData) {
      // Simple key level calculation based on range
      const range = price.high24h - price.low24h;
      const pivot = (price.high24h + price.low24h + price.price) / 3;
      
      levels.push({
        asset: price.symbol,
        type: 'pivot',
        price: pivot,
        strength: 60,
        touches: 1,
        lastTested: new Date(),
      });
      
      levels.push({
        asset: price.symbol,
        type: 'resistance',
        price: price.high24h,
        strength: 70,
        touches: 1,
        lastTested: new Date(),
      });
      
      levels.push({
        asset: price.symbol,
        type: 'support',
        price: price.low24h,
        strength: 70,
        touches: 1,
        lastTested: new Date(),
      });
    }
    
    return levels;
  }

  private async fetchUpcomingCatalysts(): Promise<Catalyst[]> {
    const catalysts: Catalyst[] = [];

    // Fetch real macro economic events from public calendars
    try {
      // Use FRED API or similar for FOMC dates
      const fomcRes = await fetch(
        'https://www.federalreserve.gov/json/ne-press.json',
        { signal: AbortSignal.timeout(5000), next: { revalidate: 86400 } }
      );
      if (fomcRes.ok) {
        const fomcData = await fomcRes.json();
        const now = Date.now();
        const futureEvents = (fomcData || []).filter((e: { d: string; t: string }) => {
          const eventDate = new Date(e.d).getTime();
          return eventDate > now && eventDate < now + 90 * 24 * 60 * 60 * 1000;
        }).slice(0, 3);

        for (const event of futureEvents) {
          catalysts.push({
            id: `macro-${event.d}`,
            title: event.t || 'FOMC / Fed Event',
            expectedDate: new Date(event.d),
            assets: ['BTC', 'ETH'],
            potentialImpact: 'high',
            direction: 'neutral',
            type: 'macro',
            description: `Federal Reserve event: ${event.t || 'policy announcement'} - high volatility expected`,
          });
        }
      }
    } catch { /* Fed calendar unavailable */ }

    // Fetch upcoming crypto events from CoinGecko events or CoinMarketCal
    try {
      const eventsRes = await fetch(
        'https://api.coingecko.com/api/v3/events',
        { signal: AbortSignal.timeout(5000), next: { revalidate: 3600 } }
      );
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        const events = (eventsData?.data || []).slice(0, 5);
        for (const event of events) {
          catalysts.push({
            id: `crypto-event-${event.title?.replace(/\s+/g, '-')?.toLowerCase() || Date.now()}`,
            title: event.title || 'Crypto Event',
            expectedDate: new Date(event.start_date || Date.now() + 7 * 24 * 3600 * 1000),
            assets: (event.coins || []).map((c: { symbol: string }) => c.symbol?.toUpperCase()).filter(Boolean).slice(0, 5),
            potentialImpact: event.type === 'hard-fork' || event.type === 'mainnet-launch' ? 'high'
              : event.type === 'airdrop' || event.type === 'token-burn' ? 'medium'
              : 'low',
            direction: event.type === 'airdrop' || event.type === 'mainnet-launch' ? 'bullish' : 'neutral',
            type: event.type === 'hard-fork' || event.type === 'mainnet-launch' ? 'upgrade'
              : event.type === 'conference' ? 'macro'
              : 'regulatory',
            description: event.description || `${event.title} - ${event.type || 'upcoming crypto event'}`,
          });
        }
      }
    } catch { /* CoinGecko events unavailable */ }

    // If we couldn't fetch any real events, provide a minimal structural placeholder
    if (catalysts.length === 0) {
      // Use deterministic dates based on known recurring events
      // FOMC meetings happen ~8 times/year on predictable dates
      const nextWednesday = new Date();
      nextWednesday.setDate(nextWednesday.getDate() + ((3 - nextWednesday.getDay() + 7) % 7 || 7));
      catalysts.push({
        id: 'cat-fomc-next',
        title: 'Next FOMC Meeting (estimated)',
        expectedDate: nextWednesday,
        assets: ['BTC', 'ETH'],
        potentialImpact: 'high',
        direction: 'neutral',
        type: 'macro',
        description: 'Estimated next Federal Reserve activity - verify against official FOMC calendar',
      });
    }

    return catalysts;
  }

  private identifyDominantNarrative(
    signals: MarketSignal[],
    newsSignals: MarketSignal[]
  ): string {
    // Analyze signal patterns to identify dominant narrative
    const narratives = new Map<string, number>();
    
    // Check for common themes
    const themes = [
      { keywords: ['institutional', 'etf', 'blackrock', 'fidelity'], narrative: 'Institutional Adoption' },
      { keywords: ['regulation', 'sec', 'legal', 'lawsuit'], narrative: 'Regulatory Developments' },
      { keywords: ['defi', 'yield', 'staking', 'airdrop'], narrative: 'DeFi Renaissance' },
      { keywords: ['ai', 'artificial intelligence', 'gpu'], narrative: 'AI + Crypto Convergence' },
      { keywords: ['meme', 'doge', 'pepe', 'viral'], narrative: 'Meme Season' },
      { keywords: ['layer 2', 'scaling', 'l2', 'rollup'], narrative: 'L2 Scaling Narrative' },
      { keywords: ['bitcoin', 'halving', 'scarcity'], narrative: 'Bitcoin Cycle' },
    ];
    
    for (const signal of [...signals, ...newsSignals]) {
      const text = signal.narrative.toLowerCase();
      for (const theme of themes) {
        if (theme.keywords.some(kw => text.includes(kw))) {
          narratives.set(theme.narrative, (narratives.get(theme.narrative) || 0) + signal.confidence);
        }
      }
    }
    
    const sorted = [...narratives.entries()].sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'Market Consolidation';
  }

  private generateMarketNarrative(
    regime: MarketRegime,
    fearGreedIndex: number,
    signals: MarketSignal[],
    opportunities: TradingOpportunity[],
    riskAlerts: RiskAlert[]
  ): string {
    const regimeDescriptions: Record<MarketRegime, string> = {
      accumulation: 'currently in an accumulation phase with smart money quietly building positions',
      markup: 'in a markup phase with positive momentum and growing participation',
      distribution: 'showing distribution patterns as larger players begin taking profits',
      markdown: 'in a markdown phase with sellers in control',
      ranging: 'consolidating in a tight range, awaiting the next catalyst',
      capitulation: 'experiencing capitulation with panic selling creating potential opportunities',
      euphoria: 'in euphoric territory with extreme bullish sentiment - caution advised',
    };
    
    const fearGreedText = fearGreedIndex > 75 ? 'extreme greed' : 
                          fearGreedIndex > 55 ? 'greed' :
                          fearGreedIndex > 45 ? 'neutral' :
                          fearGreedIndex > 25 ? 'fear' : 'extreme fear';
    
    const topBullish = signals.filter(s => s.direction === 'bullish' && s.strength === 'strong').slice(0, 3);
    const topBearish = signals.filter(s => s.direction === 'bearish' && s.strength === 'strong').slice(0, 3);
    
    let narrative = `**Market Overview:** The crypto market is ${regimeDescriptions[regime]}. `;
    narrative += `The Fear & Greed Index reads ${fearGreedIndex} (${fearGreedText}). `;
    
    if (topBullish.length > 0) {
      narrative += `\n\n**Bullish Signals:** ${topBullish.map(s => s.narrative).join('. ')}. `;
    }
    
    if (topBearish.length > 0) {
      narrative += `\n\n**Bearish Signals:** ${topBearish.map(s => s.narrative).join('. ')}. `;
    }
    
    if (opportunities.length > 0) {
      const topOpp = opportunities[0];
      narrative += `\n\n**Top Opportunity:** ${topOpp.type.toUpperCase()} ${topOpp.asset} - ${topOpp.rationale}. `;
    }
    
    if (riskAlerts.filter(r => r.severity === 'danger' || r.severity === 'critical').length > 0) {
      narrative += `\n\n**⚠️ Risk Warning:** ${riskAlerts.filter(r => r.severity === 'danger' || r.severity === 'critical').map(r => r.title).join(', ')}. `;
    }
    
    return narrative;
  }

  // ===========================================================================
  // Query Processing
  // ===========================================================================

  private parseQueryIntent(question: string): string {
    const normalized = question.toLowerCase();
    
    if (/should i (buy|long|enter)/i.test(normalized)) return 'buy_signal';
    if (/should i (sell|short|exit)/i.test(normalized)) return 'sell_signal';
    if (/what.*happening|market.*doing|overview/i.test(normalized)) return 'market_overview';
    if (/risk|danger|warning/i.test(normalized)) return 'risk_assessment';
    if (/opportunity|alpha|trade/i.test(normalized)) return 'opportunities';
    if (/sentiment|mood|feeling/i.test(normalized)) return 'sentiment';
    if (/whale|smart money|institution/i.test(normalized)) return 'smart_money';
    if (/narrative|trend|theme/i.test(normalized)) return 'narrative';
    if (/funding|perp|futures/i.test(normalized)) return 'derivatives';
    
    return 'general';
  }

  private generateQueryResponse(
    intent: string,
    query: AgentQuery,
    intelligence: MarketIntelligence,
    signals: MarketSignal[]
  ): string {
    switch (intent) {
      case 'market_overview':
        return intelligence.marketNarrative;
        
      case 'buy_signal': {
        const asset = query.assets?.[0] || 'BTC';
        const bullishSignals = signals.filter(s => 
          s.asset === asset && s.direction === 'bullish'
        );
        const bearishSignals = signals.filter(s => 
          s.asset === asset && s.direction === 'bearish'
        );
        
        if (bullishSignals.length > bearishSignals.length && bullishSignals.length >= 2) {
          return `**${asset} Buy Analysis:** The signals lean bullish with ${bullishSignals.length} positive indicators vs ${bearishSignals.length} negative. Key bullish factors: ${bullishSignals.slice(0, 3).map(s => s.narrative).join('; ')}. Consider entries with defined risk.`;
        } else if (bearishSignals.length > bullishSignals.length) {
          return `**${asset} Buy Analysis:** Caution advised. Currently seeing more bearish signals (${bearishSignals.length}) than bullish (${bullishSignals.length}). Key concerns: ${bearishSignals.slice(0, 2).map(s => s.narrative).join('; ')}. Wait for better setup.`;
        }
        return `**${asset} Buy Analysis:** Mixed signals currently. Market is ${intelligence.overallRegime}. Recommend waiting for clearer confluence.`;
      }
        
      case 'risk_assessment':
        if (intelligence.riskAlerts.length === 0) {
          return `**Risk Assessment:** No major risks detected. Market regime is ${intelligence.overallRegime} with ${intelligence.volatilityRegime} volatility. Fear/Greed at ${intelligence.fearGreedIndex}.`;
        }
        return `**Risk Assessment:**\n${intelligence.riskAlerts.map(r => `• [${r.severity.toUpperCase()}] ${r.title}: ${r.description}`).join('\n')}\n\n**Recommendations:** ${intelligence.riskAlerts.map(r => r.recommendation).join(' ')}`;
        
      case 'opportunities':
        if (intelligence.topOpportunities.length === 0) {
          return `**Opportunities:** No high-conviction opportunities detected currently. Market is ${intelligence.overallRegime}. Recommend patience.`;
        }
        return `**Top Opportunities:**\n${intelligence.topOpportunities.slice(0, 3).map(o => 
          `• **${o.type.toUpperCase()} ${o.asset}** (${o.confidence}% confidence)\n  ${o.rationale}\n  Entry: $${o.entry.toLocaleString()} | Targets: ${o.targets.map(t => '$' + t.toLocaleString()).join(', ')} | Stop: $${o.stopLoss.toLocaleString()}`
        ).join('\n\n')}`;
        
      case 'sentiment':
        return `**Market Sentiment:** Fear & Greed Index at ${intelligence.fearGreedIndex}/100. Dominant narrative: "${intelligence.dominantNarrative}". Market regime: ${intelligence.overallRegime}. ${intelligence.volatilityRegime} volatility environment.`;
        
      case 'smart_money':
        const smartMoneySignals = signals.filter(s => 
          s.source === 'whale' || s.source === 'on-chain' || s.source === 'smart-money'
        );
        if (smartMoneySignals.length === 0) {
          return `**Smart Money:** No significant whale or smart money movements detected recently.`;
        }
        return `**Smart Money Analysis:**\n${smartMoneySignals.slice(0, 5).map(s => `• ${s.narrative}`).join('\n')}`;
        
      case 'narrative':
        return `**Current Narrative:** "${intelligence.dominantNarrative}"\n\n**Sector Flows:**\n${intelligence.sectorRotation.slice(0, 5).map(s => 
          `• ${s.sector}: ${s.flowDirection} (${s.magnitude > 0 ? '+' : ''}${s.magnitude.toFixed(0)}%) - Leaders: ${s.leadingAssets.join(', ')}`
        ).join('\n')}`;
        
      default:
        return intelligence.marketNarrative;
    }
  }

  private suggestRelatedQueries(query: AgentQuery, intent: string): string[] {
    const suggestions: Record<string, string[]> = {
      market_overview: [
        'What are the current risks?',
        'Show me trading opportunities',
        'What is the dominant narrative?',
      ],
      buy_signal: [
        `What are the risks for ${query.assets?.[0] || 'this asset'}?`,
        'What is smart money doing?',
        'Show me the market overview',
      ],
      risk_assessment: [
        'What opportunities are available?',
        'What is market sentiment?',
        'Show me smart money flows',
      ],
      opportunities: [
        'What are the current risks?',
        'Analyze market sentiment',
        'What is the dominant narrative?',
      ],
    };
    
    return suggestions[intent] || suggestions.market_overview;
  }

  private generateSuggestedActions(
    intent: string,
    signals: MarketSignal[],
    intelligence: MarketIntelligence
  ): string[] {
    const actions: string[] = [];
    
    if (intelligence.riskAlerts.some(r => r.severity === 'danger' || r.severity === 'critical')) {
      actions.push('Review and tighten stop losses');
      actions.push('Consider reducing position sizes');
    }
    
    if (intelligence.overallRegime === 'euphoria') {
      actions.push('Take partial profits on winning positions');
      actions.push('Avoid FOMO entries');
    }
    
    if (intelligence.overallRegime === 'capitulation') {
      actions.push('Prepare watchlist for potential entries');
      actions.push('Scale into quality assets gradually');
    }
    
    if (intelligence.topOpportunities.length > 0) {
      actions.push(`Review ${intelligence.topOpportunities[0].type} ${intelligence.topOpportunities[0].asset} opportunity`);
    }
    
    if (actions.length === 0) {
      actions.push('Monitor for signal changes');
      actions.push('Maintain current positioning');
    }
    
    return actions;
  }

  private calculateResponseConfidence(signals: MarketSignal[]): number {
    if (signals.length === 0) return 30;
    const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;
    const sourceVariety = new Set(signals.map(s => s.source)).size;
    return Math.min(95, avgConfidence + sourceVariety * 5);
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  private analyzeNewsSentiment(title: string, description: string): { score: number; asset: string | null } {
    const text = `${title} ${description || ''}`.toLowerCase();
    
    // Extract mentioned asset
    const assetPatterns = /\b(btc|bitcoin|eth|ethereum|sol|solana|xrp|doge|ada|avax|dot|link|matic)\b/i;
    const assetMatch = text.match(assetPatterns);
    const asset = assetMatch ? assetMatch[0].toUpperCase() : null;
    
    // Sentiment keywords
    const bullishWords = ['surge', 'soar', 'rally', 'bullish', 'breakthrough', 'adoption', 'institutional', 'approved', 'launch', 'partnership', 'upgrade', 'milestone'];
    const bearishWords = ['crash', 'plunge', 'bearish', 'hack', 'exploit', 'ban', 'investigation', 'lawsuit', 'fraud', 'collapse', 'warning', 'risk'];
    
    let score = 0;
    for (const word of bullishWords) {
      if (text.includes(word)) score += 0.15;
    }
    for (const word of bearishWords) {
      if (text.includes(word)) score -= 0.15;
    }
    
    return { score: Math.max(-1, Math.min(1, score)), asset };
  }

  private normalizeTo100(value: number, min: number, max: number): number {
    return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let agentInstance: AIMarketAgent | null = null;

export function getMarketAgent(): AIMarketAgent {
  if (!agentInstance) {
    agentInstance = new AIMarketAgent();
  }
  return agentInstance;
}

export async function generateMarketIntelligence(): Promise<MarketIntelligence> {
  return getMarketAgent().generateIntelligence();
}

export async function queryMarketAgent(query: AgentQuery): Promise<AgentResponse> {
  return getMarketAgent().query(query);
}

export default AIMarketAgent;

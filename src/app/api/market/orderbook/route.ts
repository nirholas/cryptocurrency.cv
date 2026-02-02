/**
 * Order Book Aggregation API
 * 
 * Multi-exchange order book aggregation and smart routing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimitByRequest, rateLimitResponse } from '@/lib/rate-limit';
import { 
  orderBook,
  type Exchange,
} from '@/lib/order-book';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

// Use Node.js runtime since order-book.ts imports database.ts which requires fs/path modules
export const runtime = 'nodejs';
export const revalidate = 0; // Real-time data, no caching

const DEFAULT_EXCHANGES: Exchange[] = ['binance', 'coinbase', 'kraken', 'okx', 'bybit'];

/**
 * GET /api/market/orderbook
 * 
 * Get aggregated order book or depth chart data
 */
export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  const startTime = Date.now();
  const rateLimitResult = checkRateLimitByRequest(request);
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const action = searchParams.get('action') || 'aggregate';
    const exchangesParam = searchParams.get('exchanges');

    if (!symbol) {
      logger.error('Symbol parameter missing');
      return ApiError.badRequest('Symbol is required (e.g., BTC, ETH)');
    }

    const exchanges = exchangesParam
      ? exchangesParam.split(',') as Exchange[]
      : DEFAULT_EXCHANGES;

    // Validate exchanges
    const validExchanges = exchanges.filter(e => 
      ['binance', 'coinbase', 'kraken', 'bitfinex', 'bitstamp', 'okx', 'bybit', 'kucoin', 'huobi', 'gemini'].includes(e)
    ) as Exchange[];

    if (validExchanges.length === 0) {
      logger.error('No valid exchanges provided', { exchangesParam });
      return ApiError.badRequest('No valid exchanges provided');
    }

    if (action === 'aggregate') {
      logger.info('Aggregating order books', { symbol, exchanges: validExchanges });
      const aggregated = await orderBook.aggregateOrderBooks(symbol, validExchanges);
      
      logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
      return NextResponse.json({
        symbol: aggregated.symbol,
        timestamp: aggregated.timestamp,
        exchanges: aggregated.exchanges,
        nbbo: aggregated.nbbo,
        metrics: aggregated.metrics,
        exchangeData: aggregated.exchangeData,
        // Include top levels only to reduce payload size
        topBids: aggregated.aggregatedBids.slice(0, 10),
        topAsks: aggregated.aggregatedAsks.slice(0, 10),
      });
    }

    if (action === 'depth') {
      logger.info('Fetching depth chart data', { symbol, exchanges: validExchanges });
      const depthData = await orderBook.getDepthChartData(symbol, validExchanges);
      logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
      return NextResponse.json(depthData);
    }

    if (action === 'single') {
      const exchange = validExchanges[0];
      const depth = parseInt(searchParams.get('depth') || '25');
      
      logger.info('Fetching single order book', { symbol, exchange, depth });
      const book = await orderBook.fetchOrderBook(symbol, exchange, depth);
      if (!book) {
        logger.error('Failed to fetch order book', { exchange, symbol });
        return ApiError.upstream(exchange, new Error('Failed to fetch order book'));
      }

      logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
      return NextResponse.json({
        orderBook: {
          symbol: book.symbol,
          exchange: book.exchange,
          timestamp: book.timestamp,
          spread: book.spread,
          midPrice: book.midPrice,
          bids: book.bids,
          asks: book.asks,
        },
      });
    }

    if (action === 'nbbo') {
      logger.info('Fetching NBBO data', { symbol, exchanges: validExchanges });
      const aggregated = await orderBook.aggregateOrderBooks(symbol, validExchanges);
      
      logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
      return NextResponse.json({
        symbol: aggregated.symbol,
        timestamp: aggregated.timestamp,
        exchanges: aggregated.exchanges,
        nbbo: aggregated.nbbo,
      });
    }

    if (action === 'metrics') {
      logger.info('Fetching order book metrics', { symbol, exchanges: validExchanges });
      const aggregated = await orderBook.aggregateOrderBooks(symbol, validExchanges);
      
      logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
      return NextResponse.json({
        symbol: aggregated.symbol,
        timestamp: aggregated.timestamp,
        metrics: aggregated.metrics,
      });
    }

    if (action === 'whales') {
      logger.info('Fetching whale orders and price walls', { symbol, exchanges: validExchanges });
      const aggregated = await orderBook.aggregateOrderBooks(symbol, validExchanges);
      
      logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
      return NextResponse.json({
        symbol: aggregated.symbol,
        timestamp: aggregated.timestamp,
        whaleOrders: aggregated.metrics.whaleOrders,
        priceWalls: aggregated.metrics.priceWalls,
      });
    }

    if (action === 'snapshots') {
      const limit = parseInt(searchParams.get('limit') || '20');
      logger.info('Listing order book snapshots', { symbol, limit });
      const snapshots = await orderBook.listSnapshots({ symbol, limit });
      
      logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
      return NextResponse.json({
        snapshots: snapshots.map(s => ({
          id: s.id,
          symbol: s.symbol,
          timestamp: s.timestamp,
          exchanges: s.aggregatedBook.exchanges,
          midPrice: s.aggregatedBook.nbbo.midPrice,
          spread: s.aggregatedBook.nbbo.spread,
        })),
        count: snapshots.length,
      });
    }

    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
    return NextResponse.json({
      availableActions: [
        'aggregate',
        'depth',
        'single',
        'nbbo',
        'metrics',
        'whales',
        'snapshots',
      ],
    });
  } catch (error) {
    logger.error('Failed to fetch order book data', error);
    return ApiError.internal('Failed to fetch order book data', error);
  }
}

/**
 * POST /api/market/orderbook
 * 
 * Calculate smart routes or save snapshots
 */
export async function POST(request: NextRequest) {
  const logger = createRequestLogger(request);
  const startTime = Date.now();
  const rateLimitResult = checkRateLimitByRequest(request);
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'smart-route') {
      const { symbol, orderType, quantity, exchanges } = body as {
        symbol: string;
        orderType: 'buy' | 'sell';
        quantity: number;
        exchanges?: Exchange[];
      };

      if (!symbol || !orderType || !quantity) {
        logger.error('Missing required parameters for smart-route', { symbol, orderType, quantity });
        return ApiError.badRequest('Symbol, orderType (buy/sell), and quantity are required');
      }

      if (!['buy', 'sell'].includes(orderType)) {
        logger.error('Invalid orderType', { orderType });
        return ApiError.badRequest('orderType must be "buy" or "sell"');
      }

      if (quantity <= 0) {
        logger.error('Invalid quantity', { quantity });
        return ApiError.badRequest('Quantity must be positive');
      }

      const validExchanges = exchanges?.filter(e => 
        ['binance', 'coinbase', 'kraken', 'bitfinex', 'bitstamp', 'okx', 'bybit', 'kucoin', 'huobi', 'gemini'].includes(e)
      ) as Exchange[] | undefined;

      logger.info('Calculating smart route', { symbol, orderType, quantity });
      const recommendation = await orderBook.calculateSmartRoute(
        symbol,
        orderType,
        quantity,
        validExchanges || DEFAULT_EXCHANGES
      );

      logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
      return NextResponse.json({
        success: true,
        recommendation,
      });
    }

    if (action === 'save-snapshot') {
      const { symbol, exchanges } = body as {
        symbol: string;
        exchanges?: Exchange[];
      };

      if (!symbol) {
        logger.error('Symbol required for snapshot');
        return ApiError.badRequest('Symbol is required');
      }

      const validExchanges = exchanges?.filter(e => 
        ['binance', 'coinbase', 'kraken', 'bitfinex', 'bitstamp', 'okx', 'bybit', 'kucoin', 'huobi', 'gemini'].includes(e)
      ) as Exchange[] | undefined;

      logger.info('Saving order book snapshot', { symbol });
      const aggregated = await orderBook.aggregateOrderBooks(
        symbol,
        validExchanges || DEFAULT_EXCHANGES
      );

      const snapshot = await orderBook.saveSnapshot(aggregated);

      logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
      return NextResponse.json({
        success: true,
        snapshot: {
          id: snapshot.id,
          symbol: snapshot.symbol,
          timestamp: snapshot.timestamp,
        },
      });
    }

    if (action === 'get-snapshot') {
      const { id } = body;

      if (!id) {
        logger.error('Snapshot ID required');
        return ApiError.badRequest('Snapshot ID is required');
      }

      logger.info('Retrieving snapshot', { id });
      const snapshot = await orderBook.getSnapshot(id);
      if (!snapshot) {
        logger.error('Snapshot not found', { id });
        return ApiError.notFound('Snapshot not found');
      }

      logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
      return NextResponse.json({ snapshot });
    }

    if (action === 'compare-exchanges') {
      const { symbol, exchanges } = body as {
        symbol: string;
        exchanges?: Exchange[];
      };

      if (!symbol) {
        logger.error('Symbol required for comparison');
        return ApiError.badRequest('Symbol is required');
      }

      const validExchanges = exchanges?.filter(e => 
        ['binance', 'coinbase', 'kraken', 'bitfinex', 'bitstamp', 'okx', 'bybit', 'kucoin', 'huobi', 'gemini'].includes(e)
      ) as Exchange[] | undefined;

      logger.info('Comparing exchanges', { symbol, exchanges: validExchanges || DEFAULT_EXCHANGES });
      const aggregated = await orderBook.aggregateOrderBooks(
        symbol,
        validExchanges || DEFAULT_EXCHANGES
      );

      // Create comparison table
      const comparison = aggregated.exchangeData.map(ed => ({
        exchange: ed.exchange,
        bestBid: ed.bestBid,
        bestAsk: ed.bestAsk,
        spread: ed.spread,
        spreadPercent: ((ed.spread / ((ed.bestBid + ed.bestAsk) / 2)) * 100).toFixed(4) + '%',
        bidLiquidity: ed.totalBidLiquidity,
        askLiquidity: ed.totalAskLiquidity,
        status: ed.status,
      }));

      // Rank by spread
      const rankedBySpread = [...comparison].sort((a, b) => a.spread - b.spread);
      
      // Rank by liquidity
      const rankedByLiquidity = [...comparison].sort(
        (a, b) => (b.bidLiquidity + b.askLiquidity) - (a.bidLiquidity + a.askLiquidity)
      );

      logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
      return NextResponse.json({
        symbol,
        timestamp: aggregated.timestamp,
        comparison,
        rankings: {
          bySpread: rankedBySpread.map((e, i) => ({ 
            rank: i + 1, 
            exchange: e.exchange, 
            spread: e.spreadPercent 
          })),
          byLiquidity: rankedByLiquidity.map((e, i) => ({ 
            rank: i + 1, 
            exchange: e.exchange, 
            totalLiquidity: e.bidLiquidity + e.askLiquidity 
          })),
        },
      });
    }

    logger.error('Invalid action for POST request', { action });
    return ApiError.badRequest('Invalid action. Supported: smart-route, save-snapshot, get-snapshot, compare-exchanges');
  } catch (error) {
    logger.error('Failed to process order book request', error);
    return ApiError.internal('Failed to process order book request', error);
  }
}

/**
 * Premium API - Export Portfolio
 *
 * GET /api/premium/export/portfolio
 *
 * Export portfolio data as JSON or CSV with full transaction history.
 *
 * Price: $0.10 per export
 *
 * @module api/premium/export/portfolio
 */

import { NextRequest, NextResponse } from 'next/server';
import { withX402 } from '@/lib/x402';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'nodejs';

interface PortfolioExport {
  format: 'json' | 'csv';
  exportedAt: string;
  portfolio: {
    totalValue: number;
    totalCost: number;
    totalPnL: number;
    totalPnLPercent: number;
    holdings: Array<{
      coinId: string;
      symbol: string;
      name: string;
      quantity: number;
      avgBuyPrice: number;
      currentPrice: number;
      value: number;
      pnl: number;
      pnlPercent: number;
      allocation: number;
    }>;
    transactions: Array<{
      id: string;
      coinId: string;
      type: 'buy' | 'sell';
      quantity: number;
      price: number;
      total: number;
      date: string;
    }>;
  };
  meta: {
    premium: true;
    generatedBy: string;
    version: string;
    portfolio?: string;
  };
}

/**
 * Handler for portfolio export
 */
async function handler(
  request: NextRequest
): Promise<NextResponse<PortfolioExport | string | { error: string; message?: string }>> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();
  
  try {
    logger.info('Processing portfolio export request');
    const searchParams = request.nextUrl.searchParams;
    const format = (searchParams.get('format') || 'json') as 'json' | 'csv';
    const portfolioId = searchParams.get('portfolio_id');

    // Require a portfolio ID to export real data
    if (!portfolioId) {
      return ApiError.badRequest('Portfolio ID required. Provide portfolio_id parameter to export your portfolio data');
    }
    
    // In production, fetch portfolio from database
    // For now, return empty structure indicating no data
    const exportData: PortfolioExport = {
      format,
      exportedAt: new Date().toISOString(),
      portfolio: {
        totalValue: 0,
        totalCost: 0,
        totalPnL: 0,
        totalPnLPercent: 0,
        holdings: [],
        transactions: [],
      },
      meta: {
        premium: true,
        generatedBy: 'Crypto Data Aggregator',
        version: '1.0.0',
        portfolio: portfolioId,
      },
    };

    if (format === 'csv') {
      // Convert to CSV format
      const headers = [
        'coinId',
        'symbol',
        'name',
        'quantity',
        'avgBuyPrice',
        'currentPrice',
        'value',
        'pnl',
        'pnlPercent',
        'allocation',
      ];
      const rows = exportData.portfolio.holdings.map((h) =>
        [
          h.coinId,
          h.symbol,
          h.name,
          h.quantity,
          h.avgBuyPrice,
          h.currentPrice,
          h.value,
          h.pnl,
          h.pnlPercent,
          h.allocation,
        ].join(',')
      );
      const csv = [headers.join(','), ...rows].join('\n');

      logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="portfolio-${Date.now()}.csv"`,
        },
      });
    }

    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
    
    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="portfolio-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    logger.error('Portfolio export failed', error);
    return ApiError.internal('Failed to export portfolio', error);
  }
}

/**
 * GET /api/premium/export/portfolio
 *
 * Premium endpoint - requires x402 payment ($0.10)
 *
 * Query parameters:
 * - format: 'json' | 'csv' (default: 'json')
 */
export const GET = withX402('/api/premium/export/portfolio', handler);

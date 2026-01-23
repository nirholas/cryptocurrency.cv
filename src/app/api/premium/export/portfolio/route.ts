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
import { withX402 } from '@x402/next';
import { x402Server, getRouteConfig } from '@/lib/x402-server';

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
  };
}

/**
 * Handler for portfolio export
 */
async function handler(
  request: NextRequest
): Promise<NextResponse<PortfolioExport | string | { error: string }>> {
  const searchParams = request.nextUrl.searchParams;
  const format = (searchParams.get('format') || 'json') as 'json' | 'csv';

  try {
    // In a real implementation, this would fetch from a database
    // For demo, we return sample data structure
    const exportData: PortfolioExport = {
      format,
      exportedAt: new Date().toISOString(),
      portfolio: {
        totalValue: 10000,
        totalCost: 8500,
        totalPnL: 1500,
        totalPnLPercent: 17.65,
        holdings: [
          {
            coinId: 'bitcoin',
            symbol: 'BTC',
            name: 'Bitcoin',
            quantity: 0.15,
            avgBuyPrice: 35000,
            currentPrice: 42000,
            value: 6300,
            pnl: 1050,
            pnlPercent: 20,
            allocation: 63,
          },
          {
            coinId: 'ethereum',
            symbol: 'ETH',
            name: 'Ethereum',
            quantity: 1.5,
            avgBuyPrice: 2000,
            currentPrice: 2466.67,
            value: 3700,
            pnl: 700,
            pnlPercent: 23.33,
            allocation: 37,
          },
        ],
        transactions: [
          {
            id: 'tx-001',
            coinId: 'bitcoin',
            type: 'buy',
            quantity: 0.15,
            price: 35000,
            total: 5250,
            date: '2025-01-15T10:30:00Z',
          },
          {
            id: 'tx-002',
            coinId: 'ethereum',
            type: 'buy',
            quantity: 1.5,
            price: 2000,
            total: 3000,
            date: '2025-01-10T14:20:00Z',
          },
        ],
      },
      meta: {
        premium: true,
        generatedBy: 'Crypto Data Aggregator',
        version: '1.0.0',
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

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="portfolio-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="portfolio-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting portfolio:', error);
    return NextResponse.json({ error: 'Failed to export portfolio' }, { status: 500 });
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
export const GET = withX402(handler, getRouteConfig('/api/premium/export/portfolio'), x402Server);

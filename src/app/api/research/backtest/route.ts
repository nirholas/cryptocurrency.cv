/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { type NextRequest, NextResponse } from 'next/server';
import { runBacktest } from '@/lib/backtesting';
import { readJsonBody } from '@/lib/json-body';

interface BacktestRequest {
  strategy: string;
  asset: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  parameters: Record<string, number>;
}

export async function POST(request: NextRequest) {
  try {
    const jsonBody = await readJsonBody<BacktestRequest>(request);
    if (!jsonBody.ok) return jsonBody.response;
    const body = jsonBody.body;
    
    const { strategy, asset, start_date, end_date, initial_capital = 10000, parameters } = body;
    
    if (!strategy || !asset || !start_date || !end_date) {
      return NextResponse.json({ 
        error: 'Required: strategy, asset, start_date, end_date' 
      }, { status: 400 });
    }

    // Use real backtesting library with historical data
    const result = await runBacktest({
      strategyId: `strategy_${strategy}`,
      strategyName: strategy,
      assets: [asset],
      startDate: start_date,
      endDate: end_date,
      initialCapital: initial_capital,
      positionSizing: {
        type: 'percentage',
        value: 10,
        maxPositionSize: 25,
      },
      riskManagement: {
        stopLoss: 5,
        takeProfit: 15,
        maxDrawdown: 20,
      },
      parameters: {
        sentimentThreshold: parameters?.sentimentThreshold || 0.3,
        minConfidence: parameters?.minConfidence || 0.6,
      },
    });

    return NextResponse.json({
      result: {
        strategy,
        asset,
        period: { start: start_date, end: end_date },
        metrics: result.performance,
        trades: result.trades.slice(-50),
        equity_curve: result.equityCurve.filter((_, i) => 
          i % Math.max(1, Math.floor(result.equityCurve.length / 100)) === 0
        ),
      },
      parameters_used: parameters || {},
      disclaimer: 'Backtesting results use historical data and do not guarantee future performance.'
    });
  } catch (error) {
    console.error('Backtest error:', error);
    return NextResponse.json({ error: 'Backtest failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { runBacktest } from '@/lib/backtesting';

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
    const body: BacktestRequest = await request.json();
    
    const { strategy, asset, start_date, end_date, initial_capital = 10000, parameters } = body;
    
    if (!strategy || !asset || !start_date || !end_date) {
      return NextResponse.json({ 
        error: 'Required: strategy, asset, start_date, end_date' 
      }, { status: 400 });
    }

    // Use real backtesting library with historical data
    const result = await runBacktest({
      strategy: {
        id: `strategy_${strategy}`,
        name: strategy,
        description: `${strategy} strategy on ${asset}`,
        type: strategy.toLowerCase().includes('momentum') ? 'momentum' : 
              strategy.toLowerCase().includes('mean') ? 'mean-reversion' : 'trend-following',
        rules: {
          entryConditions: [
            { indicator: 'price', operator: 'crosses_above', value: 0, period: 20 }
          ],
          exitConditions: [
            { indicator: 'price', operator: 'crosses_below', value: 0, period: 20 }
          ],
          positionSize: 'fixed',
          riskPerTrade: 0.02,
        },
        parameters: parameters || {},
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      startDate: start_date,
      endDate: end_date,
      asset,
      initialCapital: initial_capital,
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

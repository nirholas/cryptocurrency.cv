/**
 * TradingView Integration API
 * 
 * Provides TradingView widgets, Pine Script generation, and technical analysis.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimitFromRequest, getRateLimitErrorResponse } from '@/lib/ratelimit';
import { 
  tradingView,
  type Timeframe,
  type WidgetConfig,
  type PineScriptInput,
  type PineScriptPlot,
} from '@/lib/tradingview';

// Use Node.js runtime since tradingview.ts imports database.ts which requires fs/path modules
export const runtime = 'nodejs';
export const revalidate = 60;

/**
 * GET /api/integrations/tradingview
 * 
 * Get widgets, indicators, alerts, or technical analysis
 */
export async function GET(request: NextRequest) {
  const rateLimitResult = await checkRateLimitFromRequest(request);
  if (!rateLimitResult.allowed) {
    return getRateLimitErrorResponse(rateLimitResult);
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const symbol = searchParams.get('symbol');
    const timeframe = (searchParams.get('timeframe') || 'D') as Timeframe;

    // Generate widgets
    if (action === 'widget') {
      const widgetType = searchParams.get('type') || 'chart';
      const theme = (searchParams.get('theme') || 'dark') as 'light' | 'dark';
      const width = searchParams.get('width') || '100%';
      const height = parseInt(searchParams.get('height') || '500');

      const config: Partial<WidgetConfig> = {
        symbol: symbol ? `BINANCE:${symbol.toUpperCase()}USDT` : 'BINANCE:BTCUSDT',
        interval: timeframe,
        theme,
        width,
        height,
      };

      let widget;
      switch (widgetType) {
        case 'chart':
          widget = tradingView.generateChartWidget(config);
          break;
        case 'ticker':
          const symbols = searchParams.get('symbols')?.split(',') || ['BTC', 'ETH', 'SOL'];
          widget = tradingView.generateTickerWidget(symbols, config);
          break;
        case 'technical-analysis':
          widget = tradingView.generateTechnicalAnalysisWidget(symbol || 'BTC', config);
          break;
        case 'crypto-market':
          widget = tradingView.generateCryptoMarketWidget(config);
          break;
        case 'mini-chart':
          widget = tradingView.generateMiniChartWidget(symbol || 'BTC', config);
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid widget type' },
            { status: 400 }
          );
      }

      return NextResponse.json({ widget });
    }

    // Get technical analysis
    if (action === 'analysis' || action === 'technical-analysis') {
      if (!symbol) {
        return NextResponse.json(
          { error: 'Symbol is required' },
          { status: 400 }
        );
      }

      const analysis = await tradingView.getTechnicalAnalysis(symbol, timeframe);
      return NextResponse.json({ analysis });
    }

    // List saved indicators
    if (action === 'indicators') {
      const tags = searchParams.get('tags')?.split(',');
      const overlay = searchParams.get('overlay');
      
      const indicators = await tradingView.listIndicators({
        tags,
        overlay: overlay !== null ? overlay === 'true' : undefined,
      });

      return NextResponse.json({ 
        indicators,
        count: indicators.length,
      });
    }

    // Get specific indicator
    if (action === 'indicator') {
      const id = searchParams.get('id');
      if (!id) {
        return NextResponse.json(
          { error: 'Indicator ID is required' },
          { status: 400 }
        );
      }

      const indicator = await tradingView.getIndicator(id);
      if (!indicator) {
        return NextResponse.json(
          { error: 'Indicator not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ indicator });
    }

    // List alerts
    if (action === 'alerts') {
      const enabled = searchParams.get('enabled');
      
      const alerts = await tradingView.listAlerts({
        symbol: symbol || undefined,
        enabled: enabled !== null ? enabled === 'true' : undefined,
      });

      return NextResponse.json({ 
        alerts,
        count: alerts.length,
      });
    }

    // Get predefined indicators
    if (action === 'predefined') {
      const type = searchParams.get('type');
      
      let indicator;
      switch (type) {
        case 'ma-crossover':
          const fast = parseInt(searchParams.get('fast') || '9');
          const slow = parseInt(searchParams.get('slow') || '21');
          indicator = tradingView.generateMACrossoverIndicator(fast, slow);
          break;
        case 'rsi-divergence':
          indicator = tradingView.generateRSIDivergenceIndicator();
          break;
        case 'volume-profile':
          indicator = tradingView.generateVolumeProfileIndicator();
          break;
        case 'fear-greed':
          indicator = tradingView.generateFearGreedIndicator();
          break;
        default:
          return NextResponse.json({
            availableTypes: [
              'ma-crossover',
              'rsi-divergence',
              'volume-profile',
              'fear-greed',
            ],
          });
      }

      return NextResponse.json({ indicator });
    }

    return NextResponse.json({
      availableActions: [
        'widget',
        'analysis',
        'indicators',
        'indicator',
        'alerts',
        'predefined',
      ],
      widgetTypes: [
        'chart',
        'ticker',
        'technical-analysis',
        'crypto-market',
        'mini-chart',
      ],
    });
  } catch (error) {
    console.error('TradingView API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/tradingview
 * 
 * Create indicators, alerts, or generate Pine Script
 */
export async function POST(request: NextRequest) {
  const rateLimitResult = await checkRateLimitFromRequest(request);
  if (!rateLimitResult.allowed) {
    return getRateLimitErrorResponse(rateLimitResult);
  }

  try {
    const body = await request.json();
    const { action } = body;

    // Generate Pine Script
    if (action === 'generate-pinescript') {
      const { name, description, inputs, plots, overlay, tags } = body as {
        name: string;
        description: string;
        inputs: PineScriptInput[];
        plots: PineScriptPlot[];
        overlay: boolean;
        tags?: string[];
      };

      if (!name || !inputs || !plots) {
        return NextResponse.json(
          { error: 'Name, inputs, and plots are required' },
          { status: 400 }
        );
      }

      const code = tradingView.generatePineScript({
        name,
        description: description || '',
        version: 5,
        inputs,
        plots,
        overlay: overlay ?? true,
        tags: tags || [],
      });

      return NextResponse.json({
        success: true,
        code,
      });
    }

    // Save custom indicator
    if (action === 'save-indicator') {
      const { indicator } = body;

      if (!indicator || !indicator.name || !indicator.code) {
        return NextResponse.json(
          { error: 'Indicator with name and code is required' },
          { status: 400 }
        );
      }

      const saved = await tradingView.saveIndicator({
        id: indicator.id || `tv_${Date.now().toString(36)}`,
        name: indicator.name,
        description: indicator.description || '',
        version: indicator.version || 5,
        code: indicator.code,
        inputs: indicator.inputs || [],
        plots: indicator.plots || [],
        overlay: indicator.overlay ?? true,
        tags: indicator.tags || [],
        created: indicator.created || new Date().toISOString(),
        updated: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        indicator: saved,
      });
    }

    // Create alert
    if (action === 'create-alert') {
      const { name, symbol, condition, message, webhook, frequency, enabled } = body;

      if (!name || !symbol || !condition || !message) {
        return NextResponse.json(
          { error: 'Name, symbol, condition, and message are required' },
          { status: 400 }
        );
      }

      const alert = await tradingView.createAlert({
        name,
        symbol,
        condition,
        message,
        webhook,
        frequency: frequency || 'once',
        enabled: enabled ?? true,
      });

      return NextResponse.json({
        success: true,
        alert,
      });
    }

    // Update alert
    if (action === 'update-alert') {
      const { id, updates } = body;

      if (!id) {
        return NextResponse.json(
          { error: 'Alert ID is required' },
          { status: 400 }
        );
      }

      const alert = await tradingView.updateAlert(id, updates);
      if (!alert) {
        return NextResponse.json(
          { error: 'Alert not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        alert,
      });
    }

    // Delete alert
    if (action === 'delete-alert') {
      const { id } = body;

      if (!id) {
        return NextResponse.json(
          { error: 'Alert ID is required' },
          { status: 400 }
        );
      }

      await tradingView.deleteAlert(id);
      return NextResponse.json({
        success: true,
        message: `Deleted alert ${id}`,
      });
    }

    // Trigger alert (for testing webhooks)
    if (action === 'trigger-alert') {
      const { id } = body;

      if (!id) {
        return NextResponse.json(
          { error: 'Alert ID is required' },
          { status: 400 }
        );
      }

      await tradingView.triggerAlert(id);
      return NextResponse.json({
        success: true,
        message: `Triggered alert ${id}`,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('TradingView POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

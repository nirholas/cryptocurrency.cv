/**
 * TradingView UDF API
 * 
 * Universal Data Feed (UDF) protocol endpoints for TradingView integration.
 * 
 * Endpoints:
 * GET /api/tradingview/config - Server configuration
 * GET /api/tradingview/time - Server time
 * GET /api/tradingview/symbols?symbol=... - Symbol resolution
 * GET /api/tradingview/search?query=... - Symbol search
 * GET /api/tradingview/history?symbol=...&from=...&to=...&resolution=... - Historical data
 * GET /api/tradingview/quotes?symbols=... - Real-time quotes
 * GET /api/tradingview/marks?symbol=...&from=...&to=... - Chart marks (news)
 * GET /api/tradingview/timescale_marks?symbol=...&from=...&to=... - Timeline marks
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getConfig,
  getServerTime,
  resolveSymbol,
  searchSymbols,
  getHistory,
  getQuotes,
  getMarks,
  getTimescaleMarks,
  generateWidgetConfig,
} from '@/lib/tradingview';

// Use Node.js runtime since tradingview.ts imports database.ts which requires fs/path modules
export const runtime = 'nodejs';

// =============================================================================
// GET - Handle all TradingView UDF requests
// =============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  try {
    // Route based on path or action parameter
    const action = searchParams.get('action') || 'config';
    
    switch (action) {
      case 'config':
        return NextResponse.json(getConfig());
        
      case 'time':
        return new NextResponse(getServerTime().toString(), {
          headers: { 'Content-Type': 'text/plain' },
        });
        
      case 'symbols': {
        const symbol = searchParams.get('symbol');
        if (!symbol) {
          return NextResponse.json({ s: 'error', errmsg: 'Symbol required' }, { status: 400 });
        }
        const resolved = resolveSymbol(symbol);
        if (!resolved) {
          return NextResponse.json({ s: 'error', errmsg: 'Unknown symbol' }, { status: 404 });
        }
        return NextResponse.json(resolved);
      }
        
      case 'search': {
        const query = searchParams.get('query') || '';
        const type = searchParams.get('type') || undefined;
        const exchange = searchParams.get('exchange') || undefined;
        const limit = parseInt(searchParams.get('limit') || '30', 10);
        
        const results = searchSymbols(query, type, exchange, limit);
        return NextResponse.json(results);
      }
        
      case 'history': {
        const symbol = searchParams.get('symbol');
        const from = parseInt(searchParams.get('from') || '0', 10);
        const to = parseInt(searchParams.get('to') || String(Math.floor(Date.now() / 1000)), 10);
        const resolution = searchParams.get('resolution') || 'D';
        const countback = searchParams.get('countback') 
          ? parseInt(searchParams.get('countback')!, 10) 
          : undefined;
        
        if (!symbol) {
          return NextResponse.json({ s: 'error', errmsg: 'Symbol required' }, { status: 400 });
        }
        
        const history = await getHistory(symbol, from, to, resolution, countback);
        return NextResponse.json(history);
      }
        
      case 'quotes': {
        const symbolsParam = searchParams.get('symbols');
        if (!symbolsParam) {
          return NextResponse.json({ s: 'error', errmsg: 'Symbols required' }, { status: 400 });
        }
        const symbols = symbolsParam.split(',');
        const quotes = await getQuotes(symbols);
        return NextResponse.json(quotes);
      }
        
      case 'marks': {
        const symbol = searchParams.get('symbol');
        const from = parseInt(searchParams.get('from') || '0', 10);
        const to = parseInt(searchParams.get('to') || String(Math.floor(Date.now() / 1000)), 10);
        const resolution = searchParams.get('resolution') || 'D';
        
        if (!symbol) {
          return NextResponse.json([], { status: 400 });
        }
        
        const marks = await getMarks(symbol, from, to, resolution);
        return NextResponse.json(marks);
      }
        
      case 'timescale_marks': {
        const symbol = searchParams.get('symbol');
        const from = parseInt(searchParams.get('from') || '0', 10);
        const to = parseInt(searchParams.get('to') || String(Math.floor(Date.now() / 1000)), 10);
        const resolution = searchParams.get('resolution') || 'D';
        
        if (!symbol) {
          return NextResponse.json([], { status: 400 });
        }
        
        const marks = await getTimescaleMarks(symbol, from, to, resolution);
        return NextResponse.json(marks);
      }
        
      case 'widget_config': {
        const symbol = searchParams.get('symbol') || undefined;
        const theme = (searchParams.get('theme') || 'dark') as 'light' | 'dark';
        
        const config = generateWidgetConfig({ symbol, theme });
        return NextResponse.json(config);
      }
        
      default:
        return NextResponse.json(
          { error: 'Unknown action', validActions: [
            'config', 'time', 'symbols', 'search', 'history', 
            'quotes', 'marks', 'timescale_marks', 'widget_config'
          ]},
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('TradingView API error:', error);
    return NextResponse.json(
      { 
        s: 'error',
        errmsg: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

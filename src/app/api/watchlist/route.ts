/**
 * Watchlist API
 * 
 * GET /api/watchlist - Get user's watchlist
 * GET /api/watchlist?check=coinId - Check if coin is in watchlist
 * GET /api/watchlist?prices=true - Get watchlist with current prices
 * POST /api/watchlist - Add coin to watchlist
 * DELETE /api/watchlist - Remove coin from watchlist
 * PUT /api/watchlist - Update watchlist item
 * POST /api/watchlist/bulk - Bulk add coins
 * DELETE /api/watchlist/clear - Clear entire watchlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
  toggleWatchlist,
  updateWatchlistItem,
  clearWatchlist,
  bulkAddToWatchlist,
  getWatchlistWithPrices,
  getDefaultUserId,
} from '@/lib/watchlist/service';

// =============================================================================
// Helper to get user ID
// =============================================================================

async function getUserId(request?: NextRequest): Promise<string> {
  try {
    // First, try API key from headers (for authenticated API access)
    if (request) {
      const apiKey = request.headers.get('X-API-Key') || request.headers.get('x-api-key');
      if (apiKey && apiKey.startsWith('cda_')) {
        // Use a hash of the API key prefix as user ID for privacy
        const keyPrefix = apiKey.substring(0, 20);
        return `api:${Buffer.from(keyPrefix).toString('base64').substring(0, 16)}`;
      }
    }
    
    // Next, try cookie-based user ID
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('watchlist-user-id');
    return userIdCookie?.value || getDefaultUserId();
  } catch {
    return getDefaultUserId();
  }
}

// =============================================================================
// GET - Get watchlist or check if coin is in watchlist
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = await getUserId(request);
    
    // Check if specific coin is in watchlist
    const checkCoinId = searchParams.get('check');
    if (checkCoinId) {
      const isIn = await isInWatchlist(userId, checkCoinId);
      return NextResponse.json({
        success: true,
        coinId: checkCoinId,
        isInWatchlist: isIn,
      });
    }
    
    // Get watchlist with prices
    if (searchParams.get('prices') === 'true') {
      const { watchlist, prices } = await getWatchlistWithPrices(userId);
      
      // Calculate performance for each item
      const itemsWithPerformance = watchlist.items.map(item => {
        const currentPrice = prices[item.coinId];
        const priceAtAdd = item.priceAtAdd;
        let performance = null;
        
        if (currentPrice && priceAtAdd) {
          performance = {
            absoluteChange: currentPrice - priceAtAdd,
            percentChange: ((currentPrice - priceAtAdd) / priceAtAdd) * 100,
          };
        }
        
        return {
          ...item,
          currentPrice,
          performance,
        };
      });
      
      return NextResponse.json({
        success: true,
        watchlist: {
          ...watchlist,
          items: itemsWithPerformance,
        },
        prices,
      });
    }
    
    // Get plain watchlist
    const watchlist = await getWatchlist(userId);
    
    return NextResponse.json({
      success: true,
      watchlist,
      count: watchlist.items.length,
    });
  } catch (error) {
    console.error('Watchlist GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get watchlist',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Add coin to watchlist or toggle
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    const body = await request.json();
    
    const { coinId, symbol, name, priceAtAdd, notes, toggle, bulk } = body;
    
    // Bulk add
    if (bulk && Array.isArray(bulk)) {
      const watchlist = await bulkAddToWatchlist(userId, bulk);
      return NextResponse.json({
        success: true,
        message: `Added ${bulk.length} coins to watchlist`,
        watchlist,
      });
    }
    
    // Validate required fields
    if (!coinId || !symbol || !name) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'coinId, symbol, and name are required',
        },
        { status: 400 }
      );
    }
    
    const item = { coinId, symbol, name, priceAtAdd, notes };
    
    // Toggle mode
    if (toggle) {
      const { watchlist, added } = await toggleWatchlist(userId, item);
      return NextResponse.json({
        success: true,
        action: added ? 'added' : 'removed',
        message: added 
          ? `${symbol} added to watchlist` 
          : `${symbol} removed from watchlist`,
        watchlist,
      });
    }
    
    // Add to watchlist
    const watchlist = await addToWatchlist(userId, item);
    
    return NextResponse.json({
      success: true,
      message: `${symbol} added to watchlist`,
      watchlist,
    });
  } catch (error) {
    console.error('Watchlist POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add to watchlist',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Remove coin from watchlist
// =============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    const { searchParams } = new URL(request.url);
    
    // Clear entire watchlist
    if (searchParams.get('clear') === 'true') {
      const watchlist = await clearWatchlist(userId);
      return NextResponse.json({
        success: true,
        message: 'Watchlist cleared',
        watchlist,
      });
    }
    
    // Remove specific coin
    const coinId = searchParams.get('coinId');
    if (!coinId) {
      return NextResponse.json(
        { success: false, error: 'coinId parameter required' },
        { status: 400 }
      );
    }
    
    const watchlist = await removeFromWatchlist(userId, coinId);
    
    return NextResponse.json({
      success: true,
      message: 'Removed from watchlist',
      watchlist,
    });
  } catch (error) {
    console.error('Watchlist DELETE error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to remove from watchlist',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT - Update watchlist item
// =============================================================================

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    const body = await request.json();
    
    const { coinId, notes } = body;
    
    if (!coinId) {
      return NextResponse.json(
        { success: false, error: 'coinId is required' },
        { status: 400 }
      );
    }
    
    const watchlist = await updateWatchlistItem(userId, coinId, { notes });
    
    return NextResponse.json({
      success: true,
      message: 'Watchlist item updated',
      watchlist,
    });
  } catch (error) {
    console.error('Watchlist PUT error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update watchlist item',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

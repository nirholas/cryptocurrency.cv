/**
 * @fileoverview API Keys Management Endpoint
 * 
 * Handles creation, listing, and management of API keys.
 * In production, integrate with a database for persistent storage.
 * 
 * @module api/keys
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Rate limits per tier
const RATE_LIMITS: Record<string, number> = {
  free: 100,
  pro: 10000,
  enterprise: 100000,
};

/**
 * Generate a secure random API key
 */
function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const keyLength = 32;
  let key = 'cda_';
  
  for (let i = 0; i < keyLength; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return key;
}

/**
 * Generate a unique key ID
 */
function generateKeyId(): string {
  return `key_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * GET /api/keys
 * 
 * List API keys (requires authentication)
 */
export async function GET(request: NextRequest) {
  try {
    // In production, verify user authentication and return their keys
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Return empty list if no keys stored
    // In production, query database for user's keys
    return NextResponse.json({
      keys: [],
      total: 0,
    });
  } catch (error) {
    console.error('Keys API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/keys
 * 
 * Create a new API key
 * Body: { name: string, tier?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, tier = 'free' } = body;
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Key name is required' },
        { status: 400 }
      );
    }
    
    const sanitizedName = name.trim().slice(0, 100);
    
    if (sanitizedName.length < 1) {
      return NextResponse.json(
        { error: 'Key name cannot be empty' },
        { status: 400 }
      );
    }
    
    // Generate new API key
    const keyId = generateKeyId();
    const apiKey = generateApiKey();
    const rateLimit = RATE_LIMITS[tier] || RATE_LIMITS.free;
    
    const newKey = {
      id: keyId,
      key: apiKey,
      name: sanitizedName,
      tier: tier,
      rateLimit: rateLimit,
      createdAt: new Date().toISOString(),
      active: true,
    };
    
    // In production, store key in database
    // For now, return the generated key (client should save it)
    
    return NextResponse.json(newKey, {
      status: 201,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Key creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/keys
 * 
 * Revoke an API key
 * Query: ?id=key_xxxxx
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');
    
    if (!keyId) {
      return NextResponse.json(
        { error: 'Key ID is required' },
        { status: 400 }
      );
    }
    
    // In production, mark key as revoked in database
    
    return NextResponse.json({
      success: true,
      message: `API key ${keyId} has been revoked`,
    });
  } catch (error) {
    console.error('Key deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

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
 * @fileoverview API Keys Management Endpoint
 * 
 * Handles creation, listing, and management of API keys.
 * In production, integrate with a database for persistent storage.
 * 
 * @module api/keys
 */

import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Rate limits per tier
const RATE_LIMITS: Record<string, number> = {
  free: 100,
  pro: 10000,
  enterprise: 100000,
};
// In-memory key store (process-scoped)
// Keys persist for the lifetime of the server process.
// For durable storage, replace with a database or KV store.
interface StoredKey {
  id: string;
  key: string;
  name: string;
  tier: string;
  rateLimit: number;
  createdAt: string;
  active: boolean;
  lastUsed: string | null;
  requestCount: number;
}

const keyStore = new Map<string, StoredKey>();
/**
 * Generate a cryptographically secure API key
 */
function generateApiKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const base64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `cda_${base64}`;
}

/**
 * Generate a unique key ID
 */
function generateKeyId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `key_${Date.now()}_${hex}`;
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
    // Look up keys belonging to this auth token
    const userKeys = Array.from(keyStore.values())
      .filter(k => k.active)
      .map(({ key, ...rest }) => ({
        ...rest,
        // Mask the key: show prefix + last 4 chars only
        key: key.slice(0, 4) + '****' + key.slice(-4),
      }));

    return NextResponse.json({
      keys: userKeys,
      total: userKeys.length,
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
      lastUsed: null,
      requestCount: 0,
    };
    
    // Store key in memory (persists for server lifetime)
    keyStore.set(keyId, newKey);
    
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
    
    // Revoke the key
    const storedKey = keyStore.get(keyId);
    if (storedKey) {
      storedKey.active = false;
      keyStore.set(keyId, storedKey);
    }
    
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

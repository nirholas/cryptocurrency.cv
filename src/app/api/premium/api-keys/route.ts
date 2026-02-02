/**
 * Premium API - API Key Management
 *
 * GET/POST /api/premium/api-keys
 *
 * Manage API keys for programmatic access:
 * - Generate new API keys
 * - List existing keys
 * - Set rate limits and permissions
 * - Revoke keys
 *
 * Price: $1.00 per month for API access
 *
 * @module api/premium/api-keys
 */

import { NextRequest, NextResponse } from 'next/server';
import { withX402 } from '@/lib/x402';
import { db } from '@/lib/database';

export const runtime = 'nodejs';

// Database collection for API keys
const API_KEYS_COLLECTION = 'api_keys';

interface APIKey {
  id: string;
  key: string;
  name: string;
  permissions: string[];
  rateLimit: number;
  usageToday: number;
  usageMonth: number;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt: string;
  active: boolean;
}

interface CreateKeyRequest {
  name: string;
  permissions?: string[];
  rateLimit?: number;
}

interface APIKeysResponse {
  keys: APIKey[];
  limits: {
    maxKeys: number;
    currentKeys: number;
    defaultRateLimit: number;
    maxRateLimit: number;
  };
  premium: true;
  metadata: {
    generatedAt: string;
    subscription: {
      active: boolean;
      expiresAt: string;
    };
  };
}

// Database-backed key storage helper functions
async function getAllKeys(): Promise<APIKey[]> {
  try {
    const docs = await db.listDocuments<APIKey>(API_KEYS_COLLECTION, { limit: 100 });
    return docs.map(doc => doc.data);
  } catch (error) {
    console.error('Failed to get API keys from database:', error);
    return [];
  }
}

async function getKeyById(id: string): Promise<APIKey | null> {
  try {
    const doc = await db.getDocument<APIKey>(API_KEYS_COLLECTION, id);
    return doc?.data || null;
  } catch {
    return null;
  }
}

async function saveKey(key: APIKey): Promise<void> {
  await db.saveDocument(API_KEYS_COLLECTION, key.id, key, {
    keyPrefix: key.key.substring(0, 8),
  });
}

async function countKeys(): Promise<number> {
  try {
    return await db.countDocuments(API_KEYS_COLLECTION);
  } catch {
    return 0;
  }
}

/**
 * Generate a secure API key
 */
function generateAPIKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const prefix = 'cda_'; // crypto data API
  let key = prefix;
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `key_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Available permissions
 */
const AVAILABLE_PERMISSIONS = [
  'market:read',
  'market:premium',
  'defi:read',
  'defi:premium',
  'portfolio:read',
  'portfolio:analytics',
  'ai:analyze',
  'alerts:read',
  'alerts:write',
  'export:csv',
  'export:json',
  'streams:subscribe',
];

/**
 * Handler for GET requests - list keys
 */
async function handleGet(): Promise<NextResponse<APIKeysResponse>> {
  // Get all keys from database (mask the actual key value)
  const storedKeys = await getAllKeys();
  const keys = storedKeys.map((k) => ({
    ...k,
    key: k.key.substring(0, 8) + '...' + k.key.substring(k.key.length - 4),
  }));

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  return NextResponse.json({
    keys,
    limits: {
      maxKeys: 10,
      currentKeys: keys.length,
      defaultRateLimit: 1000,
      maxRateLimit: 10000,
    },
    premium: true,
    metadata: {
      generatedAt: new Date().toISOString(),
      subscription: {
        active: true,
        expiresAt: expiresAt.toISOString(),
      },
    },
  });
}

/**
 * Handler for POST requests - create key
 */
async function handlePost(
  request: NextRequest
): Promise<NextResponse<{ key: APIKey; premium: true } | { error: string; message: string }>> {
  let body: CreateKeyRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
      { status: 400 }
    );
  }

  const { name, permissions = ['market:read'], rateLimit = 1000 } = body;

  if (!name || name.length < 3 || name.length > 50) {
    return NextResponse.json(
      { error: 'Invalid name', message: 'name must be 3-50 characters' },
      { status: 400 }
    );
  }

  // Validate permissions
  const invalidPerms = permissions.filter((p) => !AVAILABLE_PERMISSIONS.includes(p));
  if (invalidPerms.length > 0) {
    return NextResponse.json(
      {
        error: 'Invalid permissions',
        message: `Invalid: ${invalidPerms.join(', ')}. Valid: ${AVAILABLE_PERMISSIONS.join(', ')}`,
      },
      { status: 400 }
    );
  }

  // Check key limit
  const currentCount = await countKeys();
  if (currentCount >= 10) {
    return NextResponse.json(
      { error: 'Key limit reached', message: 'Maximum 10 API keys allowed' },
      { status: 400 }
    );
  }

  // Validate rate limit
  const validatedRateLimit = Math.min(Math.max(100, rateLimit), 10000);

  // Generate new key
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const newKey: APIKey = {
    id: generateId(),
    key: generateAPIKey(),
    name,
    permissions,
    rateLimit: validatedRateLimit,
    usageToday: 0,
    usageMonth: 0,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    active: true,
  };

  // Store the key in database
  await saveKey(newKey);

  return NextResponse.json(
    {
      key: newKey,
      premium: true,
    },
    {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    }
  );
}

/**
 * Combined handler
 */
async function handler(request: NextRequest): Promise<NextResponse> {
  if (request.method === 'GET') {
    return handleGet();
  } else if (request.method === 'POST') {
    return handlePost(request);
  }

  return NextResponse.json(
    { error: 'Method not allowed', message: 'Use GET or POST' },
    { status: 405 }
  );
}

/**
 * GET /api/premium/api-keys
 *
 * List all API keys (masked)
 *
 * @example
 * GET /api/premium/api-keys
 */
export const GET = withX402('/api/premium/api-keys', handler);

/**
 * POST /api/premium/api-keys
 *
 * Create a new API key
 *
 * Request body:
 * {
 *   "name": "My Trading Bot",
 *   "permissions": ["market:read", "market:premium", "ai:analyze"],
 *   "rateLimit": 5000
 * }
 *
 * @example
 * POST /api/premium/api-keys
 * Body: { "name": "Production Key", "permissions": [...] }
 */
export const POST = withX402('/api/premium/api-keys', handler);

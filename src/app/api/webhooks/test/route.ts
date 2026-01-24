/**
 * Webhook Test Endpoint
 * Test webhook delivery by sending a test payload
 *
 * POST /api/webhooks/test
 * - Requires authentication via API key
 * - Sends a test payload to the specified webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api-keys';
import { testWebhook, getWebhookById, verifySignature } from '@/lib/webhooks';

export const runtime = 'edge';

// ============================================================================
// Helper: Extract and validate API key
// ============================================================================

async function getAuthenticatedKey(request: NextRequest): Promise<{
  keyId: string;
  email: string;
  tier: string;
} | null> {
  const apiKey = request.headers.get('X-API-Key') || request.nextUrl.searchParams.get('api_key');

  if (!apiKey) return null;

  const keyData = await validateApiKey(apiKey);
  if (!keyData) return null;

  return {
    keyId: keyData.id,
    email: keyData.email,
    tier: keyData.tier,
  };
}

// ============================================================================
// POST: Send test webhook
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedKey(request);

    if (!auth) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Valid API key required. Include X-API-Key header.',
        },
        { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const body = await request.json();
    const { webhookId } = body;

    if (!webhookId) {
      return NextResponse.json(
        { error: 'Bad request', message: 'webhookId is required' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Verify the webhook exists and belongs to this key
    const webhook = await getWebhookById(webhookId);

    if (!webhook || webhook.userId !== auth.keyId) {
      return NextResponse.json(
        { error: 'Not found', message: 'Webhook not found or access denied' },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Send test webhook
    const result = await testWebhook(auth.keyId, webhookId);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed', message: 'Failed to send test webhook' },
        { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    return NextResponse.json(
      {
        success: result.success,
        message: result.success
          ? 'Test webhook delivered successfully'
          : 'Test webhook delivery failed',
        delivery: {
          id: result.id,
          url: result.url,
          event: result.event,
          statusCode: result.statusCode,
          duration: result.duration,
          success: result.success,
          error: result.error,
          deliveredAt: result.deliveredAt,
        },
        payload: result.payload,
      },
      {
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('[Webhooks Test API] POST error:', error);
    return NextResponse.json(
      { error: 'Internal error', message: 'Failed to send test webhook' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

// ============================================================================
// GET: Verify webhook signature (utility endpoint)
// ============================================================================

export async function GET(request: NextRequest) {
  // Return documentation for webhook verification
  return NextResponse.json(
    {
      endpoint: '/api/webhooks/test',
      description: 'Test and verify webhook functionality',
      methods: {
        POST: {
          description: 'Send a test webhook to verify connectivity',
          authentication: 'Required (X-API-Key header)',
          body: {
            webhookId: 'string (required) - The ID of the webhook to test',
          },
          response: {
            success: 'boolean - Whether the delivery was successful',
            delivery: {
              id: 'Delivery ID',
              url: 'Target URL',
              statusCode: 'HTTP status code from target',
              duration: 'Delivery time in ms',
              success: 'Whether target responded with 2xx',
            },
            payload: 'The test payload that was sent',
          },
        },
      },
      signatureVerification: {
        description: 'How to verify webhook signatures in your application',
        algorithm: 'HMAC-SHA256',
        header: 'X-Webhook-Signature',
        format: 'sha256=<hex-encoded-signature>',
        steps: [
          '1. Get the raw request body as a string',
          '2. Get your webhook secret (provided when you created the webhook)',
          '3. Compute HMAC-SHA256 of the body using the secret',
          '4. Compare with the signature in X-Webhook-Signature header',
          '5. Use constant-time comparison to prevent timing attacks',
        ],
        example: {
          nodejs: `
const crypto = require('crypto');

function verifyWebhookSignature(body, signature, secret) {
  const expectedSig = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSig)
  );
}`,
          python: `
import hmac
import hashlib

def verify_webhook_signature(body: bytes, signature: str, secret: str) -> bool:
    expected_sig = 'sha256=' + hmac.new(
        secret.encode(),
        body,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_sig)`,
        },
      },
      webhookHeaders: {
        'X-Webhook-Signature': 'HMAC-SHA256 signature of the payload',
        'X-Webhook-Event': 'The event type (e.g., "key.created")',
        'X-Webhook-Timestamp': 'ISO 8601 timestamp of when the event occurred',
        'X-Webhook-Id': 'Unique delivery ID for deduplication',
      },
      payloadFormat: {
        event: 'string - Event type',
        timestamp: 'string - ISO 8601 timestamp',
        data: 'object - Event-specific data',
        signature: 'string - Signature included in payload for convenience',
      },
    },
    {
      headers: { 'Access-Control-Allow-Origin': '*' },
    }
  );
}

// ============================================================================
// OPTIONS: CORS preflight
// ============================================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

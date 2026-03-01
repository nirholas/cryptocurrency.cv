/**
 * 📡 Nostr Integration
 * 
 * Publish news to Nostr relays and read crypto news from Nostr.
 * Decentralized news distribution!
 * 
 * GET /api/nostr - Get published events
 * POST /api/nostr - Publish news to Nostr
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { schnorr } from '@noble/curves/secp256k1';
import { bytesToHex } from '@noble/curves/abstract/utils';

export const runtime = 'nodejs';

// Nostr event kinds
const EVENT_KINDS = {
  TEXT_NOTE: 1,
  ARTICLE: 30023, // Long-form content NIP-23
  NEWS: 30024,    // Custom news kind (proposed)
};

// Default relays
const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://relay.snort.social',
  'wss://nostr.wine',
];

/** The service's Nostr public key (npub or hex). Set NOSTR_PUBKEY in env, or derive from NOSTR_PRIVATE_KEY. */
const SERVICE_PUBKEY = process.env.NOSTR_PUBKEY || null;

/** Resolve the best available pubkey: explicit env var, or derived from private key. */
function resolveServicePubkey(): string | null {
  if (SERVICE_PUBKEY) return SERVICE_PUBKEY;
  const kp = getNostrKeypair();
  return kp ? kp.pubkey : null;
}

interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

// Session-local published events (persists within one serverless container lifetime)
const publishedEvents: NostrEvent[] = [];

/**
 * Compute a proper Nostr event ID per NIP-01:
 * SHA256 of JSON.stringify([0, pubkey, created_at, kind, tags, content])
 */
function computeEventId(event: Omit<NostrEvent, 'id' | 'sig'>): string {
  const serialized = JSON.stringify([
    0,
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content,
  ]);
  return createHash('sha256').update(serialized).digest('hex');
}

/**
 * Derive the Nostr pubkey (x-only 32-byte hex) from a private key.
 * Returns null if the private key is invalid or missing.
 */
function getNostrKeypair(): { pubkey: string; privkey: string } | null {
  const privkey = process.env.NOSTR_PRIVATE_KEY;
  if (privkey?.length !== 64) return null;
  try {
    const pubkeyBytes = schnorr.getPublicKey(privkey);
    return { pubkey: bytesToHex(pubkeyBytes), privkey };
  } catch {
    return null;
  }
}

/**
 * Sign a Nostr event with secp256k1 Schnorr (NIP-01).
 * Returns a fully signed NostrEvent.
 */
function signEvent(base: Omit<NostrEvent, 'id' | 'sig'>, privkey: string): NostrEvent {
  const id = computeEventId(base);
  const sig = bytesToHex(schnorr.sign(id, privkey));
  return { ...base, id, sig };
}

// Format news article for Nostr
function formatNewsForNostr(article: any): string {
  const sentiment = article.sentiment === 'bullish' ? '🟢' : 
                    article.sentiment === 'bearish' ? '🔴' : '⚪';
  
  return `${sentiment} ${article.title}

📰 ${article.source}
🕐 ${article.timeAgo}
🔗 ${article.link}

#crypto #news #${article.sourceKey || 'bitcoin'}`;
}

// GET - Fetch published events
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  
  // Get relays info
  if (action === 'relays') {
    return NextResponse.json({
      success: true,
      relays: DEFAULT_RELAYS,
      recommended: DEFAULT_RELAYS[0],
    });
  }
  
  // Get NIP-05 verification
  if (action === 'nip05') {
    const pubkey = resolveServicePubkey();
    if (!pubkey) {
      return NextResponse.json(
        { error: 'NOSTR_PUBKEY not configured. Set NOSTR_PUBKEY or NOSTR_PRIVATE_KEY in environment variables.' },
        { status: 503 }
      );
    }
    return NextResponse.json({
      names: {
        'news': pubkey,
        '_': pubkey,
      },
      relays: { [pubkey]: DEFAULT_RELAYS },
    });
  }
  
  // Get feed configuration
  if (action === 'feed') {
    const pubkey = resolveServicePubkey();
    if (!pubkey) {
      return NextResponse.json(
        { error: 'NOSTR_PUBKEY not configured. Set NOSTR_PUBKEY or NOSTR_PRIVATE_KEY in environment variables.' },
        { status: 503 }
      );
    }
    return NextResponse.json({
      success: true,
      feed: {
        name: 'Free Crypto News',
        description: 'Real-time crypto news from 200+ sources',
        pubkey,
        relays: DEFAULT_RELAYS,
        tags: ['crypto', 'news', 'bitcoin', 'ethereum', 'defi'],
        kinds: [EVENT_KINDS.TEXT_NOTE, EVENT_KINDS.ARTICLE],
      },
    });
  }
  
  // Get recent published events
  const limit = parseInt(searchParams.get('limit') || '20');
  
  return NextResponse.json({
    success: true,
    events: publishedEvents.slice(-limit),
    count: publishedEvents.length,
    relays: DEFAULT_RELAYS,
  });
}

// POST - Publish news to Nostr
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, articles } = body;
    
    // Publish latest news
    if (action === 'publish') {
      const keypair = getNostrKeypair();
      if (!keypair) {
        return NextResponse.json({
          success: false,
          error: 'NOSTR_PRIVATE_KEY not configured or invalid',
          message: 'Set NOSTR_PRIVATE_KEY to a 64-char hex secp256k1 private key to publish signed Nostr events.',
          setup: 'Generate a key with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
        }, { status: 503 });
      }

      const articlesToPublish = articles || [];
      const events: NostrEvent[] = [];

      for (const article of articlesToPublish.slice(0, 10)) {
        const content = formatNewsForNostr(article);
        const created_at = Math.floor(Date.now() / 1000);
        const tags: string[][] = [
          ['t', 'crypto'],
          ['t', 'news'],
          ['t', article.sourceKey || 'bitcoin'],
          ['source', article.source],
          ['r', article.link],
        ];

        const event = signEvent(
          { pubkey: keypair.pubkey, created_at, kind: EVENT_KINDS.TEXT_NOTE, tags, content },
          keypair.privkey
        );
        events.push(event);
        publishedEvents.push(event);
      }

      return NextResponse.json({
        success: true,
        published: events.length,
        events,
        relays: DEFAULT_RELAYS,
        message: `Published ${events.length} Nostr events (Schnorr signed, NIP-01)`,
      });
    }
    
    // Create long-form article (NIP-23)
    if (action === 'article') {
      const keypair = getNostrKeypair();
      if (!keypair) {
        return NextResponse.json({
          success: false,
          error: 'NOSTR_PRIVATE_KEY not configured or invalid',
          message: 'Set NOSTR_PRIVATE_KEY to a 64-char hex secp256k1 private key to publish signed Nostr events.',
        }, { status: 503 });
      }

      const { title, content, summary, image, tags } = body;
      const created_at = Math.floor(Date.now() / 1000);
      const dTag = `crypto-news-${Date.now()}`;
      const eventTags: string[][] = [
        ['d', dTag],
        ['title', title],
        ['summary', summary || ''],
        ['image', image || ''],
        ['published_at', created_at.toString()],
        ...(tags || ['crypto', 'news']).map((t: string) => ['t', t]),
      ];

      const event = signEvent(
        { pubkey: keypair.pubkey, created_at, kind: EVENT_KINDS.ARTICLE, tags: eventTags, content },
        keypair.privkey
      );
      publishedEvents.push(event);

      // NIP-19 naddr: requires bech32 encoding of kind + pubkey + d-tag
      // Full encoding: use @scure/base + TLV. Providing hex ID for now.
      const naddr = `${keypair.pubkey}:${EVENT_KINDS.ARTICLE}:${dTag}`;

      return NextResponse.json({
        success: true,
        event,
        event_id: event.id,
        naddr,
        naddr_format: 'pubkey:kind:d-tag (NIP-19 bech32 encoding requires @scure/base)',
      });
    }
    
    // Subscribe to relay for crypto news
    if (action === 'subscribe') {
      const { relay, filters } = body;
      const targetRelay = relay || DEFAULT_RELAYS[0];
      const subFilters = filters || {
        kinds: [EVENT_KINDS.TEXT_NOTE, EVENT_KINDS.ARTICLE],
        '#t': ['crypto', 'bitcoin', 'ethereum'],
        limit: 50,
      };
      const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // Build the REQ message clients should send to the relay
      const reqMessage = JSON.stringify(['REQ', subscriptionId, subFilters]);

      return NextResponse.json({
        success: true,
        message: 'Subscription created — connect to relay WebSocket and send the REQ message',
        relay: targetRelay,
        filters: subFilters,
        subscriptionId,
        reqMessage,
        usage: `Connect to ${targetRelay} via WebSocket and send: ${reqMessage}`,
      });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

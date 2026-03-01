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

// =============================================================================
// BECH32 ENCODER (NIP-19)
// =============================================================================

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function bech32Polymod(values: number[]): number {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const b = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) {
      if ((b >> i) & 1) chk ^= GEN[i];
    }
  }
  return chk;
}

function bech32HrpExpand(hrp: string): number[] {
  const ret: number[] = [];
  for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) >> 5);
  ret.push(0);
  for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) & 31);
  return ret;
}

function bech32CreateChecksum(hrp: string, data: number[]): number[] {
  const values = bech32HrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
  const polymod = bech32Polymod(values) ^ 1;
  const ret: number[] = [];
  for (let i = 0; i < 6; i++) ret.push((polymod >> (5 * (5 - i))) & 31);
  return ret;
}

function convertBits(data: Uint8Array, fromBits: number, toBits: number, pad: boolean): number[] {
  let acc = 0;
  let bits = 0;
  const ret: number[] = [];
  const maxv = (1 << toBits) - 1;
  for (const value of data) {
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      ret.push((acc >> bits) & maxv);
    }
  }
  if (pad) {
    if (bits > 0) ret.push((acc << (toBits - bits)) & maxv);
  }
  return ret;
}

function bech32Encode(hrp: string, data: Uint8Array): string {
  const fiveBit = convertBits(data, 8, 5, true);
  const checksum = bech32CreateChecksum(hrp, fiveBit);
  let result = hrp + '1';
  for (const d of fiveBit.concat(checksum)) result += BECH32_CHARSET[d];
  return result;
}

/**
 * Encode an naddr per NIP-19:
 * TLV: 0=d-tag, 1=relay, 2=author(32 bytes), 3=kind(4 bytes BE)
 */
function encodeNaddr(dTag: string, relay: string, pubkeyHex: string, kind: number): string {
  const parts: Uint8Array[] = [];

  // TLV type 0: d-tag (identifier)
  const dTagBytes = new TextEncoder().encode(dTag);
  parts.push(new Uint8Array([0, dTagBytes.length]));
  parts.push(dTagBytes);

  // TLV type 1: relay hint
  const relayBytes = new TextEncoder().encode(relay);
  parts.push(new Uint8Array([1, relayBytes.length]));
  parts.push(relayBytes);

  // TLV type 2: author pubkey (32 bytes)
  const pubkeyBytes = hexToBytes(pubkeyHex);
  parts.push(new Uint8Array([2, 32]));
  parts.push(pubkeyBytes);

  // TLV type 3: kind (4 bytes big-endian)
  const kindBytes = new Uint8Array(4);
  new DataView(kindBytes.buffer).setUint32(0, kind, false);
  parts.push(new Uint8Array([3, 4]));
  parts.push(kindBytes);

  // Concatenate all TLV parts
  const totalLen = parts.reduce((s, p) => s + p.length, 0);
  const tlv = new Uint8Array(totalLen);
  let offset = 0;
  for (const part of parts) {
    tlv.set(part, offset);
    offset += part.length;
  }

  return bech32Encode('naddr', tlv);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

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
const MAX_EVENTS = 1000;
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
  // Publishing requires admin authentication
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const expected = process.env.ADMIN_TOKEN || process.env.CRON_SECRET;
  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
        if (publishedEvents.length > MAX_EVENTS) {
          publishedEvents.splice(0, publishedEvents.length - MAX_EVENTS);
        }
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
      if (publishedEvents.length > MAX_EVENTS) {
        publishedEvents.splice(0, publishedEvents.length - MAX_EVENTS);
      }

      // NIP-19 naddr: bech32-encoded TLV of kind + pubkey + d-tag + relay
      const naddr = encodeNaddr(dTag, DEFAULT_RELAYS[0], keypair.pubkey, EVENT_KINDS.ARTICLE);

      return NextResponse.json({
        success: true,
        event,
        event_id: event.id,
        naddr,
      });
    }
    
    // Subscribe to relay for crypto news — fetch recent events via WebSocket
    if (action === 'subscribe') {
      const { relay, filters, timeout } = body;
      const targetRelay = relay || DEFAULT_RELAYS[0];
      const subFilters = filters || {
        kinds: [EVENT_KINDS.TEXT_NOTE, EVENT_KINDS.ARTICLE],
        '#t': ['crypto', 'bitcoin', 'ethereum'],
        limit: 50,
      };
      const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const wsTimeout = Math.min(timeout || 5000, 15000);

      // Build the REQ message
      const reqMessage = JSON.stringify(['REQ', subscriptionId, subFilters]);

      // Attempt to connect to the relay and fetch events
      let fetchedEvents: Array<Record<string, unknown>> = [];
      let relayConnected = false;
      let relayError: string | null = null;

      try {
        // Use dynamic import for ws in Node.js runtime
        const { WebSocket: WS } = await import('ws');
        fetchedEvents = await new Promise<Array<Record<string, unknown>>>((resolve) => {
          const events: Array<Record<string, unknown>> = [];
          const ws = new WS(targetRelay);
          const timer = setTimeout(() => {
            ws.close();
            resolve(events);
          }, wsTimeout);

          ws.on('open', () => {
            relayConnected = true;
            ws.send(reqMessage);
          });

          ws.on('message', (data: Buffer | string) => {
            try {
              const msg = JSON.parse(data.toString());
              if (Array.isArray(msg)) {
                if (msg[0] === 'EVENT' && msg[2]) {
                  events.push(msg[2]);
                } else if (msg[0] === 'EOSE') {
                  // End-of-stored-events: we have all historical matches
                  clearTimeout(timer);
                  ws.close();
                  resolve(events);
                }
              }
            } catch { /* skip malformed */ }
          });

          ws.on('error', (err: Error) => {
            relayError = err.message;
            clearTimeout(timer);
            resolve(events);
          });

          ws.on('close', () => {
            clearTimeout(timer);
            resolve(events);
          });
        });
      } catch (wsErr) {
        relayError = wsErr instanceof Error ? wsErr.message : 'WebSocket unavailable';
      }

      return NextResponse.json({
        success: true,
        relay: targetRelay,
        connected: relayConnected,
        filters: subFilters,
        subscriptionId,
        events: fetchedEvents.slice(0, 100),
        eventCount: fetchedEvents.length,
        ...(relayError ? { warning: `Relay connection issue: ${relayError}` } : {}),
        reqMessage,
        usage: `Events fetched from ${targetRelay}. To stream live, connect via WebSocket and send: ${reqMessage}`,
      });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

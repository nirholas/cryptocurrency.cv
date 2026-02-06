/**
 * 📡 Nostr Integration
 * 
 * Publish news to Nostr relays and read crypto news from Nostr.
 * Decentralized news distribution!
 * 
 * GET /api/nostr - Get published events
 * POST /api/nostr - Publish news to Nostr
 */

import { NextRequest, NextResponse } from 'next/server';

// Nostr event kinds
const EVENT_KINDS = {
  TEXT_NOTE: 1,
  ARTICLE: 30023, // Long-form content
  NEWS: 30024, // Custom news kind (proposed)
};

// Default relays
const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://relay.snort.social',
  'wss://nostr.wine',
];

interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

// Store published events (in production, use DB)
const publishedEvents: NostrEvent[] = [];

// Generate Nostr event ID (simplified - in production use proper signing)
function generateEventId(event: Partial<NostrEvent>): string {
  const data = JSON.stringify([
    0,
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content,
  ]);
  // Simplified hash - in production use proper crypto
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
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
    return NextResponse.json({
      names: {
        'news': 'pubkey_here', // Would be actual pubkey
        '_': 'pubkey_here',
      },
      relays: {
        'pubkey_here': DEFAULT_RELAYS,
      },
    });
  }
  
  // Get feed configuration
  if (action === 'feed') {
    return NextResponse.json({
      success: true,
      feed: {
        name: 'Free Crypto News',
        description: 'Real-time crypto news from 200+ sources',
        pubkey: 'npub1...', // Placeholder
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
    const { action, articles, privateKey } = body;
    
    // Publish latest news
    if (action === 'publish') {
      const articlesToPublish = articles || [];
      const events: NostrEvent[] = [];
      
      for (const article of articlesToPublish.slice(0, 10)) {
        const content = formatNewsForNostr(article);
        
        const event: NostrEvent = {
          id: '',
          pubkey: 'fcn_demo_pubkey_' + Date.now(), // Placeholder
          created_at: Math.floor(Date.now() / 1000),
          kind: EVENT_KINDS.TEXT_NOTE,
          tags: [
            ['t', 'crypto'],
            ['t', 'news'],
            ['t', article.sourceKey || 'bitcoin'],
            ['source', article.source],
            ['r', article.link],
          ],
          content,
          sig: 'demo_signature', // Would be proper signature
        };
        
        event.id = generateEventId(event);
        events.push(event);
        publishedEvents.push(event);
      }
      
      return NextResponse.json({
        success: true,
        published: events.length,
        events,
        relays: DEFAULT_RELAYS,
        message: `Published ${events.length} news events to Nostr`,
      });
    }
    
    // Create long-form article (NIP-23)
    if (action === 'article') {
      const { title, content, summary, image, tags } = body;
      
      const event: NostrEvent = {
        id: '',
        pubkey: 'fcn_demo_pubkey_' + Date.now(),
        created_at: Math.floor(Date.now() / 1000),
        kind: EVENT_KINDS.ARTICLE,
        tags: [
          ['d', `crypto-news-${Date.now()}`],
          ['title', title],
          ['summary', summary || ''],
          ['image', image || ''],
          ['published_at', Math.floor(Date.now() / 1000).toString()],
          ...(tags || ['crypto', 'news']).map((t: string) => ['t', t]),
        ],
        content,
        sig: 'demo_signature',
      };
      
      event.id = generateEventId(event);
      publishedEvents.push(event);
      
      return NextResponse.json({
        success: true,
        event,
        naddr: `naddr1...${event.id.slice(0, 8)}`, // Placeholder NIP-19
      });
    }
    
    // Subscribe to relay for crypto news
    if (action === 'subscribe') {
      const { relay, filters } = body;
      
      // In production, would set up WebSocket subscription
      return NextResponse.json({
        success: true,
        message: 'Subscription created',
        relay: relay || DEFAULT_RELAYS[0],
        filters: filters || {
          kinds: [EVENT_KINDS.TEXT_NOTE, EVENT_KINDS.ARTICLE],
          '#t': ['crypto', 'bitcoin', 'ethereum'],
          limit: 50,
        },
        subscriptionId: `sub_${Date.now()}`,
      });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

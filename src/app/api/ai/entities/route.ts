import { NextRequest, NextResponse } from 'next/server';
import { aiComplete, getAIConfigOrNull } from '@/lib/ai-provider';

export const runtime = 'edge';

interface Entity {
  type: 'person' | 'organization' | 'cryptocurrency' | 'exchange' | 'protocol' | 'location' | 'event' | 'amount';
  value: string;
  confidence: number;
  context?: string;
}

interface ExtractRequest {
  text: string;
  types?: Entity['type'][];
}

// Common crypto entities for pattern matching fallback
const CRYPTO_PATTERNS = {
  cryptocurrency: [
    /\b(Bitcoin|BTC|Ethereum|ETH|Solana|SOL|Cardano|ADA|Ripple|XRP|Dogecoin|DOGE|Polkadot|DOT|Chainlink|LINK|Avalanche|AVAX|Polygon|MATIC)\b/gi,
  ],
  exchange: [
    /\b(Binance|Coinbase|Kraken|FTX|Bitfinex|Huobi|OKX|Bybit|KuCoin|Gemini|Bitstamp|Gate\.io|Crypto\.com)\b/gi,
  ],
  protocol: [
    /\b(Uniswap|Aave|Compound|MakerDAO|Curve|Lido|Rocket Pool|Synthetix|SushiSwap|PancakeSwap|dYdX|GMX)\b/gi,
  ],
  organization: [
    /\b(SEC|CFTC|Federal Reserve|Treasury|DOJ|FBI|European Central Bank|IMF|World Bank|Grayscale|BlackRock|Fidelity|MicroStrategy|Tesla|Block|Square|PayPal|Visa|Mastercard)\b/gi,
  ],
  amount: [
    /\$[\d,.]+\s*(million|billion|trillion|M|B|T)?/gi,
    /[\d,.]+\s*(BTC|ETH|SOL|USDT|USDC)/gi,
  ],
};

export async function POST(request: NextRequest) {
  try {
    const body: ExtractRequest = await request.json();
    const { text, types } = body;

    if (!text?.trim()) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Try AI extraction first, fallback to pattern matching
    let entities: Entity[] = [];
    
    if (getAIConfigOrNull(true)) {
      entities = await extractWithAI(text, types);
    }
    
    // If AI returned few results or no API key, supplement with pattern matching
    if (entities.length < 3) {
      const patternEntities = extractWithPatterns(text, types);
      // Merge, avoiding duplicates
      const existingValues = new Set(entities.map(e => e.value.toLowerCase()));
      for (const entity of patternEntities) {
        if (!existingValues.has(entity.value.toLowerCase())) {
          entities.push(entity);
          existingValues.add(entity.value.toLowerCase());
        }
      }
    }

    // Sort by confidence
    entities.sort((a, b) => b.confidence - a.confidence);

    return NextResponse.json({
      entities,
      count: entities.length,
      types: [...new Set(entities.map(e => e.type))],
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to extract entities' },
      { status: 500 }
    );
  }
}

async function extractWithAI(text: string, types?: Entity['type'][]): Promise<Entity[]> {
  const typeFilter = types?.length 
    ? `Focus on these entity types: ${types.join(', ')}.` 
    : '';

  const systemPrompt = `You are an entity extraction system specialized in cryptocurrency and financial news. Extract entities from the text and return them as a JSON array.

Entity types:
- person: Names of people (CEOs, founders, regulators, etc.)
- organization: Companies, regulatory bodies, institutions
- cryptocurrency: Crypto tokens and coins
- exchange: Crypto exchanges
- protocol: DeFi protocols and platforms
- location: Countries, cities, jurisdictions
- event: Named events (conferences, launches, halvings)
- amount: Monetary amounts or crypto quantities

${typeFilter}

Return ONLY a JSON array with objects containing:
- type: the entity type
- value: the extracted entity name
- confidence: 0.0-1.0 confidence score
- context: brief context from the text (optional)

Example: [{"type":"person","value":"Gary Gensler","confidence":0.95,"context":"SEC Chair"}]`;

  try {
    const content = await aiComplete(systemPrompt, text.slice(0, 4000), {
      maxTokens: 1000,
      temperature: 0.1,
    }, true /* preferGroq */);
    
    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.filter((e: Entity) => 
        e.type && e.value && typeof e.confidence === 'number'
      );
    }
    
    return [];
  } catch {
    return [];
  }
}

function extractWithPatterns(text: string, types?: Entity['type'][]): Entity[] {
  const entities: Entity[] = [];
  const typesToCheck = types || Object.keys(CRYPTO_PATTERNS) as Entity['type'][];

  for (const type of typesToCheck) {
    const patterns = CRYPTO_PATTERNS[type as keyof typeof CRYPTO_PATTERNS];
    if (!patterns) continue;

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const value = match[0];
        // Get surrounding context
        const startIdx = Math.max(0, (match.index || 0) - 30);
        const endIdx = Math.min(text.length, (match.index || 0) + value.length + 30);
        const context = text.slice(startIdx, endIdx).replace(/\s+/g, ' ').trim();

        entities.push({
          type: type as Entity['type'],
          value,
          confidence: 0.8,
          context: context !== value ? context : undefined,
        });
      }
    }
  }

  return entities;
}

// GET endpoint for simple usage
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  const types = searchParams.get('types')?.split(',') as Entity['type'][] | undefined;

  if (!text) {
    return NextResponse.json(
      { 
        error: 'Missing required parameter',
        usage: {
          endpoint: '/api/ai/entities',
          methods: ['GET', 'POST'],
          params: {
            text: 'Text to extract entities from (required)',
            types: 'Comma-separated entity types to extract (optional)',
          },
          entityTypes: ['person', 'organization', 'cryptocurrency', 'exchange', 'protocol', 'location', 'event', 'amount'],
          example: '/api/ai/entities?text=Bitcoin hit $100k after SEC approved ETF&types=cryptocurrency,amount',
        }
      },
      { status: 400 }
    );
  }

  const mockRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ text, types }),
  });

  return POST(mockRequest);
}

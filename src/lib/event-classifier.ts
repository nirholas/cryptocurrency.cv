/**
 * Event Classification Module
 * Automatically classifies crypto news events by type
 */

import { aiCache, withCache } from './cache';

// Event types for classification
export type EventType =
  | 'funding_round'      // Series A, seed, etc.
  | 'hack_exploit'       // Security breaches
  | 'regulation'         // Government/legal actions
  | 'product_launch'     // New products/features
  | 'partnership'        // Business partnerships
  | 'listing'            // Exchange listings
  | 'airdrop'            // Token airdrops
  | 'network_upgrade'    // Hard forks, upgrades
  | 'legal_action'       // Lawsuits, enforcement
  | 'market_movement'    // Price analysis
  | 'executive_change'   // Hiring/firing
  | 'acquisition'        // M&A activity
  | 'general';           // Default

export interface EventClassification {
  eventType: EventType;
  confidence: number;           // 0-1
  subType?: string;             // e.g., "Series B" for funding
  entities: {
    primary: string;            // Main entity involved
    secondary: string[];        // Other entities
  };
  magnitude?: {
    value: number;
    unit: string;               // "USD", "BTC", etc.
  };
  urgency: 'breaking' | 'important' | 'routine';
  marketRelevance: 'high' | 'medium' | 'low';
}

// AI provider configuration
interface AIConfig {
  provider: 'openai' | 'anthropic' | 'groq' | 'openrouter';
  model: string;
  apiKey: string;
  baseUrl?: string;
}

function getAIConfig(): AIConfig | null {
  if (process.env.GROQ_API_KEY) {
    return {
      provider: 'groq',
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      apiKey: process.env.GROQ_API_KEY,
      baseUrl: 'https://api.groq.com/openai/v1',
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      provider: 'openai',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY,
    };
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return {
      provider: 'anthropic',
      model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
      apiKey: process.env.ANTHROPIC_API_KEY,
    };
  }

  if (process.env.OPENROUTER_API_KEY) {
    return {
      provider: 'openrouter',
      model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3-8b-instruct',
      apiKey: process.env.OPENROUTER_API_KEY,
      baseUrl: 'https://openrouter.ai/api/v1',
    };
  }

  return null;
}

/**
 * Check if AI classification is configured
 */
export function isClassifierConfigured(): boolean {
  return getAIConfig() !== null;
}

// Generic AI completion request
async function aiComplete(
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const config = getAIConfig();
  if (!config) {
    throw new Error('No AI provider configured. Set GROQ_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, or OPENROUTER_API_KEY');
  }

  const { maxTokens = 1000, temperature = 0.2 } = options || {};

  if (config.provider === 'anthropic') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  // OpenAI-compatible API (OpenAI, Groq, OpenRouter)
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      ...(config.provider === 'openrouter' && {
        'HTTP-Referer': process.env.VERCEL_URL || 'https://cryptocurrency.cv',
        'X-Title': 'Crypto News Event Classifier',
      }),
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

const EVENT_CLASSIFICATION_PROMPT = `You are a crypto news event classifier. Analyze the news article and classify it into one of these event types:

EVENT TYPES:
- funding_round: Fundraising (Series A, seed, etc.)
- hack_exploit: Security breaches, hacks, exploits
- regulation: Government/legal actions, regulatory news
- product_launch: New products, features, platform launches
- partnership: Business partnerships, collaborations
- listing: Exchange listings, delistings
- airdrop: Token airdrops, distributions
- network_upgrade: Hard forks, protocol upgrades, migrations
- legal_action: Lawsuits, enforcement actions
- market_movement: Price analysis, market trends
- executive_change: Hiring, firing, leadership changes
- acquisition: Mergers & acquisitions
- general: News that doesn't fit other categories

RESPONSE FORMAT (JSON):
{
  "eventType": "<one of the event types above>",
  "confidence": <0.0 to 1.0>,
  "subType": "<optional: specific subtype like 'Series B', 'flash loan attack', etc.>",
  "entities": {
    "primary": "<main company/project/person involved>",
    "secondary": ["<other entities mentioned>"]
  },
  "magnitude": {
    "value": <number if applicable>,
    "unit": "<USD, BTC, ETH, etc.>"
  },
  "urgency": "<breaking | important | routine>",
  "marketRelevance": "<high | medium | low>"
}

CLASSIFICATION GUIDELINES:
- Breaking: Major hacks, significant regulatory actions, major acquisitions
- Important: Funding rounds >$10M, significant partnerships, exchange listings
- Routine: Minor updates, general market commentary
- High market relevance: Events affecting top 100 coins, major exchanges, or >$100M
- Medium market relevance: Mid-tier projects, moderate impact
- Low market relevance: Small projects, minimal market impact

Be accurate with entity extraction. If magnitude is mentioned (dollar amounts, percentages), extract it.`;

/**
 * Classify a crypto news event
 */
export async function classifyEvent(
  title: string,
  content: string
): Promise<EventClassification> {
  // Generate cache key from title
  const cacheKey = `event:classify:${Buffer.from(title).toString('base64').slice(0, 40)}`;

  return withCache(aiCache, cacheKey, 86400, async () => {
    const userPrompt = `Classify this crypto news article:

Title: ${title}

Content: ${content.slice(0, 4000)}

Respond with JSON only.`;

    const response = await aiComplete(EVENT_CLASSIFICATION_PROMPT, userPrompt);

    try {
      const parsed = JSON.parse(response);

      // Validate and normalize the response
      const classification: EventClassification = {
        eventType: validateEventType(parsed.eventType),
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
        entities: {
          primary: parsed.entities?.primary || 'Unknown',
          secondary: Array.isArray(parsed.entities?.secondary)
            ? parsed.entities.secondary
            : [],
        },
        urgency: validateUrgency(parsed.urgency),
        marketRelevance: validateMarketRelevance(parsed.marketRelevance),
      };

      // Add optional fields if present
      if (parsed.subType) {
        classification.subType = parsed.subType;
      }

      if (parsed.magnitude?.value && parsed.magnitude?.unit) {
        classification.magnitude = {
          value: Number(parsed.magnitude.value),
          unit: String(parsed.magnitude.unit),
        };
      }

      return classification;
    } catch {
      // Fallback classification if parsing fails
      return {
        eventType: 'general',
        confidence: 0.3,
        entities: {
          primary: extractPrimaryEntity(title),
          secondary: [],
        },
        urgency: 'routine',
        marketRelevance: 'low',
      };
    }
  });
}

// Validation helpers
const VALID_EVENT_TYPES: EventType[] = [
  'funding_round', 'hack_exploit', 'regulation', 'product_launch',
  'partnership', 'listing', 'airdrop', 'network_upgrade', 'legal_action',
  'market_movement', 'executive_change', 'acquisition', 'general',
];

function validateEventType(type: string): EventType {
  if (VALID_EVENT_TYPES.includes(type as EventType)) {
    return type as EventType;
  }
  return 'general';
}

function validateUrgency(urgency: string): 'breaking' | 'important' | 'routine' {
  if (['breaking', 'important', 'routine'].includes(urgency)) {
    return urgency as 'breaking' | 'important' | 'routine';
  }
  return 'routine';
}

function validateMarketRelevance(relevance: string): 'high' | 'medium' | 'low' {
  if (['high', 'medium', 'low'].includes(relevance)) {
    return relevance as 'high' | 'medium' | 'low';
  }
  return 'low';
}

/**
 * Extract primary entity from title using simple heuristics
 */
function extractPrimaryEntity(title: string): string {
  // Common crypto project/company patterns
  const patterns = [
    /^(\w+(?:\s+\w+)?)\s+(?:raises|announces|launches|partners|lists|reports)/i,
    /^(\w+(?:\s+\w+)?)\s+(?:hack|exploit|breach|vulnerability)/i,
    /SEC\s+(?:sues|charges|investigates)\s+(\w+(?:\s+\w+)?)/i,
    /(\w+)\s+(?:ETF|token|coin|network)/i,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  // Return first capitalized word as fallback
  const words = title.split(/\s+/);
  for (const word of words) {
    if (/^[A-Z][a-z]+/.test(word) && word.length > 2) {
      return word;
    }
  }

  return 'Unknown';
}

/**
 * Batch classify multiple events
 */
export async function classifyEvents(
  articles: Array<{ title: string; content: string }>
): Promise<EventClassification[]> {
  const results = await Promise.all(
    articles.map(article => classifyEvent(article.title, article.content))
  );
  return results;
}

/**
 * Quick classification using heuristics (no AI)
 * Useful for initial filtering or when AI is not available
 */
export function quickClassify(title: string, content?: string): EventType {
  const text = `${title} ${content || ''}`.toLowerCase();

  // Funding patterns
  if (/(?:raises?|raised|funding|series [a-d]|seed round|venture|investment)/i.test(text)) {
    return 'funding_round';
  }

  // Hack/exploit patterns
  if (/(?:hack|exploit|breach|vulnerability|stolen|attack|drained)/i.test(text)) {
    return 'hack_exploit';
  }

  // Legal action patterns (check before regulation to catch "SEC sues")
  if (/(?:lawsuit|sues?|sued|legal action|enforcement|charged|indicted|settlement)/i.test(text)) {
    return 'legal_action';
  }

  // Regulation patterns
  if (/(?:sec |cftc|regulation|regulatory|compliance|license|ban(?:ned|s)?|congress|senate|legislation)/i.test(text)) {
    return 'regulation';
  }

  // Product launch patterns
  if (/(?:launch(?:es|ed)?|release(?:s|d)?|unveil|introduce|new (?:product|feature|platform))/i.test(text)) {
    return 'product_launch';
  }

  // Partnership patterns
  if (/(?:partner(?:ship|s)?|collaborat|alliance|team(?:s)? up|join(?:s|ed)? forces)/i.test(text)) {
    return 'partnership';
  }

  // Listing patterns
  if (/(?:list(?:ing|ed|s)?|delist|(?:coinbase|binance|kraken) (?:adds|lists))/i.test(text)) {
    return 'listing';
  }

  // Airdrop patterns
  if (/(?:airdrop|token distribution|free tokens|claim(?:ing)? tokens)/i.test(text)) {
    return 'airdrop';
  }

  // Network upgrade patterns
  if (/(?:hard fork|upgrade|migration|protocol update|mainnet|testnet)/i.test(text)) {
    return 'network_upgrade';
  }

  // Market movement patterns
  if (/(?:price|surge|crash|rally|dump|ath|all-time|bull|bear|market)/i.test(text)) {
    return 'market_movement';
  }

  // Executive change patterns
  if (/(?:ceo|cto|cfo|chief|hire(?:s|d)?|fired|resign|appoint|executive|leadership)/i.test(text)) {
    return 'executive_change';
  }

  // Acquisition patterns
  if (/(?:acqui(?:res?|sition)|merger|buyout|takeover|purchase(?:s|d)?)/i.test(text)) {
    return 'acquisition';
  }

  return 'general';
}

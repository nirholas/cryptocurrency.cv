/**
 * Claim Extraction Module
 * Extracts verifiable claims with attribution from news articles
 */

import { aiCache, withCache } from './cache';

// Claim types
export type ClaimType = 'fact' | 'opinion' | 'prediction' | 'announcement';
export type Verifiability = 'verifiable' | 'subjective' | 'future';

export interface ExtractedClaim {
  claim: string;                // The actual claim
  attribution: {
    source: string;             // Who said it
    role?: string;              // Their title/role
    organization?: string;      // Their org
  };
  type: ClaimType;
  verifiability: Verifiability;
  relatedEntities: string[];
  timestamp?: string;           // When claim was made
}

export interface ClaimExtractionResult {
  claims: ExtractedClaim[];
  primaryNarrative: string;     // Main story being told
  conflictingClaims: boolean;   // Any contradictions?
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
 * Check if claim extraction is configured
 */
export function isExtractorConfigured(): boolean {
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

  const { maxTokens = 2000, temperature = 0.2 } = options || {};

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
        'X-Title': 'Crypto News Claim Extractor',
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

const CLAIM_EXTRACTION_PROMPT = `You are a claim extraction specialist for crypto news. Extract all verifiable claims and statements with proper attribution.

CLAIM TYPES:
- fact: Statements presented as factual (e.g., "raised $50M", "acquired by", "launched on")
- opinion: Subjective views or assessments (e.g., "believes", "thinks", "expects")
- prediction: Forward-looking statements (e.g., "will reach", "expected to", "forecast")
- announcement: Official declarations (e.g., "announced", "revealed", "confirmed")

VERIFIABILITY:
- verifiable: Can be fact-checked with data/sources (amounts, dates, events)
- subjective: Opinion-based, cannot be objectively verified
- future: Will only be verifiable in the future

RESPONSE FORMAT (JSON):
{
  "claims": [
    {
      "claim": "<the actual claim text>",
      "attribution": {
        "source": "<who made the claim - person, company, or 'article author'>",
        "role": "<title/position if mentioned>",
        "organization": "<company/org if applicable>"
      },
      "type": "<fact | opinion | prediction | announcement>",
      "verifiability": "<verifiable | subjective | future>",
      "relatedEntities": ["<entities mentioned in claim>"],
      "timestamp": "<when claim was made if specified>"
    }
  ],
  "primaryNarrative": "<1-2 sentence summary of the main story>",
  "conflictingClaims": <true if any claims contradict each other, false otherwise>
}

EXTRACTION GUIDELINES:
1. Extract SPECIFIC claims, not vague statements
2. Include numeric data when mentioned (amounts, percentages, dates)
3. Attribute claims accurately - who said what
4. Identify when the author is making claims vs quoting sources
5. Note if multiple sources make conflicting claims
6. Keep claims concise but complete

EXAMPLES OF GOOD CLAIMS:
- "Coinbase raised $300 million in Series E funding" (fact, verifiable)
- "CEO believes Bitcoin will reach $200K by 2025" (prediction, future)
- "The partnership will accelerate DeFi adoption" (opinion, subjective)
- "Exchange confirmed the listing for March 15" (announcement, verifiable)`;

/**
 * Extract claims from a crypto news article
 */
export async function extractClaims(
  title: string,
  content: string
): Promise<ClaimExtractionResult> {
  // Generate cache key from title
  const cacheKey = `claims:extract:${Buffer.from(title).toString('base64').slice(0, 40)}`;

  return withCache(aiCache, cacheKey, 86400, async () => {
    const userPrompt = `Extract all claims from this crypto news article:

Title: ${title}

Content: ${content.slice(0, 5000)}

Respond with JSON only.`;

    const response = await aiComplete(CLAIM_EXTRACTION_PROMPT, userPrompt);

    try {
      const parsed = JSON.parse(response);

      // Validate and normalize the response
      const result: ClaimExtractionResult = {
        claims: Array.isArray(parsed.claims)
          ? parsed.claims.map(validateClaim).filter(Boolean) as ExtractedClaim[]
          : [],
        primaryNarrative: parsed.primaryNarrative || 'Unable to determine primary narrative.',
        conflictingClaims: Boolean(parsed.conflictingClaims),
      };

      return result;
    } catch {
      // Fallback result if parsing fails
      return {
        claims: [],
        primaryNarrative: extractFallbackNarrative(title),
        conflictingClaims: false,
      };
    }
  });
}

/**
 * Validate and normalize a single claim
 */
function validateClaim(claim: unknown): ExtractedClaim | null {
  if (!claim || typeof claim !== 'object') {
    return null;
  }

  const c = claim as Record<string, unknown>;

  if (!c.claim || typeof c.claim !== 'string') {
    return null;
  }

  const attribution = c.attribution as Record<string, unknown> | undefined;

  return {
    claim: String(c.claim),
    attribution: {
      source: attribution?.source ? String(attribution.source) : 'Unknown',
      role: attribution?.role ? String(attribution.role) : undefined,
      organization: attribution?.organization ? String(attribution.organization) : undefined,
    },
    type: validateClaimType(c.type),
    verifiability: validateVerifiability(c.verifiability),
    relatedEntities: Array.isArray(c.relatedEntities)
      ? c.relatedEntities.map(String)
      : [],
    timestamp: c.timestamp ? String(c.timestamp) : undefined,
  };
}

function validateClaimType(type: unknown): ClaimType {
  if (['fact', 'opinion', 'prediction', 'announcement'].includes(type as string)) {
    return type as ClaimType;
  }
  return 'fact';
}

function validateVerifiability(verifiability: unknown): Verifiability {
  if (['verifiable', 'subjective', 'future'].includes(verifiability as string)) {
    return verifiability as Verifiability;
  }
  return 'verifiable';
}

/**
 * Generate fallback narrative from title
 */
function extractFallbackNarrative(title: string): string {
  return `News article about: ${title}`;
}

/**
 * Batch extract claims from multiple articles
 */
export async function extractClaimsBatch(
  articles: Array<{ title: string; content: string }>
): Promise<ClaimExtractionResult[]> {
  const results = await Promise.all(
    articles.map(article => extractClaims(article.title, article.content))
  );
  return results;
}

/**
 * Quick claim detection using heuristics (no AI)
 * Returns true if article likely contains significant claims
 */
export function hasSignificantClaims(title: string, content?: string): boolean {
  const text = `${title} ${content || ''}`;

  // Patterns indicating significant claims
  const significantPatterns = [
    /\$[\d,]+(?:\s*(?:million|billion|M|B))?/i,  // Dollar amounts
    /\d+%/,                                        // Percentages
    /(?:raised|acquired|invested|valued at)/i,    // Financial events
    /(?:announced|confirmed|revealed|reported)/i, // Official statements
    /(?:according to|sources say|insider|leaked)/i, // Attribution
    /(?:will|expects?|predicts?|forecasts?)/i,    // Predictions
  ];

  return significantPatterns.some(pattern => pattern.test(text));
}

/**
 * Extract quick attribution hints without AI
 */
export function extractQuickAttributions(content: string): string[] {
  const attributions: string[] = [];

  // Common attribution patterns - recreate RegExp each time to avoid lastIndex issues
  const patternDefs = [
    /[Aa]ccording to ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
    /(?:per|said|stated by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s+(?:CEO|CTO|CFO|COO|founder|president|director)/gi,
    /"[^"]+"\s+(?:said|stated|announced)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
  ];

  for (const pattern of patternDefs) {
    // Reset lastIndex for global regex
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1] && !attributions.includes(match[1])) {
        attributions.push(match[1]);
      }
    }
  }

  return attributions;
}

/**
 * Analyze claim density and quality
 */
export function analyzeClaimQuality(result: ClaimExtractionResult): {
  totalClaims: number;
  verifiableClaims: number;
  hasAttribution: number;
  qualityScore: number;
} {
  const totalClaims = result.claims.length;

  if (totalClaims === 0) {
    return {
      totalClaims: 0,
      verifiableClaims: 0,
      hasAttribution: 0,
      qualityScore: 0,
    };
  }

  const verifiableClaims = result.claims.filter(
    c => c.verifiability === 'verifiable'
  ).length;

  const hasAttribution = result.claims.filter(
    c => c.attribution.source !== 'Unknown' && c.attribution.source !== 'article author'
  ).length;

  // Quality score (0-100)
  const qualityScore = Math.round(
    ((verifiableClaims / totalClaims) * 40) +
    ((hasAttribution / totalClaims) * 40) +
    (result.conflictingClaims ? 0 : 20) // Bonus for consistent claims
  );

  return {
    totalClaims,
    verifiableClaims,
    hasAttribution,
    qualityScore,
  };
}

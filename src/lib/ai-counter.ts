/**
 * AI Counter-Arguments Generator
 * Challenge any claim or article with counter-arguments
 */

import { aiCache, withCache } from './cache';

// Types
export interface CounterResult {
  originalClaim: string;
  counterArguments: {
    argument: string;
    type: 'factual' | 'logical' | 'contextual' | 'alternative';
    strength: 'strong' | 'moderate' | 'weak';
    source?: string;
  }[];
  assumptions: {
    assumption: string;
    challenge: string;
  }[];
  alternativeInterpretations: string[];
  missingContext: string[];
  overallAssessment: {
    claimStrength: 'strong' | 'moderate' | 'weak';
    mainVulnerability: string;
  };
  generatedAt: string;
}

export interface CounterInput {
  claim: string;
  context?: string;
}

// AI Provider Configuration
type AIProvider = 'openai' | 'anthropic' | 'groq' | 'openrouter';

interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

function getAIConfig(): AIConfig {
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

  if (process.env.GROQ_API_KEY) {
    return {
      provider: 'groq',
      model: process.env.GROQ_MODEL || 'mixtral-8x7b-32768',
      apiKey: process.env.GROQ_API_KEY,
      baseUrl: 'https://api.groq.com/openai/v1',
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

  throw new Error('No AI provider configured');
}

async function aiComplete(
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const config = getAIConfig();
  const { maxTokens = 1500, temperature = 0.4 } = options || {};

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

  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      ...(config.provider === 'openrouter' && {
        'HTTP-Referer': process.env.VERCEL_URL || 'https://cryptocurrency.cv',
        'X-Title': 'Crypto News AI',
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
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Generate a cache key for counter-arguments
 */
function generateCounterCacheKey(input: CounterInput): string {
  const claimHash = Buffer.from(input.claim).toString('base64').slice(0, 40);
  return `ai:counter:${claimHash}`;
}

/**
 * Generate counter-arguments for a claim
 */
export async function generateCounterArguments(input: CounterInput): Promise<CounterResult> {
  if (!input.claim || input.claim.trim().length === 0) {
    throw new Error('Claim is required');
  }

  const cacheKey = generateCounterCacheKey(input);
  
  // Cache counter-arguments for 24 hours
  return withCache(aiCache, cacheKey, 86400, async () => {
    const systemPrompt = `You are a critical thinking expert and crypto market analyst.
Your task is to challenge claims with well-reasoned counter-arguments.
Be thorough but fair - acknowledge when claims have merit while identifying weaknesses.
Categorize counter-arguments by type:
- factual: disputes facts or data
- logical: identifies logical fallacies or reasoning errors
- contextual: points out missing context or oversimplifications
- alternative: presents alternative explanations

Always respond with valid JSON matching the exact schema provided.`;

    const contextSection = input.context 
      ? `\nAdditional Context:\n${input.context.slice(0, 1000)}\n`
      : '';

    const userPrompt = `Analyze and challenge the following claim with counter-arguments:

Claim: "${input.claim}"
${contextSection}

Return a JSON object with this exact structure:
{
  "counterArguments": [
    {
      "argument": "the counter-argument",
      "type": "factual|logical|contextual|alternative",
      "strength": "strong|moderate|weak",
      "source": "optional source or reference"
    }
  ],
  "assumptions": [
    {
      "assumption": "hidden assumption in the claim",
      "challenge": "why this assumption might be wrong"
    }
  ],
  "alternativeInterpretations": [
    "alternative way to interpret the same facts"
  ],
  "missingContext": [
    "important context that was left out"
  ],
  "overallAssessment": {
    "claimStrength": "strong|moderate|weak",
    "mainVulnerability": "the biggest weakness in the claim"
  }
}

Requirements:
- Provide 3-5 counter-arguments with varied types
- Identify 2-4 hidden assumptions
- Suggest 1-3 alternative interpretations
- Note 1-3 pieces of missing context
- Be specific to the crypto/financial domain when relevant
- Don't be contrarian for its own sake - be intellectually honest`;

    const response = await aiComplete(systemPrompt, userPrompt, { 
      maxTokens: 1500,
      temperature: 0.4 
    });

    // Parse AI response
    let aiData;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      // Fallback data
      aiData = {
        counterArguments: [
          {
            argument: 'The claim may be oversimplified and not account for market complexity.',
            type: 'contextual',
            strength: 'moderate',
          },
          {
            argument: 'Historical patterns may not reliably predict future outcomes in crypto markets.',
            type: 'logical',
            strength: 'moderate',
          },
        ],
        assumptions: [
          {
            assumption: 'Market conditions remain constant',
            challenge: 'Crypto markets are highly dynamic and conditions change rapidly',
          },
        ],
        alternativeInterpretations: [
          'The same data could support different conclusions depending on timeframe',
        ],
        missingContext: [
          'Broader macroeconomic factors',
          'Regulatory developments',
        ],
        overallAssessment: {
          claimStrength: 'moderate',
          mainVulnerability: 'Insufficient consideration of external factors',
        },
      };
    }

    // Validate and normalize counter-arguments
    const validTypes = ['factual', 'logical', 'contextual', 'alternative'] as const;
    const validStrengths = ['strong', 'moderate', 'weak'] as const;

    const counterArguments = (Array.isArray(aiData.counterArguments) ? aiData.counterArguments : [])
      .map((arg: { argument?: string; type?: string; strength?: string; source?: string }) => ({
        argument: arg.argument || 'Counter-argument not specified',
        type: validTypes.includes(arg.type as typeof validTypes[number]) 
          ? arg.type as typeof validTypes[number]
          : 'logical',
        strength: validStrengths.includes(arg.strength as typeof validStrengths[number])
          ? arg.strength as typeof validStrengths[number]
          : 'moderate',
        source: arg.source,
      }));

    const assumptions = (Array.isArray(aiData.assumptions) ? aiData.assumptions : [])
      .map((a: { assumption?: string; challenge?: string }) => ({
        assumption: a.assumption || 'Assumption not specified',
        challenge: a.challenge || 'Challenge not specified',
      }));

    const alternativeInterpretations = Array.isArray(aiData.alternativeInterpretations)
      ? aiData.alternativeInterpretations.filter((i: unknown): i is string => typeof i === 'string')
      : [];

    const missingContext = Array.isArray(aiData.missingContext)
      ? aiData.missingContext.filter((c: unknown): c is string => typeof c === 'string')
      : [];

    const claimStrength = validStrengths.includes(aiData.overallAssessment?.claimStrength)
      ? aiData.overallAssessment.claimStrength as typeof validStrengths[number]
      : 'moderate';

    return {
      originalClaim: input.claim,
      counterArguments,
      assumptions,
      alternativeInterpretations,
      missingContext,
      overallAssessment: {
        claimStrength,
        mainVulnerability: aiData.overallAssessment?.mainVulnerability || 'Insufficient analysis',
      },
      generatedAt: new Date().toISOString(),
    };
  });
}

/**
 * Check if AI is configured
 */
export function isAIConfigured(): boolean {
  return !!(
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.OPENROUTER_API_KEY
  );
}

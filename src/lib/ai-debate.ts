/**
 * AI Debate Generator
 * Generates bull vs bear perspectives on any article or topic
 */

import { aiCache, withCache } from './cache';
import { aiComplete } from './ai-provider';

// Types
export interface DebateResult {
  topic: string;
  bullCase: {
    thesis: string;
    arguments: string[];
    supportingEvidence: string[];
    priceTarget?: string;
    timeframe?: string;
    confidence: number;
  };
  bearCase: {
    thesis: string;
    arguments: string[];
    supportingEvidence: string[];
    priceTarget?: string;
    timeframe?: string;
    confidence: number;
  };
  neutralAnalysis: {
    keyUncertainties: string[];
    whatToWatch: string[];
    consensus?: string;
  };
  generatedAt: string;
}

export interface DebateInput {
  article?: {
    title: string;
    content: string;
  };
  topic?: string;
}

/**
 * Generate a cache key for debate
 */
function generateDebateCacheKey(input: DebateInput): string {
  if (input.article) {
    const titleHash = Buffer.from(input.article.title).toString('base64').slice(0, 30);
    return `ai:debate:article:${titleHash}`;
  }
  if (input.topic) {
    const topicHash = Buffer.from(input.topic).toString('base64').slice(0, 30);
    return `ai:debate:topic:${topicHash}`;
  }
  return `ai:debate:unknown:${Date.now()}`;
}

/**
 * Generate bull vs bear debate on an article or topic
 */
export async function generateDebate(input: DebateInput): Promise<DebateResult> {
  if (!input.article && !input.topic) {
    throw new Error('Either article or topic must be provided');
  }

  const cacheKey = generateDebateCacheKey(input);
  
  // Cache debates for 24 hours
  return withCache(aiCache, cacheKey, 86400, async () => {
    const topic = input.topic || input.article?.title || 'Unknown topic';
    
    let context = '';
    if (input.article) {
      context = `
Article Title: ${input.article.title}

Article Content:
${input.article.content.slice(0, 3000)}
`;
    } else {
      context = `Topic: ${input.topic}`;
    }

    const systemPrompt = `You are an expert crypto market analyst tasked with generating balanced bull vs bear debates.
You must present BOTH sides fairly and objectively, even if one side seems stronger.
Be specific with arguments and provide concrete evidence where possible.
Always respond with valid JSON matching the exact schema provided.`;

    const userPrompt = `Generate a comprehensive bull vs bear debate for the following:

${context}

Return a JSON object with this exact structure:
{
  "bullCase": {
    "thesis": "One sentence bull thesis",
    "arguments": ["argument 1", "argument 2", "argument 3"],
    "supportingEvidence": ["evidence 1", "evidence 2"],
    "priceTarget": "optional price target if applicable",
    "timeframe": "optional timeframe if applicable",
    "confidence": 0.0 to 1.0
  },
  "bearCase": {
    "thesis": "One sentence bear thesis",
    "arguments": ["argument 1", "argument 2", "argument 3"],
    "supportingEvidence": ["evidence 1", "evidence 2"],
    "priceTarget": "optional price target if applicable",
    "timeframe": "optional timeframe if applicable",
    "confidence": 0.0 to 1.0
  },
  "neutralAnalysis": {
    "keyUncertainties": ["uncertainty 1", "uncertainty 2"],
    "whatToWatch": ["indicator 1", "indicator 2"],
    "consensus": "optional market consensus view"
  }
}

Requirements:
- Each case should have 3-5 arguments
- Each case should have 2-4 pieces of supporting evidence
- Confidence should reflect how strong each case is (0.0-1.0)
- Be balanced - don't favor bulls or bears unless evidence clearly supports one side
- Price targets and timeframes are optional but encouraged for specific assets
- Key uncertainties should highlight what could change the outlook`;

    const response = await aiComplete(systemPrompt, userPrompt, { 
      maxTokens: 2000,
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
      // Fallback data for balanced debate
      aiData = {
        bullCase: {
          thesis: 'The market shows potential for upside based on current fundamentals.',
          arguments: [
            'Growing institutional adoption',
            'Improving regulatory clarity',
            'Strong network fundamentals',
          ],
          supportingEvidence: [
            'Increased ETF inflows',
            'Rising on-chain activity',
          ],
          confidence: 0.5,
        },
        bearCase: {
          thesis: 'Significant risks remain that could pressure prices.',
          arguments: [
            'Macroeconomic headwinds persist',
            'Regulatory uncertainty in key markets',
            'Technical indicators show weakness',
          ],
          supportingEvidence: [
            'Declining trading volumes',
            'Negative funding rates',
          ],
          confidence: 0.5,
        },
        neutralAnalysis: {
          keyUncertainties: [
            'Fed policy direction',
            'Regulatory developments',
          ],
          whatToWatch: [
            'BTC price action around key levels',
            'ETF flow data',
          ],
          consensus: 'Market remains divided with no clear directional bias.',
        },
      };
    }

    // Ensure required fields and proper typing
    const bullCase = {
      thesis: aiData.bullCase?.thesis || 'Bullish outlook based on fundamentals.',
      arguments: Array.isArray(aiData.bullCase?.arguments) ? aiData.bullCase.arguments : [],
      supportingEvidence: Array.isArray(aiData.bullCase?.supportingEvidence) ? aiData.bullCase.supportingEvidence : [],
      priceTarget: aiData.bullCase?.priceTarget,
      timeframe: aiData.bullCase?.timeframe,
      confidence: typeof aiData.bullCase?.confidence === 'number' 
        ? Math.max(0, Math.min(1, aiData.bullCase.confidence)) 
        : 0.5,
    };

    const bearCase = {
      thesis: aiData.bearCase?.thesis || 'Bearish outlook based on risks.',
      arguments: Array.isArray(aiData.bearCase?.arguments) ? aiData.bearCase.arguments : [],
      supportingEvidence: Array.isArray(aiData.bearCase?.supportingEvidence) ? aiData.bearCase.supportingEvidence : [],
      priceTarget: aiData.bearCase?.priceTarget,
      timeframe: aiData.bearCase?.timeframe,
      confidence: typeof aiData.bearCase?.confidence === 'number'
        ? Math.max(0, Math.min(1, aiData.bearCase.confidence))
        : 0.5,
    };

    const neutralAnalysis = {
      keyUncertainties: Array.isArray(aiData.neutralAnalysis?.keyUncertainties) 
        ? aiData.neutralAnalysis.keyUncertainties 
        : [],
      whatToWatch: Array.isArray(aiData.neutralAnalysis?.whatToWatch)
        ? aiData.neutralAnalysis.whatToWatch
        : [],
      consensus: aiData.neutralAnalysis?.consensus,
    };

    return {
      topic,
      bullCase,
      bearCase,
      neutralAnalysis,
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

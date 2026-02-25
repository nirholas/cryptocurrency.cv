/**
 * Multimodal Chart Analysis Engine
 *
 * Uses vision-capable AI models (Gemini, Claude, GPT-4V) to analyze
 * cryptocurrency chart images and detect:
 * - Technical patterns (head & shoulders, double tops, triangles, etc.)
 * - Support/resistance levels
 * - Trend direction and strength
 * - Volume anomalies
 * - Key Fibonacci levels
 *
 * Can analyze:
 * - Uploaded chart screenshots
 * - TradingView chart URLs
 * - Programmatically rendered OHLC charts
 *
 * @module lib/ai-chart-analysis
 */

import { getAIConfigOrNull, type AIConfig } from './ai-provider';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PatternType =
  | 'head-and-shoulders'
  | 'inverse-head-and-shoulders'
  | 'double-top'
  | 'double-bottom'
  | 'triple-top'
  | 'triple-bottom'
  | 'ascending-triangle'
  | 'descending-triangle'
  | 'symmetrical-triangle'
  | 'bull-flag'
  | 'bear-flag'
  | 'rising-wedge'
  | 'falling-wedge'
  | 'cup-and-handle'
  | 'pennant'
  | 'channel-up'
  | 'channel-down'
  | 'broadening-formation'
  | 'rounding-bottom'
  | 'none-detected';

export type TrendDirection = 'strong-up' | 'up' | 'sideways' | 'down' | 'strong-down';
export type VolumeProfile = 'increasing' | 'decreasing' | 'spike' | 'dry' | 'normal';

export interface DetectedPattern {
  type: PatternType;
  confidence: number; // 0-100
  completion: number; // 0-100 (how formed is the pattern)
  target?: number; // projected price target
  invalidation?: number; // level that invalidates the pattern
  timeframe: string; // e.g., "4H", "1D"
  description: string;
}

export interface SupportResistanceLevel {
  level: number;
  type: 'support' | 'resistance';
  strength: 'weak' | 'moderate' | 'strong';
  touches: number; // how many times price tested this level
}

export interface ChartAnalysis {
  id: string;
  timestamp: string;
  symbol: string;
  timeframe: string;

  // Trend
  trend: {
    direction: TrendDirection;
    strength: number; // 0-100
    description: string;
  };

  // Patterns
  patterns: DetectedPattern[];

  // Key Levels
  levels: SupportResistanceLevel[];

  // Volume
  volume: {
    profile: VolumeProfile;
    trend: string;
    anomaly: boolean;
    description: string;
  };

  // Overall assessment
  bias: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  summary: string;
  actionableInsights: string[];

  // Fibonacci levels (if identifiable swing points)
  fibonacci?: {
    swing_low: number;
    swing_high: number;
    levels: { ratio: string; price: number }[];
  };

  // Risk/reward
  riskReward?: {
    entry: number;
    stopLoss: number;
    target1: number;
    target2?: number;
    ratio: number;
  };

  // Raw AI response for transparency
  rawAnalysis: string;
}

// ---------------------------------------------------------------------------
// Vision API Calls
// ---------------------------------------------------------------------------

async function analyzeWithGemini(
  imageBase64: string,
  mimeType: string,
  prompt: string,
  config: AIConfig
): Promise<string> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(config.apiKey);
  const model = genAI.getGenerativeModel({
    model: config.model || 'gemini-2.5-pro',
    generationConfig: {
      maxOutputTokens: 4000,
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent([
    { text: prompt },
    {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    },
  ]);

  return result.response.text();
}

async function analyzeWithClaude(
  imageBase64: string,
  mimeType: string,
  prompt: string,
  config: AIConfig
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model || 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: imageBase64,
              },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude vision error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function analyzeWithOpenAI(
  imageBase64: string,
  mimeType: string,
  prompt: string,
  config: AIConfig
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: 'high',
              },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
      max_tokens: 4000,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI vision error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ---------------------------------------------------------------------------
// Chart Analysis Prompt
// ---------------------------------------------------------------------------

function buildChartPrompt(symbol?: string, timeframe?: string): string {
  return `You are an expert technical analyst examining a cryptocurrency price chart.

Analyze this chart image and provide a detailed technical analysis.

${symbol ? `Symbol: ${symbol}` : ''}
${timeframe ? `Timeframe: ${timeframe}` : ''}

OUTPUT: Respond with a JSON object with these fields:
{
  "symbol": "detected or provided symbol",
  "timeframe": "detected or provided timeframe",
  "trend": {
    "direction": "strong-up"|"up"|"sideways"|"down"|"strong-down",
    "strength": 0-100,
    "description": "Brief trend description"
  },
  "patterns": [
    {
      "type": "pattern name from: head-and-shoulders, inverse-head-and-shoulders, double-top, double-bottom, triple-top, triple-bottom, ascending-triangle, descending-triangle, symmetrical-triangle, bull-flag, bear-flag, rising-wedge, falling-wedge, cup-and-handle, pennant, channel-up, channel-down, broadening-formation, rounding-bottom, none-detected",
      "confidence": 0-100,
      "completion": 0-100,
      "target": price_target_number_or_null,
      "invalidation": invalidation_level_or_null,
      "timeframe": "timeframe of the pattern",
      "description": "Pattern description"
    }
  ],
  "levels": [
    {
      "level": price_number,
      "type": "support"|"resistance",
      "strength": "weak"|"moderate"|"strong",
      "touches": number_of_touches
    }
  ],
  "volume": {
    "profile": "increasing"|"decreasing"|"spike"|"dry"|"normal",
    "trend": "Brief volume trend description",
    "anomaly": true|false,
    "description": "Volume analysis"
  },
  "fibonacci": {
    "swing_low": number_or_null,
    "swing_high": number_or_null,
    "levels": [{"ratio": "0.236", "price": number}, ...]
  },
  "riskReward": {
    "entry": suggested_entry,
    "stopLoss": stop_loss_level,
    "target1": first_target,
    "target2": second_target_or_null,
    "ratio": risk_reward_ratio
  },
  "bias": "bullish"|"bearish"|"neutral",
  "confidence": 0-100,
  "summary": "2-3 sentence executive summary of the chart",
  "actionableInsights": ["insight1", "insight2", "insight3"]
}

ANALYSIS RULES:
- Be precise with price levels — use the actual numbers visible on the chart
- Only report patterns you can genuinely identify, not speculate
- If no clear pattern exists, use "none-detected"
- Confidence should reflect how clearly the pattern/level is visible
- Include at least 2 support/resistance levels
- Actionable insights should be specific trades or levels to watch
- Respond ONLY with valid JSON`;
}

// ---------------------------------------------------------------------------
// Main Analysis Function
// ---------------------------------------------------------------------------

/**
 * Analyze a chart image using multimodal AI.
 *
 * @param imageBase64 - Base64 encoded chart image
 * @param mimeType - Image MIME type (image/png, image/jpeg, image/webp)
 * @param symbol - Optional trading pair symbol
 * @param timeframe - Optional chart timeframe
 */
export async function analyzeChart(
  imageBase64: string,
  mimeType: string,
  symbol?: string,
  timeframe?: string
): Promise<ChartAnalysis> {
  // Try providers in vision-capability order
  const geminiConfig = getVisionConfig('gemini');
  const anthropicConfig = getVisionConfig('anthropic');
  const openaiConfig = getVisionConfig('openai');

  const configs = [geminiConfig, anthropicConfig, openaiConfig].filter(Boolean) as AIConfig[];

  if (configs.length === 0) {
    throw new Error(
      'No vision-capable AI provider configured. Set GEMINI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY.'
    );
  }

  const prompt = buildChartPrompt(symbol, timeframe);
  let rawAnalysis = '';
  let lastError: Error | null = null;

  // Try each provider until one succeeds
  for (const config of configs) {
    try {
      if (config.provider === 'gemini') {
        rawAnalysis = await analyzeWithGemini(imageBase64, mimeType, prompt, config);
      } else if (config.provider === 'anthropic') {
        rawAnalysis = await analyzeWithClaude(imageBase64, mimeType, prompt, config);
      } else if (config.provider === 'openai') {
        rawAnalysis = await analyzeWithOpenAI(imageBase64, mimeType, prompt, config);
      }
      break; // success
    } catch (err) {
      lastError = err as Error;
      console.warn(`[Chart Analysis] ${config.provider} failed:`, err);
      continue;
    }
  }

  if (!rawAnalysis) {
    throw lastError || new Error('All vision providers failed');
  }

  // Parse the JSON response
  try {
    const parsed = JSON.parse(rawAnalysis);
    return {
      id: `chart-${Date.now()}`,
      timestamp: new Date().toISOString(),
      symbol: parsed.symbol || symbol || 'UNKNOWN',
      timeframe: parsed.timeframe || timeframe || 'unknown',
      trend: parsed.trend || { direction: 'sideways', strength: 50, description: '' },
      patterns: (parsed.patterns || []).map((p: Record<string, unknown>) => ({
        type: p.type || 'none-detected',
        confidence: typeof p.confidence === 'number' ? p.confidence : 50,
        completion: typeof p.completion === 'number' ? p.completion : 50,
        target: typeof p.target === 'number' ? p.target : undefined,
        invalidation: typeof p.invalidation === 'number' ? p.invalidation : undefined,
        timeframe: p.timeframe || timeframe || '',
        description: p.description || '',
      })),
      levels: (parsed.levels || []).map((l: Record<string, unknown>) => ({
        level: typeof l.level === 'number' ? l.level : 0,
        type: l.type || 'support',
        strength: l.strength || 'moderate',
        touches: typeof l.touches === 'number' ? l.touches : 1,
      })),
      volume: parsed.volume || {
        profile: 'normal',
        trend: '',
        anomaly: false,
        description: '',
      },
      bias: parsed.bias || 'neutral',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 50,
      summary: parsed.summary || '',
      actionableInsights: Array.isArray(parsed.actionableInsights) ? parsed.actionableInsights : [],
      fibonacci: parsed.fibonacci || undefined,
      riskReward: parsed.riskReward || undefined,
      rawAnalysis,
    };
  } catch (parseError) {
    // If JSON parsing fails, still return what we can
    return {
      id: `chart-${Date.now()}`,
      timestamp: new Date().toISOString(),
      symbol: symbol || 'UNKNOWN',
      timeframe: timeframe || 'unknown',
      trend: { direction: 'sideways', strength: 50, description: '' },
      patterns: [],
      levels: [],
      volume: { profile: 'normal', trend: '', anomaly: false, description: '' },
      bias: 'neutral',
      confidence: 0,
      summary: 'Failed to parse analysis. Raw response included.',
      actionableInsights: [],
      rawAnalysis,
    };
  }
}

/**
 * Analyze an OHLC dataset directly (without image).
 * Converts price data to a text description for analysis.
 */
export async function analyzeOHLCData(
  candles: { open: number; high: number; low: number; close: number; volume?: number; timestamp: number }[],
  symbol: string,
  timeframe: string
): Promise<ChartAnalysis> {
  const config = getAIConfigOrNull();
  if (!config) {
    throw new Error('No AI provider configured');
  }

  // Build a text representation of the OHLC data
  const recent = candles.slice(-30); // last 30 candles
  const priceRange = {
    high: Math.max(...recent.map(c => c.high)),
    low: Math.min(...recent.map(c => c.low)),
    currentClose: recent[recent.length - 1]?.close ?? 0,
    previousClose: recent[recent.length - 2]?.close ?? 0,
  };

  const ohlcText = recent
    .map(c => {
      const date = new Date(c.timestamp).toISOString().split('T')[0];
      return `${date}: O=${c.open.toFixed(2)} H=${c.high.toFixed(2)} L=${c.low.toFixed(2)} C=${c.close.toFixed(2)}${c.volume ? ` V=${c.volume}` : ''}`;
    })
    .join('\n');

  const prompt = `Analyze this ${symbol} ${timeframe} OHLC price data as a technical analyst.

PRICE RANGE: $${priceRange.low.toFixed(2)} — $${priceRange.high.toFixed(2)}
CURRENT: $${priceRange.currentClose.toFixed(2)}
CHANGE: ${((priceRange.currentClose - priceRange.previousClose) / priceRange.previousClose * 100).toFixed(2)}%

OHLC DATA (last ${recent.length} candles):
${ohlcText}

${buildChartPrompt(symbol, timeframe)}`;

  const { aiComplete: complete } = await import('./ai-provider');
  const rawAnalysis = await complete(
    'You are an expert crypto technical analyst.',
    prompt,
    { maxTokens: 4000, temperature: 0.2, jsonMode: true }
  );

  const parsed = JSON.parse(rawAnalysis);

  return {
    id: `ohlc-${Date.now()}`,
    timestamp: new Date().toISOString(),
    symbol,
    timeframe,
    trend: parsed.trend || { direction: 'sideways', strength: 50, description: '' },
    patterns: parsed.patterns || [],
    levels: parsed.levels || [],
    volume: parsed.volume || { profile: 'normal', trend: '', anomaly: false, description: '' },
    bias: parsed.bias || 'neutral',
    confidence: parsed.confidence || 50,
    summary: parsed.summary || '',
    actionableInsights: parsed.actionableInsights || [],
    fibonacci: parsed.fibonacci,
    riskReward: parsed.riskReward,
    rawAnalysis,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getVisionConfig(provider: string): AIConfig | null {
  switch (provider) {
    case 'gemini': {
      const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
      return key ? { provider: 'gemini', model: 'gemini-2.5-pro', apiKey: key } : null;
    }
    case 'anthropic': {
      const key = process.env.ANTHROPIC_API_KEY;
      return key ? { provider: 'anthropic', model: 'claude-sonnet-4-20250514', apiKey: key } : null;
    }
    case 'openai': {
      const key = process.env.OPENAI_API_KEY;
      return key ? { provider: 'openai', model: 'gpt-4o', apiKey: key } : null;
    }
    default:
      return null;
  }
}

/**
 * Google Gemini Client
 *
 * Dedicated Gemini integration leveraging $100k GCP credits for:
 *
 *  1. **Flash Analysis** — Sub-200ms structured extractions (sentiment, entities, categories)
 *     using Gemini 2.0 Flash's 350 tok/s throughput
 *  2. **Chart Vision** — Analyze TradingView screenshots, on-chain graphs, and market
 *     heatmaps using Gemini's vision capabilities
 *  3. **Long Context Synthesis** — Feed 1M token context windows with entire days of
 *     news + market data for comprehensive daily reports
 *  4. **Grounded Search** — Use Google Search grounding to fact-check claims in real time
 *  5. **Streaming Generation** — SSE-streamed market reports and chat responses
 *
 * @module gemini
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  /** Base URL override (for Vertex AI) */
  baseUrl?: string;
}

export interface GeminiGenerateOptions {
  /** Model override (default: gemini-2.0-flash) */
  model?: string;
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  /** Request JSON output */
  responseMimeType?: 'application/json' | 'text/plain';
  /** JSON schema for structured output (Gemini 2.0+) */
  responseSchema?: Record<string, unknown>;
  /** System instruction */
  systemInstruction?: string;
  /** Enable Google Search grounding */
  enableGrounding?: boolean;
  /** Timeout in ms */
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }
  | { fileData: { mimeType: string; fileUri: string } };

export interface GeminiResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  groundingMetadata?: {
    searchQueries?: string[];
    webSearchResults?: Array<{ uri: string; title: string }>;
  };
  finishReason: string;
  safetyRatings?: Array<{ category: string; probability: string }>;
}

export interface GeminiStreamChunk {
  text: string;
  done: boolean;
  usage?: GeminiResponse['usage'];
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

function getConfig(): GeminiConfig | null {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: process.env.GEMINI_BASE_URL,
  };
}

export function isGeminiConfigured(): boolean {
  return !!(process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY);
}

// ---------------------------------------------------------------------------
// Core API Call
// ---------------------------------------------------------------------------

const DEFAULT_MODEL = 'gemini-2.0-flash';

async function generateContent(
  contents: GeminiContent[],
  options: GeminiGenerateOptions = {},
): Promise<GeminiResponse> {
  const config = getConfig();
  if (!config) throw new Error('Gemini not configured: set GOOGLE_AI_API_KEY');

  const model = options.model || DEFAULT_MODEL;
  const baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  const url = `${baseUrl}/models/${model}:generateContent?key=${config.apiKey}`;

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: options.maxOutputTokens || 4096,
      temperature: options.temperature ?? 0.3,
      ...(options.topP !== undefined ? { topP: options.topP } : {}),
      ...(options.topK !== undefined ? { topK: options.topK } : {}),
      ...(options.responseMimeType ? { responseMimeType: options.responseMimeType } : {}),
      ...(options.responseSchema ? { responseSchema: options.responseSchema } : {}),
    },
  };

  if (options.systemInstruction) {
    body.systemInstruction = { parts: [{ text: options.systemInstruction }] };
  }

  if (options.enableGrounding) {
    body.tools = [{ googleSearch: {} }];
  }

  const controller = new AbortController();
  const timeout = options.timeoutMs || 30_000;
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: options.signal || controller.signal,
    });

    if (!res.ok) {
      const err = await res.text().catch(() => `HTTP ${res.status}`);
      throw new Error(`Gemini API error (${model}): ${res.status} — ${err.slice(0, 300)}`);
    }

    const json = await res.json() as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
        safetyRatings?: Array<{ category: string; probability: string }>;
        groundingMetadata?: {
          searchEntryPoint?: { renderedContent?: string };
          groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
          webSearchQueries?: string[];
        };
      }>;
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      };
    };

    const candidate = json.candidates?.[0];
    const text = candidate?.content?.parts?.map(p => p.text || '').join('') || '';

    const grounding = candidate?.groundingMetadata;
    const groundingMetadata = grounding ? {
      searchQueries: grounding.webSearchQueries,
      webSearchResults: grounding.groundingChunks
        ?.filter(c => c.web)
        .map(c => ({ uri: c.web!.uri || '', title: c.web!.title || '' })),
    } : undefined;

    return {
      text,
      usage: {
        promptTokens: json.usageMetadata?.promptTokenCount || 0,
        completionTokens: json.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: json.usageMetadata?.totalTokenCount || 0,
      },
      groundingMetadata,
      finishReason: candidate?.finishReason || 'UNKNOWN',
      safetyRatings: candidate?.safetyRatings,
    };
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Streaming API
// ---------------------------------------------------------------------------

export async function* streamContent(
  contents: GeminiContent[],
  options: GeminiGenerateOptions = {},
): AsyncGenerator<GeminiStreamChunk> {
  const config = getConfig();
  if (!config) throw new Error('Gemini not configured: set GOOGLE_AI_API_KEY');

  const model = options.model || DEFAULT_MODEL;
  const baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  const url = `${baseUrl}/models/${model}:streamGenerateContent?alt=sse&key=${config.apiKey}`;

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: options.maxOutputTokens || 4096,
      temperature: options.temperature ?? 0.3,
      ...(options.responseMimeType ? { responseMimeType: options.responseMimeType } : {}),
    },
  };

  if (options.systemInstruction) {
    body.systemInstruction = { parts: [{ text: options.systemInstruction }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: options.signal,
  });

  if (!res.ok || !res.body) {
    const err = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`Gemini stream error: ${res.status} — ${err.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          yield { text: '', done: true };
          return;
        }

        try {
          const chunk = JSON.parse(data) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
            usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
          };

          const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const usage = chunk.usageMetadata ? {
            promptTokens: chunk.usageMetadata.promptTokenCount || 0,
            completionTokens: chunk.usageMetadata.candidatesTokenCount || 0,
            totalTokens: chunk.usageMetadata.totalTokenCount || 0,
          } : undefined;

          yield { text, done: false, usage };
        } catch {
          // Skip malformed SSE chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  yield { text: '', done: true };
}

// ---------------------------------------------------------------------------
// High-Level Feature Functions
// ---------------------------------------------------------------------------

/**
 * Flash Extraction — sub-200ms structured data extraction.
 *
 * Uses Gemini 2.0 Flash with JSON mode for maximum throughput.
 * Ideal for real-time pipelines processing hundreds of articles/min.
 */
export async function flashExtract<T = unknown>(
  text: string,
  schema: Record<string, unknown>,
  systemPrompt?: string,
): Promise<T> {
  const response = await generateContent(
    [{ role: 'user', parts: [{ text }] }],
    {
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt || 'Extract structured data from the input. Return valid JSON matching the schema.',
      responseMimeType: 'application/json',
      responseSchema: schema,
      maxOutputTokens: 2048,
      temperature: 0.1,
      timeoutMs: 5_000,
    },
  );

  return JSON.parse(response.text) as T;
}

/**
 * Chart Vision Analysis — analyze trading charts using Gemini's vision.
 *
 * Accepts base64-encoded or URL images of charts (TradingView, CoinGecko, etc.)
 * and returns structured technical analysis.
 */
export async function analyzeChart(
  imageBase64: string,
  mimeType = 'image/png',
  context?: string,
): Promise<{
  pattern: string;
  trend: 'bullish' | 'bearish' | 'neutral' | 'mixed';
  support: string[];
  resistance: string[];
  indicators: Array<{ name: string; signal: string; value?: string }>;
  summary: string;
  confidence: number;
}> {
  const response = await generateContent(
    [{
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: imageBase64 } },
        { text: context
          ? `Analyze this cryptocurrency chart. Context: ${context}\n\nReturn a JSON technical analysis.`
          : 'Analyze this cryptocurrency chart. Return a JSON technical analysis.' },
      ],
    }],
    {
      model: 'gemini-2.0-flash',
      systemInstruction: `You are an expert cryptocurrency technical analyst. Analyze chart images and return structured JSON analysis.

Return this exact JSON structure:
{
  "pattern": "description of the primary chart pattern (e.g., ascending triangle, head and shoulders, bull flag)",
  "trend": "bullish" | "bearish" | "neutral" | "mixed",
  "support": ["price level 1", "price level 2"],
  "resistance": ["price level 1", "price level 2"],
  "indicators": [{"name": "RSI", "signal": "oversold/neutral/overbought", "value": "42"}],
  "summary": "2-3 sentence analysis",
  "confidence": 0.0-1.0
}`,
      responseMimeType: 'application/json',
      maxOutputTokens: 1024,
      temperature: 0.2,
    },
  );

  return JSON.parse(response.text);
}

/**
 * Long Context Synthesis — feed an entire day of news + market data
 * into Gemini's 1M token window for comprehensive reports.
 */
export async function synthesizeReport(
  newsArticles: Array<{ title: string; source: string; summary?: string; publishedAt: string }>,
  marketData?: { btcPrice: number; ethPrice: number; totalMarketCap: number; dominance: number; fearGreed: number },
  reportType: 'daily' | 'weekly' | 'flash' = 'daily',
): Promise<{
  title: string;
  executive_summary: string;
  key_developments: Array<{ headline: string; significance: 'high' | 'medium' | 'low'; impact: string }>;
  market_analysis: string;
  outlook: string;
  risks: string[];
  opportunities: string[];
}> {
  const articleContext = newsArticles
    .map((a, i) => `[${i + 1}] ${a.publishedAt} — ${a.source}\n${a.title}${a.summary ? `\n${a.summary}` : ''}`)
    .join('\n\n');

  const marketContext = marketData
    ? `\nMARKET DATA:\nBTC: $${marketData.btcPrice.toLocaleString()} | ETH: $${marketData.ethPrice.toLocaleString()} | Total MCap: $${(marketData.totalMarketCap / 1e12).toFixed(2)}T | BTC Dom: ${marketData.dominance}% | Fear/Greed: ${marketData.fearGreed}/100`
    : '';

  const response = await generateContent(
    [{
      role: 'user',
      parts: [{
        text: `${articleContext}\n${marketContext}\n\nGenerate a comprehensive ${reportType} crypto market report.`,
      }],
    }],
    {
      // Use Pro for reports (better reasoning)
      model: newsArticles.length > 200 ? 'gemini-2.5-pro-preview-06-05' : 'gemini-2.0-flash',
      systemInstruction: `You are a senior crypto market analyst at a tier-1 research firm. Generate institutional-quality ${reportType} market reports. Be data-driven, cite specific articles by number, and provide actionable insights.

Return valid JSON with this structure:
{
  "title": "report title",
  "executive_summary": "3-4 sentence overview",
  "key_developments": [{"headline": "...", "significance": "high|medium|low", "impact": "..."}],
  "market_analysis": "detailed market analysis paragraph",
  "outlook": "forward-looking analysis",
  "risks": ["risk 1", "risk 2"],
  "opportunities": ["opp 1", "opp 2"]
}`,
      responseMimeType: 'application/json',
      maxOutputTokens: 4096,
      temperature: 0.4,
      timeoutMs: 60_000,
    },
  );

  return JSON.parse(response.text);
}

/**
 * Grounded Fact Check — use Google Search to verify a claim.
 *
 * Leverages Gemini's built-in Google Search grounding to find
 * supporting/contradicting evidence for any crypto-related claim.
 */
export async function groundedFactCheck(
  claim: string,
): Promise<{
  verdict: 'verified' | 'likely_true' | 'unverified' | 'likely_false' | 'false';
  confidence: number;
  evidence: Array<{ source: string; url: string; supports: boolean; excerpt: string }>;
  reasoning: string;
}> {
  const response = await generateContent(
    [{
      role: 'user',
      parts: [{ text: `Fact-check the following claim using web search:\n\n"${claim}"` }],
    }],
    {
      model: 'gemini-2.0-flash',
      systemInstruction: `You are a crypto fact-checker. Use Google Search to verify claims.

Return JSON:
{
  "verdict": "verified|likely_true|unverified|likely_false|false",
  "confidence": 0.0-1.0,
  "evidence": [{"source": "name", "url": "https://...", "supports": true/false, "excerpt": "relevant quote"}],
  "reasoning": "brief explanation"
}`,
      enableGrounding: true,
      responseMimeType: 'application/json',
      maxOutputTokens: 2048,
      temperature: 0.1,
    },
  );

  return JSON.parse(response.text);
}

/**
 * Multi-Modal News Enrichment — analyze article + related images together.
 */
export async function enrichArticle(
  title: string,
  content: string,
  imageUrls?: string[],
): Promise<{
  summary: string;
  sentiment: { score: number; label: string };
  entities: Array<{ name: string; type: string; relevance: number }>;
  topics: string[];
  impactScore: number;
  imageAnalysis?: string;
}> {
  const parts: GeminiPart[] = [
    { text: `TITLE: ${title}\n\nCONTENT:\n${content}\n\nAnalyze this crypto news article.` },
  ];

  // Add images if available (for multi-modal analysis)
  if (imageUrls?.length) {
    for (const url of imageUrls.slice(0, 3)) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          const mimeType = res.headers.get('content-type') || 'image/jpeg';
          parts.push({ inlineData: { mimeType, data: base64 } });
        }
      } catch {
        // Skip failed image fetches
      }
    }
  }

  const response = await generateContent(
    [{ role: 'user', parts }],
    {
      model: 'gemini-2.0-flash',
      systemInstruction: `You are a crypto news analysis engine. Analyze articles and return structured intelligence.
If images are included, analyze them as well (charts, logos, infographics).

Return JSON:
{
  "summary": "2-3 sentence summary",
  "sentiment": {"score": -1.0 to 1.0, "label": "bearish/neutral/bullish"},
  "entities": [{"name": "...", "type": "person/org/crypto/exchange/protocol/event", "relevance": 0-1}],
  "topics": ["topic1", "topic2"],
  "impactScore": 0-100,
  "imageAnalysis": "description of what images show (if any)"
}`,
      responseMimeType: 'application/json',
      maxOutputTokens: 1024,
      temperature: 0.2,
      timeoutMs: 10_000,
    },
  );

  return JSON.parse(response.text);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  generateContent,
  getConfig as getGeminiConfig,
};

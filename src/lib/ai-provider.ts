/**
 * Shared AI Provider Utilities
 * Centralises provider config and completion logic to avoid duplication
 * across ai-brief, ai-counter, ai-debate, ai-enhanced, claim-extractor, event-classifier.
 */

export type AIProvider = 'openai' | 'anthropic' | 'groq' | 'openrouter';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

export interface AICompleteOptions {
  maxTokens?: number;
  temperature?: number;
  /** When true, requests json_object response format (OpenAI-compatible providers only) */
  jsonMode?: boolean;
  /** X-Title header for OpenRouter attribution */
  title?: string;
}

/**
 * Returns AI config or null when no provider is configured.
 *
 * @param preferGroq - When true, Groq is tried first (good for fast JSON tasks).
 *                     When false (default), OpenAI is tried first.
 */
export function getAIConfigOrNull(preferGroq = false): AIConfig | null {
  const openai = (): AIConfig | null =>
    process.env.OPENAI_API_KEY
      ? { provider: 'openai', model: process.env.OPENAI_MODEL || 'gpt-4o-mini', apiKey: process.env.OPENAI_API_KEY }
      : null;

  const anthropic = (): AIConfig | null =>
    process.env.ANTHROPIC_API_KEY
      ? { provider: 'anthropic', model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307', apiKey: process.env.ANTHROPIC_API_KEY }
      : null;

  const groq = (): AIConfig | null =>
    process.env.GROQ_API_KEY
      ? { provider: 'groq', model: process.env.GROQ_MODEL || (preferGroq ? 'llama-3.3-70b-versatile' : 'mixtral-8x7b-32768'), apiKey: process.env.GROQ_API_KEY, baseUrl: 'https://api.groq.com/openai/v1' }
      : null;

  const openrouter = (): AIConfig | null =>
    process.env.OPENROUTER_API_KEY
      ? { provider: 'openrouter', model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3-8b-instruct', apiKey: process.env.OPENROUTER_API_KEY, baseUrl: 'https://openrouter.ai/api/v1' }
      : null;

  const order = preferGroq
    ? [groq, openai, anthropic, openrouter]
    : [openai, anthropic, groq, openrouter];

  for (const fn of order) {
    const cfg = fn();
    if (cfg) return cfg;
  }
  return null;
}

/**
 * Returns AI config or throws when no provider is configured.
 */
export function getAIConfigOrThrow(preferGroq = false): AIConfig {
  const cfg = getAIConfigOrNull(preferGroq);
  if (!cfg) {
    throw new Error(
      'No AI provider configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY'
    );
  }
  return cfg;
}

/**
 * Generic AI completion request compatible with all supported providers.
 */
export async function aiComplete(
  systemPrompt: string,
  userPrompt: string,
  options: AICompleteOptions = {},
  preferGroq = false
): Promise<string> {
  const config = getAIConfigOrThrow(preferGroq);
  const { maxTokens = 1000, temperature = 0.3, jsonMode = false, title = 'Crypto News AI' } = options;

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
      Authorization: `Bearer ${config.apiKey}`,
      ...(config.provider === 'openrouter' && {
        'HTTP-Referer': process.env.VERCEL_URL || 'https://cryptocurrency.cv',
        'X-Title': title,
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
      ...(jsonMode && { response_format: { type: 'json_object' } }),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

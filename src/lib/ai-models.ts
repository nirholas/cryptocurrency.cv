/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Model names, in one place.
 *
 * `llama-3.3-70b-versatile` was hardcoded in a dozen modules. Groq retired it
 * for our account and every AI-backed endpoint started answering 500:
 * /api/signals, /api/sentiment, /api/summarize, article enrichment, the
 * translator, the oracle. Nothing pointed at the outage because each call site
 * carried its own copy of the string.
 *
 * A model name is deployment configuration, not a constant. Everything here
 * reads an environment variable first and falls back to a model we have
 * verified against the live account, so the next retirement is one env var
 * away from fixed instead of a dozen edits.
 *
 * This module deliberately has no imports: every AI client can depend on it
 * without risking an import cycle.
 *
 * @module lib/ai-models
 */

/**
 * Groq chat model. Verified available: `qwen/qwen3.8-27b` answers reliably in
 * JSON mode, which most of our prompts require.
 *
 * @see lib/groq.ts for the fallback chain that survives a mid-flight retirement.
 */
export const GROQ_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';

/** Groq model for high-volume, latency-sensitive work (enrichment, translation). */
export const GROQ_FAST_MODEL = process.env.GROQ_FAST_MODEL || GROQ_MODEL;

/** OpenAI chat model. */
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

/** Anthropic chat model. */
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

/** OpenRouter chat model. */
export const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct';

/** Google Gemini chat model. */
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

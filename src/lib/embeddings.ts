/**
 * Embeddings — vector generation and cosine similarity utilities
 *
 * generateEmbedding: calls OpenAI text-embedding-3-small via fetch.
 * cosineSimilarity: dot-product / (|a| * |b|) for two vectors.
 * Embeddings are cached in @vercel/kv under key "emb:{sha256(text)}"
 * to avoid redundant API calls and reduce cost.
 *
 * Environment variables required:
 *   OPENAI_API_KEY — OpenAI secret key
 *   KV_REST_API_URL / KV_REST_API_TOKEN — Vercel KV credentials
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBEDDING_MODEL = 'text-embedding-3-small';

// ---------------------------------------------------------------------------
// SHA-256 helper (Web Crypto API — works in Node.js 18+ and Edge Runtime)
// ---------------------------------------------------------------------------

async function sha256Hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------
// Core: cosine similarity between two equal-length vectors
// ---------------------------------------------------------------------------

/**
 * Compute cosine similarity between two vectors.
 * Returns a value in [-1, 1]; higher means more similar.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ---------------------------------------------------------------------------
// KV lazy-loader (avoids import errors when KV env vars are absent)
// ---------------------------------------------------------------------------

type KVClient = {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts?: { ex?: number }): Promise<unknown>;
};

let _kv: KVClient | null = null;

async function getKV(): Promise<KVClient | null> {
  if (_kv) return _kv;
  try {
    const mod = await import('@vercel/kv');
    _kv = mod.kv as unknown as KVClient;
    return _kv;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Core: generate a single embedding vector with KV caching
// ---------------------------------------------------------------------------

/**
 * Generate an embedding vector for the given text using
 * OpenAI text-embedding-3-small (1536 dimensions).
 *
 * Results are cached in Vercel KV under "emb:{sha256(text)}" for 30 days.
 * If KV is unavailable, caching is silently skipped.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const normalizedText = text.trim().slice(0, 8000);

  // --- Cache read ---
  let cacheKey: string | null = null;
  try {
    const kv = await getKV();
    if (kv) {
      const hash = await sha256Hex(normalizedText);
      cacheKey = `emb:${hash}`;
      const cached = await kv.get<number[]>(cacheKey);
      if (cached && Array.isArray(cached)) return cached;
    }
  } catch {
    // KV unavailable or error — continue without cache
  }

  // --- OpenAI API call ---
  if (!OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY is not configured. Set it to use semantic search.'
    );
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: normalizedText,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI embeddings error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as { data: { embedding: number[] }[] };
  const embedding = data.data[0].embedding;

  // --- Cache write ---
  if (cacheKey) {
    try {
      const kv = await getKV();
      if (kv) {
        // Cache for 30 days (in seconds)
        await kv.set(cacheKey, embedding, { ex: 60 * 60 * 24 * 30 });
      }
    } catch {
      // KV write failed — non-fatal
    }
  }

  return embedding;
}

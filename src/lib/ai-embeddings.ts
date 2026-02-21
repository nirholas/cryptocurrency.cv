/**
 * AI Embeddings — semantic vector utilities for crypto news
 *
 * Uses OpenAI text-embedding-3-small (1536-dim, low cost) for all embedding
 * operations.  Falls back to a simple TF-IDF bag-of-words when the API key is
 * not configured so the module is always functional.
 */

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

/** Read at call-time so tests and edge runtimes can set the env var dynamically. */
function getApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface EmbeddingDocument {
  id: string;
  text: string;
}

export interface ScoredDocument {
  id: string;
  score: number;
}

// --------------------------------------------------------------------------
// Core: generate a single embedding vector
// --------------------------------------------------------------------------

/**
 * Generate an embedding vector for the given text.
 * Returns a float array of length 1536 when using the OpenAI model, or a
 * sparse fallback vector when no API key is available.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!getApiKey()) {
    return sparseEmbedding(text);
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text.slice(0, 8000), // model max ~8K tokens; chars are safe approximation
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI embeddings error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as { data: { embedding: number[] }[] };
  return data.data[0].embedding;
}

/**
 * Batch-generate embeddings for multiple texts in a single API call (up to 100).
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  if (!getApiKey()) {
    return texts.map(sparseEmbedding);
  }

  const batches: string[][] = [];
  for (let i = 0; i < texts.length; i += 100) {
    batches.push(texts.slice(i, i + 100));
  }

  const results: number[][] = [];
  for (const batch of batches) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: batch.map((t) => t.slice(0, 8000)),
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI embeddings error ${response.status}: ${err}`);
    }

    const data = (await response.json()) as {
      data: { index: number; embedding: number[] }[];
    };
    // API returns results in the same order as input
    data.data
      .sort((a, b) => a.index - b.index)
      .forEach((item) => results.push(item.embedding));
  }

  return results;
}

// --------------------------------------------------------------------------
// Math utilities
// --------------------------------------------------------------------------

/**
 * Cosine similarity between two equal-length vectors (range -1 to 1).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }

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

/**
 * Euclidean (L2) distance between two equal-length vectors.
 */
export function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(
    a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0)
  );
}

// --------------------------------------------------------------------------
// Semantic search
// --------------------------------------------------------------------------

/**
 * Find the most semantically similar documents to a query string.
 *
 * @param query   Natural-language search query
 * @param docs    Corpus of documents with id + text
 * @param topK    Maximum results to return (default 10)
 * @returns       Documents sorted by descending cosine similarity
 */
export async function semanticSearch(
  query: string,
  docs: EmbeddingDocument[],
  topK = 10
): Promise<ScoredDocument[]> {
  if (docs.length === 0) return [];

  const [queryVec, docVecs] = await Promise.all([
    generateEmbedding(query),
    generateEmbeddings(docs.map((d) => d.text)),
  ]);

  const scored: ScoredDocument[] = docs.map((doc, i) => ({
    id: doc.id,
    score: cosineSimilarity(queryVec, docVecs[i]),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

/**
 * Re-rank an already-retrieved list of documents by semantic similarity.
 * Useful as a second-pass after a keyword search.
 */
export async function rerank(
  query: string,
  docs: EmbeddingDocument[],
  topK = 10
): Promise<ScoredDocument[]> {
  return semanticSearch(query, docs, topK);
}

// --------------------------------------------------------------------------
// Fallback: sparse term-frequency embedding (no API key required)
// --------------------------------------------------------------------------

const VOCAB_SIZE = 1024;

function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
    h = h >>> 0; // unsigned 32-bit
  }
  return h;
}

function sparseEmbedding(text: string): number[] {
  const vec = new Array<number>(VOCAB_SIZE).fill(0);

  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  for (const token of tokens) {
    const idx = hashString(token) % VOCAB_SIZE;
    vec[idx] += 1;
  }

  // L2 normalise
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return norm === 0 ? vec : vec.map((v) => v / norm);
}

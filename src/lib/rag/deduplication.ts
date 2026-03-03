/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Document Deduplication — Near-Duplicate Detection & Cleanup
 *
 * Identifies and handles duplicate/near-duplicate documents in the
 * vector store index to improve retrieval precision and avoid
 * repetitive context in RAG answers.
 *
 * Methods:
 *   - MinHash (Jaccard approximation) — fast, good for near-duplicates
 *   - SimHash (fingerprint-based)     — very fast, locality-sensitive
 *   - Embedding similarity            — most accurate, uses vector distance
 *
 * Deduplication strategies:
 *   - keep_newest:       Retain the most recently published document
 *   - keep_highest_vote: Retain the document with the highest vote score
 *   - keep_best_source:  Retain based on source credibility ranking
 *   - merge:             Combine metadata from duplicates into a single doc
 *
 * Usage:
 *   import { findDuplicates, deduplicateDocuments } from '@/lib/rag/deduplication';
 *
 *   const dupes = await findDuplicates(documents, { threshold: 0.9 });
 *   const cleaned = deduplicateDocuments(documents, dupes, 'keep_newest');
 *
 * @module deduplication
 */

import { generateEmbedding } from "./embedding-service";
import { ragLogger } from "./observability";
import type { ScoredDocument } from "./types";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type DeduplicationMethod = "minhash" | "simhash" | "embedding";
export type DeduplicationStrategy =
  | "keep_newest"
  | "keep_highest_vote"
  | "keep_best_source"
  | "merge";

export interface DeduplicationOptions {
  /** Detection method (default: 'minhash') */
  method?: DeduplicationMethod;
  /** Similarity threshold to consider as duplicate (0–1, default: 0.9) */
  threshold?: number;
  /** Number of hash functions for MinHash (default: 128) */
  numHashes?: number;
  /** Number of bits for SimHash fingerprints (default: 64) */
  simHashBits?: number;
  /** N-gram size for shingling (default: 3 words) */
  shingleSize?: number;
}

export interface DuplicateCluster {
  /** Cluster ID */
  id: string;
  /** Document IDs in this cluster */
  documentIds: string[];
  /** Pairwise similarity between the documents */
  similarity: number;
  /** The "canonical" document (the one to keep depending on strategy) */
  canonicalId?: string;
}

export interface DeduplicationResult {
  /** Clusters of duplicate documents */
  clusters: DuplicateCluster[];
  /** Total duplicate documents found */
  totalDuplicates: number;
  /** Unique documents (not duplicates) */
  uniqueCount: number;
  /** Method used */
  method: DeduplicationMethod;
  /** Threshold used */
  threshold: number;
  /** Processing time in ms */
  processingTime: number;
}

// ═══════════════════════════════════════════════════════════════
// MINHASH
// ═══════════════════════════════════════════════════════════════

/**
 * MinHash signature for approximate Jaccard similarity.
 *
 * Represents a document as a fixed-size "signature" of minimum
 * hash values over its shingle set. Comparing two signatures gives
 * an unbiased estimate of their Jaccard similarity.
 */
class MinHashSignature {
  private numHashes: number;
  private hashA: Uint32Array;
  private hashB: Uint32Array;

  constructor(numHashes: number) {
    this.numHashes = numHashes;
    // Random hash parameters (a*x + b mod p)
    this.hashA = new Uint32Array(numHashes);
    this.hashB = new Uint32Array(numHashes);
    for (let i = 0; i < numHashes; i++) {
      this.hashA[i] = Math.floor(Math.random() * 0x7fffffff) + 1;
      this.hashB[i] = Math.floor(Math.random() * 0x7fffffff);
    }
  }

  /**
   * Compute the MinHash signature for a set of shingles.
   */
  computeSignature(shingles: Set<number>): Uint32Array {
    const LARGE_PRIME = 4294967291; // Largest prime < 2^32
    const signature = new Uint32Array(this.numHashes).fill(0xffffffff);

    for (const shingle of shingles) {
      for (let i = 0; i < this.numHashes; i++) {
        const hash =
          ((this.hashA[i] * shingle + this.hashB[i]) % LARGE_PRIME) >>> 0;
        if (hash < signature[i]) {
          signature[i] = hash;
        }
      }
    }

    return signature;
  }

  /**
   * Estimate Jaccard similarity from two MinHash signatures.
   */
  estimateSimilarity(sig1: Uint32Array, sig2: Uint32Array): number {
    let matches = 0;
    for (let i = 0; i < this.numHashes; i++) {
      if (sig1[i] === sig2[i]) matches++;
    }
    return matches / this.numHashes;
  }
}

// ═══════════════════════════════════════════════════════════════
// SIMHASH
// ═══════════════════════════════════════════════════════════════

/**
 * SimHash — locality-sensitive hash fingerprint.
 *
 * Produces a fixed-length bit fingerprint where similar documents
 * have fingerprints with few differing bits (low Hamming distance).
 */
function computeSimHash(tokens: string[], bits = 64): bigint {
  const counts = new Array<number>(bits).fill(0);

  for (const token of tokens) {
    const hash = fnv1aHash(token, bits);
    for (let i = 0; i < bits; i++) {
      if ((hash >> BigInt(i)) & 1n) {
        counts[i]++;
      } else {
        counts[i]--;
      }
    }
  }

  let fingerprint = 0n;
  for (let i = 0; i < bits; i++) {
    if (counts[i] >= 0) {
      fingerprint |= 1n << BigInt(i);
    }
  }

  return fingerprint;
}

/**
 * Hamming distance between two SimHash fingerprints.
 */
function hammingDistance(a: bigint, b: bigint): number {
  let xor = a ^ b;
  let distance = 0;
  while (xor > 0n) {
    distance += Number(xor & 1n);
    xor >>= 1n;
  }
  return distance;
}

/**
 * Convert Hamming distance to similarity score (0–1).
 */
function hammingToSimilarity(distance: number, bits: number): number {
  return 1 - distance / bits;
}

/**
 * FNV-1a hash producing a bigint of specified bit width.
 */
function fnv1aHash(str: string, bits: number): bigint {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = (1n << BigInt(bits)) - 1n;

  for (let i = 0; i < str.length; i++) {
    hash ^= BigInt(str.charCodeAt(i));
    hash = (hash * prime) & mask;
  }

  return hash;
}

// ═══════════════════════════════════════════════════════════════
// SHINGLING
// ═══════════════════════════════════════════════════════════════

/**
 * Generate word-level shingles (n-grams) from text.
 * Returns a set of hashed shingle values.
 */
function generateShingles(text: string, shingleSize: number): Set<number> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 0);

  const shingles = new Set<number>();

  for (let i = 0; i <= words.length - shingleSize; i++) {
    const shingle = words.slice(i, i + shingleSize).join(" ");
    shingles.add(simpleHash(shingle));
  }

  return shingles;
}

/**
 * Simple string → 32-bit integer hash (for shingles).
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return hash >>> 0;
}

/**
 * Tokenize text into words for SimHash.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

// ═══════════════════════════════════════════════════════════════
// DUPLICATE FINDER
// ═══════════════════════════════════════════════════════════════

/**
 * Find duplicate/near-duplicate document clusters.
 */
export async function findDuplicates(
  documents: ScoredDocument[],
  options: DeduplicationOptions = {},
): Promise<DeduplicationResult> {
  const {
    method = "minhash",
    threshold = 0.9,
    numHashes = 128,
    simHashBits = 64,
    shingleSize = 3,
  } = options;

  const startTime = Date.now();

  ragLogger.debug("Deduplication started", undefined, {
    method,
    threshold,
    docCount: documents.length,
  });

  let clusters: DuplicateCluster[];

  switch (method) {
    case "minhash":
      clusters = findDuplicatesMinHash(
        documents,
        threshold,
        numHashes,
        shingleSize,
      );
      break;
    case "simhash":
      clusters = findDuplicatesSimHash(documents, threshold, simHashBits);
      break;
    case "embedding":
      clusters = await findDuplicatesEmbedding(documents, threshold);
      break;
    default:
      clusters = findDuplicatesMinHash(
        documents,
        threshold,
        numHashes,
        shingleSize,
      );
  }

  const duplicateIds = new Set<string>();
  for (const cluster of clusters) {
    for (const id of cluster.documentIds) {
      duplicateIds.add(id);
    }
  }

  const result: DeduplicationResult = {
    clusters,
    totalDuplicates: duplicateIds.size,
    uniqueCount: documents.length - duplicateIds.size + clusters.length, // clusters contribute 1 each (the canonical)
    method,
    threshold,
    processingTime: Date.now() - startTime,
  };

  ragLogger.debug("Deduplication completed", undefined, {
    clusters: clusters.length,
    totalDuplicates: result.totalDuplicates,
    processingTime: result.processingTime,
  });

  return result;
}

/**
 * MinHash-based duplicate detection.
 */
function findDuplicatesMinHash(
  documents: ScoredDocument[],
  threshold: number,
  numHashes: number,
  shingleSize: number,
): DuplicateCluster[] {
  const minhash = new MinHashSignature(numHashes);

  // Compute signatures
  const signatures = documents.map((doc) => {
    const text = `${doc.title} ${doc.content}`;
    const shingles = generateShingles(text, shingleSize);
    return { id: doc.id, sig: minhash.computeSignature(shingles) };
  });

  // Find similar pairs (brute-force for now; use LSH bands for large scale)
  return clusterSimilarPairs(signatures, threshold, (a, b) =>
    minhash.estimateSimilarity(a.sig, b.sig),
  );
}

/**
 * SimHash-based duplicate detection.
 */
function findDuplicatesSimHash(
  documents: ScoredDocument[],
  threshold: number,
  bits: number,
): DuplicateCluster[] {
  const fingerprints = documents.map((doc) => {
    const text = `${doc.title} ${doc.content}`;
    const tokens = tokenize(text);
    return { id: doc.id, fp: computeSimHash(tokens, bits), bits };
  });

  return clusterSimilarPairs(fingerprints, threshold, (a, b) =>
    hammingToSimilarity(hammingDistance(a.fp, b.fp), bits),
  );
}

/**
 * Embedding-based duplicate detection (most accurate, slowest).
 */
async function findDuplicatesEmbedding(
  documents: ScoredDocument[],
  threshold: number,
): Promise<DuplicateCluster[]> {
  // Generate embeddings
  const embeddings = await Promise.all(
    documents.map(async (doc) => {
      const text = `${doc.title} ${doc.content}`.slice(0, 500);
      const emb = await generateEmbedding(text);
      return { id: doc.id, emb };
    }),
  );

  return clusterSimilarPairs(embeddings, threshold, (a, b) => {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.emb.length; i++) {
      dot += a.emb[i] * b.emb[i];
      normA += a.emb[i] * a.emb[i];
      normB += b.emb[i] * b.emb[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  });
}

/**
 * Generic clustering of similar pairs using Union-Find.
 */
function clusterSimilarPairs<T extends { id: string }>(
  items: T[],
  threshold: number,
  similarityFn: (a: T, b: T) => number,
): DuplicateCluster[] {
  // Union-Find
  const parent = new Map<string, string>();
  const maxSim = new Map<string, number>();

  function find(x: string): string {
    if (!parent.has(x)) parent.set(x, x);
    const px = parent.get(x) ?? x;
    if (px !== x) {
      parent.set(x, find(px));
    }
    return parent.get(x) ?? x;
  }

  function union(x: string, y: string): void {
    const rx = find(x);
    const ry = find(y);
    if (rx !== ry) parent.set(rx, ry);
  }

  // Compare all pairs
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const sim = similarityFn(items[i], items[j]);
      if (sim >= threshold) {
        union(items[i].id, items[j].id);

        const key = `${items[i].id}|${items[j].id}`;
        maxSim.set(key, sim);
      }
    }
  }

  // Group by root
  const groups = new Map<string, string[]>();
  for (const item of items) {
    const root = find(item.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)?.push(item.id);
  }

  // Only keep clusters with 2+ members
  const clusters: DuplicateCluster[] = [];
  let clusterIdx = 0;

  for (const [_, memberIds] of groups) {
    if (memberIds.length < 2) continue;

    // Find the average pairwise similarity
    let totalSim = 0;
    let pairCount = 0;
    for (let i = 0; i < memberIds.length; i++) {
      for (let j = i + 1; j < memberIds.length; j++) {
        const key1 = `${memberIds[i]}|${memberIds[j]}`;
        const key2 = `${memberIds[j]}|${memberIds[i]}`;
        totalSim += maxSim.get(key1) ?? maxSim.get(key2) ?? threshold;
        pairCount++;
      }
    }

    clusters.push({
      id: `cluster_${clusterIdx++}`,
      documentIds: memberIds,
      similarity: pairCount > 0 ? totalSim / pairCount : threshold,
    });
  }

  return clusters;
}

// ═══════════════════════════════════════════════════════════════
// DEDUPLICATION APPLICATION
// ═══════════════════════════════════════════════════════════════

/** Source credibility ranking (higher = more credible) */
const SOURCE_CREDIBILITY: Record<string, number> = {
  coindesk: 10,
  "the block": 9,
  cointelegraph: 8,
  decrypt: 8,
  "bitcoin magazine": 7,
  blockworks: 7,
  "the defiant": 6,
  "crypto briefing": 5,
  cryptopanic: 4,
  unknown: 1,
};

/**
 * Apply a deduplication strategy to remove duplicates from a document set.
 *
 * For each duplicate cluster, selects one canonical document and removes
 * the rest from the output.
 */
export function deduplicateDocuments(
  documents: ScoredDocument[],
  result: DeduplicationResult,
  strategy: DeduplicationStrategy = "keep_newest",
): ScoredDocument[] {
  // Assign canonical IDs
  const docMap = new Map(documents.map((d) => [d.id, d]));
  const removeIds = new Set<string>();

  for (const cluster of result.clusters) {
    const clusterDocs = cluster.documentIds
      .map((id) => docMap.get(id))
      .filter(Boolean) as ScoredDocument[];

    if (clusterDocs.length < 2) continue;

    let canonical: ScoredDocument;

    switch (strategy) {
      case "keep_newest":
        canonical = clusterDocs.sort((a, b) => {
          const dateA = a.publishedAt?.getTime() ?? 0;
          const dateB = b.publishedAt?.getTime() ?? 0;
          return dateB - dateA;
        })[0];
        break;

      case "keep_highest_vote":
        canonical = clusterDocs.sort(
          (a, b) => (b.voteScore ?? 0) - (a.voteScore ?? 0),
        )[0];
        break;

      case "keep_best_source":
        canonical = clusterDocs.sort((a, b) => {
          const credA =
            SOURCE_CREDIBILITY[a.source.toLowerCase()] ??
            SOURCE_CREDIBILITY.unknown;
          const credB =
            SOURCE_CREDIBILITY[b.source.toLowerCase()] ??
            SOURCE_CREDIBILITY.unknown;
          return credB - credA;
        })[0];
        break;

      case "merge":
        // Keep the newest but merge vote scores
        canonical = clusterDocs.sort((a, b) => {
          const dateA = a.publishedAt?.getTime() ?? 0;
          const dateB = b.publishedAt?.getTime() ?? 0;
          return dateB - dateA;
        })[0];

        // Merge: take the max vote score and combine metadata
        const maxVote = Math.max(...clusterDocs.map((d) => d.voteScore ?? 0));
        canonical = { ...canonical, voteScore: maxVote };
        // Update in the doc map
        docMap.set(canonical.id, canonical);
        break;

      default:
        canonical = clusterDocs[0];
    }

    cluster.canonicalId = canonical.id;

    // Mark non-canonical documents for removal
    for (const doc of clusterDocs) {
      if (doc.id !== canonical.id) {
        removeIds.add(doc.id);
      }
    }
  }

  return documents.filter((d) => !removeIds.has(d.id));
}

/**
 * Quick dedup: find duplicates and apply strategy in one call.
 */
export async function quickDedup(
  documents: ScoredDocument[],
  options: DeduplicationOptions & { strategy?: DeduplicationStrategy } = {},
): Promise<{ documents: ScoredDocument[]; result: DeduplicationResult }> {
  const { strategy = "keep_newest", ...dedupOptions } = options;
  const result = await findDuplicates(documents, dedupOptions);
  const cleaned = deduplicateDocuments(documents, result, strategy);
  return { documents: cleaned, result };
}

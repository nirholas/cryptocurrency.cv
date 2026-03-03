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
 * Semantic Chunking — Intelligent Pre-Indexing Document Segmentation
 *
 * Splits documents into semantically coherent chunks before embedding,
 * improving retrieval precision vs. fixed-size chunking.
 *
 * Methods:
 *   - sentence_similarity: Split where consecutive sentence similarity drops
 *   - topic_boundary:      Detect topic shifts using windowed similarity
 *   - fixed_overlap:       Traditional fixed-size + overlap (baseline)
 *   - hybrid:              Combine sentence similarity + topic boundary signals
 *
 * Each chunk preserves:
 *   - Source metadata (title, source, pubDate, etc.)
 *   - Positional info (chunk index, total chunks, character offsets)
 *   - Overlap markers for context continuity
 *
 * Usage:
 *   import { semanticChunk, SemanticChunker } from '@/lib/rag/semantic-chunking';
 *
 *   const chunks = await semanticChunk(document, {
 *     method: 'sentence_similarity',
 *     targetSize: 512,
 *     overlap: 50,
 *   });
 *
 * @module semantic-chunking
 */

import { generateEmbedding } from "./embedding-service";
import { ragLogger } from "./observability";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type ChunkingMethod =
  | "sentence_similarity"
  | "topic_boundary"
  | "fixed_overlap"
  | "hybrid";

export interface ChunkingOptions {
  /** Chunking strategy (default: 'sentence_similarity') */
  method?: ChunkingMethod;
  /** Target chunk size in characters (default: 512) */
  targetSize?: number;
  /** Maximum chunk size in characters (default: 1024) */
  maxSize?: number;
  /** Overlap between chunks in characters (default: 50) */
  overlap?: number;
  /** Similarity drop threshold to trigger a split (0–1, default: 0.5) */
  similarityThreshold?: number;
  /** Window size for topic boundary detection (default: 3 sentences) */
  windowSize?: number;
  /** Preserve paragraph structure where possible (default: true) */
  preserveStructure?: boolean;
}

export interface DocumentChunk {
  /** Unique chunk ID (docId + chunk index) */
  id: string;
  /** The chunk text content */
  content: string;
  /** Source document ID */
  documentId: string;
  /** Chunk index within the source document (0-based) */
  chunkIndex: number;
  /** Total chunks from the source document */
  totalChunks: number;
  /** Character offset start in original document */
  charStart: number;
  /** Character offset end in original document */
  charEnd: number;
  /** Inherited metadata from source document */
  metadata: ChunkMetadata;
  /** Quality score: how semantically coherent this chunk is (0–1) */
  coherenceScore: number;
}

export interface ChunkMetadata {
  title: string;
  source: string;
  pubDate?: string;
  url?: string;
  voteScore?: number;
  /** Original fields pass-through */
  [key: string]: unknown;
}

export interface ChunkingResult {
  chunks: DocumentChunk[];
  method: ChunkingMethod;
  stats: {
    inputLength: number;
    chunkCount: number;
    avgChunkSize: number;
    minChunkSize: number;
    maxChunkSize: number;
    avgCoherence: number;
  };
}

interface Sentence {
  text: string;
  start: number;
  end: number;
  embedding?: number[];
}

// ═══════════════════════════════════════════════════════════════
// SEMANTIC CHUNKER
// ═══════════════════════════════════════════════════════════════

export class SemanticChunker {
  // ─────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────

  /**
   * Chunk a document using the specified method.
   */
  async chunk(
    documentId: string,
    content: string,
    metadata: ChunkMetadata,
    options: ChunkingOptions = {},
  ): Promise<ChunkingResult> {
    const {
      method = "sentence_similarity",
      targetSize = 512,
      maxSize = 1024,
      overlap = 50,
      similarityThreshold = 0.5,
      windowSize = 3,
      preserveStructure = true,
    } = options;

    ragLogger.debug("Semantic chunking started", undefined, {
      documentId,
      method,
      contentLength: content.length,
    });

    let rawChunks: Array<{
      content: string;
      charStart: number;
      charEnd: number;
    }>;

    switch (method) {
      case "sentence_similarity":
        rawChunks = await this.chunkBySentenceSimilarity(
          content,
          targetSize,
          maxSize,
          similarityThreshold,
        );
        break;

      case "topic_boundary":
        rawChunks = await this.chunkByTopicBoundary(
          content,
          targetSize,
          maxSize,
          windowSize,
          similarityThreshold,
        );
        break;

      case "hybrid":
        rawChunks = await this.chunkHybrid(
          content,
          targetSize,
          maxSize,
          similarityThreshold,
          windowSize,
        );
        break;

      case "fixed_overlap":
      default:
        rawChunks = this.chunkFixedOverlap(
          content,
          targetSize,
          overlap,
          preserveStructure,
        );
        break;
    }

    // Build DocumentChunk objects
    const totalChunks = rawChunks.length;
    const chunks: DocumentChunk[] = rawChunks.map((raw, idx) => ({
      id: `${documentId}__chunk_${idx}`,
      content: raw.content,
      documentId,
      chunkIndex: idx,
      totalChunks,
      charStart: raw.charStart,
      charEnd: raw.charEnd,
      metadata,
      coherenceScore: 0, // Will be filled below
    }));

    // Score coherence
    await this.scoreCoherence(chunks);

    // Stats
    const sizes = chunks.map((c) => c.content.length);
    const result: ChunkingResult = {
      chunks,
      method,
      stats: {
        inputLength: content.length,
        chunkCount: chunks.length,
        avgChunkSize:
          sizes.length > 0
            ? sizes.reduce((a, b) => a + b, 0) / sizes.length
            : 0,
        minChunkSize: sizes.length > 0 ? Math.min(...sizes) : 0,
        maxChunkSize: sizes.length > 0 ? Math.max(...sizes) : 0,
        avgCoherence:
          chunks.length > 0
            ? chunks.reduce((a, c) => a + c.coherenceScore, 0) / chunks.length
            : 0,
      },
    };

    ragLogger.debug("Semantic chunking completed", undefined, {
      documentId,
      chunkCount: result.stats.chunkCount,
      avgSize: Math.round(result.stats.avgChunkSize),
    });

    return result;
  }

  // ─────────────────────────────────────────────────────────────
  // SENTENCE SIMILARITY CHUNKING
  // ─────────────────────────────────────────────────────────────

  /**
   * Split where consecutive sentence-pair cosine similarity drops
   * below a threshold. Groups consecutive similar sentences into chunks.
   */
  private async chunkBySentenceSimilarity(
    content: string,
    targetSize: number,
    maxSize: number,
    threshold: number,
  ): Promise<Array<{ content: string; charStart: number; charEnd: number }>> {
    const sentences = splitSentences(content);
    if (sentences.length <= 1) {
      return [
        { content: content.trim(), charStart: 0, charEnd: content.length },
      ];
    }

    // Generate embeddings for all sentences
    const embeddings = await Promise.all(
      sentences.map((s) => generateEmbedding(s.text)),
    );
    sentences.forEach((s, i) => (s.embedding = embeddings[i]));

    // Compute pairwise cosine similarities
    const similarities: number[] = [];
    for (let i = 0; i < sentences.length - 1; i++) {
      const embA = sentences[i].embedding ?? [];
      const embB = sentences[i + 1].embedding ?? [];
      similarities.push(cosineSim(embA, embB));
    }

    // Find split points where similarity drops
    const splitIndices: number[] = [];
    for (let i = 0; i < similarities.length; i++) {
      if (similarities[i] < threshold) {
        splitIndices.push(i + 1); // Split AFTER sentence i
      }
    }

    // Build chunks from split points
    const chunks = buildChunksFromSplits(sentences, splitIndices, content);

    // Enforce maxSize: further split any chunks that are too large
    return enforceMaxSize(chunks, maxSize);
  }

  // ─────────────────────────────────────────────────────────────
  // TOPIC BOUNDARY CHUNKING
  // ─────────────────────────────────────────────────────────────

  /**
   * Detect topic changes by comparing windowed sentence group embeddings.
   * A topic boundary is detected when the similarity between two
   * consecutive windows drops significantly.
   */
  private async chunkByTopicBoundary(
    content: string,
    targetSize: number,
    maxSize: number,
    windowSize: number,
    threshold: number,
  ): Promise<Array<{ content: string; charStart: number; charEnd: number }>> {
    const sentences = splitSentences(content);
    if (sentences.length <= windowSize * 2) {
      return [
        { content: content.trim(), charStart: 0, charEnd: content.length },
      ];
    }

    // Generate embeddings
    const embeddings = await Promise.all(
      sentences.map((s) => generateEmbedding(s.text)),
    );
    sentences.forEach((s, i) => (s.embedding = embeddings[i]));

    // Compute windowed embeddings (average of window sentences)
    const windowEmbeddings: number[][] = [];
    for (let i = 0; i <= sentences.length - windowSize; i++) {
      const window = sentences.slice(i, i + windowSize);
      windowEmbeddings.push(
        averageEmbeddings(window.map((s) => s.embedding ?? [])),
      );
    }

    // Find topic boundaries
    const splitIndices: number[] = [];
    for (let i = 0; i < windowEmbeddings.length - 1; i++) {
      const sim = cosineSim(windowEmbeddings[i], windowEmbeddings[i + 1]);
      if (sim < threshold) {
        // The boundary is at sentence index i + windowSize
        const splitAt = i + windowSize;
        if (splitAt < sentences.length) {
          splitIndices.push(splitAt);
        }
      }
    }

    const chunks = buildChunksFromSplits(sentences, splitIndices, content);
    return enforceMaxSize(chunks, maxSize);
  }

  // ─────────────────────────────────────────────────────────────
  // HYBRID CHUNKING
  // ─────────────────────────────────────────────────────────────

  /**
   * Combine sentence similarity + topic boundary signals.
   * A split point is placed where EITHER method triggers.
   */
  private async chunkHybrid(
    content: string,
    targetSize: number,
    maxSize: number,
    threshold: number,
    windowSize: number,
  ): Promise<Array<{ content: string; charStart: number; charEnd: number }>> {
    const sentences = splitSentences(content);
    if (sentences.length <= 2) {
      return [
        { content: content.trim(), charStart: 0, charEnd: content.length },
      ];
    }

    const embeddings = await Promise.all(
      sentences.map((s) => generateEmbedding(s.text)),
    );
    sentences.forEach((s, i) => (s.embedding = embeddings[i]));

    const splitPoints = new Set<number>();

    // Sentence-level similarity splits
    for (let i = 0; i < sentences.length - 1; i++) {
      const sim = cosineSim(
        sentences[i].embedding ?? [],
        sentences[i + 1].embedding ?? [],
      );
      if (sim < threshold) {
        splitPoints.add(i + 1);
      }
    }

    // Topic boundary splits
    if (sentences.length > windowSize * 2) {
      const windowEmbs: number[][] = [];
      for (let i = 0; i <= sentences.length - windowSize; i++) {
        windowEmbs.push(
          averageEmbeddings(
            sentences.slice(i, i + windowSize).map((s) => s.embedding ?? []),
          ),
        );
      }
      for (let i = 0; i < windowEmbs.length - 1; i++) {
        const sim = cosineSim(windowEmbs[i], windowEmbs[i + 1]);
        if (sim < threshold * 0.9) {
          // Slightly tighter threshold for topic boundaries
          const splitAt = i + windowSize;
          if (splitAt < sentences.length) splitPoints.add(splitAt);
        }
      }
    }

    const sortedSplits = [...splitPoints].sort((a, b) => a - b);
    const chunks = buildChunksFromSplits(sentences, sortedSplits, content);
    return enforceMaxSize(chunks, maxSize);
  }

  // ─────────────────────────────────────────────────────────────
  // FIXED OVERLAP CHUNKING (BASELINE)
  // ─────────────────────────────────────────────────────────────

  /**
   * Traditional fixed-size chunking with overlap.
   * Optionally respects paragraph boundaries.
   */
  private chunkFixedOverlap(
    content: string,
    targetSize: number,
    overlap: number,
    preserveStructure: boolean,
  ): Array<{ content: string; charStart: number; charEnd: number }> {
    if (content.length <= targetSize) {
      return [
        { content: content.trim(), charStart: 0, charEnd: content.length },
      ];
    }

    const chunks: Array<{
      content: string;
      charStart: number;
      charEnd: number;
    }> = [];
    let start = 0;

    while (start < content.length) {
      let end = Math.min(start + targetSize, content.length);

      // If preserving structure, try to end at a sentence boundary
      if (preserveStructure && end < content.length) {
        const sentenceEnd = findSentenceEnd(content, start, end);
        if (sentenceEnd > start + targetSize * 0.5) {
          end = sentenceEnd;
        }
      }

      const text = content.slice(start, end).trim();
      if (text.length > 0) {
        chunks.push({ content: text, charStart: start, charEnd: end });
      }

      start = end - overlap;
      if (start >= content.length) break;
      // Prevent infinite loop
      if (start <= chunks[chunks.length - 1]?.charStart) break;
    }

    return chunks;
  }

  // ─────────────────────────────────────────────────────────────
  // COHERENCE SCORING
  // ─────────────────────────────────────────────────────────────

  /**
   * Score how semantically coherent each chunk is.
   * Uses embedding self-similarity of sentences within the chunk.
   */
  private async scoreCoherence(chunks: DocumentChunk[]): Promise<void> {
    for (const chunk of chunks) {
      const sentences = splitSentences(chunk.content);

      if (sentences.length <= 1) {
        chunk.coherenceScore = 1.0;
        continue;
      }

      // For efficiency, sample up to 5 sentences
      const sampled =
        sentences.length <= 5
          ? sentences
          : sentences
              .filter((_, i) => i % Math.ceil(sentences.length / 5) === 0)
              .slice(0, 5);

      try {
        const embeddings = await Promise.all(
          sampled.map((s) => generateEmbedding(s.text)),
        );

        // Average pairwise similarity
        let totalSim = 0;
        let pairs = 0;
        for (let i = 0; i < embeddings.length - 1; i++) {
          for (let j = i + 1; j < embeddings.length; j++) {
            totalSim += cosineSim(embeddings[i], embeddings[j]);
            pairs++;
          }
        }

        chunk.coherenceScore = pairs > 0 ? totalSim / pairs : 1.0;
      } catch {
        chunk.coherenceScore = 0.5; // Default on error
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Split text into sentences with position tracking.
 */
function splitSentences(text: string): Sentence[] {
  // Split on sentence-ending punctuation followed by whitespace or end of string
  const regex = /[^.!?\n]+(?:[.!?\n](?:\s|$))?/g;
  const sentences: Sentence[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const trimmed = match[0].trim();
    if (trimmed.length > 5) {
      // Skip very short fragments
      sentences.push({
        text: trimmed,
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  // If regex produced nothing, fall back to splitting on newlines/periods
  if (sentences.length === 0 && text.trim().length > 0) {
    sentences.push({
      text: text.trim(),
      start: 0,
      end: text.length,
    });
  }

  return sentences;
}

/**
 * Cosine similarity between two vectors.
 */
function cosineSim(a: number[], b: number[]): number {
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

/**
 * Average multiple embedding vectors element-wise.
 */
function averageEmbeddings(embeddings: number[][]): number[] {
  if (embeddings.length === 0) return [];
  const dim = embeddings[0].length;
  const avg = new Array(dim).fill(0);

  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) {
      avg[i] += emb[i];
    }
  }

  for (let i = 0; i < dim; i++) {
    avg[i] /= embeddings.length;
  }

  return avg;
}

/**
 * Build chunk objects from sentence arrays and split indices.
 */
function buildChunksFromSplits(
  sentences: Sentence[],
  splitIndices: number[],
  originalText: string,
): Array<{ content: string; charStart: number; charEnd: number }> {
  const chunks: Array<{ content: string; charStart: number; charEnd: number }> =
    [];
  let prevSplit = 0;

  const splits = [...splitIndices, sentences.length];

  for (const splitIdx of splits) {
    const chunkSentences = sentences.slice(prevSplit, splitIdx);
    if (chunkSentences.length === 0) continue;

    const charStart = chunkSentences[0].start;
    const charEnd = chunkSentences[chunkSentences.length - 1].end;
    const content = originalText.slice(charStart, charEnd).trim();

    if (content.length > 0) {
      chunks.push({ content, charStart, charEnd });
    }

    prevSplit = splitIdx;
  }

  return chunks;
}

/**
 * Enforce maximum chunk size by splitting oversized chunks at sentence boundaries.
 */
function enforceMaxSize(
  chunks: Array<{ content: string; charStart: number; charEnd: number }>,
  maxSize: number,
): Array<{ content: string; charStart: number; charEnd: number }> {
  const result: Array<{ content: string; charStart: number; charEnd: number }> =
    [];

  for (const chunk of chunks) {
    if (chunk.content.length <= maxSize) {
      result.push(chunk);
      continue;
    }

    // Split oversized chunk
    const subSentences = splitSentences(chunk.content);
    let current: Sentence[] = [];
    let currentLen = 0;

    for (const sent of subSentences) {
      if (currentLen + sent.text.length > maxSize && current.length > 0) {
        const text = current.map((s) => s.text).join(" ");
        result.push({
          content: text,
          charStart: chunk.charStart + current[0].start,
          charEnd: chunk.charStart + current[current.length - 1].end,
        });
        current = [];
        currentLen = 0;
      }
      current.push(sent);
      currentLen += sent.text.length;
    }

    if (current.length > 0) {
      const text = current.map((s) => s.text).join(" ");
      result.push({
        content: text,
        charStart: chunk.charStart + current[0].start,
        charEnd: chunk.charStart + current[current.length - 1].end,
      });
    }
  }

  return result;
}

/**
 * Find the nearest sentence-ending position within a window.
 */
function findSentenceEnd(text: string, start: number, end: number): number {
  // Look backwards from `end` for a sentence-ending punctuation
  for (let i = end; i > start + (end - start) * 0.5; i--) {
    if (
      ".!?\n".includes(text[i]) &&
      (i + 1 >= text.length || /\s/.test(text[i + 1]))
    ) {
      return i + 1;
    }
  }
  return end;
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON & CONVENIENCE
// ═══════════════════════════════════════════════════════════════

let _chunker: SemanticChunker | null = null;

export function getSemanticChunker(): SemanticChunker {
  if (!_chunker) {
    _chunker = new SemanticChunker();
  }
  return _chunker;
}

/**
 * Convenience function: chunk a document with default options.
 */
export async function semanticChunk(
  documentId: string,
  content: string,
  metadata: ChunkMetadata,
  options?: ChunkingOptions,
): Promise<ChunkingResult> {
  return getSemanticChunker().chunk(documentId, content, metadata, options);
}

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
 * MinHash signatures and LSH banding.
 *
 * Grouping N articles by similarity is N² comparisons if you do it directly.
 * At the volume this aggregator ingests (hundreds of articles per window, from
 * 377 feeds) that is tens of thousands of set comparisons per request, on a
 * serverless function, on the read path. It does not fit.
 *
 * MinHash replaces each article's shingle set with a fixed-length signature
 * whose agreement rate estimates Jaccard similarity. LSH then buckets those
 * signatures so that only articles which are plausibly similar are ever
 * compared: the pair count collapses from N² to roughly N times the size of a
 * bucket. What survives that filter gets an exact Jaccard check, so the
 * approximation is a speed optimisation and never the thing a published claim
 * rests on.
 *
 * Everything here is deterministic. The permutation coefficients come from a
 * fixed seed rather than `Math.random`, so the same corpus produces the same
 * story groupings on every server, on every deploy, and in the test suite. A
 * clustering that reshuffled itself per process could not have stable story ids.
 *
 * @module lib/provenance/minhash
 */

/** Signature length. 128 puts the Jaccard estimate's standard error near 1/sqrt(128), about 9%. */
export const SIGNATURE_SIZE = 128;

/**
 * Largest prime below 2^32, the modulus for the permutation family
 * `h_i(x) = (a_i * x + b_i) mod P`.
 */
const MERSENNE_PRIME = 4294967291;

/**
 * FNV-1a, 32-bit. Chosen over a cryptographic hash because this runs over every
 * shingle of every article on the read path and the only property needed is a
 * good avalanche, not collision resistance against an adversary.
 */
export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // hash *= 16777619, kept in 32-bit range without overflowing to a double.
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/**
 * A seeded xorshift generator for the permutation coefficients.
 *
 * The point is reproducibility, not statistical perfection: these numbers are
 * generated once at module load and never again, so the same build always hashes
 * the same way.
 */
function seededCoefficients(size: number, seed: number): { a: Uint32Array; b: Uint32Array } {
  let state = seed >>> 0 || 1;
  const next = () => {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state;
  };
  const a = new Uint32Array(size);
  const b = new Uint32Array(size);
  for (let i = 0; i < size; i++) {
    // `a` must be non-zero for the permutation to be a bijection.
    a[i] = (next() % (MERSENNE_PRIME - 1)) + 1;
    b[i] = next() % MERSENNE_PRIME;
  }
  return { a, b };
}

const { a: COEF_A, b: COEF_B } = seededCoefficients(SIGNATURE_SIZE, 0x9e3779b9);

/**
 * The MinHash signature of a shingle set.
 *
 * An empty set yields a signature of all-max, which shares no minimum with any
 * real signature, so an article we could not tokenise never matches anything
 * rather than matching everything.
 */
export function signature(shingleSet: readonly string[]): Uint32Array {
  const sig = new Uint32Array(SIGNATURE_SIZE).fill(0xffffffff);
  for (const shingle of shingleSet) {
    const h = fnv1a(shingle);
    for (let i = 0; i < SIGNATURE_SIZE; i++) {
      // Multiply in doubles then reduce: a * h can exceed 2^32 and Math.imul
      // would wrap it, which breaks the permutation.
      const permuted = (COEF_A[i] * h + COEF_B[i]) % MERSENNE_PRIME;
      if (permuted < sig[i]) sig[i] = permuted;
    }
  }
  return sig;
}

/**
 * Estimated Jaccard similarity: the fraction of signature positions that agree.
 *
 * Cheap enough to run on every candidate pair, and always confirmed by the
 * exact `jaccard` in ./text before anything is published.
 */
export function estimateSimilarity(a: Uint32Array, b: Uint32Array): number {
  let same = 0;
  for (let i = 0; i < SIGNATURE_SIZE; i++) if (a[i] === b[i]) same++;
  return same / SIGNATURE_SIZE;
}

/**
 * Band configuration for a target similarity threshold.
 *
 * LSH gives two signatures a chance of `1 - (1 - s^rows)^bands` of sharing at
 * least one bucket, where `s` is their true similarity. That curve is an
 * S-curve whose steep part sits near `(1 / bands)^(1 / rows)`, so choosing
 * bands and rows chooses which similarity the filter starts admitting. Picking
 * the configuration whose knee is closest to the caller's threshold keeps
 * recall high without flooding the exact check with garbage candidates.
 */
export function bandConfig(threshold: number): { bands: number; rows: number } {
  const candidates: Array<{ bands: number; rows: number }> = [];
  for (let rows = 2; rows <= 16; rows++) {
    if (SIGNATURE_SIZE % rows !== 0) continue;
    candidates.push({ bands: SIGNATURE_SIZE / rows, rows });
  }
  let best = candidates[0];
  let bestDistance = Infinity;
  for (const c of candidates) {
    const knee = Math.pow(1 / c.bands, 1 / c.rows);
    const distance = Math.abs(knee - threshold);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = c;
    }
  }
  return best;
}

/**
 * Bucket keys for one signature: one opaque key per band.
 *
 * Two signatures sharing any key are candidates. The key mixes the band index
 * in so that identical rows appearing in different bands do not collide, which
 * would manufacture candidates out of nothing.
 */
export function bandKeys(sig: Uint32Array, bands: number, rows: number): string[] {
  const keys: string[] = [];
  for (let band = 0; band < bands; band++) {
    let key = `${band}`;
    for (let row = 0; row < rows; row++) key += `:${sig[band * rows + row]}`;
    keys.push(key);
  }
  return keys;
}

/**
 * Candidate pairs from an LSH index over `signatures`, as `i < j` index pairs.
 *
 * A pathologically popular bucket (hundreds of near-identical wire copies of
 * one press release) is capped rather than expanded, because that single bucket
 * would otherwise reintroduce the N² cost the index exists to avoid. The cap is
 * generous enough that a genuine mega-story keeps its members: what it drops is
 * the tail of an already-saturated bucket.
 *
 * @param signatures  one signature per article, index-aligned with the corpus
 * @param threshold   target similarity, used to pick the band configuration
 * @param maxBucket   largest bucket that is expanded pairwise
 */
export function candidatePairs(
  signatures: readonly Uint32Array[],
  threshold: number,
  maxBucket = 200,
): Array<[number, number]> {
  const { bands, rows } = bandConfig(threshold);
  const buckets = new Map<string, number[]>();

  for (let i = 0; i < signatures.length; i++) {
    for (const key of bandKeys(signatures[i], bands, rows)) {
      const bucket = buckets.get(key);
      if (bucket) {
        if (bucket.length < maxBucket) bucket.push(i);
      } else {
        buckets.set(key, [i]);
      }
    }
  }

  // A pair found in several bands is still one pair.
  const seen = new Set<number>();
  const pairs: Array<[number, number]> = [];
  for (const bucket of buckets.values()) {
    if (bucket.length < 2) continue;
    for (let x = 0; x < bucket.length; x++) {
      for (let y = x + 1; y < bucket.length; y++) {
        const i = bucket[x];
        const j = bucket[y];
        const id = i * signatures.length + j;
        if (seen.has(id)) continue;
        seen.add(id);
        pairs.push([i, j]);
      }
    }
  }
  return pairs;
}

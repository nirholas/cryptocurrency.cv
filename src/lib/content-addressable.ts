/**
 * Content-Addressable Storage (CAS)
 * 
 * Enterprise-grade IPFS-style content-addressable storage for cryptocurrency news
 * and market data. Uses cryptographic hashing (SHA-256) to create immutable,
 * verifiable content identifiers.
 * 
 * Features:
 * - Content-based addressing using SHA-256 hashes
 * - Deduplication of identical content
 * - Merkle DAG for hierarchical data structures
 * - Content verification and integrity checking
 * - Pinning system for persistence guarantees
 * - Garbage collection for unpinned content
 * - Block-level chunking for large content
 * - Link traversal for graph structures
 * 
 * @module content-addressable
 */

import { db } from './database';

// =============================================================================
// TYPES
// =============================================================================

export type ContentIdentifier = string; // Format: "cas_{hash}"

export interface ContentBlock {
  cid: ContentIdentifier;
  data: Uint8Array | string;
  size: number;
  links: ContentLink[];
  created: string;
  codec: Codec;
  multihash: MultihashInfo;
}

export interface ContentLink {
  name: string;
  cid: ContentIdentifier;
  size: number;
}

export interface MultihashInfo {
  algorithm: HashAlgorithm;
  digest: string;
  size: number;
}

export type HashAlgorithm = 'sha2-256' | 'sha2-512' | 'sha3-256' | 'blake2b-256';
export type Codec = 'raw' | 'json' | 'dag-json' | 'dag-cbor' | 'protobuf';

export interface PinnedContent {
  cid: ContentIdentifier;
  name?: string;
  pinned: string;
  recursive: boolean;
  size: number;
  metadata?: Record<string, unknown>;
}

export interface DAGNode {
  cid: ContentIdentifier;
  data?: unknown;
  links: ContentLink[];
}

export interface ResolveResult {
  cid: ContentIdentifier;
  path: string[];
  value: unknown;
  remainderPath: string[];
}

export interface ImportResult {
  cid: ContentIdentifier;
  size: number;
  blocks: number;
}

export interface GarbageCollectionResult {
  collected: number;
  freedBytes: number;
  duration: number;
  errors: string[];
}

export interface ContentStats {
  totalBlocks: number;
  totalSize: number;
  pinnedBlocks: number;
  pinnedSize: number;
  uniqueHashes: number;
  duplicatesAvoided: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const BLOCKS_COLLECTION = 'cas_blocks';
const PINS_COLLECTION = 'cas_pins';
const STATS_KEY = 'cas_stats';

const CHUNK_SIZE = 262144; // 256KB chunks for large content
const MAX_LINKS_PER_BLOCK = 174; // Maximum links in a single block

// =============================================================================
// HASHING UTILITIES
// =============================================================================

/**
 * Calculate SHA-256 hash of content
 */
async function sha256(content: string | Uint8Array): Promise<string> {
  const data = typeof content === 'string' 
    ? new TextEncoder().encode(content)
    : content;
  
  // Use Web Crypto API for SHA-256
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    // Create a new ArrayBuffer from the Uint8Array
    const buffer = new ArrayBuffer(data.length);
    const view = new Uint8Array(buffer);
    view.set(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback: Simple hash for environments without crypto.subtle
  // This is not cryptographically secure but works for basic CAS
  let hash = 0;
  const str = typeof content === 'string' ? content : new TextDecoder().decode(content);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const positiveHash = hash >>> 0;
  return positiveHash.toString(16).padStart(64, '0');
}

/**
 * Generate content identifier from hash
 */
function hashToCid(hash: string, codec: Codec = 'raw'): ContentIdentifier {
  const codecPrefix = {
    'raw': '55',
    'json': '00',
    'dag-json': '01',
    'dag-cbor': '71',
    'protobuf': '50',
  }[codec];
  
  return `cas_${codecPrefix}${hash.substring(0, 58)}`;
}

/**
 * Extract hash from CID
 */
function cidToHash(cid: ContentIdentifier): string {
  return cid.substring(6);
}

// =============================================================================
// CORE STORAGE OPERATIONS
// =============================================================================

/**
 * Store raw content and return its CID
 */
export async function put(
  content: string | Uint8Array | object,
  options: {
    codec?: Codec;
    pin?: boolean;
    name?: string;
  } = {}
): Promise<ContentIdentifier> {
  const codec = options.codec || (typeof content === 'object' ? 'dag-json' : 'raw');
  
  // Serialize content
  let data: string;
  if (typeof content === 'object' && !(content instanceof Uint8Array)) {
    data = JSON.stringify(content);
  } else if (content instanceof Uint8Array) {
    data = new TextDecoder().decode(content);
  } else {
    data = content;
  }
  
  // Calculate hash
  const hash = await sha256(data);
  const cid = hashToCid(hash, codec);
  
  // Check if already exists (deduplication)
  const existing = await db.getDocument<ContentBlock>(BLOCKS_COLLECTION, cid);
  if (existing) {
    // Update stats for deduplication
    await updateStats({ duplicatesAvoided: 1 });
    
    // Still pin if requested
    if (options.pin) {
      await pin(cid, { name: options.name });
    }
    
    return cid;
  }
  
  // Create block
  const block: ContentBlock = {
    cid,
    data,
    size: new TextEncoder().encode(data).length,
    links: [],
    created: new Date().toISOString(),
    codec,
    multihash: {
      algorithm: 'sha2-256',
      digest: hash,
      size: 32,
    },
  };
  
  // Store block
  await db.saveDocument(BLOCKS_COLLECTION, cid, block);
  
  // Update stats
  await updateStats({
    totalBlocks: 1,
    totalSize: block.size,
    uniqueHashes: 1,
  });
  
  // Pin if requested
  if (options.pin) {
    await pin(cid, { name: options.name });
  }
  
  return cid;
}

/**
 * Retrieve content by CID
 */
export async function get<T = unknown>(cid: ContentIdentifier): Promise<T | null> {
  const doc = await db.getDocument<ContentBlock>(BLOCKS_COLLECTION, cid);
  if (!doc) return null;
  
  const block = doc.data;
  
  // Deserialize based on codec
  switch (block.codec) {
    case 'dag-json':
    case 'json':
      return JSON.parse(block.data as string) as T;
    case 'raw':
    default:
      return block.data as unknown as T;
  }
}

/**
 * Get raw block data
 */
export async function getBlock(cid: ContentIdentifier): Promise<ContentBlock | null> {
  const doc = await db.getDocument<ContentBlock>(BLOCKS_COLLECTION, cid);
  return doc?.data || null;
}

/**
 * Check if content exists
 */
export async function has(cid: ContentIdentifier): Promise<boolean> {
  const doc = await db.getDocument(BLOCKS_COLLECTION, cid);
  return doc !== null;
}

/**
 * Delete content by CID (only if not pinned)
 */
export async function remove(cid: ContentIdentifier, force: boolean = false): Promise<boolean> {
  // Check if pinned
  if (!force) {
    const isPinned = await getPinStatus(cid);
    if (isPinned) {
      throw new Error(`Cannot remove pinned content: ${cid}`);
    }
  }
  
  const block = await getBlock(cid);
  if (!block) return false;
  
  await db.deleteDocument(BLOCKS_COLLECTION, cid);
  
  // Update stats
  await updateStats({
    totalBlocks: -1,
    totalSize: -block.size,
  });
  
  return true;
}

// =============================================================================
// DAG OPERATIONS
// =============================================================================

/**
 * Store a DAG node with links to other content
 */
export async function putDAG(
  data: unknown,
  links: { name: string; cid: ContentIdentifier }[],
  options: {
    pin?: boolean;
    name?: string;
  } = {}
): Promise<ContentIdentifier> {
  // Resolve link sizes
  const resolvedLinks: ContentLink[] = [];
  for (const link of links) {
    const block = await getBlock(link.cid);
    resolvedLinks.push({
      name: link.name,
      cid: link.cid,
      size: block?.size || 0,
    });
  }
  
  // Create DAG node content
  const dagContent = {
    data,
    links: resolvedLinks,
  };
  
  const serialized = JSON.stringify(dagContent);
  const hash = await sha256(serialized);
  const cid = hashToCid(hash, 'dag-json');
  
  // Check for existing
  const existing = await db.getDocument<ContentBlock>(BLOCKS_COLLECTION, cid);
  if (existing) {
    if (options.pin) await pin(cid, { name: options.name, recursive: true });
    return cid;
  }
  
  // Create block with links
  const block: ContentBlock = {
    cid,
    data: serialized,
    size: new TextEncoder().encode(serialized).length,
    links: resolvedLinks,
    created: new Date().toISOString(),
    codec: 'dag-json',
    multihash: {
      algorithm: 'sha2-256',
      digest: hash,
      size: 32,
    },
  };
  
  await db.saveDocument(BLOCKS_COLLECTION, cid, block);
  
  await updateStats({
    totalBlocks: 1,
    totalSize: block.size,
    uniqueHashes: 1,
  });
  
  if (options.pin) {
    await pin(cid, { name: options.name, recursive: true });
  }
  
  return cid;
}

/**
 * Resolve a path through linked DAG nodes
 */
export async function resolve(
  cid: ContentIdentifier,
  path: string[] = []
): Promise<ResolveResult> {
  let currentCid = cid;
  const resolvedPath: string[] = [];
  const remainderPath: string[] = [...path];
  
  while (remainderPath.length > 0) {
    const block = await getBlock(currentCid);
    if (!block) {
      break;
    }
    
    const segment = remainderPath.shift()!;
    resolvedPath.push(segment);
    
    // Find matching link
    const link = block.links.find(l => l.name === segment);
    if (!link) {
      remainderPath.unshift(segment);
      resolvedPath.pop();
      break;
    }
    
    currentCid = link.cid;
  }
  
  const value = await get(currentCid);
  
  return {
    cid: currentCid,
    path: resolvedPath,
    value,
    remainderPath,
  };
}

/**
 * Get all links from a block
 */
export async function getLinks(cid: ContentIdentifier): Promise<ContentLink[]> {
  const block = await getBlock(cid);
  return block?.links || [];
}

// =============================================================================
// CHUNKING FOR LARGE CONTENT
// =============================================================================

/**
 * Import large content with chunking
 */
export async function importLarge(
  content: string | Uint8Array,
  options: {
    chunkSize?: number;
    pin?: boolean;
    name?: string;
  } = {}
): Promise<ImportResult> {
  const chunkSize = options.chunkSize || CHUNK_SIZE;
  const data = typeof content === 'string' 
    ? new TextEncoder().encode(content)
    : content;
  
  if (data.length <= chunkSize) {
    // Small content, store directly
    const cid = await put(content, { pin: options.pin, name: options.name });
    return { cid, size: data.length, blocks: 1 };
  }
  
  // Split into chunks
  const chunks: ContentIdentifier[] = [];
  let offset = 0;
  
  while (offset < data.length) {
    const chunk = data.slice(offset, offset + chunkSize);
    const chunkCid = await put(chunk);
    chunks.push(chunkCid);
    offset += chunkSize;
  }
  
  // Build tree if too many chunks for single level
  let currentLevel = chunks;
  let totalBlocks = chunks.length;
  
  while (currentLevel.length > MAX_LINKS_PER_BLOCK) {
    const nextLevel: ContentIdentifier[] = [];
    
    for (let i = 0; i < currentLevel.length; i += MAX_LINKS_PER_BLOCK) {
      const batch = currentLevel.slice(i, i + MAX_LINKS_PER_BLOCK);
      const links = batch.map((cid, idx) => ({
        name: `${idx}`,
        cid,
      }));
      
      const nodeCid = await putDAG({ type: 'intermediate' }, links);
      nextLevel.push(nodeCid);
      totalBlocks++;
    }
    
    currentLevel = nextLevel;
  }
  
  // Create root node
  const rootLinks = currentLevel.map((cid, idx) => ({
    name: `${idx}`,
    cid,
  }));
  
  const rootCid = await putDAG(
    { type: 'root', totalSize: data.length, chunks: chunks.length },
    rootLinks,
    { pin: options.pin, name: options.name }
  );
  
  return {
    cid: rootCid,
    size: data.length,
    blocks: totalBlocks + 1,
  };
}

/**
 * Export chunked content by reassembling
 */
export async function exportLarge(cid: ContentIdentifier): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  
  async function collectChunks(nodeCid: ContentIdentifier): Promise<void> {
    const block = await getBlock(nodeCid);
    if (!block) throw new Error(`Block not found: ${nodeCid}`);
    
    if (block.links.length === 0) {
      // Leaf node - actual data
      const data = typeof block.data === 'string'
        ? new TextEncoder().encode(block.data)
        : block.data as Uint8Array;
      chunks.push(data);
    } else {
      // Intermediate or root node - follow links in order
      for (const link of block.links.sort((a, b) => 
        parseInt(a.name) - parseInt(b.name)
      )) {
        await collectChunks(link.cid);
      }
    }
  }
  
  await collectChunks(cid);
  
  // Concatenate chunks
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result;
}

// =============================================================================
// PINNING
// =============================================================================

/**
 * Pin content to prevent garbage collection
 */
export async function pin(
  cid: ContentIdentifier,
  options: {
    name?: string;
    recursive?: boolean;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<PinnedContent> {
  const block = await getBlock(cid);
  if (!block) throw new Error(`Block not found: ${cid}`);
  
  const pinData: PinnedContent = {
    cid,
    name: options.name,
    pinned: new Date().toISOString(),
    recursive: options.recursive ?? true,
    size: block.size,
    metadata: options.metadata,
  };
  
  await db.saveDocument(PINS_COLLECTION, cid, pinData);
  
  // Update stats
  await updateStats({
    pinnedBlocks: 1,
    pinnedSize: block.size,
  });
  
  // If recursive, pin all linked content
  if (options.recursive && block.links.length > 0) {
    for (const link of block.links) {
      await pin(link.cid, { recursive: true });
    }
  }
  
  return pinData;
}

/**
 * Unpin content
 */
export async function unpin(cid: ContentIdentifier, recursive: boolean = true): Promise<void> {
  const pinDoc = await db.getDocument<PinnedContent>(PINS_COLLECTION, cid);
  if (!pinDoc) return;
  
  await db.deleteDocument(PINS_COLLECTION, cid);
  
  // Update stats
  await updateStats({
    pinnedBlocks: -1,
    pinnedSize: -pinDoc.data.size,
  });
  
  // Recursively unpin linked content
  if (recursive) {
    const block = await getBlock(cid);
    if (block) {
      for (const link of block.links) {
        await unpin(link.cid, true);
      }
    }
  }
}

/**
 * Get pin status
 */
export async function getPinStatus(cid: ContentIdentifier): Promise<PinnedContent | null> {
  const doc = await db.getDocument<PinnedContent>(PINS_COLLECTION, cid);
  return doc?.data || null;
}

/**
 * List all pinned content
 */
export async function listPins(options: {
  limit?: number;
  type?: 'recursive' | 'direct' | 'all';
} = {}): Promise<PinnedContent[]> {
  const docs = await db.listDocuments<PinnedContent>(PINS_COLLECTION, { 
    limit: options.limit || 100 
  });
  
  let pins = docs.map(d => d.data);
  
  if (options.type === 'recursive') {
    pins = pins.filter(p => p.recursive);
  } else if (options.type === 'direct') {
    pins = pins.filter(p => !p.recursive);
  }
  
  return pins;
}

// =============================================================================
// VERIFICATION
// =============================================================================

/**
 * Verify content integrity
 */
export async function verify(cid: ContentIdentifier): Promise<{
  valid: boolean;
  error?: string;
  expected?: string;
  actual?: string;
}> {
  const block = await getBlock(cid);
  if (!block) {
    return { valid: false, error: 'Block not found' };
  }
  
  // Recalculate hash
  const actualHash = await sha256(block.data as string);
  const expectedHash = block.multihash.digest;
  
  if (actualHash !== expectedHash) {
    return {
      valid: false,
      error: 'Hash mismatch - content corrupted',
      expected: expectedHash,
      actual: actualHash,
    };
  }
  
  // Verify all links exist
  for (const link of block.links) {
    const linkExists = await has(link.cid);
    if (!linkExists) {
      return {
        valid: false,
        error: `Missing linked block: ${link.cid}`,
      };
    }
  }
  
  return { valid: true };
}

/**
 * Verify entire DAG recursively
 */
export async function verifyDAG(cid: ContentIdentifier): Promise<{
  valid: boolean;
  errors: Array<{ cid: ContentIdentifier; error: string }>;
  verified: number;
}> {
  const errors: Array<{ cid: ContentIdentifier; error: string }> = [];
  const verified = new Set<string>();
  
  async function verifyNode(nodeCid: ContentIdentifier): Promise<void> {
    if (verified.has(nodeCid)) return;
    verified.add(nodeCid);
    
    const result = await verify(nodeCid);
    if (!result.valid) {
      errors.push({ cid: nodeCid, error: result.error || 'Unknown error' });
    }
    
    const block = await getBlock(nodeCid);
    if (block) {
      for (const link of block.links) {
        await verifyNode(link.cid);
      }
    }
  }
  
  await verifyNode(cid);
  
  return {
    valid: errors.length === 0,
    errors,
    verified: verified.size,
  };
}

// =============================================================================
// GARBAGE COLLECTION
// =============================================================================

/**
 * Run garbage collection to remove unpinned content
 */
export async function gc(options: {
  dryRun?: boolean;
  olderThan?: number; // Hours
} = {}): Promise<GarbageCollectionResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let collected = 0;
  let freedBytes = 0;
  
  // Get all pinned CIDs (including recursively pinned)
  const pinnedSet = new Set<string>();
  const pins = await listPins({ type: 'all' });
  
  for (const pin of pins) {
    pinnedSet.add(pin.cid);
    
    // Add all linked CIDs for recursive pins
    if (pin.recursive) {
      const links = await getAllLinkedCids(pin.cid);
      links.forEach(cid => pinnedSet.add(cid));
    }
  }
  
  // Get all blocks
  const allBlocks = await db.listDocuments<ContentBlock>(BLOCKS_COLLECTION, { limit: 10000 });
  
  const cutoffTime = options.olderThan 
    ? Date.now() - options.olderThan * 3600000
    : 0;
  
  for (const doc of allBlocks) {
    const block = doc.data;
    
    // Skip if pinned
    if (pinnedSet.has(block.cid)) continue;
    
    // Skip if too recent
    if (cutoffTime > 0 && new Date(block.created).getTime() > cutoffTime) continue;
    
    // Remove block
    try {
      if (!options.dryRun) {
        await db.deleteDocument(BLOCKS_COLLECTION, block.cid);
        
        await updateStats({
          totalBlocks: -1,
          totalSize: -block.size,
        });
      }
      
      collected++;
      freedBytes += block.size;
    } catch (error) {
      errors.push(`Failed to remove ${block.cid}: ${error}`);
    }
  }
  
  return {
    collected,
    freedBytes,
    duration: Date.now() - startTime,
    errors,
  };
}

/**
 * Get all CIDs linked from a root
 */
async function getAllLinkedCids(rootCid: ContentIdentifier): Promise<ContentIdentifier[]> {
  const visited = new Set<string>();
  const result: ContentIdentifier[] = [];
  
  async function traverse(cid: ContentIdentifier): Promise<void> {
    if (visited.has(cid)) return;
    visited.add(cid);
    
    const block = await getBlock(cid);
    if (block) {
      for (const link of block.links) {
        result.push(link.cid);
        await traverse(link.cid);
      }
    }
  }
  
  await traverse(rootCid);
  return result;
}

// =============================================================================
// STATS
// =============================================================================

interface StatsUpdate {
  totalBlocks?: number;
  totalSize?: number;
  pinnedBlocks?: number;
  pinnedSize?: number;
  uniqueHashes?: number;
  duplicatesAvoided?: number;
}

async function updateStats(update: StatsUpdate): Promise<void> {
  const current = await getStats();
  
  const updated: ContentStats = {
    totalBlocks: current.totalBlocks + (update.totalBlocks || 0),
    totalSize: current.totalSize + (update.totalSize || 0),
    pinnedBlocks: current.pinnedBlocks + (update.pinnedBlocks || 0),
    pinnedSize: current.pinnedSize + (update.pinnedSize || 0),
    uniqueHashes: current.uniqueHashes + (update.uniqueHashes || 0),
    duplicatesAvoided: current.duplicatesAvoided + (update.duplicatesAvoided || 0),
  };
  
  await db.saveDocument('cas_meta', STATS_KEY, updated);
}

/**
 * Get storage statistics
 */
export async function getStats(): Promise<ContentStats> {
  const doc = await db.getDocument<ContentStats>('cas_meta', STATS_KEY);
  
  return doc?.data || {
    totalBlocks: 0,
    totalSize: 0,
    pinnedBlocks: 0,
    pinnedSize: 0,
    uniqueHashes: 0,
    duplicatesAvoided: 0,
  };
}

// =============================================================================
// CONVENIENCE FUNCTIONS FOR NEWS/MARKET DATA
// =============================================================================

/**
 * Store a news article with content addressing
 */
export async function storeNewsArticle(article: {
  title: string;
  content: string;
  source: string;
  pubDate: string;
  url: string;
  [key: string]: unknown;
}): Promise<ContentIdentifier> {
  // Store article content
  const contentCid = await put(article.content, { codec: 'raw' });
  
  // Store article metadata with link to content
  const metadataCid = await putDAG(
    {
      title: article.title,
      source: article.source,
      pubDate: article.pubDate,
      url: article.url,
      contentHash: contentCid,
    },
    [{ name: 'content', cid: contentCid }],
    { pin: true, name: `article:${article.url}` }
  );
  
  return metadataCid;
}

/**
 * Store market snapshot with content addressing
 */
export async function storeMarketSnapshot(snapshot: {
  timestamp: string;
  prices: Array<{ symbol: string; price: number; volume: number }>;
}): Promise<ContentIdentifier> {
  return await put(snapshot, {
    codec: 'dag-json',
    pin: true,
    name: `market:${snapshot.timestamp}`,
  });
}

/**
 * Get content history for an article URL
 */
export async function getArticleHistory(url: string): Promise<ContentIdentifier[]> {
  const pins = await listPins();
  return pins
    .filter(p => p.name?.startsWith(`article:${url}`))
    .map(p => p.cid);
}

// =============================================================================
// EXPORTS
// =============================================================================

export const cas = {
  // Core operations
  put,
  get,
  getBlock,
  has,
  remove,
  
  // DAG operations
  putDAG,
  resolve,
  getLinks,
  
  // Large content
  importLarge,
  exportLarge,
  
  // Pinning
  pin,
  unpin,
  getPinStatus,
  listPins,
  
  // Verification
  verify,
  verifyDAG,
  
  // Maintenance
  gc,
  getStats,
  
  // Convenience
  storeNewsArticle,
  storeMarketSnapshot,
  getArticleHistory,
};

export default cas;

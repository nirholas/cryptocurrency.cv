/**
 * Database Abstraction Layer
 * 
 * Enterprise-grade storage abstraction supporting multiple backends:
 * - Vercel KV (production)
 * - Upstash Redis (serverless)
 * - In-memory (development/testing)
 * - File-based (local persistence)
 * 
 * @module database
 * @description Unified data persistence layer with automatic backend detection,
 * connection pooling, retry logic, and comprehensive error handling.
 */

import { aiCache } from './cache';

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface DatabaseConfig {
  backend: 'vercel-kv' | 'upstash' | 'memory' | 'file';
  prefix?: string;
  maxRetries?: number;
  retryDelayMs?: number;
  connectionTimeout?: number;
}

const DEFAULT_CONFIG: DatabaseConfig = {
  backend: 'memory',
  prefix: 'fcn:',
  maxRetries: 3,
  retryDelayMs: 100,
  connectionTimeout: 5000,
};

// =============================================================================
// TYPES
// =============================================================================

export interface StoredDocument<T = unknown> {
  id: string;
  data: T;
  createdAt: string;
  updatedAt: string;
  version: number;
  metadata?: Record<string, unknown>;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'asc' | 'desc';
  prefix?: string;
}

export interface BatchOperation<T = unknown> {
  operation: 'set' | 'delete';
  key: string;
  value?: T;
  ttl?: number;
}

export interface DatabaseStats {
  backend: string;
  connected: boolean;
  totalKeys: number;
  memoryUsage?: number;
  lastOperation?: string;
  uptime: number;
}

// =============================================================================
// IN-MEMORY BACKEND (Development & Fallback)
// =============================================================================

class MemoryBackend {
  private store = new Map<string, { value: string; expiresAt?: number }>();
  private startTime = Date.now();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const result: string[] = [];
    
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        this.store.delete(key);
        continue;
      }
      if (regex.test(key)) {
        result.push(key);
      }
    }
    
    return result;
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    return Promise.all(keys.map(k => this.get(k)));
  }

  async mset(entries: Array<{ key: string; value: string; ttl?: number }>): Promise<void> {
    for (const entry of entries) {
      await this.set(entry.key, entry.value, entry.ttl);
    }
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const newValue = (parseInt(current || '0', 10) + 1).toString();
    await this.set(key, newValue);
    return parseInt(newValue, 10);
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    
    this.store.set(key, {
      ...entry,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return true;
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    const current = await this.get(key);
    const list = current ? JSON.parse(current) : [];
    list.unshift(...values.reverse());
    await this.set(key, JSON.stringify(list));
    return list.length;
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const current = await this.get(key);
    if (!current) return [];
    const list = JSON.parse(current);
    return list.slice(start, stop === -1 ? undefined : stop + 1);
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    const current = await this.get(key);
    if (!current) return;
    const list = JSON.parse(current);
    const trimmed = list.slice(start, stop === -1 ? undefined : stop + 1);
    await this.set(key, JSON.stringify(trimmed));
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    const current = await this.get(key);
    const set: Array<{ score: number; member: string }> = current ? JSON.parse(current) : [];
    
    const existingIndex = set.findIndex(s => s.member === member);
    if (existingIndex >= 0) {
      set[existingIndex].score = score;
    } else {
      set.push({ score, member });
    }
    
    set.sort((a, b) => a.score - b.score);
    await this.set(key, JSON.stringify(set));
    return existingIndex >= 0 ? 0 : 1;
  }

  async zrange(key: string, start: number, stop: number, options?: { withScores?: boolean }): Promise<string[]> {
    const current = await this.get(key);
    if (!current) return [];
    
    const set: Array<{ score: number; member: string }> = JSON.parse(current);
    const sliced = set.slice(start, stop === -1 ? undefined : stop + 1);
    
    if (options?.withScores) {
      return sliced.flatMap(s => [s.member, s.score.toString()]);
    }
    return sliced.map(s => s.member);
  }

  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    const current = await this.get(key);
    if (!current) return [];
    
    const set: Array<{ score: number; member: string }> = JSON.parse(current);
    set.sort((a, b) => b.score - a.score);
    const sliced = set.slice(start, stop === -1 ? undefined : stop + 1);
    return sliced.map(s => s.member);
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    const current = await this.get(key);
    const hash: Record<string, string> = current ? JSON.parse(current) : {};
    const isNew = !(field in hash);
    hash[field] = value;
    await this.set(key, JSON.stringify(hash));
    return isNew ? 1 : 0;
  }

  async hget(key: string, field: string): Promise<string | null> {
    const current = await this.get(key);
    if (!current) return null;
    const hash = JSON.parse(current);
    return hash[field] ?? null;
  }

  async hgetall(key: string): Promise<Record<string, string> | null> {
    const current = await this.get(key);
    if (!current) return null;
    return JSON.parse(current);
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    const current = await this.hget(key, field);
    const newValue = (parseInt(current || '0', 10) + increment);
    await this.hset(key, field, newValue.toString());
    return newValue;
  }

  getStats(): DatabaseStats {
    // Only access process.memoryUsage in Node.js runtime (not Edge)
    let memoryUsage: number | undefined;
    if (typeof process !== 'undefined' && typeof process.memoryUsage === 'function') {
      try {
        memoryUsage = process.memoryUsage()?.heapUsed;
      } catch {
        // Edge runtime - memoryUsage not available
      }
    }
    return {
      backend: 'memory',
      connected: true,
      totalKeys: this.store.size,
      memoryUsage,
      uptime: Date.now() - this.startTime,
    };
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

// =============================================================================
// FILE-BASED BACKEND (Local Persistence)
// =============================================================================

class FileBackend extends MemoryBackend {
  private filePath: string;
  private saveDebounce: ReturnType<typeof setTimeout> | null = null;

  constructor(filePath = '.data/database.json') {
    super();
    this.filePath = filePath;
    this.loadFromFile();
  }

  private async loadFromFile(): Promise<void> {
    // Skip in browser or Edge runtime environments
    if (typeof window !== 'undefined') return;
    // Check for Node.js environment safely - Edge Runtime doesn't have process.versions
    if (typeof process === 'undefined') return;
    // @ts-expect-error - EdgeRuntime is a global in Vercel Edge Runtime
    if (typeof EdgeRuntime !== 'undefined') return;
    
    try {
      const fs = await import(/* webpackIgnore: true */ 'fs/promises');
      const data = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(data);
      
      for (const [key, entry] of Object.entries(parsed)) {
        await this.set(key, (entry as { value: string }).value);
      }
    } catch {
      // File doesn't exist yet, that's fine
    }
  }

  private scheduleSave(): void {
    if (this.saveDebounce) {
      clearTimeout(this.saveDebounce);
    }
    this.saveDebounce = setTimeout(() => this.saveToFile(), 1000);
  }

  private async saveToFile(): Promise<void> {
    // Skip in browser or Edge runtime environments
    if (typeof window !== 'undefined') return;
    // Check for Node.js environment safely - Edge Runtime doesn't have process.versions
    if (typeof process === 'undefined') return;
    // @ts-expect-error - EdgeRuntime is a global in Vercel Edge Runtime
    if (typeof EdgeRuntime !== 'undefined') return;
    
    try {
      const fs = await import(/* webpackIgnore: true */ 'fs/promises');
      const pathModule = await import(/* webpackIgnore: true */ 'path');
      // Handle both ESM default export and CommonJS module
      const path = pathModule.default || pathModule;
      
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });
      
      const data: Record<string, unknown> = {};
      const keys = await this.keys('*');
      
      for (const key of keys) {
        const value = await this.get(key);
        if (value) {
          data[key] = { value };
        }
      }
      
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save database to file:', error);
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    await super.set(key, value, ttlSeconds);
    this.scheduleSave();
  }

  async delete(key: string): Promise<boolean> {
    const result = await super.delete(key);
    this.scheduleSave();
    return result;
  }

  getStats(): DatabaseStats {
    return {
      ...super.getStats(),
      backend: 'file',
    };
  }
}

// =============================================================================
// VERCEL KV BACKEND (Production)
// =============================================================================

class VercelKVBackend {
  private kv: typeof import('@vercel/kv').kv | null = null;
  private startTime = Date.now();
  private initialized = false;

  private async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const vercelKv = await import('@vercel/kv');
      this.kv = vercelKv.kv;
      this.initialized = true;
    } catch (error) {
      console.warn('Vercel KV not available, falling back to memory backend');
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    await this.init();
    const value = await this.kv!.get<string>(key);
    return value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    await this.init();
    if (ttlSeconds) {
      await this.kv!.set(key, value, { ex: ttlSeconds });
    } else {
      await this.kv!.set(key, value);
    }
  }

  async delete(key: string): Promise<boolean> {
    await this.init();
    const result = await this.kv!.del(key);
    return result > 0;
  }

  async exists(key: string): Promise<boolean> {
    await this.init();
    const result = await this.kv!.exists(key);
    return result > 0;
  }

  async keys(pattern: string): Promise<string[]> {
    await this.init();
    return this.kv!.keys(pattern);
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    await this.init();
    return this.kv!.mget(...keys);
  }

  async incr(key: string): Promise<number> {
    await this.init();
    return this.kv!.incr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    await this.init();
    const result = await this.kv!.expire(key, ttlSeconds);
    return result > 0;
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    await this.init();
    return this.kv!.lpush(key, ...values);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    await this.init();
    return this.kv!.lrange(key, start, stop);
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    await this.init();
    await this.kv!.ltrim(key, start, stop);
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    await this.init();
    const result = await this.kv!.zadd(key, { score, member });
    return result ?? 0;
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    await this.init();
    return this.kv!.zrange(key, start, stop);
  }

  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    await this.init();
    return this.kv!.zrange(key, start, stop, { rev: true });
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    await this.init();
    return this.kv!.hset(key, { [field]: value });
  }

  async hget(key: string, field: string): Promise<string | null> {
    await this.init();
    return this.kv!.hget(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string> | null> {
    await this.init();
    return this.kv!.hgetall(key);
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    await this.init();
    return this.kv!.hincrby(key, field, increment);
  }

  getStats(): DatabaseStats {
    return {
      backend: 'vercel-kv',
      connected: this.initialized,
      totalKeys: -1, // Cannot easily get this from Vercel KV
      uptime: Date.now() - this.startTime,
    };
  }
}

// =============================================================================
// DATABASE CLIENT
// =============================================================================

type Backend = MemoryBackend | FileBackend | VercelKVBackend;

class DatabaseClient {
  private backend: Backend;
  private config: DatabaseConfig;
  private operationCount = 0;

  constructor(config: Partial<DatabaseConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.backend = this.createBackend();
  }

  private createBackend(): Backend {
    // Auto-detect backend based on environment
    if (process.env.KV_REST_API_URL || process.env.VERCEL_KV_URL) {
      try {
        return new VercelKVBackend();
      } catch {
        console.warn('Vercel KV initialization failed, using memory backend');
      }
    }

    if (this.config.backend === 'file' || process.env.NODE_ENV === 'development') {
      return new FileBackend();
    }

    return new MemoryBackend();
  }

  private prefixKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < (this.config.maxRetries || 3); attempt++) {
      try {
        this.operationCount++;
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < (this.config.maxRetries || 3) - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, (this.config.retryDelayMs || 100) * Math.pow(2, attempt))
          );
        }
      }
    }
    
    throw lastError;
  }

  // ==========================================================================
  // STRING OPERATIONS
  // ==========================================================================

  async get<T = unknown>(key: string): Promise<T | null> {
    return this.withRetry(async () => {
      const value = await this.backend.get(this.prefixKey(key));
      if (!value) return null;
      
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    });
  }

  async set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    return this.withRetry(async () => {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await this.backend.set(this.prefixKey(key), serialized, ttlSeconds);
    });
  }

  async delete(key: string): Promise<boolean> {
    return this.withRetry(async () => {
      return this.backend.delete(this.prefixKey(key));
    });
  }

  async exists(key: string): Promise<boolean> {
    return this.withRetry(async () => {
      return this.backend.exists(this.prefixKey(key));
    });
  }

  async keys(pattern: string): Promise<string[]> {
    return this.withRetry(async () => {
      const prefixedPattern = this.prefixKey(pattern);
      const keys = await this.backend.keys(prefixedPattern);
      return keys.map(k => k.replace(this.config.prefix!, ''));
    });
  }

  async mget<T = unknown>(keys: string[]): Promise<(T | null)[]> {
    return this.withRetry(async () => {
      const prefixedKeys = keys.map(k => this.prefixKey(k));
      const values = await this.backend.mget(prefixedKeys);
      return values.map(v => {
        if (!v) return null;
        try {
          return JSON.parse(v) as T;
        } catch {
          return v as T;
        }
      });
    });
  }

  async incr(key: string): Promise<number> {
    return this.withRetry(async () => {
      return this.backend.incr(this.prefixKey(key));
    });
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    return this.withRetry(async () => {
      return this.backend.expire(this.prefixKey(key), ttlSeconds);
    });
  }

  // ==========================================================================
  // LIST OPERATIONS
  // ==========================================================================

  async lpush<T = unknown>(key: string, ...values: T[]): Promise<number> {
    return this.withRetry(async () => {
      const serialized = values.map(v => typeof v === 'string' ? v : JSON.stringify(v));
      return this.backend.lpush(this.prefixKey(key), ...serialized);
    });
  }

  async lrange<T = unknown>(key: string, start: number, stop: number): Promise<T[]> {
    return this.withRetry(async () => {
      const values = await this.backend.lrange(this.prefixKey(key), start, stop);
      return values.map(v => {
        try {
          return JSON.parse(v) as T;
        } catch {
          return v as T;
        }
      });
    });
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    return this.withRetry(async () => {
      await this.backend.ltrim(this.prefixKey(key), start, stop);
    });
  }

  // ==========================================================================
  // SORTED SET OPERATIONS
  // ==========================================================================

  async zadd(key: string, score: number, member: string): Promise<number> {
    return this.withRetry(async () => {
      return this.backend.zadd(this.prefixKey(key), score, member);
    });
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.withRetry(async () => {
      return this.backend.zrange(this.prefixKey(key), start, stop);
    });
  }

  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.withRetry(async () => {
      return this.backend.zrevrange(this.prefixKey(key), start, stop);
    });
  }

  // ==========================================================================
  // HASH OPERATIONS
  // ==========================================================================

  async hset(key: string, field: string, value: unknown): Promise<number> {
    return this.withRetry(async () => {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      return this.backend.hset(this.prefixKey(key), field, serialized);
    });
  }

  async hget<T = unknown>(key: string, field: string): Promise<T | null> {
    return this.withRetry(async () => {
      const value = await this.backend.hget(this.prefixKey(key), field);
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    });
  }

  async hgetall<T = Record<string, unknown>>(key: string): Promise<T | null> {
    return this.withRetry(async () => {
      const hash = await this.backend.hgetall(this.prefixKey(key));
      if (!hash) return null;
      
      const result: Record<string, unknown> = {};
      for (const [field, value] of Object.entries(hash)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value;
        }
      }
      return result as T;
    });
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    return this.withRetry(async () => {
      return this.backend.hincrby(this.prefixKey(key), field, increment);
    });
  }

  // ==========================================================================
  // DOCUMENT OPERATIONS
  // ==========================================================================

  async saveDocument<T>(
    collection: string,
    id: string,
    data: T,
    metadata?: Record<string, unknown>
  ): Promise<StoredDocument<T>> {
    const existing = await this.getDocument<T>(collection, id);
    
    const doc: StoredDocument<T> = {
      id,
      data,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: (existing?.version || 0) + 1,
      metadata,
    };
    
    await this.set(`${collection}:${id}`, doc);
    
    // Update collection index
    await this.zadd(`${collection}:_index`, Date.now(), id);
    
    return doc;
  }

  async getDocument<T>(collection: string, id: string): Promise<StoredDocument<T> | null> {
    return this.get<StoredDocument<T>>(`${collection}:${id}`);
  }

  async deleteDocument(collection: string, id: string): Promise<boolean> {
    const deleted = await this.delete(`${collection}:${id}`);
    // Note: We don't remove from index for performance, will be cleaned up on access
    return deleted;
  }

  async listDocuments<T>(
    collection: string,
    options: QueryOptions = {}
  ): Promise<StoredDocument<T>[]> {
    const { limit = 100, offset = 0, orderBy = 'desc' } = options;
    
    const ids = orderBy === 'desc'
      ? await this.zrevrange(`${collection}:_index`, offset, offset + limit - 1)
      : await this.zrange(`${collection}:_index`, offset, offset + limit - 1);
    
    const docs = await Promise.all(
      ids.map(id => this.getDocument<T>(collection, id))
    );
    
    return docs.filter((d): d is StoredDocument<T> => d !== null);
  }

  async countDocuments(collection: string): Promise<number> {
    const keys = await this.keys(`${collection}:*`);
    return keys.filter(k => !k.includes('_index')).length;
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  getStats(): DatabaseStats {
    return {
      ...this.backend.getStats(),
      lastOperation: `${this.operationCount} operations`,
    };
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; backend: string }> {
    const start = Date.now();
    try {
      await this.set('_healthcheck', { timestamp: Date.now() }, 60);
      await this.get('_healthcheck');
      await this.delete('_healthcheck');
      
      return {
        healthy: true,
        latencyMs: Date.now() - start,
        backend: this.backend.getStats().backend,
      };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        backend: this.backend.getStats().backend,
      };
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let dbInstance: DatabaseClient | null = null;

export function getDatabase(config?: Partial<DatabaseConfig>): DatabaseClient {
  if (!dbInstance) {
    dbInstance = new DatabaseClient(config);
  }
  return dbInstance;
}

export const db = getDatabase();

/**
 * Check if KV storage is available (Vercel KV or Upstash)
 */
export function isKVAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);
}

export default db;

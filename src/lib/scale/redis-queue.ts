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
 * Redis Queue Adapter
 *
 * Persistent job queue backed by Redis. Uses sorted sets for priority scheduling,
 * hashes for job data, and sets for active/dead-letter tracking. Jobs survive
 * process restarts and support horizontal scaling across multiple workers.
 *
 * Data structures:
 * - {prefix}pending:{type}  — sorted set (score = priority * 1e13 + timestamp)
 * - {prefix}active          — set of currently processing job IDs
 * - {prefix}dead            — sorted set of dead letter jobs (score = timestamp)
 * - {prefix}job:{id}        — hash with full job data
 * - {prefix}metrics         — hash with counter fields
 * - {prefix}dedup:{key}     — deduplication keys with TTL
 *
 * @module lib/scale/redis-queue
 */

import type Redis from 'ioredis';
import type { Job, JobPriority, QueueMetrics } from './index';
import type { QueueAdapter, EnqueueOptions } from './queue-interface';

const PRIORITY_SCORES: Record<JobPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

const DEFAULT_MAX_ATTEMPTS = 3;

export class RedisQueueAdapter implements QueueAdapter {
  private redis: Redis;
  private prefix: string;

  constructor(redis: Redis, prefix = 'fcn:queue:') {
    this.redis = redis;
    this.prefix = prefix;
  }

  private key(suffix: string): string {
    return `${this.prefix}${suffix}`;
  }

  async enqueue<T>(type: string, data: T, options?: EnqueueOptions): Promise<string> {
    // Deduplication check
    if (options?.deduplicationKey) {
      const dedupKey = this.key(`dedup:${options.deduplicationKey}`);
      const exists = await this.redis.exists(dedupKey);
      if (exists) {
        const existingId = await this.redis.get(dedupKey);
        return existingId || '';
      }
    }

    const id = `${type}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
    const now = Date.now();
    const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    const priority = options?.priority ?? 'normal';

    const job: Job<T> = {
      id,
      type,
      payload: data,
      status: 'pending',
      priority,
      attempts: 0,
      maxAttempts,
      createdAt: now,
      metadata: options?.metadata,
    };

    // Score: priority bucket * 1e13 + timestamp (lower = higher priority, earlier)
    const delayMs = options?.delayMs ?? 0;
    const score = PRIORITY_SCORES[priority] * 1e13 + now + delayMs;

    const pipeline = this.redis.pipeline();
    pipeline.hset(this.key(`job:${id}`), 'data', JSON.stringify(job));
    pipeline.zadd(this.key(`pending:${type}`), score.toString(), id);
    pipeline.hincrby(this.key('metrics'), 'enqueued', 1);

    if (options?.deduplicationKey) {
      // Dedup key expires in 1 hour
      pipeline.set(this.key(`dedup:${options.deduplicationKey}`), id, 'EX', 3600);
    }

    await pipeline.exec();
    return id;
  }

  async dequeue(type: string, count = 1): Promise<Job[]> {
    const jobs: Job[] = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      // Get the lowest-scored (highest priority, earliest) pending job
      const results = await this.redis.zrange(this.key(`pending:${type}`), 0, 0);

      if (results.length === 0) break;

      const jobId = results[0];

      // Check if the job is ready (respects delay)
      const scoreStr = await this.redis.zscore(this.key(`pending:${type}`), jobId);
      if (scoreStr) {
        const score = parseFloat(scoreStr);
        // The availability timestamp is score % 1e13
        const availableAt = score % 1e13;
        if (availableAt > now) break; // Not ready yet
      }

      // Atomically remove from pending and add to active
      const removed = await this.redis.zrem(this.key(`pending:${type}`), jobId);
      if (!removed) continue; // Another worker got it

      await this.redis.sadd(this.key('active'), jobId);

      const jobData = await this.redis.hget(this.key(`job:${jobId}`), 'data');
      if (!jobData) {
        await this.redis.srem(this.key('active'), jobId);
        continue;
      }

      const job = JSON.parse(jobData) as Job;
      job.status = 'active';
      job.startedAt = Date.now();
      job.attempts++;

      await this.redis.hset(this.key(`job:${jobId}`), 'data', JSON.stringify(job));
      jobs.push(job);
    }

    return jobs;
  }

  async ack(jobId: string, result?: unknown): Promise<void> {
    const jobData = await this.redis.hget(this.key(`job:${jobId}`), 'data');
    if (!jobData) return;

    const job = JSON.parse(jobData) as Job;
    job.status = 'completed';
    job.completedAt = Date.now();
    job.result = result;

    const processingTime = job.completedAt - (job.startedAt ?? job.createdAt);

    const pipeline = this.redis.pipeline();
    pipeline.hset(this.key(`job:${jobId}`), 'data', JSON.stringify(job));
    // Auto-expire completed job data after 24 hours
    pipeline.expire(this.key(`job:${jobId}`), 86400);
    pipeline.srem(this.key('active'), jobId);
    pipeline.hincrby(this.key('metrics'), 'completed', 1);
    pipeline.hincrby(this.key('metrics'), 'totalProcessingTime', processingTime);
    await pipeline.exec();
  }

  async nack(jobId: string, error: string): Promise<void> {
    const jobData = await this.redis.hget(this.key(`job:${jobId}`), 'data');
    if (!jobData) return;

    const job = JSON.parse(jobData) as Job;
    job.error = error;

    if (job.attempts < job.maxAttempts) {
      // Retry with exponential backoff
      job.status = 'retrying';
      const delay = Math.min(1000 * Math.pow(2, job.attempts - 1), 60_000);
      const score = Date.now() + delay;

      const pipeline = this.redis.pipeline();
      pipeline.hset(this.key(`job:${jobId}`), 'data', JSON.stringify(job));
      pipeline.srem(this.key('active'), jobId);
      pipeline.zadd(this.key(`pending:${job.type}`), score.toString(), jobId);
      pipeline.hincrby(this.key('metrics'), 'retries', 1);
      await pipeline.exec();
    } else {
      await this.moveToDeadLetter(jobId);
    }
  }

  async moveToDeadLetter(jobId: string): Promise<void> {
    const jobData = await this.redis.hget(this.key(`job:${jobId}`), 'data');
    if (!jobData) return;

    const job = JSON.parse(jobData) as Job;
    job.status = 'dead';

    const pipeline = this.redis.pipeline();
    pipeline.hset(this.key(`job:${jobId}`), 'data', JSON.stringify(job));
    pipeline.srem(this.key('active'), jobId);
    pipeline.zadd(this.key('dead'), Date.now().toString(), jobId);
    pipeline.hincrby(this.key('metrics'), 'dead', 1);
    pipeline.hincrby(this.key('metrics'), 'failed', 1);
    await pipeline.exec();
  }

  async getMetrics(): Promise<QueueMetrics> {
    const metrics = await this.redis.hgetall(this.key('metrics'));
    const activeCount = await this.redis.scard(this.key('active'));
    const deadCount = await this.redis.zcard(this.key('dead'));

    // Sum pending across all types by scanning matching keys
    let pendingCount = 0;
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        this.key('pending:*'),
        'COUNT',
        100,
      );
      cursor = nextCursor;
      for (const key of keys) {
        pendingCount += await this.redis.zcard(key);
      }
    } while (cursor !== '0');

    const completed = parseInt(metrics.completed || '0', 10);
    const failed = parseInt(metrics.failed || '0', 10);
    const totalProcessingTime = parseInt(metrics.totalProcessingTime || '0', 10);
    const total = completed + failed;

    return {
      pending: pendingCount,
      active: activeCount,
      completed,
      failed,
      dead: deadCount,
      avgProcessingTimeMs: completed > 0 ? totalProcessingTime / completed : 0,
      throughputPerMinute: 0, // Would need a time-windowed counter for accurate throughput
      errorRate: total > 0 ? failed / total : 0,
    };
  }

  async getJob(jobId: string): Promise<Job | null> {
    const jobData = await this.redis.hget(this.key(`job:${jobId}`), 'data');
    if (!jobData) return null;
    return JSON.parse(jobData) as Job;
  }

  async getDeadLetterJobs(limit = 100): Promise<Job[]> {
    const jobIds = await this.redis.zrange(this.key('dead'), 0, limit - 1);
    const jobs: Job[] = [];

    for (const jobId of jobIds) {
      const jobData = await this.redis.hget(this.key(`job:${jobId}`), 'data');
      if (jobData) {
        jobs.push(JSON.parse(jobData) as Job);
      }
    }

    return jobs;
  }

  async retryDeadLetterJob(jobId: string): Promise<void> {
    const jobData = await this.redis.hget(this.key(`job:${jobId}`), 'data');
    if (!jobData) return;

    const job = JSON.parse(jobData) as Job;
    job.status = 'pending';
    job.attempts = 0;
    job.error = undefined;

    const score = PRIORITY_SCORES[job.priority] * 1e13 + Date.now();

    const pipeline = this.redis.pipeline();
    pipeline.hset(this.key(`job:${jobId}`), 'data', JSON.stringify(job));
    pipeline.zrem(this.key('dead'), jobId);
    pipeline.zadd(this.key(`pending:${job.type}`), score.toString(), jobId);
    pipeline.hincrby(this.key('metrics'), 'dead', -1);
    await pipeline.exec();
  }

  async purgeDeadLetter(): Promise<number> {
    const jobIds = await this.redis.zrange(this.key('dead'), 0, -1);
    if (jobIds.length === 0) return 0;

    const pipeline = this.redis.pipeline();
    for (const jobId of jobIds) {
      pipeline.del(this.key(`job:${jobId}`));
    }
    pipeline.del(this.key('dead'));
    pipeline.hset(this.key('metrics'), 'dead', '0');
    await pipeline.exec();

    return jobIds.length;
  }

  async size(type?: string): Promise<number> {
    if (type) {
      return this.redis.zcard(this.key(`pending:${type}`));
    }

    let total = 0;
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        this.key('pending:*'),
        'COUNT',
        100,
      );
      cursor = nextCursor;
      for (const key of keys) {
        total += await this.redis.zcard(key);
      }
    } while (cursor !== '0');

    return total;
  }
}

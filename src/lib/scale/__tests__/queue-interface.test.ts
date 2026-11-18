/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { QueueAdapter } from '../queue-interface';
import { MemoryQueueAdapter } from '../memory-queue';

function createContractTests(name: string, factory: () => QueueAdapter) {
  describe(name, () => {
    let adapter: QueueAdapter;

    beforeEach(() => {
      adapter = factory();
    });

    it('enqueues and dequeues a job', async () => {
      const id = await adapter.enqueue('test', { message: 'hello' });
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');

      const jobs = await adapter.dequeue('test', 1);
      expect(jobs).toHaveLength(1);
      expect(jobs[0].type).toBe('test');
      expect(jobs[0].payload).toEqual({ message: 'hello' });
      expect(jobs[0].status).toBe('active');
      expect(jobs[0].attempts).toBe(1);
    });

    it('returns empty array when no jobs available', async () => {
      const jobs = await adapter.dequeue('nonexistent', 1);
      expect(jobs).toEqual([]);
    });

    it('acknowledges a completed job', async () => {
      const id = await adapter.enqueue('test', { x: 1 });
      const [job] = await adapter.dequeue('test', 1);

      await adapter.ack(job.id, { result: 'done' });

      const fetched = await adapter.getJob(id);
      expect(fetched).not.toBeNull();
      expect(fetched!.status).toBe('completed');
      expect(fetched!.result).toEqual({ result: 'done' });
    });

    it('nacks a job and retries it', async () => {
      const id = await adapter.enqueue('test', { x: 1 }, { maxAttempts: 3 });
      const [job] = await adapter.dequeue('test', 1);

      await adapter.nack(job.id, 'temporary error');

      const fetched = await adapter.getJob(id);
      expect(fetched).not.toBeNull();
      expect(fetched!.status).toBe('retrying');
      expect(fetched!.error).toBe('temporary error');
    });

    it('moves to dead letter after max attempts', async () => {
      const id = await adapter.enqueue('test', { x: 1 }, { maxAttempts: 1 });

      // Dequeue to get attempt 1
      const [job] = await adapter.dequeue('test', 1);
      expect(job.attempts).toBe(1);

      // Nack — should go to dead letter since maxAttempts=1
      await adapter.nack(job.id, 'permanent error');

      const fetched = await adapter.getJob(id);
      expect(fetched).not.toBeNull();
      expect(fetched!.status).toBe('dead');

      const deadJobs = await adapter.getDeadLetterJobs();
      expect(deadJobs.some((j) => j.id === id)).toBe(true);
    });

    it('retries a dead letter job', async () => {
      const id = await adapter.enqueue('test', { x: 1 }, { maxAttempts: 1 });
      const [job] = await adapter.dequeue('test', 1);
      await adapter.nack(job.id, 'fail');

      await adapter.retryDeadLetterJob(id);

      const fetched = await adapter.getJob(id);
      expect(fetched).not.toBeNull();
      expect(fetched!.status).toBe('pending');
      expect(fetched!.attempts).toBe(0);
    });

    it('purges dead letter queue', async () => {
      await adapter.enqueue('test', { x: 1 }, { maxAttempts: 1 });
      await adapter.enqueue('test', { x: 2 }, { maxAttempts: 1 });

      const jobs = await adapter.dequeue('test', 2);
      for (const j of jobs) {
        await adapter.nack(j.id, 'fail');
      }

      const deadBefore = await adapter.getDeadLetterJobs();
      expect(deadBefore.length).toBe(2);

      const purged = await adapter.purgeDeadLetter();
      expect(purged).toBe(2);

      const deadAfter = await adapter.getDeadLetterJobs();
      expect(deadAfter.length).toBe(0);
    });

    it('tracks metrics correctly', async () => {
      // Start with empty metrics
      const initial = await adapter.getMetrics();
      expect(initial.pending).toBe(0);
      expect(initial.active).toBe(0);
      expect(initial.completed).toBe(0);

      // Enqueue and complete a job
      await adapter.enqueue('test', { x: 1 });
      const afterEnqueue = await adapter.getMetrics();
      expect(afterEnqueue.pending).toBe(1);

      const [job] = await adapter.dequeue('test', 1);
      await adapter.ack(job.id, 'ok');

      const afterAck = await adapter.getMetrics();
      expect(afterAck.completed).toBe(1);
      expect(afterAck.pending).toBe(0);
    });

    it('respects priority ordering', async () => {
      await adapter.enqueue('test', { order: 3 }, { priority: 'low' });
      await adapter.enqueue('test', { order: 1 }, { priority: 'critical' });
      await adapter.enqueue('test', { order: 2 }, { priority: 'high' });

      const jobs = await adapter.dequeue('test', 3);
      expect(jobs).toHaveLength(3);
      expect((jobs[0].payload as { order: number }).order).toBe(1);
      expect((jobs[1].payload as { order: number }).order).toBe(2);
      expect((jobs[2].payload as { order: number }).order).toBe(3);
    });

    it('reports correct size', async () => {
      expect(await adapter.size('test')).toBe(0);
      expect(await adapter.size()).toBe(0);

      await adapter.enqueue('test', { a: 1 });
      await adapter.enqueue('test', { b: 2 });
      await adapter.enqueue('other', { c: 3 });

      expect(await adapter.size('test')).toBe(2);
      expect(await adapter.size('other')).toBe(1);
      expect(await adapter.size()).toBe(3);
    });

    it('supports deduplication', async () => {
      const id1 = await adapter.enqueue('test', { x: 1 }, { deduplicationKey: 'unique-key' });
      const id2 = await adapter.enqueue('test', { x: 2 }, { deduplicationKey: 'unique-key' });

      expect(id1).toBe(id2);
      expect(await adapter.size('test')).toBe(1);
    });

    it('moves a job directly to dead letter', async () => {
      const id = await adapter.enqueue('test', { x: 1 });
      const [job] = await adapter.dequeue('test', 1);

      await adapter.moveToDeadLetter(job.id);

      const fetched = await adapter.getJob(id);
      expect(fetched!.status).toBe('dead');
    });

    it('returns null for non-existent job', async () => {
      const job = await adapter.getJob('nonexistent-id');
      expect(job).toBeNull();
    });
  });
}

// Run contract tests against the MemoryQueueAdapter
createContractTests('MemoryQueueAdapter', () => new MemoryQueueAdapter());

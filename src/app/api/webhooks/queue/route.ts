/**
 * @fileoverview Async Webhook Delivery Queue
 * Implements faster webhook delivery with retry logic and batching
 */

import { NextRequest, NextResponse } from 'next/server';

interface WebhookJob {
  id: string;
  url: string;
  payload: unknown;
  headers: Record<string, string>;
  retries: number;
  maxRetries: number;
  createdAt: number;
  nextRetryAt: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  lastError?: string;
}

// In-memory queue (use Redis in production)
const webhookQueue: WebhookJob[] = [];
const completedJobs: WebhookJob[] = [];
let isProcessing = false;

// Retry delays: 1s, 5s, 30s, 2m, 10m
const RETRY_DELAYS = [1000, 5000, 30000, 120000, 600000];

/**
 * Add a webhook to the delivery queue
 */
export function queueWebhook(
  url: string,
  payload: unknown,
  headers: Record<string, string> = {}
): string {
  const job: WebhookJob = {
    id: `wh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    url,
    payload,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'FCN-Webhook/1.0',
      ...headers,
    },
    retries: 0,
    maxRetries: 5,
    createdAt: Date.now(),
    nextRetryAt: Date.now(),
    status: 'pending',
  };

  webhookQueue.push(job);

  // Start processing if not already running
  if (!isProcessing) {
    processQueue();
  }

  return job.id;
}

/**
 * Process webhook queue with concurrency
 */
async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  const CONCURRENCY = 10;
  const BATCH_DELAY = 100; // ms between batches

  while (webhookQueue.length > 0) {
    const now = Date.now();

    // Get jobs ready for processing
    const readyJobs = webhookQueue
      .filter((j) => j.status === 'pending' && j.nextRetryAt <= now)
      .slice(0, CONCURRENCY);

    if (readyJobs.length === 0) {
      // Wait for next retry window
      const nextRetry = Math.min(
        ...webhookQueue
          .filter((j) => j.status === 'pending')
          .map((j) => j.nextRetryAt)
      );
      const waitTime = Math.max(100, nextRetry - now);
      await new Promise((r) => setTimeout(r, waitTime));
      continue;
    }

    // Process batch concurrently
    await Promise.all(readyJobs.map(processJob));

    // Small delay between batches
    await new Promise((r) => setTimeout(r, BATCH_DELAY));
  }

  isProcessing = false;
}

/**
 * Process a single webhook job
 */
async function processJob(job: WebhookJob) {
  job.status = 'processing';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(job.url, {
      method: 'POST',
      headers: job.headers,
      body: JSON.stringify(job.payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      job.status = 'completed';
      moveToCompleted(job);
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    job.lastError = error instanceof Error ? error.message : 'Unknown error';
    job.retries++;

    if (job.retries >= job.maxRetries) {
      job.status = 'failed';
      moveToCompleted(job);
    } else {
      job.status = 'pending';
      job.nextRetryAt = Date.now() + RETRY_DELAYS[job.retries - 1];
    }
  }
}

/**
 * Move job to completed list
 */
function moveToCompleted(job: WebhookJob) {
  const index = webhookQueue.indexOf(job);
  if (index > -1) {
    webhookQueue.splice(index, 1);
  }
  completedJobs.push(job);

  // Keep only last 1000 completed jobs
  while (completedJobs.length > 1000) {
    completedJobs.shift();
  }
}

/**
 * Queue status endpoint
 */
export async function GET() {
  const pending = webhookQueue.filter((j) => j.status === 'pending').length;
  const processing = webhookQueue.filter(
    (j) => j.status === 'processing'
  ).length;
  const completed = completedJobs.filter(
    (j) => j.status === 'completed'
  ).length;
  const failed = completedJobs.filter((j) => j.status === 'failed').length;

  const recentCompleted = completedJobs
    .filter((j) => j.status === 'completed')
    .slice(-10)
    .map((j) => ({
      id: j.id,
      url: new URL(j.url).hostname,
      duration: Date.now() - j.createdAt,
      retries: j.retries,
    }));

  const recentFailed = completedJobs
    .filter((j) => j.status === 'failed')
    .slice(-10)
    .map((j) => ({
      id: j.id,
      url: new URL(j.url).hostname,
      error: j.lastError,
      retries: j.retries,
    }));

  return NextResponse.json({
    status: 'healthy',
    isProcessing,
    queue: {
      pending,
      processing,
      total: webhookQueue.length,
    },
    history: {
      completed,
      failed,
      successRate:
        completed + failed > 0
          ? ((completed / (completed + failed)) * 100).toFixed(1)
          : '100',
    },
    recentCompleted,
    recentFailed,
  });
}

/**
 * Manually trigger queue processing
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body.action === 'process') {
    processQueue();
    return NextResponse.json({ message: 'Queue processing started' });
  }

  if (body.action === 'clear') {
    webhookQueue.length = 0;
    return NextResponse.json({ message: 'Queue cleared' });
  }

  if (body.action === 'test') {
    const jobId = queueWebhook(
      body.url || 'https://httpbin.org/post',
      { test: true, timestamp: new Date().toISOString() },
      body.headers || {}
    );
    return NextResponse.json({ jobId, message: 'Test webhook queued' });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

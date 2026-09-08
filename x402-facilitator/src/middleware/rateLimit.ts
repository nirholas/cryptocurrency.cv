import type { MiddlewareHandler } from 'hono';

interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  max: number;
  windowMs: number;
}

/** Fixed-window per-IP limiter kept in process memory. */
export function rateLimit({ max, windowMs }: RateLimitOptions): MiddlewareHandler {
  const buckets = new Map<string, Bucket>();
  return async (c, next) => {
    const ip =
      c.req.header('cf-connecting-ip') ??
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
      c.req.header('x-real-ip') ??
      'unknown';
    const now = Date.now();
    let bucket = buckets.get(ip);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(ip, bucket);
    }
    bucket.count += 1;
    c.header('X-RateLimit-Limit', String(max));
    c.header('X-RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
    c.header('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json({ error: 'Rate limit exceeded', retryAfter }, 429);
    }
    if (buckets.size > 50_000) {
      for (const [key, value] of buckets) if (value.resetAt <= now) buckets.delete(key);
    }
    await next();
  };
}

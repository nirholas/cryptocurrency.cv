import { Hono } from 'hono';
import { logger as honoLogger } from 'hono/logger';

import { Facilitator } from './core/facilitator.js';
import { cors } from './middleware/cors.js';
import { rateLimit } from './middleware/rateLimit.js';
import { healthRoute } from './routes/health.js';
import { infoRoute } from './routes/info.js';
import { settleRoute } from './routes/settle.js';
import { supportedRoute } from './routes/supported.js';
import { verifyRoute } from './routes/verify.js';
import { logger } from './utils/logger.js';
import { renderMetrics } from './utils/metrics.js';

export interface ServerOptions {
  facilitator?: Facilitator;
  corsOrigins?: string;
  rateLimitMax?: number;
  rateLimitWindowMs?: number;
}

export function createServer(options: ServerOptions = {}): { app: Hono; facilitator: Facilitator } {
  const facilitator = options.facilitator ?? new Facilitator();
  const app = new Hono();

  app.use('*', honoLogger((line) => logger.info(line)));
  app.use('*', cors(options.corsOrigins ?? '*'));
  app.use('*', rateLimit({ max: options.rateLimitMax ?? 100, windowMs: options.rateLimitWindowMs ?? 60_000 }));

  app.get('/', (c) => c.redirect('/info'));
  app.route('/verify', verifyRoute(facilitator));
  app.route('/settle', settleRoute(facilitator));
  app.route('/supported', supportedRoute(facilitator));
  app.route('/health', healthRoute(() => facilitator.uptimeSeconds));
  app.route('/info', infoRoute(facilitator));
  app.get('/metrics', (c) => c.text(renderMetrics(), 200, { 'Content-Type': 'text/plain; version=0.0.4' }));

  app.notFound((c) => c.json({ error: 'Not found' }, 404));
  app.onError((error, c) => {
    logger.error({ err: error.message, path: c.req.path }, 'unhandled error');
    return c.json({ error: 'Internal error', message: error.message }, 500);
  });

  return { app, facilitator };
}

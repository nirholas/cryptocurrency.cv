import { Hono } from 'hono';

import type { Facilitator } from '../core/facilitator.js';

/** x402 discovery endpoint: which (scheme, network) pairs this facilitator settles. */
export function supportedRoute(facilitator: Facilitator): Hono {
  const app = new Hono();
  app.get('/', (c) => c.json({ kinds: facilitator.supported() }));
  return app;
}

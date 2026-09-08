import { serve } from '@hono/node-server';

import { env } from './config/env.js';
import { createServer } from './server.js';
import { logger } from './utils/logger.js';

export { Facilitator } from './core/facilitator.js';
export { PaymentVerifier, verifyPayment } from './core/verifier.js';
export { PaymentSettler, settlePayment } from './core/settler.js';
export { NonceStore } from './core/nonce-store.js';
export { x402ResourceServer } from './middleware/x402-resource-server.js';
export { createServer } from './server.js';
export { SUPPORTED_CHAINS, getChainConfig } from './config/chains.js';
export { TOKENS, getToken, getEIP712Domain } from './config/tokens.js';
export type * from './types/index.js';

const isMain = process.argv[1] !== undefined && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isMain) {
  const { app, facilitator } = createServer({
    corsOrigins: env.CORS_ORIGINS,
    rateLimitMax: env.RATE_LIMIT_MAX,
    rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
  });
  serve({ fetch: app.fetch, port: env.PORT, hostname: env.HOST }, (address) => {
    logger.info(
      { port: address.port, host: env.HOST, facilitator: facilitator.address, chains: facilitator.settler.getSupportedChainIds() },
      'x402 facilitator listening',
    );
  });
}

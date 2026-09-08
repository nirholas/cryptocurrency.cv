import { Hono } from 'hono';

import type { Facilitator } from '../core/facilitator.js';
import { facilitatorRequestSchema, formatZodError, toPayment, toRequirements } from '../middleware/validate.js';

export function settleRoute(facilitator: Facilitator): Hono {
  const app = new Hono();
  app.post('/', async (c) => {
    const parsed = facilitatorRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json({ success: false, error: formatZodError(parsed.error) }, 400);
    }
    const payment = toPayment(parsed.data.payment);
    const requirements = toRequirements(parsed.data.paymentRequirements);
    const result = await facilitator.settle(payment, requirements);
    const body = {
      success: result.success,
      txHash: result.txHash ?? null,
      transaction: result.txHash ?? null,
      blockNumber: result.blockNumber ?? null,
      network: result.network,
      chainId: result.chainId,
      payer: result.payer,
      ...(result.error ? { error: result.error, errorReason: result.error } : {}),
    };
    // A rejected verification is the caller's problem (4xx); a chain failure is upstream (502).
    if (!result.success) return c.json(body, result.reason ? 402 : 502);
    return c.json(body);
  });
  return app;
}

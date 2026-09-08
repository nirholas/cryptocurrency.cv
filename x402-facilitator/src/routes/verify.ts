import { Hono } from 'hono';

import type { Facilitator } from '../core/facilitator.js';
import { facilitatorRequestSchema, formatZodError, toPayment, toRequirements } from '../middleware/validate.js';

export function verifyRoute(facilitator: Facilitator): Hono {
  const app = new Hono();
  app.post('/', async (c) => {
    const parsed = facilitatorRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json({ valid: false, isValid: false, invalidReason: formatZodError(parsed.error) }, 400);
    }
    const payment = toPayment(parsed.data.payment);
    const requirements = toRequirements(parsed.data.paymentRequirements);
    const result = await facilitator.verify(payment, requirements);
    if (result.valid) {
      return c.json({ valid: true, isValid: true, payer: result.signer });
    }
    return c.json({ valid: false, isValid: false, invalidReason: result.reason, payer: payment.authorization.from });
  });
  return app;
}

import type { Context, MiddlewareHandler } from 'hono';
import type { Address } from 'viem';

import type { Facilitator } from '../core/facilitator.js';
import type { PaymentRequirements } from '../types/index.js';
import { formatZodError, paymentSchema, toPayment } from './validate.js';

export interface ResourceServerOptions {
  facilitator: Facilitator;
  requirements: PaymentRequirements;
  description?: string;
  /** Settle on-chain before serving (default) or only verify the signature. */
  settle?: boolean;
}

function encodeResponse(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function decodePaymentHeader(raw: string): unknown {
  const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  return JSON.parse(text);
}

function challenge(c: Context, requirements: PaymentRequirements, description: string, error?: string) {
  return c.json(
    {
      x402Version: 1,
      error: error ?? 'Payment required',
      accepts: [
        {
          scheme: 'exact',
          chainId: requirements.chainId,
          asset: requirements.asset,
          payTo: requirements.payTo,
          maxAmountRequired: requirements.maxAmountRequired.toString(),
          maxTimeoutSeconds: 60,
          resource: c.req.url,
          description,
        },
      ],
    },
    402,
  );
}

/**
 * Hono middleware that turns any route into an x402-paid resource: without a
 * valid X-PAYMENT header the client gets a 402 challenge; with one, the payment
 * is verified (and by default settled) through the facilitator before `next()`.
 */
export function x402ResourceServer(options: ResourceServerOptions): MiddlewareHandler {
  const { facilitator, requirements } = options;
  const description = options.description ?? 'x402 paid resource';
  const shouldSettle = options.settle ?? true;

  return async (c, next) => {
    const raw = c.req.header('x-payment');
    if (!raw) return challenge(c, requirements, description);

    let parsedBody: unknown;
    try {
      parsedBody = decodePaymentHeader(raw);
    } catch {
      return challenge(c, requirements, description, 'X-PAYMENT header is not valid base64 JSON');
    }
    const envelope = (parsedBody as { payload?: unknown }).payload ?? parsedBody;
    const parsed = paymentSchema.safeParse(envelope);
    if (!parsed.success) return challenge(c, requirements, description, formatZodError(parsed.error));

    const payment = toPayment(parsed.data);
    if (shouldSettle) {
      const result = await facilitator.settle(payment, requirements);
      if (!result.success) return challenge(c, requirements, description, result.error);
      c.header(
        'X-PAYMENT-RESPONSE',
        encodeResponse({ success: true, txHash: result.txHash, network: result.network, payer: result.payer }),
      );
    } else {
      const verification = await facilitator.verify(payment, requirements);
      if (!verification.valid) return challenge(c, requirements, description, verification.reason);
      c.header('X-PAYMENT-RESPONSE', encodeResponse({ success: true, verified: true, payer: verification.signer as Address }));
    }
    await next();
  };
}

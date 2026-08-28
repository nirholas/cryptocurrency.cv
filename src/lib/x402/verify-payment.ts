/**
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @copyright 2024-2026 nirholas
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

/**
 * Server-side verification of an x402 payment payload.
 *
 * Routes that are exempt from the global x402 gate but still sell something
 * (the API key upgrade route is the only one today) must verify the payment
 * themselves. Treating the presence of a header as proof of payment is not
 * verification: a caller can send `x-402-payment: anything` and get the goods.
 *
 * This asks the configured facilitator to verify the signed payload against the
 * exact requirements the route demands, so an unsigned, replayed, underpaid or
 * wrong-recipient payment is rejected before anything is granted.
 *
 * @module lib/x402/verify-payment
 */

import { FACILITATOR_URL, CURRENT_NETWORK, RECEIVE_ADDRESS } from './config';
import { createLogger } from '@/lib/logger';

const logger = createLogger('x402:verify');

/** How long to wait on the facilitator before giving up. */
const VERIFY_TIMEOUT_MS = 8000;

export interface PaymentRequirements {
  /** Price in whole USD, e.g. 29 for $29. */
  priceUsd: number;
  /** What the payment buys, echoed to the facilitator for its records. */
  description: string;
  /** Recipient address the payment must have been made to. */
  payTo?: string;
}

export type PaymentVerification =
  | { valid: true; payer?: string; transaction?: string }
  | { valid: false; reason: string; code: 'MALFORMED' | 'UNVERIFIED' | 'UNAVAILABLE' };

/**
 * Decodes the `X-PAYMENT` header, which x402 transports as base64-encoded JSON.
 * Returns null when the header is absent or not a payment payload at all, which
 * is the case an attacker sending a placeholder string lands in.
 */
export function decodePaymentHeader(raw: string | null): Record<string, unknown> | null {
  if (!raw || raw.trim() === '') return null;
  const value = raw.trim();

  // Some clients send the JSON directly rather than base64.
  const candidates: string[] = [];
  if (value.startsWith('{')) {
    candidates.push(value);
  } else {
    try {
      candidates.push(Buffer.from(value, 'base64').toString('utf8'));
    } catch {
      return null;
    }
  }

  for (const candidate of candidates) {
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Not JSON: fall through and report malformed.
    }
  }
  return null;
}

/**
 * Verifies a payment payload with the facilitator.
 *
 * Fails closed. If the facilitator cannot be reached the payment is NOT
 * accepted: an unreachable verifier is not evidence that money moved, and this
 * path grants a paid tier. The caller should surface a 402 or 503 and let the
 * buyer retry.
 */
export async function verifyPayment(
  paymentHeader: string | null,
  requirements: PaymentRequirements,
): Promise<PaymentVerification> {
  const payload = decodePaymentHeader(paymentHeader);
  if (!payload) {
    return {
      valid: false,
      code: 'MALFORMED',
      reason: 'X-PAYMENT header is missing or is not a base64-encoded x402 payload',
    };
  }

  const accepts = {
    scheme: 'exact',
    network: CURRENT_NETWORK,
    // x402 quotes USDC in its 6-decimal base unit.
    maxAmountRequired: Math.round(requirements.priceUsd * 1_000_000).toString(),
    payTo: requirements.payTo ?? RECEIVE_ADDRESS,
    description: requirements.description,
    resource: 'https://cryptocurrency.cv/api/keys/upgrade',
    mimeType: 'application/json',
    maxTimeoutSeconds: 60,
  };

  try {
    const response = await fetch(`${FACILITATOR_URL.replace(/\/$/, '')}/verify`, {
      method: 'POST',
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x402Version: 1, paymentPayload: payload, paymentRequirements: accepts }),
    });

    if (!response.ok) {
      logger.warn('Facilitator rejected the verification request', {
        status: response.status,
      });
      return {
        valid: false,
        code: 'UNVERIFIED',
        reason: `Facilitator returned ${response.status}`,
      };
    }

    const result = (await response.json()) as {
      isValid?: boolean;
      invalidReason?: string;
      payer?: string;
      transaction?: string;
    };

    if (result.isValid === true) {
      return { valid: true, payer: result.payer, transaction: result.transaction };
    }

    return {
      valid: false,
      code: 'UNVERIFIED',
      reason: result.invalidReason ?? 'Facilitator reported the payment as invalid',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Could not reach the facilitator to verify a payment', { error: message });
    return {
      valid: false,
      code: 'UNAVAILABLE',
      reason: 'Payment could not be verified right now. No charge was made; please retry.',
    };
  }
}

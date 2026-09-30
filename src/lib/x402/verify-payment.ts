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
 * exact requirements the route demands, so an unsigned, underpaid or
 * wrong-recipient payment is rejected before anything is granted.
 *
 * Verification alone moves no money: `/verify` only checks that the signed
 * transfer authorization WOULD succeed. Routes that grant something must call
 * `collectPayment`, which also settles the authorization on-chain and only
 * reports success once the facilitator returns a transaction. Settling also
 * consumes the authorization's nonce, so the same payload cannot buy twice.
 *
 * @module lib/x402/verify-payment
 */

import { FACILITATOR_URL, CURRENT_NETWORK, RECEIVE_ADDRESS, getAcceptedAssets } from './config';
import { createLogger } from '@/lib/logger';

const logger = createLogger('x402:verify');

/** How long to wait on the facilitator before giving up. */
const VERIFY_TIMEOUT_MS = 8000;
/** Settlement submits a transaction and waits for it, so it gets longer. */
const SETTLE_TIMEOUT_MS = 30_000;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export interface PaymentRequirements {
  /** Price in whole USD, e.g. 29 for $29. */
  priceUsd: number;
  /** What the payment buys, echoed to the facilitator for its records. */
  description: string;
  /** Recipient address the payment must have been made to. */
  payTo?: string;
  /** Path of the resource being bought, e.g. /api/keys/upgrade. */
  resource?: string;
}

export type PaymentVerification =
  | { valid: true; payer?: string; transaction?: string }
  | {
      valid: false;
      reason: string;
      code: 'MALFORMED' | 'UNVERIFIED' | 'UNAVAILABLE' | 'NOT_CONFIGURED';
    };

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

  const accepts = buildRequirements(requirements);

  try {
    const response = await fetch(`${FACILITATOR_URL.replace(/\/$/, '')}/verify`, {
      method: 'POST',
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        x402Version: 1,
        paymentPayload: payload,
        paymentRequirements: accepts,
      }),
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

/** The x402 `exact` payment requirements the facilitator checks a payload against. */
function buildRequirements(requirements: PaymentRequirements) {
  const asset = getAcceptedAssets()[0]?.address;
  return {
    scheme: 'exact',
    network: CURRENT_NETWORK,
    // x402 quotes USDC in its 6-decimal base unit.
    maxAmountRequired: Math.round(requirements.priceUsd * 1_000_000).toString(),
    payTo: requirements.payTo ?? RECEIVE_ADDRESS,
    ...(asset && { asset }),
    description: requirements.description,
    resource: `https://cryptocurrency.cv${requirements.resource ?? '/api/keys/upgrade'}`,
    mimeType: 'application/json',
    maxTimeoutSeconds: 60,
  };
}

/**
 * Verifies a payment and then settles it, so money has actually moved before
 * the caller grants anything. This is the function a route that SELLS
 * something must use; `verifyPayment` alone never charges the buyer.
 *
 * Fails closed at every step: no payee configured, an invalid payload, a
 * rejected settlement, or an unreachable facilitator all return `valid: false`
 * and nothing is charged or granted.
 */
export async function collectPayment(
  paymentHeader: string | null,
  requirements: PaymentRequirements,
): Promise<PaymentVerification> {
  const payTo = requirements.payTo ?? RECEIVE_ADDRESS;
  if (!payTo || payTo.toLowerCase() === ZERO_ADDRESS) {
    return {
      valid: false,
      code: 'NOT_CONFIGURED',
      reason: 'Payments are not enabled on this deployment (no receiving wallet is configured).',
    };
  }

  const verification = await verifyPayment(paymentHeader, { ...requirements, payTo });
  if (!verification.valid) return verification;

  const payload = decodePaymentHeader(paymentHeader);
  const accepts = buildRequirements({ ...requirements, payTo });

  try {
    const response = await fetch(`${FACILITATOR_URL.replace(/\/$/, '')}/settle`, {
      method: 'POST',
      signal: AbortSignal.timeout(SETTLE_TIMEOUT_MS),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        x402Version: 1,
        paymentPayload: payload,
        paymentRequirements: accepts,
      }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      transaction?: string | null;
      txHash?: string | null;
      payer?: string;
      errorReason?: string;
      error?: string;
    };
    const transaction = result.transaction ?? result.txHash ?? undefined;

    if (response.ok && result.success === true && transaction) {
      return { valid: true, payer: result.payer ?? verification.payer, transaction };
    }

    const reason = result.errorReason ?? result.error ?? `Facilitator returned ${response.status}`;
    logger.warn('Facilitator did not settle a verified payment', {
      status: response.status,
      reason,
    });
    // A 5xx is the chain or facilitator failing, not the buyer, so it maps to
    // 503 (retry) rather than 402 (pay again).
    return response.status >= 500
      ? {
          valid: false,
          code: 'UNAVAILABLE',
          reason: `Payment settlement did not complete (${reason}). Nothing was granted. Retry, or if your wallet shows the transfer, contact support with its transaction hash.`,
        }
      : { valid: false, code: 'UNVERIFIED', reason };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Could not reach the facilitator to settle a payment', { error: message });
    return {
      valid: false,
      code: 'UNAVAILABLE',
      reason:
        'Payment settlement could not be confirmed. Nothing was granted. Retry, or if your wallet shows the transfer, contact support with its transaction hash.',
    };
  }
}

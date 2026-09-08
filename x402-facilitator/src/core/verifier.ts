import { verifyTypedData, type Address } from 'viem';

import { getEIP712Domain, TRANSFER_WITH_AUTHORIZATION_TYPES } from '../config/tokens.js';
import type { PaymentRequirements, VerificationResult, X402Payment } from '../types/index.js';
import { logger } from '../utils/logger.js';

function sameAddress(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/**
 * Verifies an x402 payment against a resource server's requirements without
 * touching the chain: field-level requirement checks first (cheap, and they
 * produce specific reasons), then the EIP-712 signature.
 */
export class PaymentVerifier {
  async verify(payment: X402Payment, requirements: PaymentRequirements): Promise<VerificationResult> {
    const { authorization } = payment;

    if (payment.chainId !== requirements.chainId) {
      return { valid: false, reason: 'Chain ID mismatch' };
    }
    if (!sameAddress(payment.token, requirements.asset)) {
      return { valid: false, reason: 'Asset mismatch' };
    }
    if (!sameAddress(authorization.to, requirements.payTo)) {
      return { valid: false, reason: 'Recipient mismatch' };
    }
    if (authorization.value < requirements.maxAmountRequired) {
      return { valid: false, reason: 'Insufficient payment amount' };
    }

    const now = BigInt(Math.floor(Date.now() / 1000));
    if (authorization.validAfter > now) {
      return { valid: false, reason: 'Authorization not yet valid' };
    }
    if (authorization.validBefore <= now) {
      return { valid: false, reason: 'Authorization expired' };
    }
    if (requirements.expiry !== undefined && BigInt(requirements.expiry) <= now) {
      return { valid: false, reason: 'Payment requirement expired' };
    }

    const domain = getEIP712Domain(payment.chainId, payment.token);
    if (!domain) {
      return { valid: false, reason: `No EIP-712 domain for token ${payment.token} on chain ${payment.chainId}` };
    }

    try {
      const ok = await verifyTypedData({
        address: authorization.from,
        domain,
        types: TRANSFER_WITH_AUTHORIZATION_TYPES,
        primaryType: 'TransferWithAuthorization',
        message: {
          from: authorization.from,
          to: authorization.to,
          value: authorization.value,
          validAfter: authorization.validAfter,
          validBefore: authorization.validBefore,
          nonce: authorization.nonce,
        },
        signature: payment.signature,
      });
      if (!ok) {
        logger.warn({ from: authorization.from, chainId: payment.chainId }, 'signature does not recover to from address');
        return { valid: false, reason: 'Invalid signature — signer does not match from address' };
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      logger.warn({ err: reason }, 'signature verification threw');
      return { valid: false, reason };
    }

    return { valid: true, signer: authorization.from as Address };
  }
}

export const paymentVerifier = new PaymentVerifier();

export function verifyPayment(payment: X402Payment, requirements: PaymentRequirements): Promise<VerificationResult> {
  return paymentVerifier.verify(payment, requirements);
}

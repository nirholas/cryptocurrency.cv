import type { Address, Hex } from 'viem';
import { z } from 'zod';

import { isSupportedChainId } from '../config/chains.js';
import type { PaymentRequirements, X402Payment } from '../types/index.js';
import { toBigInt } from '../utils/hex.js';

const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'must be a 20-byte hex address');
const bytes32 = z.string().regex(/^0x[0-9a-fA-F]{64}$/, 'must be a 32-byte hex value');
const signature = z.string().regex(/^0x[0-9a-fA-F]{130}$/, 'must be a 65-byte hex signature');
const uint = z.union([z.string().regex(/^(\d+|0x[0-9a-fA-F]+)$/), z.number().int().nonnegative(), z.bigint()]);
const chainId = z.number().int().refine(isSupportedChainId, { message: 'unsupported chain' });

export const paymentSchema = z
  .object({
    chainId,
    asset: address.optional(),
    token: address.optional(),
    authorization: z.object({
      from: address,
      to: address,
      value: uint,
      validAfter: uint,
      validBefore: uint,
      nonce: bytes32,
    }),
    signature,
  })
  .refine((p) => p.asset || p.token, { message: 'asset (or token) is required', path: ['asset'] });

export const requirementsSchema = z.object({
  chainId,
  asset: address,
  payTo: address,
  maxAmountRequired: uint,
  expiry: z.number().int().nonnegative().optional(),
});

export const facilitatorRequestSchema = z.object({
  x402Version: z.number().int().optional(),
  payment: paymentSchema,
  paymentRequirements: requirementsSchema,
});

export type FacilitatorRequest = z.infer<typeof facilitatorRequestSchema>;

export function toPayment(input: z.infer<typeof paymentSchema>): X402Payment {
  return {
    chainId: input.chainId as X402Payment['chainId'],
    token: (input.asset ?? input.token) as Address,
    authorization: {
      from: input.authorization.from as Address,
      to: input.authorization.to as Address,
      value: toBigInt(input.authorization.value),
      validAfter: toBigInt(input.authorization.validAfter),
      validBefore: toBigInt(input.authorization.validBefore),
      nonce: input.authorization.nonce as Hex,
    },
    signature: input.signature as Hex,
  };
}

export function toRequirements(input: z.infer<typeof requirementsSchema>): PaymentRequirements {
  return {
    chainId: input.chainId as PaymentRequirements['chainId'],
    asset: input.asset as Address,
    payTo: input.payTo as Address,
    maxAmountRequired: toBigInt(input.maxAmountRequired),
    expiry: input.expiry,
  };
}

export function formatZodError(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
}

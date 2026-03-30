/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Type declarations for @x402/evm subpath exports
 *
 * The '@x402/evm/exact/server' subpath is fully typed by the package itself
 * (ExactEvmScheme implements SchemeNetworkServer with parsePrice,
 * enhancePaymentRequirements, and registerMoneyParser). No stub needed.
 */

declare module '@x402/evm/exact/client' {
  import type { PaymentRequirements, PaymentPayload } from '@x402/core/types';

  export interface ClientEvmSigner {
    address: string;
    signTypedData: (params: unknown) => Promise<string>;
  }

  export class ExactEvmScheme {
    readonly scheme: 'exact';
    constructor(signer: ClientEvmSigner);
    createPaymentPayload(
      x402Version: number,
      paymentRequirements: PaymentRequirements
    ): Promise<Pick<PaymentPayload, 'x402Version' | 'payload'>>;
  }
}

declare module '@x402/evm/exact/facilitator' {
  export interface FacilitatorEvmSigner {
    address: string;
    signTypedData: (params: unknown) => Promise<string>;
  }

  export function toFacilitatorEvmSigner(signer: unknown): FacilitatorEvmSigner;
}

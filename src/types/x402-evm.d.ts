/**
 * Type declarations for @x402/evm subpath exports
 * 
 * These declarations help TypeScript resolve the subpath exports
 * from the @x402/evm package that aren't being resolved automatically.
 */

declare module '@x402/evm/exact/server' {
  import type { x402ResourceServer } from '@x402/core/server';

  export interface EvmResourceServerConfig {
    /**
     * Optional networks to register. If not provided, registers wildcard support (eip155:*)
     */
    networks?: string[];
  }

  /**
   * Registers EVM exact payment schemes to an x402ResourceServer instance.
   */
  export function registerExactEvmScheme(
    server: x402ResourceServer,
    config?: EvmResourceServerConfig
  ): x402ResourceServer;

  export class ExactEvmScheme {
    readonly scheme: 'exact';
  }
}

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

import type { Address, Hex } from 'viem';

import { SUPPORTED_CHAINS, getChainConfig } from '../config/chains.js';
import { env } from '../config/env.js';
import { getTokensForChain } from '../config/tokens.js';
import type {
  PaymentRequirements,
  SettlementResult,
  VerificationResult,
  X402Payment,
} from '../types/index.js';
import { logger } from '../utils/logger.js';
import { metrics } from '../utils/metrics.js';
import { NonceStore } from './nonce-store.js';
import { PaymentSettler } from './settler.js';
import { PaymentVerifier } from './verifier.js';

export interface FacilitatorOptions {
  privateKey?: Hex;
  verifier?: PaymentVerifier;
  settler?: PaymentSettler;
  nonceStore?: NonceStore;
}

export interface SupportedKind {
  x402Version: number;
  scheme: 'exact';
  network: string;
  chainId: number;
  asset: Address;
  symbol: string;
  decimals: number;
}

/** Orchestrates verify then settle, with in-flight nonce dedup and metrics. */
export class Facilitator {
  readonly verifier: PaymentVerifier;
  readonly settler: PaymentSettler;
  readonly nonceStore: NonceStore;
  private readonly startedAt = Date.now();

  constructor(options: FacilitatorOptions = {}) {
    this.verifier = options.verifier ?? new PaymentVerifier();
    this.settler =
      options.settler ??
      new PaymentSettler((options.privateKey ?? env.FACILITATOR_PRIVATE_KEY) as Hex, SUPPORTED_CHAINS);
    this.nonceStore = options.nonceStore ?? new NonceStore();
  }

  get address(): Address {
    return this.settler.getAddress();
  }

  get uptimeSeconds(): number {
    return Math.floor((Date.now() - this.startedAt) / 1000);
  }

  async verify(payment: X402Payment, requirements: PaymentRequirements): Promise<VerificationResult> {
    metrics.verifyRequests.inc();
    const started = Date.now();
    try {
      return await this.verifier.verify(payment, requirements);
    } catch (error) {
      metrics.verifyErrors.inc();
      throw error;
    } finally {
      metrics.verifyLatency.observe(Date.now() - started);
    }
  }

  async settle(payment: X402Payment, requirements: PaymentRequirements): Promise<SettlementResult & { payer: Address; reason?: string }> {
    const started = Date.now();
    const chain = getChainConfig(payment.chainId);
    const network = chain?.network ?? 'unknown';
    const payer = payment.authorization.from;

    const verification = await this.verify(payment, requirements);
    if (!verification.valid) {
      metrics.settleRejected.inc();
      return { success: false, chainId: payment.chainId, network, payer, error: verification.reason, reason: verification.reason };
    }

    if (!this.nonceStore.claim(payer, payment.authorization.nonce)) {
      metrics.settleRejected.inc();
      const reason = 'Settlement for this authorization is already in progress';
      return { success: false, chainId: payment.chainId, network, payer, error: reason, reason };
    }

    try {
      const result = await this.settler.settle(payment);
      if (result.success) metrics.settleSuccess.inc();
      else metrics.settleFailed.inc();
      return { ...result, payer };
    } finally {
      metrics.settleLatency.observe(Date.now() - started);
      // Successful settlements stay claimed (the nonce is burned on-chain anyway);
      // failures are released so a retry with corrected gas can go through.
      if (!this.nonceStore.has(payer, payment.authorization.nonce)) {
        logger.debug({ payer }, 'nonce released before settle finished');
      }
    }
  }

  releaseNonce(payer: Address, nonce: Hex): void {
    this.nonceStore.release(payer, nonce);
  }

  supported(): SupportedKind[] {
    return SUPPORTED_CHAINS.flatMap((chain) =>
      getTokensForChain(chain.chainId).map((token) => ({
        x402Version: 1,
        scheme: 'exact' as const,
        network: chain.network,
        chainId: chain.chainId,
        asset: token.address,
        symbol: token.symbol,
        decimals: token.decimals,
      })),
    );
  }
}

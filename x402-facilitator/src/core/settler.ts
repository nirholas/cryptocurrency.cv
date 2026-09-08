import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Chain,
  type Hex,
  type PublicClient,
  type WalletClient,
} from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { arbitrum, arbitrumSepolia, base, baseSepolia, mainnet } from 'viem/chains';

import { EIP3009_ABI } from '../config/tokens.js';
import type { ChainConfig, SettlementResult, X402Payment } from '../types/index.js';
import { decomposeSignature } from '../utils/hex.js';
import { logger } from '../utils/logger.js';

const VIEM_CHAINS: Record<number, Chain> = {
  1: mainnet,
  8453: base,
  84532: baseSepolia,
  42161: arbitrum,
  421614: arbitrumSepolia,
};

interface ChainClients {
  config: ChainConfig;
  publicClient: PublicClient;
  walletClient: WalletClient;
}

/** Turn an RPC/wallet error into a short, stable message for API consumers. */
export function classifySettlementError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (lower.includes('timed out') || lower.includes('timeout')) return `RPC request timed out: ${message}`;
  if (lower.includes('insufficient funds')) return `Facilitator wallet has insufficient gas: ${message}`;
  if (lower.includes('nonce') && lower.includes('used')) return `Authorization nonce already used: ${message}`;
  if (lower.includes('authorization is expired') || lower.includes('expired')) return `Authorization expired: ${message}`;
  if (lower.includes('invalid signature') || lower.includes('invalid v')) return `Invalid signature: ${message}`;
  return message;
}

/**
 * Submits EIP-3009 transferWithAuthorization calls from the facilitator wallet.
 * One wallet + public client pair per supported chain.
 */
export class PaymentSettler {
  private readonly account: PrivateKeyAccount;
  private readonly clients = new Map<number, ChainClients>();

  constructor(privateKey: Hex, chains: readonly ChainConfig[]) {
    this.account = privateKeyToAccount(privateKey);
    for (const config of chains) {
      const chain = VIEM_CHAINS[config.chainId];
      if (!chain) continue;
      const transport = http(config.rpcUrl, { timeout: 30_000 });
      this.clients.set(config.chainId, {
        config,
        publicClient: createPublicClient({ chain, transport }),
        walletClient: createWalletClient({ account: this.account, chain, transport }),
      });
    }
  }

  getAddress(): Address {
    return this.account.address;
  }

  getSupportedChainIds(): number[] {
    return [...this.clients.keys()];
  }

  /** True when the authorization nonce is already consumed on-chain. Undefined when the RPC check failed. */
  async isNonceUsed(chainId: number, token: Address, from: Address, nonce: Hex): Promise<boolean | undefined> {
    const clients = this.clients.get(chainId);
    if (!clients) return undefined;
    try {
      const used = await clients.publicClient.readContract({
        address: token,
        abi: EIP3009_ABI,
        functionName: 'authorizationState',
        args: [from, nonce],
      });
      return Boolean(used);
    } catch (error) {
      logger.warn({ chainId, err: (error as Error).message }, 'nonce pre-check failed; proceeding to submit');
      return undefined;
    }
  }

  async settle(payment: X402Payment): Promise<SettlementResult> {
    const clients = this.clients.get(payment.chainId);
    if (!clients) {
      return {
        success: false,
        chainId: payment.chainId,
        network: 'unknown',
        error: `Unsupported chain: ${payment.chainId}`,
      };
    }
    const { config, publicClient, walletClient } = clients;
    const { authorization } = payment;
    const base: Pick<SettlementResult, 'chainId' | 'network'> = { chainId: config.chainId, network: config.network };

    const nonceUsed = await this.isNonceUsed(payment.chainId, payment.token, authorization.from, authorization.nonce);
    if (nonceUsed === true) {
      return { ...base, success: false, error: 'Authorization nonce already used on-chain' };
    }

    let sig: ReturnType<typeof decomposeSignature>;
    try {
      sig = decomposeSignature(payment.signature);
    } catch (error) {
      return { ...base, success: false, error: (error as Error).message };
    }

    let txHash: Hex;
    try {
      txHash = await walletClient.writeContract({
        account: this.account,
        chain: VIEM_CHAINS[config.chainId],
        address: payment.token,
        abi: EIP3009_ABI,
        functionName: 'transferWithAuthorization',
        args: [
          authorization.from,
          authorization.to,
          authorization.value,
          authorization.validAfter,
          authorization.validBefore,
          authorization.nonce,
          sig.v,
          sig.r,
          sig.s,
        ],
      });
    } catch (error) {
      const message = classifySettlementError(error);
      logger.error({ chainId: config.chainId, from: authorization.from, err: message }, 'transferWithAuthorization submit failed');
      return { ...base, success: false, error: message };
    }

    try {
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 120_000 });
      const blockNumber = Number(receipt.blockNumber);
      if (receipt.status !== 'success') {
        logger.error({ chainId: config.chainId, txHash, blockNumber }, 'settlement transaction reverted');
        return { ...base, success: false, txHash, blockNumber, error: `Transaction reverted on-chain (${txHash})` };
      }
      logger.info({ chainId: config.chainId, txHash, blockNumber, value: authorization.value.toString() }, 'settled');
      return { ...base, success: true, txHash, blockNumber };
    } catch (error) {
      const message = classifySettlementError(error);
      logger.error({ chainId: config.chainId, txHash, err: message }, 'waiting for receipt failed');
      return { ...base, success: false, txHash, error: message };
    }
  }
}

let defaultSettler: PaymentSettler | undefined;

/** Convenience wrapper that lazily builds a settler from the process environment. */
export async function settlePayment(payment: X402Payment): Promise<SettlementResult> {
  if (!defaultSettler) {
    const [{ env }, { SUPPORTED_CHAINS }] = await Promise.all([
      import('../config/env.js'),
      import('../config/chains.js'),
    ]);
    defaultSettler = new PaymentSettler(env.FACILITATOR_PRIVATE_KEY as Hex, SUPPORTED_CHAINS);
  }
  return defaultSettler.settle(payment);
}

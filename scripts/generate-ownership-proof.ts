/**
 * Generate x402 Ownership Proof
 *
 * Signs your origin URL with your payTo wallet's private key (EIP-191 personal_sign)
 * to prove you control the receiving address. Add the output to X402_OWNERSHIP_PROOF env var.
 *
 * Usage:
 *   bun run scripts/generate-ownership-proof.ts
 *
 * Environment variables:
 *   X402_PRIVATE_KEY  - Private key of your payTo wallet (0x-prefixed hex)
 *   X402_ORIGIN       - Origin URL to sign (default: https://cryptocurrency.cv)
 *
 * @see https://github.com/Merit-Systems/x402scan/blob/main/docs/DISCOVERY.md
 */

import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

const PRIVATE_KEY = process.env.X402_PRIVATE_KEY;
const ORIGIN = process.env.X402_ORIGIN || 'https://cryptocurrency.cv';

if (!PRIVATE_KEY) {
  console.error('Error: X402_PRIVATE_KEY environment variable is required.');
  console.error('');
  console.error('Usage:');
  console.error('  X402_PRIVATE_KEY=0x... bun run scripts/generate-ownership-proof.ts');
  console.error('');
  console.error('The private key must belong to your payTo address.');
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

const client = createWalletClient({
  account,
  chain: mainnet,
  transport: http(),
});

const signature = await client.signMessage({ message: ORIGIN });

console.log('');
console.log('x402 Ownership Proof Generated');
console.log('==============================');
console.log(`  Address: ${account.address}`);
console.log(`  Origin:  ${ORIGIN}`);
console.log(`  Proof:   ${signature}`);
console.log('');
console.log('Add to your environment:');
console.log(`  X402_OWNERSHIP_PROOF=${signature}`);
console.log('');

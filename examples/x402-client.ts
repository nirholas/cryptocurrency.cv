/**
 * x402 Payment Client Example - JavaScript/TypeScript
 *
 * This example shows how to make authenticated API calls using x402 payments.
 * Requires: npm install @x402/fetch ethers
 *
 * @see https://docs.x402.org
 */

import { payFetch } from '@x402/fetch';
import { Wallet } from 'ethers';

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_BASE = 'https://cryptocurrency.cv';
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  throw new Error('WALLET_PRIVATE_KEY environment variable required');
}

// Create wallet from private key
const wallet = new Wallet(PRIVATE_KEY);

// =============================================================================
// BASIC USAGE - Pay-per-request
// =============================================================================

/**
 * Make a paid API call with automatic x402 payment
 */
async function fetchNews(): Promise<void> {
  console.log('📰 Fetching crypto news with x402 payment...');
  console.log(`💳 Paying from wallet: ${wallet.address}`);

  try {
    const response = await payFetch(`${API_BASE}/api/v1/news`, {
      wallet,
      // Optional: specify which network to pay on
      // network: 'eip155:8453', // Base mainnet
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Received ${data.articles?.length || 0} articles`);
    console.log('Sample:', data.articles?.[0]?.title);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// =============================================================================
// MULTIPLE ENDPOINTS
// =============================================================================

/**
 * Fetch multiple endpoints with payments
 */
async function fetchMultiple(): Promise<void> {
  const endpoints = [
    '/api/v1/news',
    '/api/v1/trending',
    '/api/v1/market-data',
  ];

  for (const endpoint of endpoints) {
    console.log(`\n📡 Fetching ${endpoint}...`);

    const response = await payFetch(`${API_BASE}${endpoint}`, { wallet });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Success: ${JSON.stringify(data).slice(0, 100)}...`);
    } else {
      console.log(`❌ Failed: ${response.status}`);
    }
  }
}

// =============================================================================
// HANDLE 402 MANUALLY (without @x402/fetch)
// =============================================================================

/**
 * Example of handling 402 response manually
 */
async function handlePaymentManually(): Promise<void> {
  console.log('\n🔧 Manual 402 handling example...');

  // 1. Make initial request
  const response = await fetch(`${API_BASE}/api/v1/coins`);

  if (response.status === 402) {
    // 2. Parse payment requirements
    const data = await response.json();
    console.log('💰 Payment required:', data.x402);

    const accepts = data.x402.accepts[0];
    console.log(`  Network: ${accepts.network}`);
    console.log(`  Amount: ${accepts.maxAmountRequired} (USDC units)`);
    console.log(`  PayTo: ${accepts.payTo}`);

    // 3. Create payment signature using your wallet
    // This is simplified - use @x402/fetch for production
    console.log('\n📝 To pay, use @x402/fetch which handles signing automatically');
  } else {
    const data = await response.json();
    console.log('Response:', data);
  }
}

// =============================================================================
// STREAMING EXAMPLE
// =============================================================================

/**
 * Stream real-time data with payment
 */
async function streamData(): Promise<void> {
  console.log('\n📺 Streaming with payment...');

  const response = await payFetch(`${API_BASE}/api/v1/stream/prices`, {
    wallet,
  });

  if (!response.ok || !response.body) {
    console.log('Streaming not available or payment failed');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    console.log('Received:', chunk);
  }
}

// =============================================================================
// CHECK BALANCE BEFORE PAYING
// =============================================================================

/**
 * Check USDC balance before making requests
 */
async function checkBalance(): Promise<void> {
  console.log('\n💰 Checking USDC balance...');

  // Use viem or ethers to check balance
  // This is a simplified example
  console.log(`Wallet: ${wallet.address}`);
  console.log('Use viem/ethers to check USDC balance before payments');
}

// =============================================================================
// RUN EXAMPLES
// =============================================================================

async function main(): Promise<void> {
  console.log('🚀 x402 Payment Client Examples\n');
  console.log('='.repeat(50));

  await fetchNews();
  await handlePaymentManually();

  console.log('\n' + '='.repeat(50));
  console.log('✅ Examples complete!');
}

main().catch(console.error);

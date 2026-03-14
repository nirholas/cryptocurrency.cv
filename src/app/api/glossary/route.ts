/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Glossary API
 * GET /api/glossary — returns crypto glossary terms
 */

import { type NextRequest, NextResponse } from 'next/server';

const TERMS = [
  { term: 'HODL', definition: 'A misspelling of "hold" that became crypto slang for holding assets long-term rather than selling during volatility.', category: 'Culture' },
  { term: 'DeFi', definition: 'Decentralized Finance — financial services built on blockchain that operate without traditional intermediaries like banks.', category: 'DeFi' },
  { term: 'Gas', definition: 'The fee paid to process transactions on a blockchain network like Ethereum. Measured in gwei on Ethereum.', category: 'Blockchain' },
  { term: 'Wallet', definition: 'Software or hardware that stores your private keys and lets you send, receive, and manage cryptocurrency.', category: 'Basics' },
  { term: 'Staking', definition: 'Locking up cryptocurrency to support a proof-of-stake blockchain network in exchange for rewards.', category: 'DeFi' },
  { term: 'Yield Farming', definition: 'Providing liquidity to DeFi protocols in exchange for token rewards, often optimized across multiple platforms.', category: 'DeFi' },
  { term: 'TVL', definition: 'Total Value Locked — the total amount of assets deposited in a DeFi protocol, used as a measure of protocol adoption.', category: 'DeFi' },
  { term: 'Impermanent Loss', definition: 'Temporary loss from providing liquidity in an AMM when the price ratio of deposited tokens changes compared to simply holding.', category: 'DeFi' },
  { term: 'NFT', definition: 'Non-Fungible Token — a unique digital asset on the blockchain representing ownership of art, collectibles, or other unique items.', category: 'NFTs' },
  { term: 'DAO', definition: 'Decentralized Autonomous Organization — a community-governed organization where decisions are made through token-based voting.', category: 'Governance' },
  { term: 'Hash Rate', definition: 'The total computational power being used to mine and process transactions on a proof-of-work blockchain.', category: 'Mining' },
  { term: 'Cold Storage', definition: 'Keeping private keys completely offline on hardware devices or paper to protect against hacking.', category: 'Security' },
  { term: 'Liquidity Pool', definition: 'A pool of tokens locked in a smart contract that enables decentralized trading, lending, and other DeFi functions.', category: 'DeFi' },
  { term: 'Market Cap', definition: 'The total value of a cryptocurrency calculated by multiplying the current price by the total circulating supply.', category: 'Trading' },
  { term: 'Slippage', definition: 'The difference between the expected price of a trade and the actual executed price, common in low-liquidity markets.', category: 'Trading' },
  { term: 'Mempool', definition: 'The waiting area for unconfirmed transactions before they are added to a block by miners or validators.', category: 'Blockchain' },
  { term: 'MEV', definition: 'Maximal Extractable Value — profit validators can make by reordering, inserting, or censoring transactions within a block.', category: 'Blockchain' },
  { term: 'Airdrop', definition: 'Free distribution of tokens to wallet addresses, often as a marketing strategy or reward for early users.', category: 'Basics' },
  { term: 'Bridge', definition: 'A protocol that enables transferring assets between different blockchain networks.', category: 'Blockchain' },
  { term: 'Oracle', definition: 'A service that provides external real-world data to smart contracts on the blockchain (e.g., Chainlink).', category: 'Blockchain' },
  { term: 'Whale', definition: 'An individual or entity that holds a very large amount of cryptocurrency, capable of influencing market prices.', category: 'Trading' },
  { term: 'Rug Pull', definition: 'A scam where developers abandon a project and run away with investor funds, common in DeFi.', category: 'Security' },
  { term: 'Layer 2', definition: 'Scaling solutions built on top of a base blockchain (Layer 1) to improve transaction speed and reduce costs (e.g., Optimism, Arbitrum).', category: 'Blockchain' },
  { term: 'Seed Phrase', definition: 'A set of 12 or 24 words that serves as a backup to recover your crypto wallet. Must be kept secret and safe.', category: 'Security' },
  { term: 'Smart Contract', definition: 'Self-executing code stored on a blockchain that automatically enforces the terms of an agreement when conditions are met.', category: 'Blockchain' },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const search = searchParams.get('q')?.toLowerCase();
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  let filtered = [...TERMS];

  if (category) {
    filtered = filtered.filter(t => t.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    filtered = filtered.filter(t =>
      t.term.toLowerCase().includes(search) || t.definition.toLowerCase().includes(search)
    );
  }

  filtered = filtered.slice(0, limit);

  return NextResponse.json({
    terms: filtered,
    total: filtered.length,
    categories: [...new Set(TERMS.map(t => t.category))],
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

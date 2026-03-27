/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

export interface NewsVertical {
  slug: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Brand color
  subcategories: string[];
  keywords: string[]; // For auto-categorization
  feedTitle: string; // RSS feed title
}

export const NEWS_VERTICALS: NewsVertical[] = [
  {
    slug: 'business',
    name: 'Business',
    description:
      'Corporate crypto news, funding rounds, M&A, institutional adoption, and industry partnerships.',
    icon: 'Building2',
    color: '#3B82F6',
    subcategories: ['funding', 'm-and-a', 'institutional', 'adoption', 'partnerships'],
    keywords: [
      'funding',
      'raised',
      'series a',
      'series b',
      'acquisition',
      'acquired',
      'merger',
      'partnership',
      'institutional',
      'enterprise',
      'corporate',
      'IPO',
      'valuation',
      'revenue',
      'quarterly',
      'earnings',
      'BlackRock',
      'Fidelity',
      'Goldman',
      'JPMorgan',
      'bank',
      'hedge fund',
    ],
    feedTitle: 'Crypto Business News',
  },
  {
    slug: 'tech',
    name: 'Technology',
    description:
      'Protocol upgrades, infrastructure development, developer tools, scaling solutions, and technical analysis.',
    icon: 'Code',
    color: '#8B5CF6',
    subcategories: ['protocols', 'infrastructure', 'developer-tools', 'upgrades', 'security'],
    keywords: [
      'upgrade',
      'fork',
      'protocol',
      'consensus',
      'EIP',
      'BIP',
      'developer',
      'SDK',
      'API',
      'smart contract',
      'audit',
      'vulnerability',
      'patch',
      'testnet',
      'mainnet',
      'deploy',
      'Solidity',
      'Rust',
      'Move',
      'compiler',
      'node',
      'client',
      'validator',
      'sequencer',
      'rollup',
      'ZK',
      'proof',
    ],
    feedTitle: 'Crypto Tech News',
  },
  {
    slug: 'web3',
    name: 'Web3',
    description:
      'Decentralized applications, social platforms, gaming, metaverse, digital identity, and the decentralized internet.',
    icon: 'Globe',
    color: '#EC4899',
    subcategories: ['dapps', 'social', 'gaming', 'metaverse', 'identity', 'creator-economy'],
    keywords: [
      'dapp',
      'decentralized app',
      'web3',
      'metaverse',
      'gaming',
      'play-to-earn',
      'GameFi',
      'SocialFi',
      'Farcaster',
      'Lens',
      'ENS',
      'identity',
      'DID',
      'credential',
      'NFT marketplace',
      'creator',
      'content',
      'social token',
      'community',
    ],
    feedTitle: 'Web3 News',
  },
  {
    slug: 'defi-news',
    name: 'DeFi',
    description:
      'Decentralized finance news: protocol updates, yield opportunities, TVL changes, governance, and security incidents.',
    icon: 'Layers',
    color: '#14B8A6',
    subcategories: ['lending', 'dex', 'yields', 'governance', 'hacks'],
    keywords: [
      'DeFi',
      'TVL',
      'yield',
      'lending',
      'borrowing',
      'liquidity',
      'AMM',
      'DEX',
      'Uniswap',
      'Aave',
      'Compound',
      'MakerDAO',
      'Curve',
      'Lido',
      'staking',
      'restaking',
      'EigenLayer',
      'flash loan',
      'exploit',
      'hack',
      'governance',
      'proposal',
    ],
    feedTitle: 'DeFi News',
  },
];

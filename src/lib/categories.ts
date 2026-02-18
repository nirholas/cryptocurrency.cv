/**
 * News categories configuration
 */

export interface Category {
  slug: string;
  name: string;
  icon: string;
  description: string;
  keywords: string[];
  color: string;
  bgColor: string;
}

export const categories: Category[] = [
  {
    slug: 'bitcoin',
    name: 'Bitcoin',
    icon: '₿',
    description: 'Bitcoin news, mining, Lightning Network, and BTC market updates',
    keywords: ['bitcoin', 'btc', 'satoshi', 'lightning network', 'halving', 'miner', 'ordinals', 'inscription', 'sats'],
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    slug: 'ethereum',
    name: 'Ethereum',
    icon: 'Ξ',
    description: 'Ethereum ecosystem, ETH updates, Layer 2s, and smart contracts',
    keywords: ['ethereum', 'eth', 'vitalik', 'layer 2', 'l2', 'rollup', 'arbitrum', 'optimism', 'base', 'polygon', 'erc-20', 'erc-721', 'gas', 'gwei'],
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  {
    slug: 'defi',
    name: 'DeFi',
    icon: '🏦',
    description: 'Decentralized finance, yield farming, DEXs, and lending protocols',
    keywords: ['defi', 'yield', 'lending', 'liquidity', 'amm', 'dex', 'aave', 'uniswap', 'compound', 'curve', 'maker', 'lido', 'staking', 'vault', 'protocol', 'tvl', 'swap'],
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    slug: 'nft',
    name: 'NFTs',
    icon: '🖼️',
    description: 'Non-fungible tokens, digital art, collectibles, and NFT marketplaces',
    keywords: ['nft', 'nfts', 'opensea', 'blur', 'collectible', 'pfp', 'digital art', 'mint', 'floor price', 'bored ape', 'cryptopunk', 'azuki'],
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    slug: 'regulation',
    name: 'Regulation',
    icon: '⚖️',
    description: 'Crypto regulations, legal news, SEC, and government policies',
    keywords: ['regulation', 'sec', 'cftc', 'lawsuit', 'legal', 'compliance', 'ban', 'tax', 'government', 'congress', 'law', 'court', 'enforcement', 'policy'],
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  {
    slug: 'altcoins',
    name: 'Altcoins',
    icon: '🪙',
    description: 'Alternative cryptocurrencies, tokens, and emerging projects',
    keywords: ['solana', 'sol', 'cardano', 'ada', 'xrp', 'ripple', 'dogecoin', 'doge', 'shiba', 'avax', 'avalanche', 'dot', 'polkadot', 'bnb', 'binance', 'tron', 'near', 'cosmos', 'atom'],
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
  },
  {
    slug: 'trading',
    name: 'Markets',
    icon: '📈',
    description: 'Market analysis, trading updates, price movements, and exchanges',
    keywords: ['price', 'trading', 'market', 'bull', 'bear', 'rally', 'crash', 'pump', 'dump', 'exchange', 'binance', 'coinbase', 'kraken', 'futures', 'options', 'leverage', 'liquidation'],
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  {
    slug: 'technology',
    name: 'Technology',
    icon: '⚙️',
    description: 'Blockchain technology, development updates, and infrastructure',
    keywords: ['blockchain', 'protocol', 'upgrade', 'fork', 'consensus', 'proof of stake', 'proof of work', 'developer', 'github', 'mainnet', 'testnet', 'node', 'validator', 'security', 'hack', 'exploit'],
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
  {
    slug: 'geopolitical',
    name: 'Geopolitical',
    icon: '🌍',
    description: 'Central bank decisions, regulations, sanctions, and geopolitical events that move crypto markets',
    keywords: ['sanctions', 'central bank', 'federal reserve', 'fed rate', 'interest rate', 'tariff', 'war', 'conflict', 'g7', 'g20', 'treasury', 'geopolitical', 'nato', 'un'],
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find(c => c.slug === slug);
}

export function matchArticleToCategories(title: string, description?: string): string[] {
  const text = `${title} ${description || ''}`.toLowerCase();
  return categories
    .filter(cat => cat.keywords.some(keyword => text.includes(keyword)))
    .map(cat => cat.slug);
}

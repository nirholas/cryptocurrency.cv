/**
 * Tags System for SEO
 * 
 * Extracts, manages, and provides tag-based navigation for crypto news articles.
 * Optimized for search engine discovery and internal linking.
 */

export interface Tag {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: 'asset' | 'topic' | 'event' | 'technology' | 'entity' | 'sentiment';
  keywords: string[]; // Words that trigger this tag
  relatedTags?: string[]; // For internal linking
  priority: number; // Higher = more important for SEO
}

export interface TagWithCount extends Tag {
  count: number;
  trending?: boolean;
}

// Comprehensive tag definitions for SEO
export const TAGS: Record<string, Tag> = {
  // ═══════════════════════════════════════════════════════════════
  // ASSETS - Major cryptocurrencies
  // ═══════════════════════════════════════════════════════════════
  'bitcoin': {
    slug: 'bitcoin',
    name: 'Bitcoin',
    description: 'The original cryptocurrency. News about BTC price, mining, halving, adoption, and the Lightning Network.',
    icon: '₿',
    category: 'asset',
    keywords: ['bitcoin', 'btc', 'satoshi', 'sats', 'lightning network', 'halving'],
    relatedTags: ['mining', 'halving', 'lightning-network', 'institutional'],
    priority: 100,
  },
  'ethereum': {
    slug: 'ethereum',
    name: 'Ethereum',
    description: 'The leading smart contract platform. News about ETH, gas fees, staking, and the Ethereum ecosystem.',
    icon: 'Ξ',
    category: 'asset',
    keywords: ['ethereum', 'eth', 'ether', 'vitalik', 'eip', 'gas fee'],
    relatedTags: ['layer-2', 'defi', 'staking', 'smart-contracts'],
    priority: 95,
  },
  'solana': {
    slug: 'solana',
    name: 'Solana',
    description: 'High-performance blockchain for DeFi and NFTs. SOL price, ecosystem updates, and technical developments.',
    icon: '◎',
    category: 'asset',
    keywords: ['solana', 'sol', 'solana ecosystem'],
    relatedTags: ['defi', 'nft', 'meme-coins'],
    priority: 85,
  },
  'xrp': {
    slug: 'xrp',
    name: 'XRP',
    description: 'Ripple\'s XRP token. Legal updates, SEC case, institutional adoption, and cross-border payments.',
    icon: '✕',
    category: 'asset',
    keywords: ['xrp', 'ripple', 'xrp ledger'],
    relatedTags: ['regulation', 'sec', 'payments'],
    priority: 80,
  },
  'cardano': {
    slug: 'cardano',
    name: 'Cardano',
    description: 'Proof-of-stake blockchain. ADA updates, Plutus smart contracts, and ecosystem development.',
    icon: '₳',
    category: 'asset',
    keywords: ['cardano', 'ada', 'hoskinson', 'plutus'],
    relatedTags: ['staking', 'smart-contracts'],
    priority: 75,
  },
  'bnb': {
    slug: 'bnb',
    name: 'BNB Chain',
    description: 'Binance ecosystem token and blockchain. BNB price, BSC updates, and Binance news.',
    icon: '🔶',
    category: 'asset',
    keywords: ['bnb', 'binance coin', 'bsc', 'bnb chain', 'binance smart chain'],
    relatedTags: ['exchanges', 'defi'],
    priority: 75,
  },
  'dogecoin': {
    slug: 'dogecoin',
    name: 'Dogecoin',
    description: 'The original meme coin. DOGE price, community updates, and Elon Musk mentions.',
    icon: '🐕',
    category: 'asset',
    keywords: ['dogecoin', 'doge', 'shiba', 'meme coin'],
    relatedTags: ['meme-coins', 'elon-musk'],
    priority: 70,
  },
  'stablecoins': {
    slug: 'stablecoins',
    name: 'Stablecoins',
    description: 'USD-pegged cryptocurrencies. USDT, USDC, DAI news, regulations, and market dynamics.',
    icon: '💵',
    category: 'asset',
    keywords: ['stablecoin', 'usdt', 'usdc', 'dai', 'tether', 'circle', 'pax', 'busd'],
    relatedTags: ['regulation', 'defi', 'payments'],
    priority: 85,
  },

  // ═══════════════════════════════════════════════════════════════
  // TOPICS - Major crypto themes
  // ═══════════════════════════════════════════════════════════════
  'defi': {
    slug: 'defi',
    name: 'DeFi',
    description: 'Decentralized finance news. Lending protocols, DEXs, yield farming, and TVL updates.',
    icon: '🏦',
    category: 'topic',
    keywords: ['defi', 'decentralized finance', 'yield', 'tvl', 'lending', 'borrowing', 'liquidity'],
    relatedTags: ['ethereum', 'layer-2', 'smart-contracts', 'yield-farming'],
    priority: 90,
  },
  'nft': {
    slug: 'nft',
    name: 'NFTs',
    description: 'Non-fungible token news. Collections, marketplaces, sales, and digital art trends.',
    icon: '🎨',
    category: 'topic',
    keywords: ['nft', 'non-fungible', 'opensea', 'blur', 'digital art', 'collectible', 'pfp'],
    relatedTags: ['ethereum', 'solana', 'gaming'],
    priority: 75,
  },
  'layer-2': {
    slug: 'layer-2',
    name: 'Layer 2',
    description: 'Scaling solutions for blockchain. Rollups, sidechains, L2 bridges, and performance updates.',
    icon: '🔗',
    category: 'technology',
    keywords: ['layer 2', 'l2', 'rollup', 'optimism', 'arbitrum', 'polygon', 'zksync', 'base', 'scaling'],
    relatedTags: ['ethereum', 'defi', 'gas-fees'],
    priority: 80,
  },
  'mining': {
    slug: 'mining',
    name: 'Mining',
    description: 'Cryptocurrency mining news. Hashrate, mining difficulty, hardware, and profitability.',
    icon: '⛏️',
    category: 'topic',
    keywords: ['mining', 'miner', 'hashrate', 'hash rate', 'asic', 'difficulty'],
    relatedTags: ['bitcoin', 'energy', 'hardware'],
    priority: 70,
  },
  'staking': {
    slug: 'staking',
    name: 'Staking',
    description: 'Proof-of-stake and staking news. Validators, rewards, liquid staking, and restaking.',
    icon: '🥩',
    category: 'topic',
    keywords: ['staking', 'stake', 'validator', 'pos', 'proof of stake', 'restaking', 'liquid staking'],
    relatedTags: ['ethereum', 'defi', 'yield-farming'],
    priority: 75,
  },
  'airdrops': {
    slug: 'airdrops',
    name: 'Airdrops',
    description: 'Token airdrop news and announcements. Eligibility, claims, and upcoming distributions.',
    icon: '🪂',
    category: 'event',
    keywords: ['airdrop', 'token distribution', 'claim', 'free tokens'],
    relatedTags: ['defi', 'layer-2'],
    priority: 70,
  },
  'gaming': {
    slug: 'gaming',
    name: 'Crypto Gaming',
    description: 'Blockchain gaming and GameFi. Play-to-earn, metaverse, and gaming token news.',
    icon: '🎮',
    category: 'topic',
    keywords: ['gaming', 'gamefi', 'play to earn', 'p2e', 'metaverse', 'axie', 'gala'],
    relatedTags: ['nft', 'metaverse'],
    priority: 65,
  },
  'metaverse': {
    slug: 'metaverse',
    name: 'Metaverse',
    description: 'Virtual worlds and metaverse crypto. Land sales, virtual reality, and digital economies.',
    icon: '🌐',
    category: 'topic',
    keywords: ['metaverse', 'virtual world', 'decentraland', 'sandbox', 'vr', 'virtual reality'],
    relatedTags: ['nft', 'gaming'],
    priority: 60,
  },

  // ═══════════════════════════════════════════════════════════════
  // EVENTS - Market events and milestones
  // ═══════════════════════════════════════════════════════════════
  'halving': {
    slug: 'halving',
    name: 'Bitcoin Halving',
    description: 'Bitcoin halving events and analysis. Supply reduction, price impact, and mining economics.',
    icon: '✂️',
    category: 'event',
    keywords: ['halving', 'halvening', 'block reward', 'supply shock'],
    relatedTags: ['bitcoin', 'mining'],
    priority: 85,
  },
  'etf': {
    slug: 'etf',
    name: 'Crypto ETFs',
    description: 'Cryptocurrency ETF news. Bitcoin ETF, Ethereum ETF approvals, flows, and institutional products.',
    icon: '📈',
    category: 'event',
    keywords: ['etf', 'exchange traded fund', 'spot etf', 'futures etf', 'grayscale', 'blackrock', 'fidelity'],
    relatedTags: ['bitcoin', 'ethereum', 'institutional', 'sec'],
    priority: 95,
  },
  'hack': {
    slug: 'hack',
    name: 'Hacks & Exploits',
    description: 'Security incidents in crypto. Protocol exploits, exchange hacks, and stolen funds.',
    icon: '🔓',
    category: 'event',
    keywords: ['hack', 'exploit', 'breach', 'stolen', 'security incident', 'rug pull', 'drain'],
    relatedTags: ['security', 'defi'],
    priority: 80,
  },
  'bankruptcy': {
    slug: 'bankruptcy',
    name: 'Bankruptcies',
    description: 'Crypto company bankruptcies and insolvencies. Legal proceedings and creditor updates.',
    icon: '💥',
    category: 'event',
    keywords: ['bankruptcy', 'insolvent', 'chapter 11', 'ftx', 'celsius', 'voyager', 'blockfi'],
    relatedTags: ['regulation', 'exchanges'],
    priority: 70,
  },
  'whale-activity': {
    slug: 'whale-activity',
    name: 'Whale Activity',
    description: 'Large crypto transactions and whale movements. Exchange inflows, accumulation, and distribution.',
    icon: '🐋',
    category: 'event',
    keywords: ['whale', 'large transaction', 'accumulation', 'distribution', 'exchange inflow', 'exchange outflow'],
    relatedTags: ['bitcoin', 'ethereum', 'trading'],
    priority: 65,
  },

  // ═══════════════════════════════════════════════════════════════
  // REGULATION & ENTITIES
  // ═══════════════════════════════════════════════════════════════
  'regulation': {
    slug: 'regulation',
    name: 'Regulation',
    description: 'Cryptocurrency regulation news. Global policies, compliance, and legal frameworks.',
    icon: '⚖️',
    category: 'topic',
    keywords: ['regulation', 'regulatory', 'compliance', 'law', 'legal', 'legislation', 'policy'],
    relatedTags: ['sec', 'cftc', 'institutional'],
    priority: 90,
  },
  'sec': {
    slug: 'sec',
    name: 'SEC',
    description: 'U.S. Securities and Exchange Commission crypto news. Enforcement, lawsuits, and policy.',
    icon: '🏛️',
    category: 'entity',
    keywords: ['sec', 'securities', 'gensler', 'enforcement', 'lawsuit', 'wells notice'],
    relatedTags: ['regulation', 'etf', 'xrp'],
    priority: 85,
  },
  'institutional': {
    slug: 'institutional',
    name: 'Institutional',
    description: 'Institutional crypto adoption. Banks, hedge funds, corporations, and Wall Street.',
    icon: '🏢',
    category: 'topic',
    keywords: ['institutional', 'institution', 'bank', 'hedge fund', 'corporation', 'wall street', 'goldman', 'jpmorgan', 'blackrock', 'fidelity'],
    relatedTags: ['etf', 'regulation', 'bitcoin'],
    priority: 85,
  },
  'exchanges': {
    slug: 'exchanges',
    name: 'Exchanges',
    description: 'Cryptocurrency exchange news. Binance, Coinbase, listings, delistings, and trading updates.',
    icon: '🏪',
    category: 'entity',
    keywords: ['exchange', 'binance', 'coinbase', 'kraken', 'okx', 'bybit', 'listing', 'delisting'],
    relatedTags: ['trading', 'regulation'],
    priority: 80,
  },

  // ═══════════════════════════════════════════════════════════════
  // TECHNOLOGY
  // ═══════════════════════════════════════════════════════════════
  'smart-contracts': {
    slug: 'smart-contracts',
    name: 'Smart Contracts',
    description: 'Smart contract technology and development. Solidity, audits, and protocol upgrades.',
    icon: '📜',
    category: 'technology',
    keywords: ['smart contract', 'solidity', 'vyper', 'evm', 'contract', 'audit'],
    relatedTags: ['ethereum', 'defi', 'security'],
    priority: 70,
  },
  'ai-crypto': {
    slug: 'ai-crypto',
    name: 'AI & Crypto',
    description: 'Artificial intelligence and blockchain convergence. AI tokens, agents, and decentralized AI.',
    icon: '🤖',
    category: 'technology',
    keywords: ['ai', 'artificial intelligence', 'machine learning', 'ai token', 'fetch', 'ocean', 'singularity'],
    relatedTags: ['defi', 'technology'],
    priority: 80,
  },
  'privacy': {
    slug: 'privacy',
    name: 'Privacy Coins',
    description: 'Privacy-focused cryptocurrencies. Monero, Zcash, and privacy technology news.',
    icon: '🔒',
    category: 'technology',
    keywords: ['privacy', 'monero', 'xmr', 'zcash', 'zec', 'tornado', 'mixer', 'anonymous'],
    relatedTags: ['regulation', 'security'],
    priority: 65,
  },
  'oracles': {
    slug: 'oracles',
    name: 'Oracles',
    description: 'Blockchain oracle networks. Chainlink, price feeds, and data verification.',
    icon: '🔮',
    category: 'technology',
    keywords: ['oracle', 'chainlink', 'link', 'price feed', 'data feed', 'pyth', 'band'],
    relatedTags: ['defi', 'smart-contracts'],
    priority: 65,
  },
  'lightning-network': {
    slug: 'lightning-network',
    name: 'Lightning Network',
    description: 'Bitcoin\'s Lightning Network. Layer 2 scaling, payments, and node updates.',
    icon: '⚡',
    category: 'technology',
    keywords: ['lightning', 'lightning network', 'lnd', 'lightning channel', 'lightning node'],
    relatedTags: ['bitcoin', 'payments', 'layer-2'],
    priority: 70,
  },

  // ═══════════════════════════════════════════════════════════════
  // MARKET SENTIMENT
  // ═══════════════════════════════════════════════════════════════
  'bullish': {
    slug: 'bullish',
    name: 'Bullish News',
    description: 'Positive crypto news and bullish developments. Price rallies, adoption, and growth.',
    icon: '🐂',
    category: 'sentiment',
    keywords: ['bullish', 'rally', 'surge', 'soar', 'moon', 'pump', 'ath', 'all time high', 'breakout'],
    relatedTags: ['trading', 'institutional'],
    priority: 60,
  },
  'bearish': {
    slug: 'bearish',
    name: 'Bearish News',
    description: 'Negative crypto news and bearish developments. Price drops, concerns, and risks.',
    icon: '🐻',
    category: 'sentiment',
    keywords: ['bearish', 'crash', 'dump', 'plunge', 'drop', 'decline', 'fear', 'capitulation'],
    relatedTags: ['trading', 'hack'],
    priority: 60,
  },
  'meme-coins': {
    slug: 'meme-coins',
    name: 'Meme Coins',
    description: 'Meme cryptocurrency news. Dogecoin, Shiba Inu, and viral token trends.',
    icon: '🐸',
    category: 'topic',
    keywords: ['meme coin', 'memecoin', 'doge', 'shib', 'pepe', 'bonk', 'wif', 'floki'],
    relatedTags: ['dogecoin', 'solana', 'trading'],
    priority: 70,
  },

  // ═══════════════════════════════════════════════════════════════
  // ADDITIONAL TOPICS
  // ═══════════════════════════════════════════════════════════════
  'yield-farming': {
    slug: 'yield-farming',
    name: 'Yield Farming',
    description: 'DeFi yield farming strategies. Liquidity mining, APY rates, and protocol incentives.',
    icon: '🌾',
    category: 'topic',
    keywords: ['yield', 'farm', 'liquidity mining', 'apy', 'apr', 'rewards'],
    relatedTags: ['defi', 'staking'],
    priority: 65,
  },
  'gas-fees': {
    slug: 'gas-fees',
    name: 'Gas Fees',
    description: 'Blockchain transaction fees. Ethereum gas, fee spikes, and cost optimization.',
    icon: '⛽',
    category: 'topic',
    keywords: ['gas', 'gas fee', 'transaction fee', 'gwei', 'eip-1559'],
    relatedTags: ['ethereum', 'layer-2'],
    priority: 60,
  },
  'payments': {
    slug: 'payments',
    name: 'Crypto Payments',
    description: 'Cryptocurrency payment adoption. Merchant acceptance, payment processors, and use cases.',
    icon: '💳',
    category: 'topic',
    keywords: ['payment', 'pay', 'merchant', 'visa', 'mastercard', 'paypal', 'remittance'],
    relatedTags: ['stablecoins', 'lightning-network', 'institutional'],
    priority: 70,
  },
  'security': {
    slug: 'security',
    name: 'Security',
    description: 'Crypto security best practices. Wallet safety, audits, and protective measures.',
    icon: '🛡️',
    category: 'topic',
    keywords: ['security', 'secure', 'audit', 'vulnerability', 'bug bounty', 'wallet security'],
    relatedTags: ['hack', 'smart-contracts'],
    priority: 70,
  },
  'trading': {
    slug: 'trading',
    name: 'Trading',
    description: 'Crypto trading news. Technical analysis, derivatives, and market movements.',
    icon: '📊',
    category: 'topic',
    keywords: ['trading', 'trade', 'futures', 'options', 'leverage', 'long', 'short', 'liquidation'],
    relatedTags: ['exchanges', 'whale-activity'],
    priority: 75,
  },
  'cbdc': {
    slug: 'cbdc',
    name: 'CBDCs',
    description: 'Central Bank Digital Currencies. Government digital money initiatives worldwide.',
    icon: '🏦',
    category: 'topic',
    keywords: ['cbdc', 'central bank digital currency', 'digital dollar', 'digital euro', 'digital yuan'],
    relatedTags: ['regulation', 'stablecoins', 'payments'],
    priority: 70,
  },
  'elon-musk': {
    slug: 'elon-musk',
    name: 'Elon Musk',
    description: 'Elon Musk crypto mentions and influence. Tesla, SpaceX, and X (Twitter) crypto news.',
    icon: '🚀',
    category: 'entity',
    keywords: ['elon', 'musk', 'tesla', 'spacex', 'twitter', 'x corp'],
    relatedTags: ['dogecoin', 'bitcoin', 'meme-coins'],
    priority: 75,
  },
};

// Get all tags sorted by priority
export function getAllTags(): Tag[] {
  return Object.values(TAGS).sort((a, b) => b.priority - a.priority);
}

// Get tags by category
export function getTagsByCategory(category: Tag['category']): Tag[] {
  return Object.values(TAGS)
    .filter(tag => tag.category === category)
    .sort((a, b) => b.priority - a.priority);
}

// Get a single tag by slug
export function getTagBySlug(slug: string): Tag | undefined {
  return TAGS[slug];
}

// Extract tags from article text
export function extractTagsFromText(text: string): Tag[] {
  const lowerText = text.toLowerCase();
  const matchedTags: Tag[] = [];
  
  for (const tag of Object.values(TAGS)) {
    for (const keyword of tag.keywords) {
      // Use word boundary matching for better accuracy
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lowerText)) {
        matchedTags.push(tag);
        break; // Only add each tag once
      }
    }
  }
  
  // Sort by priority and limit
  return matchedTags
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 10);
}

// Extract tags from article
export function extractTagsFromArticle(article: { title: string; description?: string }): Tag[] {
  const text = `${article.title} ${article.description || ''}`;
  return extractTagsFromText(text);
}

// Get related tags for a given tag
export function getRelatedTags(slug: string): Tag[] {
  const tag = TAGS[slug];
  if (!tag || !tag.relatedTags) return [];
  
  return tag.relatedTags
    .map(relatedSlug => TAGS[relatedSlug])
    .filter((t): t is Tag => t !== undefined);
}

// Generate SEO-friendly tag URL
export function getTagUrl(slug: string): string {
  return `/tags/${slug}`;
}

// Generate structured data for a tag page
export function generateTagStructuredData(tag: Tag, articleCount: number): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${tag.name} Crypto News`,
    description: tag.description,
    url: `https://freecryptonews.io/tags/${tag.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: articleCount,
      itemListElement: [],
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://freecryptonews.io',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Tags',
          item: 'https://freecryptonews.io/tags',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: tag.name,
          item: `https://freecryptonews.io/tags/${tag.slug}`,
        },
      ],
    },
  };
}

// Generate sitemap entries for all tags
export function generateTagsSitemapEntries(): Array<{ url: string; priority: number }> {
  return Object.values(TAGS).map(tag => ({
    url: `/tags/${tag.slug}`,
    priority: Math.min(0.9, 0.5 + (tag.priority / 200)), // Convert priority to 0.5-0.9 range
  }));
}

export default TAGS;

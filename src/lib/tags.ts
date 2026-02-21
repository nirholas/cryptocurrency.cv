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
    relatedTags: ['bitcoin', 'halving'],
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
    relatedTags: ['sec', 'institutional'],
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
    relatedTags: ['defi'],
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

  // ═══════════════════════════════════════════════════════════════
  // ADDITIONAL ASSETS
  // ═══════════════════════════════════════════════════════════════
  'polkadot': {
    slug: 'polkadot',
    name: 'Polkadot',
    description: 'Polkadot ecosystem news. DOT token, parachains, and cross-chain interoperability.',
    icon: '⬡',
    category: 'asset',
    keywords: ['polkadot', 'dot', 'parachain', 'substrate', 'gavin wood'],
    relatedTags: ['staking', 'layer-2'],
    priority: 70,
  },
  'avalanche': {
    slug: 'avalanche',
    name: 'Avalanche',
    description: 'Avalanche blockchain news. AVAX token, subnets, and DeFi ecosystem.',
    icon: '🔺',
    category: 'asset',
    keywords: ['avalanche', 'avax', 'subnet', 'ava labs'],
    relatedTags: ['defi', 'layer-2'],
    priority: 70,
  },
  'chainlink': {
    slug: 'chainlink',
    name: 'Chainlink',
    description: 'Chainlink oracle network news. LINK token, price feeds, and data services.',
    icon: '⬢',
    category: 'asset',
    keywords: ['chainlink', 'link', 'oracle', 'price feed', 'ccip'],
    relatedTags: ['defi', 'smart-contracts'],
    priority: 70,
  },
  'polygon': {
    slug: 'polygon',
    name: 'Polygon',
    description: 'Polygon network news. MATIC/POL token, zkEVM, and scaling solutions.',
    icon: '⬣',
    category: 'asset',
    keywords: ['polygon', 'matic', 'pol', 'zkevm', 'polygon cdk'],
    relatedTags: ['layer-2', 'ethereum'],
    priority: 72,
  },
  'arbitrum': {
    slug: 'arbitrum',
    name: 'Arbitrum',
    description: 'Arbitrum Layer 2 news. ARB token, Nitro upgrades, and ecosystem growth.',
    icon: '🔵',
    category: 'asset',
    keywords: ['arbitrum', 'arb', 'nitro', 'orbit', 'offchain labs'],
    relatedTags: ['layer-2', 'ethereum', 'defi'],
    priority: 72,
  },
  'optimism': {
    slug: 'optimism',
    name: 'Optimism',
    description: 'Optimism Layer 2 news. OP token, Superchain, and optimistic rollups.',
    icon: '🔴',
    category: 'asset',
    keywords: ['optimism', 'op', 'superchain', 'op stack', 'bedrock'],
    relatedTags: ['layer-2', 'ethereum'],
    priority: 72,
  },
  'cosmos': {
    slug: 'cosmos',
    name: 'Cosmos',
    description: 'Cosmos ecosystem news. ATOM token, IBC protocol, and app chains.',
    icon: '⚛️',
    category: 'asset',
    keywords: ['cosmos', 'atom', 'ibc', 'tendermint', 'cosmos hub'],
    relatedTags: ['staking', 'defi'],
    priority: 68,
  },
  'near': {
    slug: 'near',
    name: 'NEAR Protocol',
    description: 'NEAR Protocol news. NEAR token, sharding, and developer ecosystem.',
    icon: '🌐',
    category: 'asset',
    keywords: ['near', 'near protocol', 'nightshade', 'aurora'],
    relatedTags: ['layer-2', 'defi'],
    priority: 65,
  },
  'sui': {
    slug: 'sui',
    name: 'Sui',
    description: 'Sui blockchain news. SUI token, Move language, and performance.',
    icon: '💧',
    category: 'asset',
    keywords: ['sui', 'sui network', 'move', 'mysten labs'],
    relatedTags: ['layer-2', 'defi'],
    priority: 65,
  },
  'aptos': {
    slug: 'aptos',
    name: 'Aptos',
    description: 'Aptos blockchain news. APT token, Move language, and ecosystem.',
    icon: '🍃',
    category: 'asset',
    keywords: ['aptos', 'apt', 'aptos labs', 'move'],
    relatedTags: ['layer-2', 'defi'],
    priority: 65,
  },
  'toncoin': {
    slug: 'toncoin',
    name: 'TON',
    description: 'TON blockchain news. Toncoin, Telegram integration, and ecosystem.',
    icon: '💎',
    category: 'asset',
    keywords: ['ton', 'toncoin', 'telegram', 'the open network'],
    relatedTags: ['payments', 'gaming'],
    priority: 68,
  },
  'tron': {
    slug: 'tron',
    name: 'TRON',
    description: 'TRON network news. TRX token, USDT on TRON, and stablecoin transfers.',
    icon: '⚡',
    category: 'asset',
    keywords: ['tron', 'trx', 'justin sun', 'trc20'],
    relatedTags: ['stablecoins', 'payments'],
    priority: 65,
  },
  'litecoin': {
    slug: 'litecoin',
    name: 'Litecoin',
    description: 'Litecoin news. LTC price, halving events, and Bitcoin alternative.',
    icon: 'Ł',
    category: 'asset',
    keywords: ['litecoin', 'ltc', 'charlie lee'],
    relatedTags: ['bitcoin', 'mining'],
    priority: 60,
  },
  'uniswap': {
    slug: 'uniswap',
    name: 'Uniswap',
    description: 'Uniswap DEX news. UNI token, liquidity pools, and AMM updates.',
    icon: '🦄',
    category: 'asset',
    keywords: ['uniswap', 'uni', 'uni v4', 'amm', 'dex'],
    relatedTags: ['defi', 'ethereum'],
    priority: 72,
  },
  'aave': {
    slug: 'aave',
    name: 'Aave',
    description: 'Aave lending protocol news. AAVE token, lending markets, and governance.',
    icon: '👻',
    category: 'asset',
    keywords: ['aave', 'lending', 'flash loan', 'gho'],
    relatedTags: ['defi', 'ethereum'],
    priority: 70,
  },
  'maker': {
    slug: 'maker',
    name: 'MakerDAO',
    description: 'MakerDAO news. MKR token, DAI stablecoin, and governance.',
    icon: '🏛️',
    category: 'asset',
    keywords: ['maker', 'mkr', 'dai', 'makerdao', 'endgame'],
    relatedTags: ['defi', 'stablecoins'],
    priority: 68,
  },
  'lido': {
    slug: 'lido',
    name: 'Lido',
    description: 'Lido liquid staking news. LDO token, stETH, and staking derivatives.',
    icon: '🌊',
    category: 'asset',
    keywords: ['lido', 'ldo', 'steth', 'liquid staking'],
    relatedTags: ['staking', 'ethereum'],
    priority: 70,
  },

  // ═══════════════════════════════════════════════════════════════
  // ADDITIONAL TOPICS
  // ═══════════════════════════════════════════════════════════════
  'rwa': {
    slug: 'rwa',
    name: 'Real World Assets',
    description: 'Tokenization of real world assets. RWA protocols, treasury bills, and real estate.',
    icon: '🏠',
    category: 'topic',
    keywords: ['rwa', 'real world asset', 'tokenization', 'treasury', 'tokenized'],
    relatedTags: ['defi', 'institutional'],
    priority: 78,
  },
  'restaking': {
    slug: 'restaking',
    name: 'Restaking',
    description: 'Restaking protocols and liquid restaking. EigenLayer, restaked ETH, and AVS.',
    icon: '🔄',
    category: 'topic',
    keywords: ['restaking', 'restake', 'eigenlayer', 'avs', 'lrt'],
    relatedTags: ['staking', 'ethereum'],
    priority: 75,
  },
  'zk': {
    slug: 'zk',
    name: 'Zero Knowledge',
    description: 'Zero-knowledge proof technology. zkRollups, zkSNARKs, and privacy.',
    icon: '🔐',
    category: 'technology',
    keywords: ['zk', 'zero knowledge', 'zksnark', 'zkstark', 'zkevm', 'zkrollup'],
    relatedTags: ['layer-2', 'ethereum'],
    priority: 75,
  },
  'modular': {
    slug: 'modular',
    name: 'Modular Blockchain',
    description: 'Modular blockchain architecture. Data availability, execution layers, and Celestia.',
    icon: '🧱',
    category: 'technology',
    keywords: ['modular', 'celestia', 'data availability', 'da layer', 'rollup'],
    relatedTags: ['layer-2', 'ethereum'],
    priority: 70,
  },
  'derivatives': {
    slug: 'derivatives',
    name: 'Derivatives',
    description: 'Crypto derivatives trading. Futures, options, perpetuals, and open interest.',
    icon: '📈',
    category: 'topic',
    keywords: ['derivative', 'futures', 'perpetual', 'options', 'open interest', 'funding rate'],
    relatedTags: ['trading', 'exchanges'],
    priority: 72,
  },
  'airdrop': {
    slug: 'airdrop',
    name: 'Airdrops',
    description: 'Crypto airdrop news. Token distributions, eligibility, and claims.',
    icon: '🪂',
    category: 'event',
    keywords: ['airdrop', 'token distribution', 'claim', 'eligible', 'drop'],
    relatedTags: ['defi', 'layer-2'],
    priority: 70,
  },
  'exploit': {
    slug: 'exploit',
    name: 'Exploits',
    description: 'DeFi and crypto exploits. Security vulnerabilities and protocol breaches.',
    icon: '💥',
    category: 'event',
    keywords: ['exploit', 'vulnerability', 'drain', 'attack', 'reentrancy'],
    relatedTags: ['hack', 'security'],
    priority: 72,
  },
  'mempool': {
    slug: 'mempool',
    name: 'Mempool & MEV',
    description: 'Mempool dynamics and MEV. Frontrunning, sandwich attacks, and block builders.',
    icon: '⚡',
    category: 'technology',
    keywords: ['mempool', 'mev', 'frontrun', 'sandwich', 'flashbots', 'block builder'],
    relatedTags: ['ethereum', 'trading'],
    priority: 65,
  },
  'bridge': {
    slug: 'bridge',
    name: 'Bridges',
    description: 'Cross-chain bridge news. Bridge security, hacks, and interoperability.',
    icon: '🌉',
    category: 'technology',
    keywords: ['bridge', 'cross-chain', 'wormhole', 'layerzero', 'multichain'],
    relatedTags: ['layer-2', 'hack'],
    priority: 68,
  },
  'dex': {
    slug: 'dex',
    name: 'DEX',
    description: 'Decentralized exchange news. DEX volume, AMMs, and orderbook DEXes.',
    icon: '🔄',
    category: 'topic',
    keywords: ['dex', 'decentralized exchange', 'amm', 'orderbook', 'swap'],
    relatedTags: ['defi', 'trading'],
    priority: 72,
  },
  'lending': {
    slug: 'lending',
    name: 'DeFi Lending',
    description: 'DeFi lending and borrowing. Interest rates, collateral, and liquidations.',
    icon: '🏦',
    category: 'topic',
    keywords: ['lending', 'borrowing', 'collateral', 'liquidation', 'interest rate'],
    relatedTags: ['defi', 'aave'],
    priority: 68,
  },
  'dao': {
    slug: 'dao',
    name: 'DAOs',
    description: 'Decentralized autonomous organizations. Governance, voting, and treasury.',
    icon: '🏛️',
    category: 'topic',
    keywords: ['dao', 'governance', 'proposal', 'vote', 'treasury'],
    relatedTags: ['defi', 'ethereum'],
    priority: 68,
  },
  'layer-1': {
    slug: 'layer-1',
    name: 'Layer 1',
    description: 'Layer 1 blockchain news. Base layer protocols and network upgrades.',
    icon: '🔷',
    category: 'technology',
    keywords: ['layer 1', 'l1', 'mainnet', 'base layer'],
    relatedTags: ['ethereum', 'bitcoin', 'solana'],
    priority: 70,
  },
  'social-fi': {
    slug: 'social-fi',
    name: 'SocialFi',
    description: 'Social finance and decentralized social. Friend.tech, Lens, and Farcaster.',
    icon: '👥',
    category: 'topic',
    keywords: ['socialfi', 'social', 'friend.tech', 'lens', 'farcaster'],
    relatedTags: ['defi', 'nft'],
    priority: 65,
  },
  'insurance': {
    slug: 'insurance',
    name: 'DeFi Insurance',
    description: 'Crypto and DeFi insurance. Protocol coverage and risk protection.',
    icon: '🛡️',
    category: 'topic',
    keywords: ['insurance', 'nexus mutual', 'coverage', 'risk'],
    relatedTags: ['defi', 'security'],
    priority: 60,
  },
  'base': {
    slug: 'base',
    name: 'Base',
    description: 'Base network news. Coinbase L2, ecosystem growth, and DeFi.',
    icon: '🔵',
    category: 'asset',
    keywords: ['base', 'coinbase l2', 'base chain'],
    relatedTags: ['layer-2', 'ethereum'],
    priority: 72,
  },
  'bitcoin-etf': {
    slug: 'bitcoin-etf',
    name: 'Bitcoin ETF',
    description: 'Bitcoin ETF news. Spot ETF approvals, flows, and institutional adoption.',
    icon: '📊',
    category: 'topic',
    keywords: ['bitcoin etf', 'spot etf', 'gbtc', 'ibit', 'etf approval', 'etf flow'],
    relatedTags: ['bitcoin', 'institutional'],
    priority: 85,
  },
  'ethereum-etf': {
    slug: 'ethereum-etf',
    name: 'Ethereum ETF',
    description: 'Ethereum ETF news. Spot ETF developments and institutional products.',
    icon: '📈',
    category: 'topic',
    keywords: ['ethereum etf', 'eth etf', 'ether etf'],
    relatedTags: ['ethereum', 'institutional'],
    priority: 80,
  },
  'depin': {
    slug: 'depin',
    name: 'DePIN',
    description: 'Decentralized physical infrastructure. IoT, storage, and compute networks.',
    icon: '🌐',
    category: 'topic',
    keywords: ['depin', 'physical infrastructure', 'iot', 'filecoin', 'helium', 'render'],
    relatedTags: ['ai-crypto'],
    priority: 70,
  },
  'sanctions': {
    slug: 'sanctions',
    name: 'Sanctions',
    description: 'Crypto sanctions and compliance. OFAC, sanctioned addresses, and enforcement.',
    icon: '🚫',
    category: 'topic',
    keywords: ['sanction', 'ofac', 'blacklist', 'compliance', 'enforcement'],
    relatedTags: ['regulation', 'privacy'],
    priority: 68,
  },
  'taxes': {
    slug: 'taxes',
    name: 'Crypto Taxes',
    description: 'Cryptocurrency taxation news. Tax reporting, regulations, and guidance.',
    icon: '🧾',
    category: 'topic',
    keywords: ['tax', 'taxes', 'irs', 'capital gains', 'tax reporting'],
    relatedTags: ['regulation'],
    priority: 65,
  },
  'venture-capital': {
    slug: 'venture-capital',
    name: 'Venture Capital',
    description: 'Crypto venture capital news. Funding rounds, valuations, and investments.',
    icon: '💰',
    category: 'topic',
    keywords: ['venture capital', 'vc', 'funding', 'series a', 'seed round', 'investment'],
    relatedTags: ['institutional'],
    priority: 70,
  },
  'ipo': {
    slug: 'ipo',
    name: 'IPO',
    description: 'Crypto company IPOs. Public listings and stock market debuts.',
    icon: '🔔',
    category: 'event',
    keywords: ['ipo', 'public offering', 'stock', 'listing', 'nasdaq'],
    relatedTags: ['institutional', 'exchanges'],
    priority: 65,
  },
  'merge': {
    slug: 'merge',
    name: 'Merger & Acquisition',
    description: 'Crypto M&A news. Company acquisitions, mergers, and deals.',
    icon: '🤝',
    category: 'event',
    keywords: ['merger', 'acquisition', 'acquire', 'buyout', 'deal'],
    relatedTags: ['institutional', 'exchanges'],
    priority: 65,
  },
  'developer': {
    slug: 'developer',
    name: 'Developer',
    description: 'Crypto developer news. SDKs, APIs, and development tools.',
    icon: '👨‍💻',
    category: 'topic',
    keywords: ['developer', 'sdk', 'api', 'development', 'build', 'github'],
    relatedTags: ['ethereum', 'smart-contracts'],
    priority: 62,
  },
  'wallet': {
    slug: 'wallet',
    name: 'Wallets',
    description: 'Crypto wallet news. Self-custody, hardware wallets, and wallet security.',
    icon: '👛',
    category: 'topic',
    keywords: ['wallet', 'metamask', 'ledger', 'trezor', 'self-custody', 'hot wallet'],
    relatedTags: ['security', 'ethereum'],
    priority: 68,
  },
  'fork': {
    slug: 'fork',
    name: 'Forks',
    description: 'Blockchain fork news. Hard forks, soft forks, and network upgrades.',
    icon: '🍴',
    category: 'event',
    keywords: ['fork', 'hard fork', 'soft fork', 'upgrade', 'chain split'],
    relatedTags: ['bitcoin', 'ethereum'],
    priority: 65,
  },
  'testnet': {
    slug: 'testnet',
    name: 'Testnet',
    description: 'Testnet launches and updates. Protocol testing and beta programs.',
    icon: '🧪',
    category: 'event',
    keywords: ['testnet', 'devnet', 'beta', 'test network', 'incentivized testnet'],
    relatedTags: ['developer', 'airdrop'],
    priority: 60,
  },
  'mainnet': {
    slug: 'mainnet',
    name: 'Mainnet Launch',
    description: 'Mainnet launches and go-lives. Production network deployments.',
    icon: '🚀',
    category: 'event',
    keywords: ['mainnet', 'launch', 'go live', 'production', 'live'],
    relatedTags: ['layer-1', 'layer-2'],
    priority: 70,
  },
  'opensea': {
    slug: 'opensea',
    name: 'OpenSea',
    description: 'OpenSea NFT marketplace news. Volume, features, and competition.',
    icon: '🌊',
    category: 'entity',
    keywords: ['opensea', 'nft marketplace'],
    relatedTags: ['nft', 'ethereum'],
    priority: 62,
  },
  'blur': {
    slug: 'blur',
    name: 'Blur',
    description: 'Blur NFT marketplace news. Volume, airdrops, and trader rewards.',
    icon: '💨',
    category: 'entity',
    keywords: ['blur', 'blur nft', 'blur marketplace'],
    relatedTags: ['nft', 'ethereum', 'airdrop'],
    priority: 60,
  },
  'blackrock': {
    slug: 'blackrock',
    name: 'BlackRock',
    description: 'BlackRock crypto news. IBIT Bitcoin ETF and institutional crypto.',
    icon: '🏢',
    category: 'entity',
    keywords: ['blackrock', 'ibit', 'larry fink'],
    relatedTags: ['bitcoin-etf', 'institutional'],
    priority: 75,
  },
  'grayscale': {
    slug: 'grayscale',
    name: 'Grayscale',
    description: 'Grayscale investments news. GBTC, trusts, and crypto products.',
    icon: '⬛',
    category: 'entity',
    keywords: ['grayscale', 'gbtc', 'ethe', 'grayscale trust'],
    relatedTags: ['bitcoin-etf', 'institutional'],
    priority: 72,
  },
  'fidelity': {
    slug: 'fidelity',
    name: 'Fidelity',
    description: 'Fidelity crypto news. Digital assets division and custody services.',
    icon: '🏦',
    category: 'entity',
    keywords: ['fidelity', 'fidelity digital'],
    relatedTags: ['bitcoin-etf', 'institutional'],
    priority: 70,
  },
  'microstrategy': {
    slug: 'microstrategy',
    name: 'MicroStrategy',
    description: 'MicroStrategy Bitcoin holdings. MSTR stock and corporate BTC strategy.',
    icon: '📊',
    category: 'entity',
    keywords: ['microstrategy', 'mstr', 'saylor', 'michael saylor'],
    relatedTags: ['bitcoin', 'institutional'],
    priority: 72,
  },
  'el-salvador': {
    slug: 'el-salvador',
    name: 'El Salvador',
    description: 'El Salvador Bitcoin news. Legal tender adoption and Bitcoin bonds.',
    icon: '🇸🇻',
    category: 'entity',
    keywords: ['el salvador', 'bukele', 'bitcoin legal tender'],
    relatedTags: ['bitcoin', 'regulation'],
    priority: 65,
  },
  'argentina': {
    slug: 'argentina',
    name: 'Argentina Crypto',
    description: 'Argentina cryptocurrency news. Adoption, inflation hedge, and policy.',
    icon: '🇦🇷',
    category: 'entity',
    keywords: ['argentina', 'milei', 'peso', 'latin america'],
    relatedTags: ['stablecoins', 'bitcoin'],
    priority: 60,
  },
  'hong-kong': {
    slug: 'hong-kong',
    name: 'Hong Kong Crypto',
    description: 'Hong Kong cryptocurrency news. Regulations, ETFs, and crypto hub.',
    icon: '🇭🇰',
    category: 'entity',
    keywords: ['hong kong', 'hk', 'asia crypto'],
    relatedTags: ['regulation', 'exchanges'],
    priority: 65,
  },
  'dubai': {
    slug: 'dubai',
    name: 'Dubai & UAE Crypto',
    description: 'Dubai and UAE cryptocurrency news. VARA regulations and crypto adoption.',
    icon: '🇦🇪',
    category: 'entity',
    keywords: ['dubai', 'uae', 'vara', 'abu dhabi'],
    relatedTags: ['regulation', 'institutional'],
    priority: 65,
  },
  'singapore': {
    slug: 'singapore',
    name: 'Singapore Crypto',
    description: 'Singapore cryptocurrency news. MAS regulations and fintech hub.',
    icon: '🇸🇬',
    category: 'entity',
    keywords: ['singapore', 'mas', 'singapore crypto'],
    relatedTags: ['regulation', 'exchanges'],
    priority: 62,
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

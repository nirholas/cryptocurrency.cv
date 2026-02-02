/**
 * Free Crypto News - RSS Feed Aggregator
 * 
 * 100% FREE - no API keys required!
 * Aggregates news from 130+ major English crypto sources across 21 categories:
 * - General: 20 sources (CoinDesk, The Block, Decrypt, CoinTelegraph, Blockworks, etc.)
 * - DeFi: 12 sources (The Defiant, Bankless, Uniswap, Aave, Compound, etc.)
 * - Research: 8 sources (Messari, Paradigm, Delphi Digital, a16z Crypto, etc.)
 * - Institutional: 8 sources (Galaxy Digital, Pantera Capital, Multicoin, etc.)
 * - Mainstream: 7 sources (Bloomberg, Reuters, Forbes, CNBC, Yahoo Finance, etc.)
 * - Layer 2: 7 sources (L2BEAT, Optimism, Arbitrum, Polygon, zkSync, Base, etc.)
 * - ETF/Asset Managers: 7 sources (Grayscale, Bitwise, VanEck, ARK, 21Shares, etc.)
 * - Alt L1: 7 sources (NEAR, Cosmos, Avalanche, Sui, Aptos, Cardano, Polkadot)
 * - Trading: 6 sources (BeInCrypto, AMBCrypto, FXStreet, TradingView, CryptoQuant)
 * - Security: 6 sources (SlowMist, CertiK, OpenZeppelin, Trail of Bits, samczsun, Immunefi)
 * - Developer: 6 sources (Alchemy, Chainlink, Infura, The Graph, Hardhat, Foundry)
 * - Quant: 5 sources (AQR, Two Sigma, Man Institute, Alpha Architect, QuantStart)
 * - On-Chain: 5 sources (Glassnode, Kaiko, IntoTheBlock, Coin Metrics, Willy Woo)
 * - Bitcoin: 5 sources (Bitcoin Magazine, Bitcoinist, BTC Times, Lightning Labs, Stacker News)
 * - NFT: 4 sources (NFT Now, NFT Evening, NFT Plazas, DappRadar)
 * - Ethereum: 4 sources (Week in Ethereum, Etherscan, Daily Gwei)
 * - Mining: 3 sources (Bitcoin Mining News, Hashrate Index, Compass Mining)
 * - Macro: 3 sources (Lyn Alden, Alhambra Partners, Macro Voices)
 * - Journalism: 3 sources (Unchained, DL News, Protos)
 * - Fintech: 3 sources (Finextra, PYMNTS, Fintech Futures)
 * - Stablecoin: 2 sources (Circle, Tether)
 * - TradFi: 2 sources (Goldman Sachs, BNY Mellon)
 * - Other: Solana, Gaming, Derivatives, Asia
 */

import sanitizeHtml from 'sanitize-html';

// RSS Feed URLs for crypto news sources (130+ sources)
const RSS_SOURCES = {
  // ═══════════════════════════════════════════════════════════════
  // TIER 1: Major News Outlets
  // ═══════════════════════════════════════════════════════════════
  coindesk: {
    name: 'CoinDesk',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    category: 'general',
  },
  theblock: {
    name: 'The Block',
    url: 'https://www.theblock.co/rss.xml',
    category: 'general',
  },
  decrypt: {
    name: 'Decrypt',
    url: 'https://decrypt.co/feed',
    category: 'general',
  },
  cointelegraph: {
    name: 'CoinTelegraph',
    url: 'https://cointelegraph.com/rss',
    category: 'general',
  },
  bitcoinmagazine: {
    name: 'Bitcoin Magazine',
    url: 'https://bitcoinmagazine.com/.rss/full/',
    category: 'bitcoin',
  },
  blockworks: {
    name: 'Blockworks',
    url: 'https://blockworks.co/feed',
    category: 'general',
  },
  defiant: {
    name: 'The Defiant',
    url: 'https://thedefiant.io/feed',
    category: 'defi',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // TIER 2: Established News Sources
  // ═══════════════════════════════════════════════════════════════
  bitcoinist: {
    name: 'Bitcoinist',
    url: 'https://bitcoinist.com/feed/',
    category: 'bitcoin',
  },
  cryptoslate: {
    name: 'CryptoSlate',
    url: 'https://cryptoslate.com/feed/',
    category: 'general',
  },
  newsbtc: {
    name: 'NewsBTC',
    url: 'https://www.newsbtc.com/feed/',
    category: 'general',
  },
  cryptonews: {
    name: 'Crypto.news',
    url: 'https://crypto.news/feed/',
    category: 'general',
  },
  cryptopotato: {
    name: 'CryptoPotato',
    url: 'https://cryptopotato.com/feed/',
    category: 'general',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: DeFi & Web3 Focused Sources
  // ═══════════════════════════════════════════════════════════════
  defirate: {
    name: 'DeFi Rate',
    url: 'https://defirate.com/feed/',
    category: 'defi',
  },
  dailydefi: {
    name: 'Daily DeFi',
    url: 'https://dailydefi.org/feed/',
    category: 'defi',
  },
  rekt: {
    name: 'Rekt News',
    url: 'https://rekt.news/rss.xml',
    category: 'defi',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: NFT & Metaverse Sources
  // ═══════════════════════════════════════════════════════════════
  nftnow: {
    name: 'NFT Now',
    url: 'https://nftnow.com/feed/',
    category: 'nft',
  },
  nftevening: {
    name: 'NFT Evening',
    url: 'https://nftevening.com/feed/',
    category: 'nft',
    skipCache: true, // Feed exceeds 2MB Next.js cache limit
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Research & Analysis Sources
  // ═══════════════════════════════════════════════════════════════
  messari: {
    name: 'Messari',
    url: 'https://messari.io/rss',
    category: 'research',
  },
  thedefireport: {
    name: 'The DeFi Report',
    url: 'https://thedefireport.substack.com/feed',
    category: 'research',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Trading & Market Analysis
  // ═══════════════════════════════════════════════════════════════
  ambcrypto: {
    name: 'AMBCrypto',
    url: 'https://ambcrypto.com/feed/',
    category: 'trading',
  },
  beincrypto: {
    name: 'BeInCrypto',
    url: 'https://beincrypto.com/feed/',
    category: 'trading',
  },
  u_today: {
    name: 'U.Today',
    url: 'https://u.today/rss',
    category: 'trading',
  },
  cryptobriefing: {
    name: 'Crypto Briefing',
    url: 'https://cryptobriefing.com/feed/',
    category: 'research',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Mining & Infrastructure
  // ═══════════════════════════════════════════════════════════════
  bitcoinmining: {
    name: 'Bitcoin Mining News',
    url: 'https://bitcoinmagazine.com/tags/mining/.rss/full/',
    category: 'mining',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Ethereum-Focused Sources
  // ═══════════════════════════════════════════════════════════════
  weekinethereumnews: {
    name: 'Week in Ethereum',
    url: 'https://weekinethereumnews.com/feed/',
    category: 'ethereum',
  },
  etherscan: {
    name: 'Etherscan Blog',
    url: 'https://etherscan.io/blog?rss',
    category: 'ethereum',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Layer 2 & Scaling Solutions
  // ═══════════════════════════════════════════════════════════════
  l2beat: {
    name: 'L2BEAT Blog',
    url: 'https://l2beat.com/blog/rss.xml',
    category: 'layer2',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Regulatory & Institutional
  // ═══════════════════════════════════════════════════════════════
  coinbase_blog: {
    name: 'Coinbase Blog',
    url: 'https://www.coinbase.com/blog/rss.xml',
    category: 'institutional',
  },
  binance_blog: {
    name: 'Binance Blog',
    url: 'https://www.binance.com/en/blog/rss.xml',
    category: 'institutional',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Asia-Pacific English Sources
  // ═══════════════════════════════════════════════════════════════
  forkast: {
    name: 'Forkast News',
    url: 'https://forkast.news/feed/',
    category: 'asia',
  },
  coingape: {
    name: 'CoinGape',
    url: 'https://coingape.com/feed/',
    category: 'general',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Bitcoin-Specific Sources
  // ═══════════════════════════════════════════════════════════════
  btctimes: {
    name: 'BTC Times',
    url: 'https://www.btctimes.com/feed/',
    category: 'bitcoin',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Security & Hacks
  // ═══════════════════════════════════════════════════════════════
  slowmist: {
    name: 'SlowMist Blog',
    url: 'https://slowmist.medium.com/feed',
    category: 'security',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Solana Ecosystem
  // ═══════════════════════════════════════════════════════════════
  solana_news: {
    name: 'Solana News',
    url: 'https://solana.com/news/rss.xml',
    category: 'solana',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Additional General News Sources
  // ═══════════════════════════════════════════════════════════════
  dailyhodl: {
    name: 'The Daily Hodl',
    url: 'https://dailyhodl.com/feed/',
    category: 'general',
  },
  coinjournal: {
    name: 'CoinJournal',
    url: 'https://coinjournal.net/feed/',
    category: 'general',
  },
  cryptoglobe: {
    name: 'CryptoGlobe',
    url: 'https://www.cryptoglobe.com/latest/feed/',
    category: 'general',
  },
  zycrypto: {
    name: 'ZyCrypto',
    url: 'https://zycrypto.com/feed/',
    category: 'general',
  },
  cryptodaily: {
    name: 'Crypto Daily',
    url: 'https://cryptodaily.co.uk/feed',
    category: 'general',
  },
  blockonomi: {
    name: 'Blockonomi',
    url: 'https://blockonomi.com/feed/',
    category: 'general',
  },
  usethebitcoin: {
    name: 'UseTheBitcoin',
    url: 'https://usethebitcoin.com/feed/',
    category: 'general',
  },
  nulltx: {
    name: 'NullTX',
    url: 'https://nulltx.com/feed/',
    category: 'general',
  },
  coinspeaker: {
    name: 'Coinspeaker',
    url: 'https://www.coinspeaker.com/feed/',
    category: 'general',
  },
  cryptoninjas: {
    name: 'CryptoNinjas',
    url: 'https://www.cryptoninjas.net/feed/',
    category: 'general',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Additional DeFi Sources
  // ═══════════════════════════════════════════════════════════════
  defipulse: {
    name: 'DeFi Pulse Blog',
    url: 'https://defipulse.com/blog/feed/',
    category: 'defi',
  },
  bankless: {
    name: 'Bankless',
    url: 'https://newsletter.banklesshq.com/feed',
    category: 'defi',
  },
  defillama_news: {
    name: 'DefiLlama News',
    url: 'https://defillama.com/feed',
    category: 'defi',
  },
  yearn_blog: {
    name: 'Yearn Finance Blog',
    url: 'https://blog.yearn.finance/feed',
    category: 'defi',
  },
  uniswap_blog: {
    name: 'Uniswap Blog',
    url: 'https://uniswap.org/blog/feed.xml',
    category: 'defi',
  },
  aave_blog: {
    name: 'Aave Blog',
    url: 'https://aave.mirror.xyz/feed/atom',
    category: 'defi',
  },
  compound_blog: {
    name: 'Compound Blog',
    url: 'https://medium.com/feed/compound-finance',
    category: 'defi',
  },
  makerdao_blog: {
    name: 'MakerDAO Blog',
    url: 'https://blog.makerdao.com/feed/',
    category: 'defi',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Layer 2 & Scaling
  // ═══════════════════════════════════════════════════════════════
  optimism_blog: {
    name: 'Optimism Blog',
    url: 'https://optimism.mirror.xyz/feed/atom',
    category: 'layer2',
  },
  arbitrum_blog: {
    name: 'Arbitrum Blog',
    url: 'https://arbitrum.io/blog/rss.xml',
    category: 'layer2',
  },
  polygon_blog: {
    name: 'Polygon Blog',
    url: 'https://polygon.technology/blog/feed',
    category: 'layer2',
  },
  starknet_blog: {
    name: 'StarkNet Blog',
    url: 'https://starkware.medium.com/feed',
    category: 'layer2',
  },
  zksync_blog: {
    name: 'zkSync Blog',
    url: 'https://zksync.mirror.xyz/feed/atom',
    category: 'layer2',
  },
  base_blog: {
    name: 'Base Blog',
    url: 'https://base.mirror.xyz/feed/atom',
    category: 'layer2',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Research & Analysis Deep Dive
  // ═══════════════════════════════════════════════════════════════
  glassnode: {
    name: 'Glassnode Insights',
    url: 'https://insights.glassnode.com/rss/',
    category: 'research',
  },
  delphi_digital: {
    name: 'Delphi Digital',
    url: 'https://members.delphidigital.io/feed',
    category: 'research',
  },
  paradigm_research: {
    name: 'Paradigm Research',
    url: 'https://www.paradigm.xyz/feed.xml',
    category: 'research',
  },
  a16z_crypto: {
    name: 'a16z Crypto',
    url: 'https://a16zcrypto.com/feed/',
    category: 'research',
  },
  theblockresearch: {
    name: 'The Block Research',
    url: 'https://www.theblock.co/research/feed',
    category: 'research',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Developer & Tech Sources
  // ═══════════════════════════════════════════════════════════════
  alchemy_blog: {
    name: 'Alchemy Blog',
    url: 'https://www.alchemy.com/blog/rss',
    category: 'developer',
  },
  chainlink_blog: {
    name: 'Chainlink Blog',
    url: 'https://blog.chain.link/feed/',
    category: 'developer',
  },
  infura_blog: {
    name: 'Infura Blog',
    url: 'https://blog.infura.io/feed/',
    category: 'developer',
  },
  thegraph_blog: {
    name: 'The Graph Blog',
    url: 'https://thegraph.com/blog/feed',
    category: 'developer',
  },
  hardhat_blog: {
    name: 'Hardhat Blog',
    url: 'https://hardhat.org/blog/rss.xml',
    category: 'developer',
  },
  foundry_blog: {
    name: 'Foundry Blog',
    url: 'https://book.getfoundry.sh/feed.xml',
    category: 'developer',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Security & Auditing
  // ═══════════════════════════════════════════════════════════════
  certik_blog: {
    name: 'CertiK Blog',
    url: 'https://www.certik.com/resources/blog/rss.xml',
    category: 'security',
  },
  openzeppelin_blog: {
    name: 'OpenZeppelin Blog',
    url: 'https://blog.openzeppelin.com/feed/',
    category: 'security',
  },
  trailofbits: {
    name: 'Trail of Bits Blog',
    url: 'https://blog.trailofbits.com/feed/',
    category: 'security',
  },
  samczsun: {
    name: 'samczsun Blog',
    url: 'https://samczsun.com/rss/',
    category: 'security',
  },
  immunefi_blog: {
    name: 'Immunefi Blog',
    url: 'https://immunefi.medium.com/feed',
    category: 'security',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Trading & Market Analysis Extended
  // ═══════════════════════════════════════════════════════════════
  fxstreet_crypto: {
    name: 'FXStreet Crypto',
    url: 'https://www.fxstreet.com/cryptocurrencies/news/feed',
    category: 'trading',
  },
  tradingview_crypto: {
    name: 'TradingView Crypto Ideas',
    url: 'https://www.tradingview.com/feed/?sort=recent&stream=crypto',
    category: 'trading',
  },
  cryptoquant_blog: {
    name: 'CryptoQuant Blog',
    url: 'https://cryptoquant.com/blog/feed',
    category: 'trading',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Mining & Energy
  // ═══════════════════════════════════════════════════════════════
  hashrateindex: {
    name: 'Hashrate Index',
    url: 'https://hashrateindex.com/blog/feed/',
    category: 'mining',
  },
  compassmining_blog: {
    name: 'Compass Mining Blog',
    url: 'https://compassmining.io/education/feed/',
    category: 'mining',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Mainstream Finance Crypto Coverage
  // ═══════════════════════════════════════════════════════════════
  bloomberg_crypto: {
    name: 'Bloomberg Crypto',
    url: 'https://www.bloomberg.com/crypto/feed',
    category: 'mainstream',
  },
  reuters_crypto: {
    name: 'Reuters Crypto',
    url: 'https://www.reuters.com/technology/cryptocurrency/rss',
    category: 'mainstream',
  },
  forbes_crypto: {
    name: 'Forbes Crypto',
    url: 'https://www.forbes.com/crypto-blockchain/feed/',
    category: 'mainstream',
  },
  cnbc_crypto: {
    name: 'CNBC Crypto',
    url: 'https://www.cnbc.com/id/100727362/device/rss/rss.html',
    category: 'mainstream',
  },
  yahoo_crypto: {
    name: 'Yahoo Finance Crypto',
    url: 'https://finance.yahoo.com/rss/cryptocurrency',
    category: 'mainstream',
  },
  wsj_crypto: {
    name: 'Wall Street Journal Crypto',
    url: 'https://feeds.a.dj.com/rss/RSSWSJD.xml',
    category: 'mainstream',
  },
  ft_crypto: {
    name: 'Financial Times Crypto',
    url: 'https://www.ft.com/cryptocurrencies?format=rss',
    category: 'mainstream',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: NFT & Gaming Extended
  // ═══════════════════════════════════════════════════════════════
  nftplazas: {
    name: 'NFT Plazas',
    url: 'https://nftplazas.com/feed/',
    category: 'nft',
  },
  playtoearn: {
    name: 'PlayToEarn',
    url: 'https://playtoearn.net/feed/',
    category: 'gaming',
  },
  dappradar_blog: {
    name: 'DappRadar Blog',
    url: 'https://dappradar.com/blog/feed',
    category: 'nft',
    skipCache: true, // Feed exceeds 2MB Next.js cache limit
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Bitcoin Ecosystem Extended
  // ═══════════════════════════════════════════════════════════════
  lightninglabs_blog: {
    name: 'Lightning Labs Blog',
    url: 'https://lightning.engineering/feed',
    category: 'bitcoin',
  },
  stackernews: {
    name: 'Stacker News',
    url: 'https://stacker.news/rss',
    category: 'bitcoin',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Alternative L1 Ecosystems
  // ═══════════════════════════════════════════════════════════════
  near_blog: {
    name: 'NEAR Protocol Blog',
    url: 'https://near.org/blog/feed/',
    category: 'altl1',
  },
  cosmos_blog: {
    name: 'Cosmos Blog',
    url: 'https://blog.cosmos.network/feed',
    category: 'altl1',
  },
  avalanche_blog: {
    name: 'Avalanche Blog',
    url: 'https://medium.com/feed/avalancheavax',
    category: 'altl1',
  },
  sui_blog: {
    name: 'Sui Blog',
    url: 'https://blog.sui.io/feed/',
    category: 'altl1',
  },
  aptos_blog: {
    name: 'Aptos Blog',
    url: 'https://medium.com/feed/aptoslabs',
    category: 'altl1',
  },
  cardano_blog: {
    name: 'Cardano Blog',
    url: 'https://iohk.io/en/blog/posts/feed.rss',
    category: 'altl1',
  },
  polkadot_blog: {
    name: 'Polkadot Blog',
    url: 'https://polkadot.network/blog/feed/',
    category: 'altl1',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Stablecoin & CBDC News
  // ═══════════════════════════════════════════════════════════════
  circle_blog: {
    name: 'Circle Blog',
    url: 'https://www.circle.com/blog/feed',
    category: 'stablecoin',
  },
  tether_news: {
    name: 'Tether News',
    url: 'https://tether.to/en/news/feed/',
    category: 'stablecoin',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // INSTITUTIONAL RESEARCH & VC INSIGHTS
  // ═══════════════════════════════════════════════════════════════
  galaxy_research: {
    name: 'Galaxy Digital Research',
    url: 'https://www.galaxy.com/insights/feed/',
    category: 'institutional',
  },
  pantera_capital: {
    name: 'Pantera Capital',
    url: 'https://panteracapital.com/feed/',
    category: 'institutional',
  },
  multicoin_capital: {
    name: 'Multicoin Capital',
    url: 'https://multicoin.capital/feed/',
    category: 'institutional',
  },
  placeholder_vc: {
    name: 'Placeholder VC',
    url: 'https://www.placeholder.vc/blog?format=rss',
    category: 'institutional',
  },
  variant_fund: {
    name: 'Variant Fund',
    url: 'https://variant.fund/writing/rss',
    category: 'institutional',
  },
  dragonfly_research: {
    name: 'Dragonfly Research',
    url: 'https://medium.com/feed/dragonfly-research',
    category: 'institutional',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // ASSET MANAGERS & ETF ISSUERS
  // ═══════════════════════════════════════════════════════════════
  grayscale_insights: {
    name: 'Grayscale Insights',
    url: 'https://grayscale.com/insights/feed/',
    category: 'etf',
  },
  bitwise_research: {
    name: 'Bitwise Research',
    url: 'https://bitwiseinvestments.com/feed/',
    category: 'etf',
  },
  vaneck_blog: {
    name: 'VanEck Blog',
    url: 'https://www.vaneck.com/us/en/blogs/rss/',
    category: 'etf',
    skipCache: true, // Feed exceeds 2MB Next.js cache limit (~18MB)
  },
  coinshares_research: {
    name: 'CoinShares Research',
    url: 'https://blog.coinshares.com/feed',
    category: 'etf',
  },
  ark_invest: {
    name: 'ARK Invest',
    url: 'https://ark-invest.com/articles/feed/',
    category: 'etf',
  },
  twentyone_shares: {
    name: '21Shares Research',
    url: 'https://21shares.com/research/feed/',
    category: 'etf',
  },
  wisdomtree_blog: {
    name: 'WisdomTree Blog',
    url: 'https://www.wisdomtree.com/blog/feed',
    category: 'etf',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // DERIVATIVES & OPTIONS MARKET
  // ═══════════════════════════════════════════════════════════════
  deribit_insights: {
    name: 'Deribit Insights',
    url: 'https://insights.deribit.com/feed/',
    category: 'derivatives',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // ON-CHAIN ANALYTICS & DATA PROVIDERS
  // ═══════════════════════════════════════════════════════════════
  kaiko_research: {
    name: 'Kaiko Research',
    url: 'https://blog.kaiko.com/rss/',
    category: 'onchain',
  },
  intotheblock: {
    name: 'IntoTheBlock',
    url: 'https://medium.com/feed/intotheblock',
    category: 'onchain',
  },
  coin_metrics: {
    name: 'Coin Metrics',
    url: 'https://coinmetrics.substack.com/feed',
    category: 'onchain',
  },
  thetie_research: {
    name: 'The Tie Research',
    url: 'https://blog.thetie.io/feed/',
    category: 'onchain',
  },
  woobull: {
    name: 'Willy Woo (Woobull)',
    url: 'https://woobull.com/feed/',
    category: 'onchain',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // FINTECH & PAYMENTS NEWS
  // ═══════════════════════════════════════════════════════════════
  finextra: {
    name: 'Finextra',
    url: 'https://www.finextra.com/rss/headlines.aspx',
    category: 'fintech',
  },
  pymnts_crypto: {
    name: 'PYMNTS Crypto',
    url: 'https://www.pymnts.com/cryptocurrency/feed/',
    category: 'fintech',
  },
  fintech_futures: {
    name: 'Fintech Futures',
    url: 'https://www.fintechfutures.com/feed/',
    category: 'fintech',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // MACRO ANALYSIS & INDEPENDENT RESEARCHERS
  // ═══════════════════════════════════════════════════════════════
  lyn_alden: {
    name: 'Lyn Alden',
    url: 'https://www.lynalden.com/feed/',
    category: 'macro',
  },
  alhambra_partners: {
    name: 'Alhambra Partners',
    url: 'https://www.alhambrapartners.com/feed/',
    category: 'macro',
  },
  macro_voices: {
    name: 'Macro Voices',
    url: 'https://www.macrovoices.com/feed',
    category: 'macro',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // QUANT & SYSTEMATIC TRADING RESEARCH
  // ═══════════════════════════════════════════════════════════════
  aqr_insights: {
    name: 'AQR Insights',
    url: 'https://www.aqr.com/Insights/feed',
    category: 'quant',
  },
  two_sigma_insights: {
    name: 'Two Sigma Insights',
    url: 'https://www.twosigma.com/insights/rss/',
    category: 'quant',
  },
  man_institute: {
    name: 'Man Institute',
    url: 'https://www.man.com/maninstitute/feed',
    category: 'quant',
  },
  alpha_architect: {
    name: 'Alpha Architect',
    url: 'https://alphaarchitect.com/feed/',
    category: 'quant',
  },
  quantstart: {
    name: 'QuantStart',
    url: 'https://www.quantstart.com/articles/rss/',
    category: 'quant',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // ADDITIONAL CRYPTO JOURNALISM
  // ═══════════════════════════════════════════════════════════════
  unchained_crypto: {
    name: 'Unchained Crypto',
    url: 'https://unchainedcrypto.com/feed/',
    category: 'journalism',
  },
  dl_news: {
    name: 'DL News',
    url: 'https://www.dlnews.com/feed/',
    category: 'journalism',
  },
  protos: {
    name: 'Protos',
    url: 'https://protos.com/feed/',
    category: 'journalism',
  },
  daily_gwei: {
    name: 'The Daily Gwei',
    url: 'https://thedailygwei.substack.com/feed',
    category: 'ethereum',
  },
  week_in_ethereum: {
    name: 'Week in Ethereum',
    url: 'https://weekinethereumnews.com/feed/',
    category: 'ethereum',
  },
  wu_blockchain: {
    name: 'Wu Blockchain',
    url: 'https://wublock.substack.com/feed',
    category: 'asia',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // TRADITIONAL FINANCE BLOGS
  // ═══════════════════════════════════════════════════════════════
  goldman_insights: {
    name: 'Goldman Sachs Insights',
    url: 'https://www.goldmansachs.com/insights/feed.rss',
    category: 'tradfi',
  },
  bny_mellon: {
    name: 'BNY Mellon Aerial View',
    url: 'https://www.bnymellon.com/us/en/insights/aerial-view-magazine.rss',
    category: 'tradfi',
  },
} as const;

type SourceKey = keyof typeof RSS_SOURCES;

export interface NewsArticle {
  title: string;
  link: string;
  description?: string;
  pubDate: string;
  source: string;
  sourceKey: string;
  category: string;
  timeAgo: string;
}

export interface NewsResponse {
  articles: NewsArticle[];
  totalCount: number;
  sources: string[];
  fetchedAt: string;
  pagination?: {
    page: number;
    perPage: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface SourceInfo {
  key: string;
  name: string;
  url: string;
  category: string;
  status: 'active' | 'unavailable';
}

/**
 * Parse RSS XML to extract articles
 */
function parseRSSFeed(xml: string, sourceKey: string, sourceName: string, category: string): NewsArticle[] {
  const articles: NewsArticle[] = [];
  
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  const titleRegex = /<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/i;
  const linkRegex = /<link>(.*?)<\/link>|<link><!\[CDATA\[(.*?)\]\]>/i;
  const descRegex = /<description><!\[CDATA\[([\s\S]*?)\]\]>|<description>([\s\S]*?)<\/description>/i;
  const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/i;
  
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    
    const titleMatch = itemXml.match(titleRegex);
    const linkMatch = itemXml.match(linkRegex);
    const descMatch = itemXml.match(descRegex);
    const pubDateMatch = itemXml.match(pubDateRegex);
    
    const title = (titleMatch?.[1] || titleMatch?.[2] || '').trim();
    const link = (linkMatch?.[1] || linkMatch?.[2] || '').trim();
    const description = sanitizeDescription(descMatch?.[1] || descMatch?.[2] || '');
    const pubDateStr = pubDateMatch?.[1] || '';
    
    if (title && link) {
      const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();
      articles.push({
        title,
        link,
        description: description || undefined,
        pubDate: pubDate.toISOString(),
        source: sourceName,
        sourceKey,
        category,
        timeAgo: getTimeAgo(pubDate),
      });
    }
  }
  
  return articles;
}

function sanitizeDescription(raw: string): string {
  if (!raw) {
    return '';
  }

  const sanitized = sanitizeHtml(raw, {
    allowedTags: [],
    allowedAttributes: {},
  });

  return sanitized.trim().slice(0, 200);
}

/**
 * Calculate human-readable time ago string
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

import { newsCache, withCache } from './cache';

// ═══════════════════════════════════════════════════════════════
// API SOURCES (more reliable than RSS)
// ═══════════════════════════════════════════════════════════════

interface ApiSource {
  name: string;
  url: string;
  category: string;
  parser: (data: unknown) => NewsArticle[];
}

const API_SOURCES: Record<string, ApiSource> = {
  // CryptoCompare News API (free, no key needed for basic usage)
  cryptocompare: {
    name: 'CryptoCompare',
    url: 'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest',
    category: 'general',
    parser: (data: unknown) => {
      const response = data as { Data?: Array<{
        title: string;
        url: string;
        body: string;
        published_on: number;
        source: string;
        categories: string;
      }> };
      if (!response.Data) return [];
      return response.Data.slice(0, 20).map(item => ({
        title: item.title,
        link: item.url,
        description: item.body?.slice(0, 200),
        pubDate: new Date(item.published_on * 1000).toISOString(),
        source: item.source || 'CryptoCompare',
        sourceKey: 'cryptocompare',
        category: item.categories?.split('|')[0]?.toLowerCase() || 'general',
        timeAgo: getTimeAgo(new Date(item.published_on * 1000)),
      }));
    },
  },
  
  // CoinGecko Status Updates (free)
  coingecko_updates: {
    name: 'CoinGecko Updates',
    url: 'https://api.coingecko.com/api/v3/status_updates',
    category: 'general',
    parser: (data: unknown) => {
      const response = data as { status_updates?: Array<{
        description: string;
        created_at: string;
        project: { name: string };
        user_title: string;
      }> };
      if (!response.status_updates) return [];
      return response.status_updates.slice(0, 10).map(item => ({
        title: `${item.project?.name}: ${item.user_title || 'Update'}`,
        link: `https://www.coingecko.com`,
        description: item.description?.slice(0, 200),
        pubDate: new Date(item.created_at).toISOString(),
        source: 'CoinGecko',
        sourceKey: 'coingecko_updates',
        category: 'general',
        timeAgo: getTimeAgo(new Date(item.created_at)),
      }));
    },
  },
  
  // CoinPaprika News (free)
  coinpaprika: {
    name: 'CoinPaprika',
    url: 'https://api.coinpaprika.com/v1/coins/btc-bitcoin/events',
    category: 'bitcoin',
    parser: (data: unknown) => {
      const events = data as Array<{
        name: string;
        description: string;
        date: string;
        link: string;
      }>;
      if (!Array.isArray(events)) return [];
      return events.slice(0, 10).map(item => ({
        title: item.name,
        link: item.link || 'https://coinpaprika.com',
        description: item.description?.slice(0, 200),
        pubDate: new Date(item.date).toISOString(),
        source: 'CoinPaprika',
        sourceKey: 'coinpaprika',
        category: 'bitcoin',
        timeAgo: getTimeAgo(new Date(item.date)),
      }));
    },
  },
  
  // Messari News (free, no API key for public endpoints)
  messari: {
    name: 'Messari',
    url: 'https://data.messari.io/api/v1/news',
    category: 'research',
    parser: (data: unknown) => {
      const response = data as { data?: Array<{
        title: string;
        url: string;
        content: string;
        published_at: string;
        author: { name: string };
        tags: Array<{ name: string }>;
      }> };
      if (!response.data) return [];
      return response.data.slice(0, 20).map(item => ({
        title: item.title,
        link: item.url,
        description: item.content?.slice(0, 200),
        pubDate: new Date(item.published_at).toISOString(),
        source: 'Messari',
        sourceKey: 'messari',
        category: item.tags?.[0]?.name?.toLowerCase() || 'research',
        timeAgo: getTimeAgo(new Date(item.published_at)),
      }));
    },
  },
  
  // CoinCap News (free)
  coincap: {
    name: 'CoinCap',
    url: 'https://api.coincap.io/v2/assets?limit=10',
    category: 'markets',
    parser: (data: unknown) => {
      // CoinCap doesn't have news, but we can generate market updates
      const response = data as { data?: Array<{
        name: string;
        symbol: string;
        priceUsd: string;
        changePercent24Hr: string;
      }> };
      if (!response.data) return [];
      // Only return significant movers (>5% change)
      const movers = response.data.filter(a => Math.abs(parseFloat(a.changePercent24Hr || '0')) > 5);
      return movers.slice(0, 5).map(item => {
        const change = parseFloat(item.changePercent24Hr || '0');
        const direction = change > 0 ? '📈' : '📉';
        return {
          title: `${direction} ${item.name} (${item.symbol}) ${change > 0 ? '+' : ''}${change.toFixed(1)}% in 24h`,
          link: `https://coincap.io/assets/${item.name.toLowerCase()}`,
          description: `${item.name} is trading at $${parseFloat(item.priceUsd).toLocaleString()}`,
          pubDate: new Date().toISOString(),
          source: 'CoinCap',
          sourceKey: 'coincap',
          category: 'markets',
          timeAgo: 'just now',
        };
      });
    },
  },
  
  // LunarCrush Galaxy Score (free tier)
  lunarcrush: {
    name: 'LunarCrush',
    url: 'https://lunarcrush.com/api4/public/coins/list?sort=galaxy_score&limit=5',
    category: 'social',
    parser: (data: unknown) => {
      const response = data as { data?: Array<{
        name: string;
        symbol: string;
        galaxy_score: number;
        alt_rank: number;
        social_volume: number;
      }> };
      if (!response.data) return [];
      return response.data.slice(0, 5).map(item => ({
        title: `🌙 ${item.name} (${item.symbol}) Galaxy Score: ${item.galaxy_score}`,
        link: `https://lunarcrush.com/coins/${item.symbol.toLowerCase()}`,
        description: `Social volume: ${item.social_volume?.toLocaleString() || 'N/A'}, Alt Rank: #${item.alt_rank}`,
        pubDate: new Date().toISOString(),
        source: 'LunarCrush',
        sourceKey: 'lunarcrush',
        category: 'social',
        timeAgo: 'just now',
      }));
    },
  },
  
  // CoinDesk Wire (public news feed)
  coindesk_wire: {
    name: 'CoinDesk',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    category: 'general',
    parser: () => [], // RSS-based, handled by RSS_SOURCES
  },
  
  // Fear & Greed Index (Alternative.me - free)
  fear_greed: {
    name: 'Fear & Greed',
    url: 'https://api.alternative.me/fng/?limit=1',
    category: 'sentiment',
    parser: (data: unknown) => {
      const response = data as { data?: Array<{
        value: string;
        value_classification: string;
        timestamp: string;
      }> };
      if (!response.data?.[0]) return [];
      const item = response.data[0];
      const emoji = parseInt(item.value) < 25 ? '😨' : parseInt(item.value) < 50 ? '😟' : parseInt(item.value) < 75 ? '😊' : '🤑';
      return [{
        title: `${emoji} Crypto Fear & Greed Index: ${item.value} (${item.value_classification})`,
        link: 'https://alternative.me/crypto/fear-and-greed-index/',
        description: `The market sentiment is currently "${item.value_classification}" with a score of ${item.value}/100`,
        pubDate: new Date(parseInt(item.timestamp) * 1000).toISOString(),
        source: 'Alternative.me',
        sourceKey: 'fear_greed',
        category: 'sentiment',
        timeAgo: getTimeAgo(new Date(parseInt(item.timestamp) * 1000)),
      }];
    },
  },
  
  // Blockchain.com Stats (free)
  blockchain_stats: {
    name: 'Blockchain Stats',
    url: 'https://api.blockchain.info/stats',
    category: 'bitcoin',
    parser: (data: unknown) => {
      const stats = data as {
        market_price_usd: number;
        hash_rate: number;
        n_tx: number;
        timestamp: number;
      };
      if (!stats.market_price_usd) return [];
      return [{
        title: `₿ Bitcoin Network: ${(stats.hash_rate / 1e18).toFixed(1)} EH/s hashrate, ${stats.n_tx.toLocaleString()} txs today`,
        link: 'https://www.blockchain.com/explorer/charts',
        description: `BTC price: $${stats.market_price_usd.toLocaleString()}`,
        pubDate: new Date(stats.timestamp).toISOString(),
        source: 'Blockchain.com',
        sourceKey: 'blockchain_stats',
        category: 'bitcoin',
        timeAgo: getTimeAgo(new Date(stats.timestamp)),
      }];
    },
  },
  
  // Etherscan Gas Tracker (free)
  etherscan_gas: {
    name: 'Etherscan Gas',
    url: 'https://api.etherscan.io/api?module=gastracker&action=gasoracle',
    category: 'ethereum',
    parser: (data: unknown) => {
      const response = data as { result?: {
        SafeGasPrice: string;
        ProposeGasPrice: string;
        FastGasPrice: string;
      } };
      if (!response.result?.SafeGasPrice) return [];
      const { SafeGasPrice, ProposeGasPrice, FastGasPrice } = response.result;
      return [{
        title: `⛽ ETH Gas: 🐢 ${SafeGasPrice} | 🚶 ${ProposeGasPrice} | 🚀 ${FastGasPrice} Gwei`,
        link: 'https://etherscan.io/gastracker',
        description: `Current Ethereum gas prices. Fast: ${FastGasPrice} Gwei, Standard: ${ProposeGasPrice} Gwei, Safe: ${SafeGasPrice} Gwei`,
        pubDate: new Date().toISOString(),
        source: 'Etherscan',
        sourceKey: 'etherscan_gas',
        category: 'ethereum',
        timeAgo: 'just now',
      }];
    },
  },
  
  // Mempool.space Bitcoin Fees (free)
  mempool_fees: {
    name: 'Mempool Fees',
    url: 'https://mempool.space/api/v1/fees/recommended',
    category: 'bitcoin',
    parser: (data: unknown) => {
      const fees = data as {
        fastestFee: number;
        halfHourFee: number;
        hourFee: number;
        economyFee: number;
      };
      if (!fees.fastestFee) return [];
      return [{
        title: `₿ BTC Fees: ⚡ ${fees.fastestFee} | ⏱️ ${fees.halfHourFee} | 🕐 ${fees.hourFee} sat/vB`,
        link: 'https://mempool.space',
        description: `Fastest: ${fees.fastestFee} sat/vB, 30min: ${fees.halfHourFee} sat/vB, 1hr: ${fees.hourFee} sat/vB, Economy: ${fees.economyFee} sat/vB`,
        pubDate: new Date().toISOString(),
        source: 'Mempool.space',
        sourceKey: 'mempool_fees',
        category: 'bitcoin',
        timeAgo: 'just now',
      }];
    },
  },
};

/**
 * Fetch from API source with caching
 */
async function fetchApiSource(sourceKey: string): Promise<NewsArticle[]> {
  const cacheKey = `api:${sourceKey}`;
  
  return withCache(newsCache, cacheKey, 120, async () => { // 2 min cache for APIs
    const source = API_SOURCES[sourceKey];
    if (!source) return [];
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(source.url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FreeCryptoNews/1.0',
        },
        signal: controller.signal,
        next: { revalidate: 120 },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return source.parser(data);
    } catch {
      // Silent fail - APIs are supplementary
      return [];
    }
  });
}

/**
 * Fetch all API sources
 */
async function fetchAllApiSources(): Promise<NewsArticle[]> {
  const apiKeys = Object.keys(API_SOURCES);
  const results = await Promise.allSettled(apiKeys.map(fetchApiSource));
  
  const articles: NewsArticle[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      articles.push(...result.value);
    }
  }
  return articles;
}

/**
 * Fetch RSS feed from a source with caching
 */
async function fetchFeed(sourceKey: SourceKey): Promise<NewsArticle[]> {
  const cacheKey = `feed:${sourceKey}`;
  
  return withCache(newsCache, cacheKey, 60, async () => { // Reduced to 60s for fresher content
    const source = RSS_SOURCES[sourceKey];
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      // Use no-store for large feeds that exceed Next.js 2MB cache limit
      const fetchOptions: RequestInit & { next?: { revalidate: number } } = {
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml',
          'User-Agent': 'FreeCryptoNews/1.0 (github.com/nirholas/free-crypto-news)',
        },
        signal: controller.signal,
        ...(source.skipCache
          ? { cache: 'no-store' as const }
          : { next: { revalidate: 60 } }), // 60s revalidation for normal feeds
      };
      const response = await fetch(source.url, fetchOptions);
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Only log in development, not every failed fetch
        if (process.env.NODE_ENV === 'development' && process.env.DEBUG_RSS) {
          console.warn(`Failed to fetch ${source.name}: ${response.status}`);
        }
        return [];
      }
      
      const xml = await response.text();
      return parseRSSFeed(xml, sourceKey, source.name, source.category);
    } catch (error) {
      // Only log non-abort errors in production, or all errors with DEBUG_RSS
      const isAbortError = error instanceof Error && error.name === 'AbortError';
      if (process.env.DEBUG_RSS || (!isAbortError && process.env.NODE_ENV === 'production')) {
        console.warn(`Error fetching ${source.name}:`, isAbortError ? 'timeout' : error);
      }
      return [];
    }
  });
}

/**
 * Source reputation scores (0-100)
 * Higher scores = more reputable/mainstream sources
 */
const SOURCE_REPUTATION_SCORES: Record<string, number> = {
  // Tier 1: Mainstream US sources (95-100)
  'Bloomberg Crypto': 100,
  'Reuters Crypto': 100,
  'CNBC Crypto': 95,
  'Forbes Crypto': 95,
  'Yahoo Finance Crypto': 90,
  'WSJ Crypto': 100,
  
  // Tier 2: Major crypto-native US sources (85-90)
  'CoinDesk': 90,
  'The Block': 88,
  'Blockworks': 85,
  'Decrypt': 85,
  
  // Tier 3: Established crypto sources (75-80)
  'CoinTelegraph': 80,
  'Bitcoin Magazine': 78,
  'CryptoSlate': 75,
  'The Defiant': 75,
  
  // Tier 4: Specialized/niche sources (60-70)
  'Messari': 70,
  'Bankless': 68,
  'Unchained Crypto': 65,
  'DL News': 65,
  
  // Fintech sources (deprioritized - 30-40)
  'Finextra': 35,
  'PYMNTS Crypto': 35,
  'Fintech Futures': 30,
  
  // Default score for other sources
  'default': 50,
};

/**
 * Crypto relevance keywords for content scoring
 */
const CRYPTO_KEYWORDS = [
  'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'blockchain', 'defi', 'nft',
  'altcoin', 'token', 'mining', 'wallet', 'exchange', 'trading', 'stablecoin',
  'satoshi', 'web3', 'dao', 'dapp', 'smart contract', 'layer 2', 'rollup',
  'price', 'bull', 'bear', 'halving', 'node', 'validator', 'staking'
];

/**
 * Calculate trending score for an article
 * Combines recency, source reputation, and crypto relevance
 * Updated: Prioritize reputation over recency to prevent low-quality sources dominating
 */
function calculateTrendingScore(article: NewsArticle): number {
  const now = Date.now();
  const pubTime = new Date(article.pubDate).getTime();
  const ageInHours = (now - pubTime) / (1000 * 60 * 60);
  
  // Recency score: exponential decay (100 at 0 hours, ~50 at 3 hours, ~25 at 6 hours)
  // But cap max benefit at 80 to prevent very new articles from dominating
  const recencyScore = Math.min(80, Math.max(0, 100 * Math.exp(-ageInHours / 3)));
  
  // Source reputation score - this is now more important
  const reputationScore = SOURCE_REPUTATION_SCORES[article.source] || SOURCE_REPUTATION_SCORES['default'];
  
  // Crypto relevance score: check title and description for crypto keywords
  const searchText = `${article.title} ${article.description || ''}`.toLowerCase();
  const keywordMatches = CRYPTO_KEYWORDS.filter(keyword => searchText.includes(keyword)).length;
  const relevanceScore = Math.min(100, keywordMatches * 15); // 15 points per keyword, max 100
  
  // Strong penalty for fintech/payments-only content that lacks crypto keywords
  const isFintech = ['finextra', 'pymnts', 'fintech'].some(term => 
    article.source.toLowerCase().includes(term)
  );
  // If it's fintech AND has no crypto keywords, apply heavy penalty
  const hasCryptoRelevance = keywordMatches >= 2;
  const fintechPenalty = isFintech ? (hasCryptoRelevance ? 0.6 : 0.25) : 1.0;
  
  // Combined score: 55% reputation, 25% recency, 20% relevance
  // Reputation matters most to keep quality sources in top positions
  const baseScore = (reputationScore * 0.55) + (recencyScore * 0.25) + (relevanceScore * 0.2);
  return baseScore * fintechPenalty;
}

/**
 * Fetch sources in batches with concurrency limit to prevent network overload
 */
async function fetchWithConcurrency<T>(
  items: T[],
  fn: (item: T) => Promise<NewsArticle[]>,
  concurrency: number = 15
): Promise<NewsArticle[]> {
  const articles: NewsArticle[] = [];
  
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const results = await Promise.allSettled(batch.map(fn));
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        articles.push(...result.value);
      }
      // Silently ignore rejected promises - already logged in fetchFeed
    }
  }
  
  return articles;
}

/**
 * Fetch from multiple sources in parallel with concurrency limit
 * Now includes both RSS feeds and API sources for better reliability
 */
async function fetchMultipleSources(sourceKeys: SourceKey[], includeApiSources: boolean = true): Promise<NewsArticle[]> {
  // Fetch RSS and optionally API sources in parallel
  const [rssArticles, apiArticles] = await Promise.all([
    // RSS feeds with concurrency limit
    fetchWithConcurrency(sourceKeys, fetchFeed, 15),
    // Only fetch API sources if not filtering by specific RSS source
    includeApiSources ? fetchAllApiSources() : Promise.resolve([]),
  ]);
  
  // Combine and deduplicate by title similarity
  const allArticles = [...rssArticles, ...apiArticles];
  const seen = new Set<string>();
  const deduped = allArticles.filter(article => {
    // Normalize title for dedup
    const normalized = article.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
  
  return deduped.sort((a, b) => 
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export interface NewsQueryOptions {
  limit?: number;
  source?: string;
  category?: string;
  from?: Date | string;
  to?: Date | string;
  page?: number;
  perPage?: number;
}

function filterByDateRange(articles: NewsArticle[], from?: Date | string, to?: Date | string): NewsArticle[] {
  let filtered = articles.filter(a => a && a.pubDate);
  
  if (from) {
    const fromDate = typeof from === 'string' ? new Date(from) : from;
    filtered = filtered.filter(a => new Date(a.pubDate) >= fromDate);
  }
  
  if (to) {
    const toDate = typeof to === 'string' ? new Date(to) : to;
    filtered = filtered.filter(a => new Date(a.pubDate) <= toDate);
  }
  
  return filtered;
}

export async function getLatestNews(
  limit: number = 10,
  source?: string,
  options?: NewsQueryOptions
): Promise<NewsResponse> {
  const normalizedLimit = Math.min(Math.max(1, limit), 50);
  
  let sourceKeys: SourceKey[];
  let includeApiSources = true;
  
  if (source && source in RSS_SOURCES) {
    sourceKeys = [source as SourceKey];
    // Don't mix in API sources when filtering by a specific RSS source
    includeApiSources = false;
  } else if (options?.category) {
    // Filter sources by category
    sourceKeys = (Object.keys(RSS_SOURCES) as SourceKey[]).filter(
      key => RSS_SOURCES[key].category === options.category
    );
    // If no sources match the category, return empty
    if (sourceKeys.length === 0) {
      return {
        articles: [],
        totalCount: 0,
        sources: [],
        fetchedAt: new Date().toISOString(),
        category: options.category,
      } as NewsResponse;
    }
  } else {
    sourceKeys = Object.keys(RSS_SOURCES) as SourceKey[];
  }
  
  let articles = await fetchMultipleSources(sourceKeys, includeApiSources);
  
  // Apply date filtering
  if (options?.from || options?.to) {
    articles = filterByDateRange(articles, options.from, options.to);
  }
  
  // Handle pagination
  const page = options?.page || 1;
  const perPage = options?.perPage || normalizedLimit;
  const startIndex = (page - 1) * perPage;
  const paginatedArticles = articles.slice(startIndex, startIndex + perPage);
  
  return {
    articles: paginatedArticles,
    totalCount: articles.length,
    sources: sourceKeys.map(k => RSS_SOURCES[k].name),
    fetchedAt: new Date().toISOString(),
    ...(options?.category && { category: options.category }),
    ...(options?.page && {
      pagination: {
        page,
        perPage,
        totalPages: Math.ceil(articles.length / perPage),
        hasMore: startIndex + perPage < articles.length,
      }
    }),
  } as NewsResponse;
}

export async function searchNews(
  keywords: string,
  limit: number = 10
): Promise<NewsResponse> {
  const normalizedLimit = Math.min(Math.max(1, limit), 30);
  const searchTerms = (keywords || '').toLowerCase().split(',').map(k => k.trim()).filter(Boolean);
  
  // If no valid search terms, return empty result
  if (searchTerms.length === 0) {
    return {
      articles: [],
      totalCount: 0,
      sources: [],
      fetchedAt: new Date().toISOString(),
    };
  }
  
  const allArticles = await fetchMultipleSources(Object.keys(RSS_SOURCES) as SourceKey[]);
  
  const matchingArticles = allArticles.filter(article => {
    if (!article || !article.title) return false;
    const searchText = `${article.title} ${article.description || ''}`.toLowerCase();
    return searchTerms.some(term => searchText.includes(term));
  });
  
  return {
    articles: matchingArticles.slice(0, normalizedLimit),
    totalCount: matchingArticles.length,
    sources: [...new Set(matchingArticles.map(a => a.source))],
    fetchedAt: new Date().toISOString(),
  };
}

export async function getBreakingNews(limit: number = 5): Promise<NewsResponse> {
  const normalizedLimit = Math.min(Math.max(1, limit), 20);
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  
  const allArticles = await fetchMultipleSources(Object.keys(RSS_SOURCES) as SourceKey[]);
  
  const recentArticles = allArticles.filter(article => 
    article && article.pubDate && new Date(article.pubDate) > twoHoursAgo
  );
  
  return {
    articles: recentArticles.slice(0, normalizedLimit),
    totalCount: recentArticles.length,
    sources: [...new Set(recentArticles.map(a => a.source))],
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Get trending news articles
 * Prioritizes reputable US sources and recent articles
 */
export async function getTrendingNews(limit: number = 10): Promise<NewsResponse> {
  const normalizedLimit = Math.min(Math.max(1, limit), 50);
  
  // Get recent articles (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const allArticles = await fetchMultipleSources(Object.keys(RSS_SOURCES) as SourceKey[]);
  
  const recentArticles = allArticles.filter(article => 
    article && article.pubDate && new Date(article.pubDate) > oneDayAgo
  );
  
  // Score and sort by trending score
  const scoredArticles = recentArticles.map(article => ({
    article,
    score: calculateTrendingScore(article),
  }));
  
  scoredArticles.sort((a, b) => b.score - a.score);
  
  // Fintech sources (lower quality for crypto news)
  const fintechSources = ['finextra', 'pymnts', 'fintech futures'];
  
  // Ensure source diversity: stricter limits on low-quality sources
  const trendingArticles: NewsArticle[] = [];
  const sourceCounts = new Map<string, number>();
  let fintechCount = 0;
  
  for (const item of scoredArticles) {
    if (trendingArticles.length >= normalizedLimit) break;
    
    const sourceCount = sourceCounts.get(item.article.source) || 0;
    const isFintech = fintechSources.some(s => item.article.source.toLowerCase().includes(s));
    
    // Fintech sources: max 1 article total across all fintech sources
    // Regular sources: max 2 articles per source
    const maxForThisSource = isFintech ? 1 : 2;
    const exceedsFintechLimit = isFintech && fintechCount >= 1;
    
    if (sourceCount < maxForThisSource && !exceedsFintechLimit) {
      trendingArticles.push(item.article);
      sourceCounts.set(item.article.source, sourceCount + 1);
      if (isFintech) fintechCount++;
    }
  }
  
  return {
    articles: trendingArticles,
    totalCount: scoredArticles.length,
    sources: [...new Set(trendingArticles.map(a => a.source))],
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Get news by category (bitcoin, ethereum, defi, nft, regulation, markets, etc.)
 */
export async function getNewsByCategory(
  category: string,
  limit: number = 30
): Promise<NewsResponse> {
  if (!category) {
    return {
      articles: [],
      totalCount: 0,
      sources: [],
      fetchedAt: new Date().toISOString(),
    };
  }
  
  const normalizedLimit = Math.min(Math.max(1, limit), 50);
  
  const allArticles = await fetchMultipleSources(Object.keys(RSS_SOURCES) as SourceKey[]);
  
  // Category keyword mappings
  const categoryKeywords: Record<string, string[]> = {
    bitcoin: ['bitcoin', 'btc', 'satoshi', 'lightning', 'halving', 'miner', 'ordinals', 'inscription', 'sats'],
    ethereum: ['ethereum', 'eth', 'vitalik', 'erc-20', 'erc-721', 'layer 2', 'l2', 'rollup', 'arbitrum', 'optimism', 'base'],
    defi: ['defi', 'yield', 'lending', 'liquidity', 'amm', 'dex', 'aave', 'uniswap', 'compound', 'curve', 'maker', 'lido', 'staking', 'vault', 'protocol', 'tvl'],
    nft: ['nft', 'non-fungible', 'opensea', 'blur', 'ordinals', 'inscription', 'collection', 'pfp', 'digital art'],
    regulation: ['regulation', 'sec', 'cftc', 'lawsuit', 'legal', 'compliance', 'tax', 'government', 'congress', 'senate', 'bill', 'law', 'policy', 'ban', 'restrict'],
    markets: ['market', 'price', 'trading', 'bull', 'bear', 'rally', 'crash', 'etf', 'futures', 'options', 'liquidation', 'volume', 'chart', 'analysis'],
    mining: ['mining', 'miner', 'hashrate', 'difficulty', 'pow', 'proof of work', 'asic', 'pool'],
    stablecoin: ['stablecoin', 'usdt', 'usdc', 'dai', 'tether', 'circle', 'peg', 'depeg'],
    exchange: ['exchange', 'binance', 'coinbase', 'kraken', 'okx', 'bybit', 'trading', 'listing', 'delist'],
    layer2: ['layer 2', 'l2', 'rollup', 'arbitrum', 'optimism', 'base', 'zksync', 'polygon', 'scaling'],
  };
  
  const keywords = categoryKeywords[category.toLowerCase()] || [category.toLowerCase()];
  
  const filteredArticles = allArticles.filter(article => {
    if (!article || !article.title) return false;
    
    // Check source category first
    if (article.category === category.toLowerCase()) return true;
    if (category === 'bitcoin' && article.sourceKey === 'bitcoinmagazine') return true;
    if (category === 'defi' && article.sourceKey === 'defiant') return true;
    
    // Then check keywords
    const searchText = `${article.title} ${article.description || ''}`.toLowerCase();
    return keywords.some(term => searchText.includes(term));
  });
  
  return {
    articles: filteredArticles.slice(0, normalizedLimit),
    totalCount: filteredArticles.length,
    sources: [...new Set(filteredArticles.map(a => a.source))],
    fetchedAt: new Date().toISOString(),
  };
}

export async function getSources(): Promise<{ sources: SourceInfo[] }> {
  const sourceChecks = await Promise.allSettled(
    (Object.keys(RSS_SOURCES) as SourceKey[]).map(async key => {
      const source = RSS_SOURCES[key];
      try {
        const response = await fetch(source.url, {
          method: 'HEAD',
          headers: { 'User-Agent': 'FreeCryptoNews/1.0' },
        });
        return {
          key,
          name: source.name,
          url: source.url,
          category: source.category,
          status: response.ok ? 'active' : 'unavailable',
        } as SourceInfo;
      } catch {
        return {
          key,
          name: source.name,
          url: source.url,
          category: source.category,
          status: 'unavailable',
        } as SourceInfo;
      }
    })
  );
  
  return {
    sources: sourceChecks
      .filter((r): r is PromiseFulfilledResult<SourceInfo> => r.status === 'fulfilled')
      .map(r => r.value),
  };
}

/**
 * Get all available news categories with source counts
 */
export function getCategories(): { 
  categories: Array<{ 
    id: string; 
    name: string; 
    description: string;
    sourceCount: number;
  }> 
} {
  const categoryMeta: Record<string, { name: string; description: string }> = {
    general: { name: 'General', description: 'Broad crypto industry news' },
    bitcoin: { name: 'Bitcoin', description: 'Bitcoin-specific news and analysis' },
    defi: { name: 'DeFi', description: 'Decentralized finance protocols and yields' },
    nft: { name: 'NFTs', description: 'Non-fungible tokens and digital collectibles' },
    research: { name: 'Research', description: 'Deep-dive analysis and reports' },
    institutional: { name: 'Institutional', description: 'VC and institutional investor insights' },
    etf: { name: 'ETFs', description: 'Crypto ETF and asset manager news' },
    derivatives: { name: 'Derivatives', description: 'Options, futures, and structured products' },
    onchain: { name: 'On-Chain', description: 'Blockchain data and analytics' },
    fintech: { name: 'Fintech', description: 'Financial technology and payments' },
    macro: { name: 'Macro', description: 'Macroeconomic analysis and commentary' },
    quant: { name: 'Quant', description: 'Quantitative and systematic trading research' },
    journalism: { name: 'Investigative', description: 'In-depth journalism and exposés' },
    ethereum: { name: 'Ethereum', description: 'Ethereum ecosystem news' },
    asia: { name: 'Asia', description: 'Asian market coverage' },
    tradfi: { name: 'TradFi', description: 'Traditional finance institutions' },
    mainstream: { name: 'Mainstream', description: 'Major media crypto coverage' },
    mining: { name: 'Mining', description: 'Bitcoin mining and hashrate' },
    gaming: { name: 'Gaming', description: 'Blockchain gaming and metaverse' },
    altl1: { name: 'Alt L1s', description: 'Alternative layer-1 blockchains' },
    stablecoin: { name: 'Stablecoins', description: 'Stablecoin and CBDC news' },
  };
  
  // Count sources per category
  const sourceCounts: Record<string, number> = {};
  for (const key of Object.keys(RSS_SOURCES) as SourceKey[]) {
    const cat = RSS_SOURCES[key].category;
    sourceCounts[cat] = (sourceCounts[cat] || 0) + 1;
  }
  
  return {
    categories: Object.entries(categoryMeta).map(([id, meta]) => ({
      id,
      name: meta.name,
      description: meta.description,
      sourceCount: sourceCounts[id] || 0,
    })).filter(c => c.sourceCount > 0).sort((a, b) => b.sourceCount - a.sourceCount),
  };
}

// Convenience function for DeFi-specific news
export async function getDefiNews(limit: number = 10): Promise<NewsResponse> {
  return getNewsByCategory('defi', limit);
}

// Convenience function for Bitcoin-specific news  
export async function getBitcoinNews(limit: number = 10): Promise<NewsResponse> {
  return getNewsByCategory('bitcoin', limit);
}

// Convenience function for Ethereum-specific news
export async function getEthereumNews(limit: number = 10): Promise<NewsResponse> {
  return getNewsByCategory('ethereum', limit);
}

// ═══════════════════════════════════════════════════════════════
// INTERNATIONAL NEWS INTEGRATION
// ═══════════════════════════════════════════════════════════════

// Re-export international news functions for convenience
export {
  getInternationalNews,
  getNewsByLanguage,
  getNewsByRegion,
  getInternationalSources,
  getSourceHealthStats,
  INTERNATIONAL_SOURCES,
  KOREAN_SOURCES,
  CHINESE_SOURCES,
  JAPANESE_SOURCES,
  SPANISH_SOURCES,
  SOURCES_BY_LANGUAGE,
  SOURCES_BY_REGION,
} from './international-sources';

export type {
  InternationalSource,
  InternationalArticle,
  InternationalNewsResponse,
  InternationalNewsOptions,
} from './international-sources';

// Re-export translation functions
export {
  translateInternationalArticles,
  translateInternationalNewsResponse,
  isTranslationAvailable,
  getInternationalTranslationCacheStats,
  clearInternationalTranslationCache,
} from './source-translator';

/**
 * Get combined news from both English and international sources
 * Returns a mixed feed sorted by publication date
 */
export async function getGlobalNews(
  limit: number = 20,
  options?: {
    includeInternational?: boolean;
    translateInternational?: boolean;
    languages?: ('ko' | 'zh' | 'ja' | 'es')[];
  }
): Promise<NewsResponse & { internationalCount: number }> {
  const { 
    includeInternational = true, 
    translateInternational = false,
    languages,
  } = options || {};

  const normalizedLimit = Math.min(Math.max(1, limit), 100);

  // Fetch English news
  const englishNews = await getLatestNews(normalizedLimit);
  
  if (!includeInternational) {
    return {
      ...englishNews,
      internationalCount: 0,
    };
  }

  // Import dynamically to avoid circular dependencies
  const { getInternationalNews: fetchIntlNews } = await import('./international-sources');
  const { translateInternationalNewsResponse: translateIntlNews, isTranslationAvailable: checkTranslation } = await import('./source-translator');

  // Fetch international news
  let intlNews = await fetchIntlNews({
    language: languages?.length === 1 ? languages[0] : 'all',
    limit: Math.ceil(normalizedLimit / 2),
  });

  // Translate if requested and available
  if (translateInternational && checkTranslation()) {
    try {
      intlNews = await translateIntlNews(intlNews);
    } catch (error) {
      console.warn('Failed to translate international news:', error);
    }
  }

  // Filter by specific languages if provided
  let intlArticles = intlNews.articles;
  if (languages && languages.length > 0) {
    intlArticles = intlArticles.filter(a => languages.includes(a.language as 'ko' | 'zh' | 'ja' | 'es'));
  }

  // Convert international articles to standard format
  const convertedIntlArticles: NewsArticle[] = intlArticles.map(article => ({
    title: article.titleEnglish || article.title,
    link: article.link,
    description: article.descriptionEnglish || article.description,
    pubDate: article.pubDate,
    source: article.source,
    sourceKey: article.sourceKey,
    category: article.category,
    timeAgo: article.timeAgo,
  }));

  // Merge and sort by date
  const allArticles = [...englishNews.articles, ...convertedIntlArticles]
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, normalizedLimit);

  return {
    articles: allArticles,
    totalCount: englishNews.totalCount + intlNews.total,
    sources: [...englishNews.sources, ...new Set(intlArticles.map(a => a.source))],
    fetchedAt: new Date().toISOString(),
    internationalCount: convertedIntlArticles.length,
  };
}

/**
 * Alias for getLatestNews for backward compatibility
 */
export const fetchNews = getLatestNews;

/**
 * Get the total count of configured news sources
 * Use this for accurate source count in UI instead of hardcoding numbers
 */
export function getSourceCount(): number {
  return Object.keys(RSS_SOURCES).length;
}

/**
 * Get source metadata for a specific source key
 */
export function getSourceInfo(sourceKey: string): { name: string; url: string; category: string } | null {
  const source = RSS_SOURCES[sourceKey as SourceKey];
  if (!source) return null;
  return {
    name: source.name,
    url: source.url,
    category: source.category,
  };
}

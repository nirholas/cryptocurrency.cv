/**
 * Free Crypto News - RSS Feed Aggregator
 * 
 * 100% FREE - no API keys required!
 * Aggregates news from 300+ major English crypto sources across 26 categories:
 * - General: 44 sources (CoinDesk, The Block, Decrypt, CoinTelegraph, Blockworks, WatcherGuru, Cryptopolitan, etc.)
 * - DeFi: 31 sources (The Defiant, Bankless, Uniswap, Aave, dYdX, GMX, Jupiter, Balancer, etc.)
 * - Mainstream: 16+ sources (Bloomberg, Reuters, Forbes, CNBC, WSJ, NYT, TechCrunch, Wired, Guardian, Barrons, Fortune, Axios, etc.)
 * - Research: 11 sources (Messari, Paradigm, Delphi Digital, a16z Crypto, Nansen, Dune, Artemis, etc.)
 * - Institutional: 17 sources (Galaxy Digital, Pantera, CoinMarketCap, CoinGecko, Fireblocks, etc.)
 * - Geopolitical: 10+ sources (BBC, Reuters, AP, Federal Reserve, SEC, CFTC, Coin Center, BIS, IMF, ECB, etc.)
 * - Layer 2: 11 sources (L2BEAT, Optimism, Arbitrum, Polygon, Polygon zkEVM, zkSync, Base, Scroll, etc.)
 * - ETF/Asset Managers: 10 sources (Grayscale, Bitwise, ARK, 21Shares, Fidelity, Hashdex, etc.)
 * - Alt L1: 16 sources (NEAR, Cosmos, Avalanche, Sui, Aptos, TON, Bittensor, Akash, Mina, etc.)
 * - Trading: 10 sources (BeInCrypto, AMBCrypto, FXStreet, TradingView, CryptoQuant, etc.)
 * - Security: 13 sources (SlowMist, CertiK, OpenZeppelin, Trail of Bits, samczsun, Immunefi, Mina, etc.)
 * - Developer: 12 sources (Alchemy, Chainlink, Infura, The Graph, Wormhole, LayerZero, RISC Zero, Noir, etc.)
 * - Bitcoin: 11 sources (Bitcoin Magazine, Bitcoinist, Bitcoin.com, BTC Times, Lightning Labs, Bitcoin Optech, etc.)
 * - Solana: 13 sources (Solana News, Helius, Phantom, Marinade, Jito, Metaplex, Squads, marginfi, etc.)
 * - On-Chain: 10+ sources (Glassnode, IntoTheBlock, Coin Metrics, Nansen, Dune, Artemis, Santiment, Parsec, etc.)
 * - Ethereum: 11 sources (EF Blog, Flashbots, EigenDA, Lido DAO, Safe, ENS, Etherscan, Daily Gwei, etc.)
 * - Quant: 5 sources (AQR, Two Sigma, Man Institute, Alpha Architect, QuantStart)
 * - NFT: 8 sources (NFT Now, NFT Plazas, SuperRare, Art Blocks, Mirror, Nifty Gateway, etc.)
 * - Gaming: 9 sources (PlayToEarn, Immutable, Ronin, STEPN, Mythical Games, Animoca, Beam, etc.)
 * - Mining: 6 sources (Bitcoin Mining News, Hashrate Index, Compass Mining, Blockware, Luxor, etc.)
 * - Macro: 6 sources (Lyn Alden, Alhambra Partners, Macro Voices, FRED Blog, Wolf Street, ZeroHedge)
 * - Journalism: 5 sources (Unchained, DL News, Protos, Coffeezilla, Molly White)
 * - Fintech: 5 sources (Finextra, PYMNTS, Ripple, Stellar, Coinbase Institutional)
 * - Stablecoin: 7 sources (Circle, Tether, Paxos, MakerDAO, Frax Finance, etc.)
 * - TradFi: 6 sources (Goldman Sachs, BNY Mellon, Securitize, BlackRock, Franklin Templeton, etc.)
 * - Social: 5 sources (Farcaster, Lens Protocol, Paragraph, Steemit, etc.)
 * - Derivatives: 11 sources (Deribit, Hyperliquid, Laevitas, Amberdata, Paradigm Trading, etc.)
 * - Asia: 10 sources (Forkast, Wu Blockchain, BlockTempo, CoinPost, Chain Catcher, etc.)
 * - Other: Podcasts
 */

import sanitizeHtml from 'sanitize-html';
import {
  SOURCE_REPUTATION_SCORES,
  isFintechSource,
} from './source-tiers';

// RSS Feed URLs for crypto news sources (350+ sources)
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
    disabled: true, // 404 Not Found — 2026-03-01
  },
  rekt: {
    name: 'Rekt News',
    url: 'https://rekt.news/rss.xml',
    category: 'defi',
    disabled: true, // 500 Server Error — 2026-03-01
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
    disabled: true, // Disabled: feed exceeds Vercel 2MB cache limit (2.2MB)
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
    disabled: true, // Disabled: SSL certificate error
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
    disabled: true, // 404 Not Found — 2026-03-01
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
    disabled: true, // Disabled: feed exceeds Vercel 2MB cache limit (2.4MB)
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
    disabled: true, // Disabled: SSL certificate alt-name mismatch
  },
  defillama_news: {
    name: 'DefiLlama News',
    url: 'https://defillama.com/feed',
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
    disabled: true, // 404 Not Found — 2026-03-01
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
    disabled: true, // 404 Not Found — 2026-03-01
  },
  a16z_crypto: {
    name: 'a16z Crypto',
    url: 'https://a16zcrypto.com/feed/',
    category: 'research',
    disabled: true, // 404 Not Found — 2026-03-01
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
    disabled: true, // 404 Not Found — 2026-03-01
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
    disabled: true, // 404 Not Found — 2026-03-01
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
    disabled: true, // 401 Unauthorized — 2026-03-01
  },
  forbes_crypto: {
    name: 'Forbes Crypto',
    url: 'https://www.forbes.com/crypto-blockchain/feed/',
    category: 'mainstream',
    disabled: true, // 404 Not Found — 2026-03-01
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
    disabled: true, // Perf: FT paywall blocks RSS; non-crypto-specific feed
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
    disabled: true, // Disabled: feed exceeds Vercel 2MB cache limit (3MB)
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Bitcoin Ecosystem Extended
  // ═══════════════════════════════════════════════════════════════
  lightninglabs_blog: {
    name: 'Lightning Labs Blog',
    url: 'https://lightning.engineering/feed',
    category: 'bitcoin',
    disabled: true, // 404 Not Found — 2026-03-01
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
    disabled: true, // Disabled: SSL unable to verify leaf certificate
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
    disabled: true, // Disabled: DNS resolution failure (ENOTFOUND)
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Stablecoin & CBDC News
  // ═══════════════════════════════════════════════════════════════
  circle_blog: {
    name: 'Circle Blog',
    url: 'https://www.circle.com/blog/feed',
    category: 'stablecoin',
    disabled: true, // 404 Not Found — 2026-03-01
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
    disabled: true, // 404 Not Found — 2026-03-01
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
    disabled: true, // Disabled: feed exceeds Vercel 2MB cache limit (18MB)
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
    disabled: true, // Disabled: SSL certificate alt-name mismatch
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
    disabled: true, // Perf: Banking/fintech news, not crypto-specific
  },
  pymnts_crypto: {
    name: 'PYMNTS Crypto',
    url: 'https://www.pymnts.com/cryptocurrency/feed/',
    category: 'fintech',
    disabled: true, // Perf: Payments news, not crypto-specific
  },
  fintech_futures: {
    name: 'Fintech Futures',
    url: 'https://www.fintechfutures.com/feed/',
    category: 'fintech',
    disabled: true, // Perf: Fintech news, not crypto-specific
  },
  
  // ═══════════════════════════════════════════════════════════════
  // MACRO ANALYSIS & INDEPENDENT RESEARCHERS
  // ═══════════════════════════════════════════════════════════════
  lyn_alden: {
    name: 'Lyn Alden',
    url: 'https://www.lynalden.com/feed/',
    category: 'macro',
    disabled: true, // Perf: Macro commentary, not crypto-specific
  },
  alhambra_partners: {
    name: 'Alhambra Partners',
    url: 'https://www.alhambrapartners.com/feed/',
    category: 'macro',
    disabled: true, // Perf: Macro economics, not crypto-specific
  },
  macro_voices: {
    name: 'Macro Voices',
    url: 'https://www.macrovoices.com/feed',
    category: 'macro',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  
  // ═══════════════════════════════════════════════════════════════
  // QUANT & SYSTEMATIC TRADING RESEARCH
  // ═══════════════════════════════════════════════════════════════
  aqr_insights: {
    name: 'AQR Insights',
    url: 'https://www.aqr.com/Insights/feed',
    category: 'quant',
    disabled: true, // Perf: Quant research, zero crypto content
  },
  two_sigma_insights: {
    name: 'Two Sigma Insights',
    url: 'https://www.twosigma.com/insights/rss/',
    category: 'quant',
    disabled: true, // Perf: Quant research, zero crypto content
  },
  man_institute: {
    name: 'Man Institute',
    url: 'https://www.man.com/maninstitute/feed',
    category: 'quant',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  alpha_architect: {
    name: 'Alpha Architect',
    url: 'https://alphaarchitect.com/feed/',
    category: 'quant',
    disabled: true, // Perf: Quant research, zero crypto content
  },
  quantstart: {
    name: 'QuantStart',
    url: 'https://www.quantstart.com/articles/rss/',
    category: 'quant',
    disabled: true, // 404 Not Found — 2026-03-01
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
    disabled: true, // 404 Not Found — 2026-03-01
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
    disabled: true, // Disabled: SSL certificate alt-name mismatch (duplicate of weekinethereumnews)
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
    disabled: true, // 404 Not Found — 2026-03-01
  },
  bny_mellon: {
    name: 'BNY Mellon Aerial View',
    url: 'https://www.bnymellon.com/us/en/insights/aerial-view-magazine.rss',
    category: 'tradfi',
    disabled: true, // Perf: Traditional finance, not crypto-specific
  },
  
  // ═══════════════════════════════════════════════════════════════
  // ADDITIONAL CRYPTO NEWS (from HQ DeFi Dashboard)
  // ═══════════════════════════════════════════════════════════════
  dailycoin: {
    name: 'DailyCoin',
    url: 'https://dailycoin.com/feed/',
    category: 'general',
  },
  coinpedia: {
    name: 'CoinPedia',
    url: 'https://coinpedia.org/feed/',
    category: 'general',
  },
  thenewscrypto: {
    name: 'TheNewsCrypto',
    url: 'https://thenewscrypto.com/feed/',
    category: 'general',
  },
  cryptonewsflash: {
    name: 'Crypto-News Flash',
    url: 'https://www.crypto-news-flash.com/feed/',
    category: 'general',
  },
  finance_magnates_crypto: {
    name: 'Finance Magnates Crypto',
    url: 'https://www.financemagnates.com/cryptocurrency/feed/',
    category: 'general',
  },
  insidebitcoins: {
    name: 'InsideBitcoins',
    url: 'https://insidebitcoins.com/feed',
    category: 'general',
  },
  thecryptobasic: {
    name: 'TheCryptoBasic',
    url: 'https://thecryptobasic.com/feed/',
    category: 'general',
  },
  bitcoincom: {
    name: 'Bitcoin.com News',
    url: 'https://news.bitcoin.com/feed/',
    category: 'bitcoin',
  },
  coincentral_news: {
    name: 'CoinCentral',
    url: 'https://coincentral.com/news/feed/',
    category: 'general',
  },
  cryptonewsz: {
    name: 'CryptoNewsZ',
    url: 'https://www.cryptonewsz.com/feed/',
    category: 'general',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // MAINSTREAM FINANCE & BUSINESS NEWS
  // These major outlets heavily cover crypto, macro, and policy
  // decisions that directly move crypto markets.
  // ═══════════════════════════════════════════════════════════════
  wsj_business: {
    name: 'Wall Street Journal',
    url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',
    category: 'mainstream',
    disabled: true, // Perf: Generic finance, not crypto-specific
  },
  nyt_business: {
    name: 'New York Times Business',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
    category: 'mainstream',
    disabled: true, // Perf: Generic business news, not crypto-specific
  },
  washingtonpost_biz: {
    name: 'Washington Post Business',
    url: 'https://feeds.washingtonpost.com/rss/business',
    category: 'mainstream',
    disabled: true, // DNS resolution failure — 2026-03-01
  },
  economist: {
    name: 'The Economist',
    url: 'https://www.economist.com/sections/economics/rss.xml',
    category: 'mainstream',
    disabled: true, // Perf: General economics, not crypto-specific
  },
  marketwatch: {
    name: 'MarketWatch',
    url: 'https://feeds.marketwatch.com/marketwatch/topstories/',
    category: 'mainstream',
    disabled: true, // Perf: Generic stock market, not crypto-specific
  },
  investopedia: {
    name: 'Investopedia',
    url: 'https://www.investopedia.com/feedbuilder/feed/getfeed/?feedName=rss_headline',
    category: 'mainstream',
    disabled: true, // Feed URL discontinued (404) — 2026-03-01
  },
  seekingalpha: {
    name: 'Seeking Alpha',
    url: 'https://seekingalpha.com/market_currents.xml',
    category: 'mainstream',
    disabled: true, // Perf: Generic stock market, not crypto-specific
  },
  nikkei_asia: {
    name: 'Nikkei Asia',
    url: 'https://asia.nikkei.com/rss/feed/nar',
    category: 'mainstream',
    disabled: true, // Perf: Asian business news, not crypto-specific
  },
  economic_times_india: {
    name: 'Economic Times India Markets',
    url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
    category: 'mainstream',
    disabled: true, // Perf: Indian markets, not crypto-specific
  },

  // ═══════════════════════════════════════════════════════════════
  // MACRO & GEOPOLITICAL (moves crypto markets)
  // Central bank decisions, regulation, sanctions, and geopolitical
  // events are top market movers for crypto. These wire services and
  // policy sources provide the earliest signals.
  // ═══════════════════════════════════════════════════════════════
  bbc_world: {
    name: 'BBC World',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'geopolitical',
    disabled: true, // Perf: General world news, not crypto-specific
  },
  reuters_world: {
    name: 'Reuters',
    url: 'https://www.reuters.com/rssFeed/worldNews/',
    category: 'geopolitical',
    disabled: true, // 401 Unauthorized — 2026-03-01
  },
  ap_news: {
    name: 'AP News',
    url: 'https://rsshub.app/apnews/topics/apf-business',
    category: 'geopolitical',
    disabled: true, // Perf: General news wire, not crypto-specific
  },
  federal_reserve: {
    name: 'Federal Reserve',
    url: 'https://www.federalreserve.gov/feeds/press_all.xml',
    category: 'geopolitical',
  },
  sec_press: {
    name: 'SEC Press Releases',
    url: 'https://www.sec.gov/news/pressreleases.rss',
    category: 'geopolitical',
  },
  dw_news: {
    name: 'DW News',
    url: 'https://rss.dw.com/xml/rss-en-all',
    category: 'geopolitical',
    disabled: true, // Perf: German news, not crypto-specific
  },
  cbc_news: {
    name: 'CBC News',
    url: 'https://www.cbc.ca/cmlink/1.1244475',
    category: 'geopolitical',
    disabled: true, // Perf: Canadian news, not crypto-specific
  },
  al_jazeera: {
    name: 'Al Jazeera',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    category: 'geopolitical',
    disabled: true, // Perf: General world news, not crypto-specific
  },

  // =========================================================================
  // ADDITIONAL SOURCES — Scaling to 200+
  // =========================================================================

  // Exchange Blogs
  kraken_blog: {
    name: 'Kraken Blog',
    url: 'https://blog.kraken.com/feed/',
    category: 'institutional',
  },
  okx_blog: {
    name: 'OKX Blog',
    url: 'https://www.okx.com/academy/en/feed',
    category: 'institutional',
  },
  bybit_blog: {
    name: 'Bybit Blog',
    url: 'https://blog.bybit.com/feed/',
    category: 'institutional',
  },
  bitfinex_blog: {
    name: 'Bitfinex Blog',
    url: 'https://blog.bitfinex.com/feed/',
    category: 'institutional',
  },
  gemini_blog: {
    name: 'Gemini Blog',
    url: 'https://www.gemini.com/blog/feed',
    category: 'institutional',
  },

  // DeFi Protocols
  lido_blog: {
    name: 'Lido Blog',
    url: 'https://blog.lido.fi/rss/',
    category: 'defi',
  },
  curve_blog: {
    name: 'Curve Blog',
    url: 'https://news.curve.fi/rss/',
    category: 'defi',
  },
  eigenlayer_blog: {
    name: 'EigenLayer Blog',
    url: 'https://www.blog.eigenlayer.xyz/rss/',
    category: 'defi',
  },
  pendle_blog: {
    name: 'Pendle Blog',
    url: 'https://medium.com/feed/pendle',
    category: 'defi',
  },
  ethena_blog: {
    name: 'Ethena Blog',
    url: 'https://mirror.xyz/ethena/feed/atom',
    category: 'defi',
  },

  // Layer 2 & Rollups
  scroll_blog: {
    name: 'Scroll Blog',
    url: 'https://scroll.io/blog/feed',
    category: 'layer2',
  },
  linea_blog: {
    name: 'Linea Blog',
    url: 'https://linea.mirror.xyz/feed/atom',
    category: 'layer2',
  },
  mantle_blog: {
    name: 'Mantle Blog',
    url: 'https://www.mantle.xyz/blog/feed',
    category: 'layer2',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  blast_blog: {
    name: 'Blast Blog',
    url: 'https://mirror.xyz/blastofficial.eth/feed/atom',
    category: 'layer2',
  },

  // Alt L1 Ecosystem Extended
  ton_blog: {
    name: 'TON Blog',
    url: 'https://blog.ton.org/rss.xml',
    category: 'altl1',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  sei_blog: {
    name: 'Sei Blog',
    url: 'https://blog.sei.io/rss/',
    category: 'altl1',
  },
  injective_blog: {
    name: 'Injective Blog',
    url: 'https://blog.injective.com/feed/',
    category: 'altl1',
  },
  monad_blog: {
    name: 'Monad Blog',
    url: 'https://www.monad.xyz/blog/feed',
    category: 'altl1',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  celestia_blog: {
    name: 'Celestia Blog',
    url: 'https://blog.celestia.org/rss/',
    category: 'altl1',
  },

  // Bitcoin Ecosystem Extended
  bisq_blog: {
    name: 'Bisq Blog',
    url: 'https://bisq.network/blog/feed.xml',
    category: 'bitcoin',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  rgb_blog: {
    name: 'RGB Blog',
    url: 'https://rgb.tech/blog/feed',
    category: 'bitcoin',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  nostr_blog: {
    name: 'Nostr Protocol',
    url: 'https://nostr.com/feed.xml',
    category: 'bitcoin',
  },

  // Privacy & ZK
  zcash_blog: {
    name: 'Zcash Blog',
    url: 'https://electriccoin.co/blog/feed/',
    category: 'security',
  },
  aztec_blog: {
    name: 'Aztec Blog',
    url: 'https://medium.com/feed/aztec-protocol',
    category: 'layer2',
  },

  // RWA (Real World Assets)
  maple_finance: {
    name: 'Maple Finance Blog',
    url: 'https://maple.finance/blog/rss.xml',
    category: 'defi',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  centrifuge_blog: {
    name: 'Centrifuge Blog',
    url: 'https://medium.com/feed/centrifuge',
    category: 'defi',
  },
  ondo_finance: {
    name: 'Ondo Finance Blog',
    url: 'https://blog.ondo.finance/rss/',
    category: 'defi',
  },

  // AI x Crypto
  fetch_ai_blog: {
    name: 'Fetch.ai Blog',
    url: 'https://fetch.ai/blog/feed',
    category: 'altl1',
  },
  ocean_protocol: {
    name: 'Ocean Protocol Blog',
    url: 'https://blog.oceanprotocol.com/feed',
    category: 'altl1',
    disabled: true, // Feed returning persistent 500s — 2026-03-01
  },
  render_blog: {
    name: 'Render Network Blog',
    url: 'https://medium.com/feed/render-token',
    category: 'altl1',
  },

  // Oracles & Infrastructure
  pyth_blog: {
    name: 'Pyth Network Blog',
    url: 'https://pyth.network/blog/feed',
    category: 'developer',
  },
  api3_blog: {
    name: 'API3 Blog',
    url: 'https://medium.com/feed/api3',
    category: 'developer',
  },

  // Governance & DAOs
  snapshot_blog: {
    name: 'Snapshot Blog',
    url: 'https://snapshot.mirror.xyz/feed/atom',
    category: 'defi',
  },
  tally_blog: {
    name: 'Tally Blog',
    url: 'https://blog.tally.xyz/feed',
    category: 'defi',
  },

  // Security Extended
  chainalysis_blog: {
    name: 'Chainalysis Blog',
    url: 'https://www.chainalysis.com/blog/feed/',
    category: 'security',
  },
  elliptic_blog: {
    name: 'Elliptic Blog',
    url: 'https://www.elliptic.co/blog/rss.xml',
    category: 'security',
  },
  hacken_blog: {
    name: 'Hacken Blog',
    url: 'https://hacken.io/blog/feed/',
    category: 'security',
    disabled: true, // 404 Not Found — 2026-03-01
  },

  // Payments & Stablecoins Extended
  stripe_crypto: {
    name: 'Stripe Blog (Crypto)',
    url: 'https://stripe.com/blog/feed.rss',
    category: 'fintech',
  },
  paypal_newsroom: {
    name: 'PayPal Newsroom',
    url: 'https://newsroom.paypal-corp.com/feed',
    category: 'fintech',
  },

  // Derivatives Extended
  coinglass_blog: {
    name: 'CoinGlass Blog',
    url: 'https://www.coinglass.com/blog/feed',
    category: 'derivatives',
    disabled: true, // 404 Not Found — 2026-03-01
  },

  // Podcasts (show notes via RSS)
  unchained_podcast: {
    name: 'Unchained Podcast',
    url: 'https://feeds.simplecast.com/JGE3yC0V',
    category: 'journalism',
    noDataCache: true, // 11.9MB feed exceeds Next.js 2MB data cache limit
  },
  what_bitcoin_did: {
    name: 'What Bitcoin Did',
    url: 'https://feeds.simplecast.com/dsMGZxro',
    category: 'bitcoin',
    noDataCache: true, // Simplecast feeds exceed Next.js 2MB data cache limit
    disabled: true, // 404 Not Found — 2026-03-01
  },
  bankless_podcast: {
    name: 'Bankless Podcast',
    url: 'https://feeds.simplecast.com/lKmQdc05',
    category: 'defi',
    noDataCache: true, // Simplecast feeds exceed Next.js 2MB data cache limit
    disabled: true, // 404 Not Found — 2026-03-01
  },
  epicenter_podcast: {
    name: 'Epicenter Podcast',
    url: 'https://feeds.simplecast.com/0E5u4F_4',
    category: 'general',
    noDataCache: true, // Simplecast feeds exceed Next.js 2MB data cache limit
    disabled: true, // 404 Not Found — 2026-03-01
  },

  // =========================================================================
  // CRYPTO MEDIA — High-Volume News Sources
  // =========================================================================
  watcherguru: {
    name: 'Watcher Guru',
    url: 'https://watcher.guru/news/feed',
    category: 'general',
  },
  cryptopolitan: {
    name: 'Cryptopolitan',
    url: 'https://www.cryptopolitan.com/feed/',
    category: 'general',
  },
  coinedition: {
    name: 'CoinEdition',
    url: 'https://coinedition.com/feed/',
    category: 'general',
  },
  bitcoinworld: {
    name: 'BitcoinWorld',
    url: 'https://bitcoinworld.co.in/feed/',
    category: 'general',
  },
  coincodex_blog: {
    name: 'CoinCodex Blog',
    url: 'https://coincodex.com/blog/feed/',
    category: 'general',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  invezz_crypto: {
    name: 'Invezz Crypto',
    url: 'https://invezz.com/cryptocurrency/feed/',
    category: 'general',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  ibtimes_crypto: {
    name: 'IBTimes Crypto',
    url: 'https://www.ibtimes.com/cryptocurrency/feed',
    category: 'general',
    disabled: true, // 404 Not Found — 2026-03-01
  },

  // =========================================================================
  // EXCHANGE & PLATFORM BLOGS
  // =========================================================================
  coinmarketcap_blog: {
    name: 'CoinMarketCap Blog',
    url: 'https://blog.coinmarketcap.com/feed/',
    category: 'institutional',
  },
  coingecko_blog: {
    name: 'CoinGecko Blog',
    url: 'https://blog.coingecko.com/feed/',
    category: 'institutional',
  },
  kucoin_blog: {
    name: 'KuCoin Blog',
    url: 'https://www.kucoin.com/blog/rss.xml',
    category: 'institutional',
  },
  cryptocom_blog: {
    name: 'Crypto.com Blog',
    url: 'https://crypto.com/company-news/feed',
    category: 'institutional',
  },
  bitget_blog: {
    name: 'Bitget Blog',
    url: 'https://www.bitget.com/blog/feed',
    category: 'institutional',
  },

  // =========================================================================
  // DEFI PROTOCOLS — Major DEX/Lending/Yield
  // =========================================================================
  dydx_blog: {
    name: 'dYdX Blog',
    url: 'https://dydx.exchange/blog/feed',
    category: 'defi',
    disabled: true, // 500 Server Error — 2026-03-01
  },
  synthetix_blog: {
    name: 'Synthetix Blog',
    url: 'https://blog.synthetix.io/rss/',
    category: 'defi',
  },
  oneinch_blog: {
    name: '1inch Blog',
    url: 'https://blog.1inch.io/feed',
    category: 'defi',
  },
  yearn_blog: {
    name: 'Yearn Finance Blog',
    url: 'https://blog.yearn.fi/feed',
    category: 'defi',
  },
  gmx_blog: {
    name: 'GMX Blog',
    url: 'https://medium.com/feed/@gmx.io',
    category: 'defi',
  },
  jupiter_blog: {
    name: 'Jupiter Blog',
    url: 'https://station.jup.ag/blog/rss.xml',
    category: 'defi',
  },
  morpho_blog: {
    name: 'Morpho Blog',
    url: 'https://medium.com/feed/morpho-labs',
    category: 'defi',
  },

  // =========================================================================
  // CROSS-CHAIN & INTEROPERABILITY
  // =========================================================================
  wormhole_blog: {
    name: 'Wormhole Blog',
    url: 'https://wormhole.com/blog/feed',
    category: 'developer',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  layerzero_blog: {
    name: 'LayerZero Blog',
    url: 'https://medium.com/feed/layerzero-official',
    category: 'developer',
  },

  // =========================================================================
  // TECH / MAINSTREAM — Crypto Coverage
  // =========================================================================
  techcrunch_crypto: {
    name: 'TechCrunch Crypto',
    url: 'https://techcrunch.com/category/cryptocurrency/feed/',
    category: 'mainstream',
  },
  wired_crypto: {
    name: 'Wired Crypto',
    url: 'https://www.wired.com/feed/tag/cryptocurrency/latest/rss',
    category: 'mainstream',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  theregister_crypto: {
    name: 'The Register',
    url: 'https://www.theregister.com/offbeat/geek/headlines.atom',
    category: 'mainstream',
    disabled: true, // 404 Not Found — 2026-03-01
  },

  // =========================================================================
  // POLICY & REGULATION
  // =========================================================================
  coincenter: {
    name: 'Coin Center',
    url: 'https://www.coincenter.org/feed/',
    category: 'geopolitical',
  },
  cftc_press: {
    name: 'CFTC Press Releases',
    url: 'https://www.cftc.gov/PressRoom/PressReleases/RSS',
    category: 'geopolitical',
  },
  mica_crypto: {
    name: 'EU Blockchain Observatory',
    url: 'https://blockchain-observatory.ec.europa.eu/feed',
    category: 'geopolitical',
    disabled: true, // 404 Not Found — 2026-03-01
  },

  // =========================================================================
  // SOLANA ECOSYSTEM
  // =========================================================================
  helius_blog: {
    name: 'Helius Blog',
    url: 'https://www.helius.dev/blog/feed',
    category: 'solana',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  phantom_blog: {
    name: 'Phantom Blog',
    url: 'https://phantom.app/blog/feed',
    category: 'solana',
  },
  marinade_blog: {
    name: 'Marinade Finance Blog',
    url: 'https://medium.com/feed/marinade-finance',
    category: 'solana',
  },
  jito_blog: {
    name: 'Jito Blog',
    url: 'https://www.jito.network/blog/rss.xml',
    category: 'solana',
  },

  // =========================================================================
  // AI x CRYPTO — Emerging Narrative
  // =========================================================================
  bittensor_blog: {
    name: 'Bittensor Blog',
    url: 'https://blog.bittensor.com/feed',
    category: 'altl1',
  },
  akash_blog: {
    name: 'Akash Network Blog',
    url: 'https://akash.network/blog/feed/',
    category: 'altl1',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  ritual_blog: {
    name: 'Ritual Blog',
    url: 'https://ritual.net/blog/feed',
    category: 'altl1',
    disabled: true, // 404 Not Found — 2026-03-01
  },

  // =========================================================================
  // DATA ANALYTICS PLATFORMS
  // =========================================================================
  nansen_blog: {
    name: 'Nansen Blog',
    url: 'https://www.nansen.ai/research/feed',
    category: 'onchain',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  dune_blog: {
    name: 'Dune Analytics Blog',
    url: 'https://dune.com/blog/feed',
    category: 'onchain',
  },
  artemis_blog: {
    name: 'Artemis Blog',
    url: 'https://www.artemis.xyz/blog/feed',
    category: 'onchain',
  },

  // =========================================================================
  // GENERAL CRYPTO NEWS — Extended Coverage
  // =========================================================================
  cryptopress: {
    name: 'Crypto.Press',
    url: 'https://crypto.press/feed/',
    category: 'general',
    disabled: true, // DNS resolution failure — 2026-03-01
  },
  cryptoslam: {
    name: 'CryptoSlam Blog',
    url: 'https://www.cryptoslam.io/blog/feed/',
    category: 'general',
  },
  coinpaprika_blog: {
    name: 'CoinPaprika Blog',
    url: 'https://coinpaprika.com/blog/feed/',
    category: 'general',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  thecoinrepublic: {
    name: 'The Coin Republic',
    url: 'https://www.thecoinrepublic.com/feed/',
    category: 'general',
  },
  bitdegree_news: {
    name: 'BitDegree News',
    url: 'https://www.bitdegree.org/crypto/news/feed',
    category: 'general',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  cryptotvplus: {
    name: 'CryptoTvPlus',
    url: 'https://cryptotvplus.com/feed/',
    category: 'general',
  },
  blocktempo: {
    name: 'BlockTempo',
    url: 'https://www.blocktempo.com/feed/',
    category: 'general',
  },

  // =========================================================================
  // DEFI PROTOCOLS — Extended
  // =========================================================================
  balancer_blog: {
    name: 'Balancer Blog',
    url: 'https://medium.com/feed/balancer-protocol',
    category: 'defi',
  },
  frax_blog: {
    name: 'Frax Finance Blog',
    url: 'https://medium.com/feed/frax-finance',
    category: 'defi',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  convex_blog: {
    name: 'Convex Finance Blog',
    url: 'https://medium.com/feed/convex-finance',
    category: 'defi',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  radiant_blog: {
    name: 'Radiant Capital Blog',
    url: 'https://medium.com/feed/@radiantcapital',
    category: 'defi',
  },
  instadapp_blog: {
    name: 'Instadapp Blog',
    url: 'https://blog.instadapp.io/rss/',
    category: 'defi',
  },
  sommelier_blog: {
    name: 'Sommelier Finance Blog',
    url: 'https://medium.com/feed/sommelier-finance',
    category: 'defi',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  liquity_blog: {
    name: 'Liquity Blog',
    url: 'https://www.liquity.org/blog/feed',
    category: 'defi',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  sushi_blog: {
    name: 'SushiSwap Blog',
    url: 'https://medium.com/feed/sushiswap-org',
    category: 'defi',
  },

  // =========================================================================
  // GAMEFI & METAVERSE
  // =========================================================================
  gamingguild_blog: {
    name: 'Yield Guild Games Blog',
    url: 'https://medium.com/feed/yield-guild-games',
    category: 'gaming',
  },
  immutable_blog: {
    name: 'Immutable Blog',
    url: 'https://www.immutable.com/blog/feed',
    category: 'gaming',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  ronin_blog: {
    name: 'Ronin Blog',
    url: 'https://roninchain.com/blog/feed',
    category: 'gaming',
  },
  gala_blog: {
    name: 'Gala Games Blog',
    url: 'https://blog.gala.games/feed',
    category: 'gaming',
  },

  // =========================================================================
  // PRIVACY & ZERO KNOWLEDGE — Extended
  // =========================================================================
  risc_zero_blog: {
    name: 'RISC Zero Blog',
    url: 'https://www.risczero.com/blog/feed',
    category: 'security',
  },
  espresso_blog: {
    name: 'Espresso Systems Blog',
    url: 'https://medium.com/feed/espresso-systems',
    category: 'layer2',
  },
  polygon_zkevm_blog: {
    name: 'Polygon zkEVM Blog',
    url: 'https://polygon.technology/blog/polygon-zkevm/feed',
    category: 'layer2',
    disabled: true, // 404 Not Found — 2026-03-01
  },

  // =========================================================================
  // SOLANA ECOSYSTEM — Extended
  // =========================================================================
  orca_blog: {
    name: 'Orca Blog',
    url: 'https://medium.com/feed/orca-so',
    category: 'solana',
  },
  raydium_blog: {
    name: 'Raydium Blog',
    url: 'https://medium.com/feed/@raydium',
    category: 'solana',
  },
  tensor_blog: {
    name: 'Tensor Blog',
    url: 'https://medium.com/feed/@tensor_hq',
    category: 'solana',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  drift_blog: {
    name: 'Drift Protocol Blog',
    url: 'https://medium.com/feed/drift-protocol',
    category: 'solana',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  solflare_blog: {
    name: 'Solflare Blog',
    url: 'https://medium.com/feed/solflare',
    category: 'solana',
  },

  // =========================================================================
  // BITCOIN ECOSYSTEM — Extended
  // =========================================================================
  ordinals_blog: {
    name: 'Ordinals Blog',
    url: 'https://ordinalsbot.com/blog/feed',
    category: 'bitcoin',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  bitcoinops: {
    name: 'Bitcoin Optech',
    url: 'https://bitcoinops.org/feed.xml',
    category: 'bitcoin',
  },
  river_blog: {
    name: 'River Financial Blog',
    url: 'https://river.com/learn/feed/',
    category: 'bitcoin',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  swan_blog: {
    name: 'Swan Bitcoin Blog',
    url: 'https://www.swanbitcoin.com/feed/',
    category: 'bitcoin',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  casa_blog: {
    name: 'Casa Blog',
    url: 'https://blog.keys.casa/rss/',
    category: 'bitcoin',
  },

  // =========================================================================
  // REGULATION & COMPLIANCE
  // =========================================================================
  elliptic_compliance: {
    name: 'Elliptic Compliance Blog',
    url: 'https://www.elliptic.co/blog/category/compliance/rss.xml',
    category: 'geopolitical',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  trminsights: {
    name: 'TRM Labs Insights',
    url: 'https://www.trmlabs.com/insights/feed',
    category: 'geopolitical',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  fireblocks_blog: {
    name: 'Fireblocks Blog',
    url: 'https://www.fireblocks.com/blog/feed/',
    category: 'institutional',
  },

  // =========================================================================
  // VENTURE & INSTITUTIONAL — Extended
  // =========================================================================
  hashkey_capital: {
    name: 'HashKey Capital Blog',
    url: 'https://medium.com/feed/hashkey-capital',
    category: 'institutional',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  polychain_blog: {
    name: 'Polychain Capital Blog',
    url: 'https://medium.com/feed/@polychain',
    category: 'institutional',
  },
  electric_capital: {
    name: 'Electric Capital Blog',
    url: 'https://medium.com/feed/electric-capital',
    category: 'institutional',
  },
  framework_blog: {
    name: 'Framework Ventures Blog',
    url: 'https://medium.com/feed/framework-ventures',
    category: 'institutional',
  },

  // =========================================================================
  // INFRASTRUCTURE & WALLETS
  // =========================================================================
  metamask_blog: {
    name: 'MetaMask Blog',
    url: 'https://metamask.io/news/feed',
    category: 'developer',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  ledger_blog: {
    name: 'Ledger Blog',
    url: 'https://www.ledger.com/blog/feed',
    category: 'security',
    disabled: true, // 401 Unauthorized — 2026-03-01
  },
  trezor_blog: {
    name: 'Trezor Blog',
    url: 'https://blog.trezor.io/feed',
    category: 'security',
  },
  safe_blog: {
    name: 'Safe (Gnosis Safe) Blog',
    url: 'https://safe.global/blog/feed',
    category: 'security',
  },
  biconomy_blog: {
    name: 'Biconomy Blog',
    url: 'https://medium.com/feed/biconomy',
    category: 'developer',
  },

  // =========================================================================
  // RESTAKING & LIQUID STAKING
  // =========================================================================
  rocketpool_blog: {
    name: 'Rocket Pool Blog',
    url: 'https://medium.com/feed/rocket-pool',
    category: 'ethereum',
  },
  ssv_network_blog: {
    name: 'SSV Network Blog',
    url: 'https://medium.com/feed/ssv-network',
    category: 'ethereum',
  },
  etherfi_blog: {
    name: 'ether.fi Blog',
    url: 'https://medium.com/feed/@ether.fi',
    category: 'defi',
  },
  kelpdao_blog: {
    name: 'Kelp DAO Blog',
    url: 'https://medium.com/feed/@kelp_dao',
    category: 'defi',
  },

  // =========================================================================
  // BRIDGES & MEV
  // =========================================================================
  across_blog: {
    name: 'Across Protocol Blog',
    url: 'https://medium.com/feed/across-protocol',
    category: 'defi',
  },
  flashbots_blog: {
    name: 'Flashbots Blog',
    url: 'https://writings.flashbots.net/feed',
    category: 'ethereum',
    disabled: true, // 404 Not Found — 2026-03-01
  },

  // =========================================================================
  // COSMOS ECOSYSTEM
  // =========================================================================
  osmosis_blog: {
    name: 'Osmosis Blog',
    url: 'https://medium.com/feed/osmosis',
    category: 'altl1',
  },
  dydx_chain_blog: {
    name: 'dYdX Chain Blog',
    url: 'https://www.dydx.foundation/blog/feed',
    category: 'altl1',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  stride_blog: {
    name: 'Stride Blog',
    url: 'https://medium.com/feed/@stride_zone',
    category: 'altl1',
  },

  // =========================================================================
  // DERIVATIVES & PERPS — Expanding Coverage
  // =========================================================================
  hyperliquid_blog: {
    name: 'Hyperliquid Blog',
    url: 'https://medium.com/feed/@hyperliquid',
    category: 'derivatives',
  },
  vertex_blog: {
    name: 'Vertex Protocol Blog',
    url: 'https://medium.com/feed/vertex-protocol',
    category: 'derivatives',
  },
  aevo_blog: {
    name: 'Aevo Blog',
    url: 'https://medium.com/feed/@aevo-exchange',
    category: 'derivatives',
  },
  kwenta_blog: {
    name: 'Kwenta Blog',
    url: 'https://mirror.xyz/kwenta.eth/feed/atom',
    category: 'derivatives',
  },
  lyra_blog: {
    name: 'Lyra Finance Blog',
    url: 'https://medium.com/feed/lyra-finance',
    category: 'derivatives',
  },
  gains_network_blog: {
    name: 'gTrade Blog',
    url: 'https://medium.com/feed/gains-network',
    category: 'derivatives',
  },

  // =========================================================================
  // STABLECOINS & PAYMENTS — Expanding Coverage
  // =========================================================================
  mountain_protocol: {
    name: 'Mountain Protocol Blog',
    url: 'https://medium.com/feed/@mountainprotocol',
    category: 'stablecoin',
  },
  paypal_crypto: {
    name: 'PayPal Crypto Newsroom',
    url: 'https://newsroom.paypal-corp.com/feed',
    category: 'stablecoin',
  },
  first_digital: {
    name: 'First Digital Labs Blog',
    url: 'https://medium.com/feed/@firstdigitallabs',
    category: 'stablecoin',
  },

  // =========================================================================
  // ASIA-PACIFIC — Expanding Coverage
  // =========================================================================
  cryptotimes_india: {
    name: 'The Crypto Times India',
    url: 'https://www.cryptotimes.io/feed/',
    category: 'asia',
  },
  chaindebrief: {
    name: 'Chain Debrief',
    url: 'https://chaindebrief.com/feed/',
    category: 'asia',
  },
  blockhead_tech: {
    name: 'Blockhead',
    url: 'https://blockhead.co/feed/',
    category: 'asia',
  },
  tokenpost_en: {
    name: 'TokenPost EN',
    url: 'https://tokenpost.com/rss/feed/',
    category: 'asia',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  bitpinas: {
    name: 'BitPinas',
    url: 'https://bitpinas.com/feed/',
    category: 'asia',
  },
  coinlive: {
    name: 'Coinlive',
    url: 'https://www.coinlive.com/feed',
    category: 'asia',
  },

  // =========================================================================
  // TRADFI & INSTITUTIONAL — Expanding Coverage
  // =========================================================================
  jpmorgan_insights: {
    name: 'JPMorgan Insights',
    url: 'https://www.jpmorgan.com/insights/feed',
    category: 'tradfi',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  citi_blog: {
    name: 'Citi GPS',
    url: 'https://www.citigroup.com/global/insights/feed',
    category: 'tradfi',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  fidelity_digital: {
    name: 'Fidelity Digital Assets',
    url: 'https://www.fidelitydigitalassets.com/research/feed',
    category: 'tradfi',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  standard_chartered_crypto: {
    name: 'Standard Chartered Crypto',
    url: 'https://www.sc.com/en/feature/crypto-insights/feed/',
    category: 'tradfi',
    disabled: true, // 404 Not Found — 2026-03-01
  },

  // =========================================================================
  // MACRO & CENTRAL BANKS — Expanding Coverage
  // =========================================================================
  federal_reserve_notes: {
    name: 'Federal Reserve FEDS Notes',
    url: 'https://www.federalreserve.gov/feeds/feds_notes.xml',
    category: 'macro',
    disabled: true, // Perf: Academic Fed research notes, not breaking news
  },
  bis_speeches: {
    name: 'BIS Speeches',
    url: 'https://www.bis.org/doclist/cbspeeches.rss',
    category: 'macro',
    disabled: true, // Perf: Central bank speeches, not crypto-specific
  },
  ecb_press: {
    name: 'ECB Press Releases',
    url: 'https://www.ecb.europa.eu/rss/press.html',
    category: 'macro',
    disabled: true, // Perf: Central bank press, not crypto-specific
  },
  imf_blog: {
    name: 'IMF Blog',
    url: 'https://www.imf.org/en/Blogs/rss',
    category: 'macro',
    disabled: true, // Perf: IMF commentary, not crypto-specific
  },
  boe_speeches: {
    name: 'Bank of England Speeches',
    url: 'https://www.bankofengland.co.uk/rss/speeches',
    category: 'macro',
    disabled: true, // Perf: Central bank speeches, not crypto-specific
  },

  // =========================================================================
  // MINING & ENERGY — Expanding Coverage
  // =========================================================================
  theminermag: {
    name: 'The Miner Mag',
    url: 'https://www.theminermag.com/feed/',
    category: 'mining',
  },
  luxor_blog: {
    name: 'Luxor Mining Blog',
    url: 'https://luxor.tech/blog/feed',
    category: 'mining',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  foundation_mining: {
    name: 'Foundation Mining',
    url: 'https://foundationmining.com/blog/feed/',
    category: 'mining',
    disabled: true, // DNS resolution failure — 2026-03-01
  },

  // =========================================================================
  // CRYPTO JOURNALISM & NEWSLETTERS — Expanding Coverage
  // =========================================================================
  milkroad: {
    name: 'Milk Road',
    url: 'https://www.milkroad.com/feed/',
    category: 'journalism',
  },
  defiprime: {
    name: 'DeFi Prime',
    url: 'https://defiprime.com/feed.xml',
    category: 'journalism',
  },
  thedefiedge: {
    name: 'The DeFi Edge',
    url: 'https://thedefiedge.substack.com/feed',
    category: 'journalism',
  },
  tokenomicsdao: {
    name: 'Tokenomics DAO',
    url: 'https://tokenomicsdao.substack.com/feed',
    category: 'journalism',
  },
  cryptoweekly: {
    name: 'Crypto Weekly',
    url: 'https://cryptoweekly.co/feed/',
    category: 'journalism',
    disabled: true, // DNS resolution failure — 2026-03-01
  },
  metaversal: {
    name: 'Metaversal',
    url: 'https://metaversal.banklesshq.com/feed',
    category: 'journalism',
  },

  // =========================================================================
  // NFT & DIGITAL ART — Expanding Coverage
  // =========================================================================
  artblocks_blog: {
    name: 'Art Blocks Blog',
    url: 'https://medium.com/feed/the-art-blocks-blog',
    category: 'nft',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  superrare_blog: {
    name: 'SuperRare Blog',
    url: 'https://medium.com/feed/superrare',
    category: 'nft',
  },
  opensea_blog: {
    name: 'OpenSea Blog',
    url: 'https://opensea.io/blog/feed',
    category: 'nft',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  blur_blog: {
    name: 'Blur Blog',
    url: 'https://mirror.xyz/blurdao.eth/feed/atom',
    category: 'nft',
  },
  zora_blog: {
    name: 'Zora Blog',
    url: 'https://zora.co/blog/feed',
    category: 'nft',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  foundation_blog: {
    name: 'Foundation Blog',
    url: 'https://foundation.app/blog/feed',
    category: 'nft',
    disabled: true, // 404 Not Found — 2026-03-01
  },

  // =========================================================================
  // TRADING & MARKET ANALYSIS — Expanding Coverage
  // =========================================================================
  santiment_blog: {
    name: 'Santiment Blog',
    url: 'https://santiment.net/blog/feed/',
    category: 'trading',
  },
  kaiko_research: {
    name: 'Kaiko Research',
    url: 'https://www.kaiko.com/research/feed',
    category: 'trading',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  ccdata_research: {
    name: 'CCData Research',
    url: 'https://ccdata.io/blog/feed',
    category: 'trading',
  },
  coinalyze_blog: {
    name: 'Coinalyze Blog',
    url: 'https://coinalyze.net/blog/feed/',
    category: 'trading',
  },
  material_indicators: {
    name: 'Material Indicators Blog',
    url: 'https://materialindicators.substack.com/feed',
    category: 'trading',
  },

  // =========================================================================
  // PREDICTION MARKETS
  // =========================================================================
  polymarket_blog: {
    name: 'Polymarket Blog',
    url: 'https://mirror.xyz/polymarket.eth/feed/atom',
    category: 'defi',
  },

  // =========================================================================
  // SOCIALFI & DECENTRALIZED SOCIAL
  // =========================================================================
  lens_blog: {
    name: 'Lens Protocol Blog',
    url: 'https://lens.xyz/blog/feed',
    category: 'social',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  farcaster_blog: {
    name: 'Farcaster Blog',
    url: 'https://www.farcaster.xyz/blog/feed',
    category: 'social',
  },

  // =========================================================================
  // ADDITIONAL PODCASTS
  // =========================================================================
  bell_curve_podcast: {
    name: 'Bell Curve Podcast',
    url: 'https://feeds.simplecast.com/ePJmCHr3',
    category: 'defi',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  the_chopping_block: {
    name: 'The Chopping Block',
    url: 'https://feeds.simplecast.com/2LYbgm7h',
    category: 'general',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  empire_podcast: {
    name: 'Empire Podcast',
    url: 'https://feeds.simplecast.com/lKRGWp6K',
    category: 'general',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  lightspeed_podcast: {
    name: 'Lightspeed Podcast',
    url: 'https://feeds.simplecast.com/V3RQUAFM',
    category: 'solana',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  on_the_margin_podcast: {
    name: 'On The Margin',
    url: 'https://feeds.simplecast.com/I1bKBJmR',
    category: 'trading',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  zero_knowledge_podcast: {
    name: 'Zero Knowledge Podcast',
    url: 'https://feeds.simplecast.com/BBRRTZZP',
    category: 'developer',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  into_the_bytecode: {
    name: 'Into the Bytecode',
    url: 'https://feeds.simplecast.com/wN3UNzZa',
    category: 'ethereum',
    disabled: true, // 404 Not Found — 2026-03-01
  },

  // =========================================================================
  // ETHEREUM ECOSYSTEM — Expanding Coverage
  // =========================================================================
  ef_blog: {
    name: 'Ethereum Foundation Blog',
    url: 'https://blog.ethereum.org/feed.xml',
    category: 'ethereum',
  },
  ethereum_cat_herders: {
    name: 'Ethereum Cat Herders',
    url: 'https://medium.com/feed/ethereum-cat-herders',
    category: 'ethereum',
  },
  nethermind_blog: {
    name: 'Nethermind Blog',
    url: 'https://www.nethermind.io/blog/feed',
    category: 'ethereum',
    disabled: true, // 404 Not Found — 2026-03-01
  },

  // =========================================================================
  // BITCOIN ECOSYSTEM — Expanding Coverage
  // =========================================================================
  mempool_space: {
    name: 'Mempool.space Blog',
    url: 'https://mempool.space/blog/feed',
    category: 'bitcoin',
  },
  unchained_capital: {
    name: 'Unchained Capital Blog',
    url: 'https://unchained.com/blog/feed/',
    category: 'bitcoin',
  },
  blockstream_blog: {
    name: 'Blockstream Blog',
    url: 'https://blog.blockstream.com/feed/',
    category: 'bitcoin',
  },

  // =========================================================================
  // RESEARCH & ON-CHAIN — Expanding Coverage
  // =========================================================================
  token_terminal_blog: {
    name: 'Token Terminal Blog',
    url: 'https://tokenterminal.com/blog/feed',
    category: 'research',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  cryptorank_blog: {
    name: 'CryptoRank Blog',
    url: 'https://cryptorank.io/blog/feed',
    category: 'research',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  flipside_blog: {
    name: 'Flipside Crypto Blog',
    url: 'https://flipsidecrypto.xyz/blog/feed',
    category: 'onchain',
    disabled: true, // 404 Not Found — 2026-03-01
  },
  debank_blog: {
    name: 'DeBank Blog',
    url: 'https://medium.com/feed/@DeBank_',
    category: 'onchain',
    disabled: true, // 404 Not Found — 2026-03-01
  },

  // =========================================================================
  // WAVE 4 — MAINSTREAM MEDIA (rebuilding from 14 disabled)
  // =========================================================================
  guardian_tech: {
    name: 'The Guardian Tech',
    url: 'https://www.theguardian.com/technology/rss',
    category: 'mainstream',
  },
  bbc_business: {
    name: 'BBC Business',
    url: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    category: 'mainstream',
  },
  cnn_business: {
    name: 'CNN Business',
    url: 'https://rss.cnn.com/rss/money_news_international.rss',
    category: 'mainstream',
  },
  barrons: {
    name: 'Barrons',
    url: 'https://www.barrons.com/feed',
    category: 'mainstream',
  },
  business_insider_markets: {
    name: 'Business Insider Markets',
    url: 'https://www.businessinsider.com/sai/rss',
    category: 'mainstream',
  },
  fortune_crypto: {
    name: 'Fortune Crypto',
    url: 'https://fortune.com/section/crypto/feed/',
    category: 'mainstream',
  },
  vice_tech: {
    name: 'Vice Motherboard',
    url: 'https://www.vice.com/en/rss/topic/tech',
    category: 'mainstream',
  },
  axios_crypto: {
    name: 'Axios Crypto',
    url: 'https://api.axios.com/feed/newsletters/axios-crypto',
    category: 'mainstream',
  },
  thestreet_crypto: {
    name: 'TheStreet Crypto',
    url: 'https://www.thestreet.com/cryptocurrency/feed',
    category: 'mainstream',
  },
  benzinga_crypto: {
    name: 'Benzinga Crypto',
    url: 'https://www.benzinga.com/feed/cryptocurrency',
    category: 'mainstream',
  },
  kitco_crypto: {
    name: 'Kitco Crypto',
    url: 'https://www.kitco.com/feed/crypto-news.rss',
    category: 'mainstream',
  },

  // =========================================================================
  // WAVE 4 — GEOPOLITICAL & REGULATION (rebuilding from 9 disabled)
  // =========================================================================
  bis_speeches: {
    name: 'BIS Speeches',
    url: 'https://www.bis.org/doclist/cbspeeches.rss',
    category: 'geopolitical',
  },
  imf_blog: {
    name: 'IMF Blog',
    url: 'https://www.imf.org/en/Blogs/rss',
    category: 'geopolitical',
  },
  ecb_press: {
    name: 'ECB Press',
    url: 'https://www.ecb.europa.eu/rss/press.html',
    category: 'geopolitical',
  },
  treasury_press: {
    name: 'US Treasury Press',
    url: 'https://home.treasury.gov/system/files/136/rss-press-releases.xml',
    category: 'geopolitical',
  },
  boe_speeches: {
    name: 'Bank of England Speeches',
    url: 'https://www.bankofengland.co.uk/rss/speeches',
    category: 'geopolitical',
  },
  atlantic_council_crypto: {
    name: 'Atlantic Council Crypto',
    url: 'https://www.atlanticcouncil.org/category/programs/geoeconomics-center/digital-currencies/feed/',
    category: 'geopolitical',
  },

  // =========================================================================
  // WAVE 4 — ON-CHAIN ANALYTICS (5→10+)
  // =========================================================================
  santiment_blog: {
    name: 'Santiment Blog',
    url: 'https://santiment.net/blog/feed/',
    category: 'onchain',
  },
  messari_research: {
    name: 'Messari Protocol Services',
    url: 'https://messari.io/research/feed',
    category: 'onchain',
  },
  blockchair_news: {
    name: 'Blockchair News',
    url: 'https://blockchair.com/news/feed',
    category: 'onchain',
  },
  defined_fi_blog: {
    name: 'Defined.fi Blog',
    url: 'https://www.defined.fi/blog/feed',
    category: 'onchain',
  },
  parsec_blog: {
    name: 'Parsec Finance Blog',
    url: 'https://parsec.fi/blog/rss.xml',
    category: 'onchain',
  },

  // =========================================================================
  // WAVE 4 — NFT & METAVERSE (rebuilding from 6 disabled)
  // =========================================================================
  nifty_gateway_blog: {
    name: 'Nifty Gateway Blog',
    url: 'https://medium.com/feed/nifty-gateway',
    category: 'nft',
  },
  superrare_blog: {
    name: 'SuperRare Blog',
    url: 'https://superrare.com/magazine/feed/',
    category: 'nft',
  },
  artblocks_blog: {
    name: 'Art Blocks Blog',
    url: 'https://medium.com/feed/the-link-art-blocks',
    category: 'nft',
  },
  mirror_xyz_blog: {
    name: 'Mirror Blog',
    url: 'https://dev.mirror.xyz/feed/atom',
    category: 'nft',
  },

  // =========================================================================
  // WAVE 4 — GAMING & GAMEFI
  // =========================================================================
  stepn_blog: {
    name: 'STEPN Blog',
    url: 'https://medium.com/feed/@aspect_build',
    category: 'gaming',
  },
  mythical_games_blog: {
    name: 'Mythical Games Blog',
    url: 'https://mythicalgames.com/blog/feed',
    category: 'gaming',
  },
  animoca_blog: {
    name: 'Animoca Brands Blog',
    url: 'https://www.animocabrands.com/blog-feed.xml',
    category: 'gaming',
  },
  beam_gaming_blog: {
    name: 'Beam Blog',
    url: 'https://medium.com/feed/onbeam',
    category: 'gaming',
  },

  // =========================================================================
  // WAVE 4 — SOCIAL & COMMUNITY PLATFORMS
  // =========================================================================
  farcaster_blog: {
    name: 'Farcaster Blog',
    url: 'https://www.farcaster.xyz/blog/feed',
    category: 'social',
  },
  lens_blog: {
    name: 'Lens Protocol Blog',
    url: 'https://lens.xyz/blog/feed',
    category: 'social',
  },
  steemit_crypto: {
    name: 'Steemit Crypto',
    url: 'https://steemit.com/created/cryptocurrency.rss',
    category: 'social',
  },
  paragraph_xyz: {
    name: 'Paragraph Blog',
    url: 'https://paragraph.xyz/blog/feed',
    category: 'social',
  },

  // =========================================================================
  // WAVE 4 — FINTECH EXPANDED
  // =========================================================================
  coinbase_institutional: {
    name: 'Coinbase Institutional',
    url: 'https://www.coinbase.com/institutional/research/feed',
    category: 'fintech',
  },
  ripple_blog: {
    name: 'Ripple Blog',
    url: 'https://ripple.com/insights/feed/',
    category: 'fintech',
  },
  stellar_blog: {
    name: 'Stellar Blog',
    url: 'https://stellar.org/blog/feed',
    category: 'fintech',
  },

  // =========================================================================
  // WAVE 4 — PRIVACY & ZK
  // =========================================================================
  mina_blog: {
    name: 'Mina Protocol Blog',
    url: 'https://minaprotocol.com/blog/feed',
    category: 'security',
  },
  polygon_zkevm_blog: {
    name: 'Polygon zkEVM Blog',
    url: 'https://polygon.technology/blog/tag/zkevm/feed',
    category: 'layer2',
  },
  noir_blog: {
    name: 'Noir Lang Blog',
    url: 'https://blog.noir-lang.org/feed',
    category: 'developer',
  },
  risc_zero_blog: {
    name: 'RISC Zero Blog',
    url: 'https://www.risczero.com/blog/rss.xml',
    category: 'developer',
  },

  // =========================================================================
  // WAVE 4 — RWA / TOKENIZATION
  // =========================================================================
  securitize_blog: {
    name: 'Securitize Blog',
    url: 'https://securitize.io/blog/feed',
    category: 'tradfi',
  },
  polymesh_blog: {
    name: 'Polymesh Blog',
    url: 'https://polymesh.network/blog/feed',
    category: 'tradfi',
  },
  blackrock_digital: {
    name: 'BlackRock Digital Assets',
    url: 'https://www.blackrock.com/corporate/insights/digital-assets/rss',
    category: 'tradfi',
  },
  franklin_templeton_digital: {
    name: 'Franklin Templeton Digital',
    url: 'https://www.franklintempleton.com/articles/digital-assets/feed',
    category: 'tradfi',
  },

  // =========================================================================
  // WAVE 4 — MACRO & ECONOMICS EXPANDED
  // =========================================================================
  fred_blog: {
    name: 'FRED Blog (St. Louis Fed)',
    url: 'https://fredblog.stlouisfed.org/feed/',
    category: 'macro',
  },
  wolf_street: {
    name: 'Wolf Street',
    url: 'https://wolfstreet.com/feed/',
    category: 'macro',
  },
  zerohedge: {
    name: 'ZeroHedge',
    url: 'https://cms.zerohedge.com/fullrss2.xml',
    category: 'macro',
  },

  // =========================================================================
  // WAVE 4 — ETF / ASSET MGMT EXPANDED
  // =========================================================================
  fidelity_digital: {
    name: 'Fidelity Digital Assets',
    url: 'https://www.fidelitydigitalassets.com/research/feed',
    category: 'etf',
  },
  hashdex_research: {
    name: 'Hashdex Research',
    url: 'https://hashdex.com/en/research/feed',
    category: 'etf',
  },
  osprey_funds_blog: {
    name: 'Osprey Funds Blog',
    url: 'https://ospreyfunds.io/blog/feed/',
    category: 'etf',
  },

  // =========================================================================
  // WAVE 4 — ASIA-PACIFIC EXPANDED
  // =========================================================================
  blocktempo: {
    name: 'BlockTempo (EN)',
    url: 'https://www.blocktempo.com/feed/',
    category: 'asia',
  },
  coinpost_en: {
    name: 'CoinPost (EN)',
    url: 'https://coinpost.jp/?feed=rss2',
    category: 'asia',
  },
  kr_crypto: {
    name: 'Chain Catcher',
    url: 'https://www.chaincatcher.com/rss',
    category: 'asia',
  },

  // =========================================================================
  // WAVE 4 — DERIVATIVES & STRUCTURED PRODUCTS
  // =========================================================================
  laevitas_blog: {
    name: 'Laevitas Blog',
    url: 'https://laevitas.ch/blog/feed',
    category: 'derivatives',
  },
  paradigm_trading: {
    name: 'Paradigm (Trading)',
    url: 'https://www.paradigm.co/blog/rss.xml',
    category: 'derivatives',
  },
  amberdata_blog: {
    name: 'Amberdata Blog',
    url: 'https://blog.amberdata.io/rss/',
    category: 'derivatives',
  },

  // =========================================================================
  // WAVE 4 — ETHEREUM ECOSYSTEM EXPANDED
  // =========================================================================
  eigenda_blog: {
    name: 'EigenDA Blog',
    url: 'https://www.blog.eigenda.xyz/rss/',
    category: 'ethereum',
  },
  lido_dao_blog: {
    name: 'Lido DAO Governance',
    url: 'https://research.lido.fi/latest.rss',
    category: 'ethereum',
  },
  safe_blog: {
    name: 'Safe Blog',
    url: 'https://safe.mirror.xyz/feed/atom',
    category: 'ethereum',
  },
  ens_blog: {
    name: 'ENS Blog',
    url: 'https://blog.ens.domains/feed',
    category: 'ethereum',
  },

  // =========================================================================
  // WAVE 4 — SOLANA ECOSYSTEM EXPANDED
  // =========================================================================
  metaplex_blog: {
    name: 'Metaplex Blog',
    url: 'https://www.metaplex.com/blog/feed',
    category: 'solana',
  },
  squads_blog: {
    name: 'Squads Blog',
    url: 'https://squads.so/blog/feed',
    category: 'solana',
  },
  marginfi_blog: {
    name: 'marginfi Blog',
    url: 'https://medium.com/feed/marginfi',
    category: 'solana',
  },

  // =========================================================================
  // WAVE 4 — STABLECOINS EXPANDED
  // =========================================================================
  paxos_blog: {
    name: 'Paxos Blog',
    url: 'https://paxos.com/blog/feed/',
    category: 'stablecoin',
  },
  makerdao_gov: {
    name: 'MakerDAO Governance',
    url: 'https://forum.makerdao.com/latest.rss',
    category: 'stablecoin',
  },
  frax_blog: {
    name: 'Frax Finance Blog',
    url: 'https://medium.com/feed/frax-finance',
    category: 'stablecoin',
  },

  // =========================================================================
  // WAVE 4 — MINING EXPANDED
  // =========================================================================
  blockware_research: {
    name: 'Blockware Solutions Research',
    url: 'https://www.blockwaresolutions.com/research-and-publications/feed',
    category: 'mining',
  },
  luxor_tech_blog: {
    name: 'Luxor Technology Blog',
    url: 'https://luxor.tech/blog/feed',
    category: 'mining',
  },

  // =========================================================================
  // WAVE 4 — JOURNALISM / INVESTIGATIVE
  // =========================================================================
  coffeezilla_pod: {
    name: 'Coffeezilla',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCFQMnBA3CS502aghlcr0_aw',
    category: 'journalism',
  },
  molly_white: {
    name: 'Molly White Blog',
    url: 'https://www.citationneeded.news/rss/',
    category: 'journalism',
  },
} as const;

type SourceKey = keyof typeof RSS_SOURCES;

/**
 * Sources shown on the homepage feed.
 * Only high-signal sources are included — general-volume outlets,
 * fintech, macro commentary, quant, and international sources are
 * excluded so the homepage stays focused and credible.
 */
const HOMEPAGE_SOURCE_KEYS = new Set<SourceKey>([
  // Tier 1 — Major crypto news
  'coindesk', 'theblock', 'decrypt', 'cointelegraph', 'bitcoinmagazine', 'blockworks', 'defiant',

  // Tier 2 — Established crypto
  'bitcoinist', 'cryptoslate', 'newsbtc', 'cryptonews', 'cryptopotato',

  // Research & Analysis
  'messari', 'thedefireport', 'glassnode', 'delphi_digital', 'paradigm_research', 'a16z_crypto', 'theblockresearch',

  // Security
  'slowmist', 'certik_blog', 'openzeppelin_blog', 'trailofbits', 'samczsun', 'immunefi_blog',

  // Ethereum
  'etherscan',

  // Alt L1s
  'near_blog', 'cosmos_blog', 'avalanche_blog', 'sui_blog', 'aptos_blog', 'cardano_blog', 'polkadot_blog',

  // Stablecoins
  'circle_blog', 'tether_news',

  // Institutional / VC
  'galaxy_research', 'pantera_capital', 'multicoin_capital', 'placeholder_vc', 'variant_fund', 'dragonfly_research',

  // ETF / Asset Managers
  'grayscale_insights', 'bitwise_research', 'vaneck_blog', 'coinshares_research', 'ark_invest', 'twentyone_shares', 'wisdomtree_blog',

  // Mainstream — selected
  'bloomberg_crypto', 'forbes_crypto', 'guardian_tech', 'fortune_crypto', 'axios_crypto', 'barrons_crypto',

  // Geopolitical / Central Banks
  'bis_innovation', 'imf_fintech', 'ecb_digital', 'us_treasury', 'atlantic_council',

  // Developer Tools
  'alchemy_blog', 'chainlink_blog', 'infura_blog', 'thegraph_blog', 'hardhat_blog', 'foundry_blog',

  // Exchange Blogs
  'coinbase_blog', 'binance_blog',

  // Crypto Media — High Volume
  'watcherguru', 'cryptopolitan', 'coinedition',

  // DeFi Protocols
  'dydx_blog', 'synthetix_blog', 'jupiter_blog',

  // Solana Ecosystem
  'helius_blog', 'jito_blog',

  // Policy & Regulation
  'coincenter', 'cftc_press',

  // On-chain Analytics
  'nansen_blog', 'artemis_blog', 'santiment_blog',

  // Derivatives
  'deribit_insights', 'hyperliquid_blog', 'laevitas_blog',

  // Bitcoin Extended
  'bitcoinops', 'blockstream_blog',

  // Ethereum Extended
  'ef_blog', 'flashbots_blog', 'lido_blog', 'ens_blog',

  // Gaming
  'immutable_blog', 'beam_blog',

  // Journalism
  'milkroad', 'coffeezilla', 'molly_white',

  // Social
  'farcaster_blog', 'lens_blog',

  // TradFi / RWA
  'securitize_blog', 'blackrock_digital', 'franklin_templeton',

  // ETF Wave 4
  'fidelity_digital', 'hashdex_blog',

  // Asia
  'blocktempo', 'coinpost',

  // Stablecoin Extended
  'paxos_blog', 'makerdao_governance',
]);

export interface NewsArticle {
  title: string;
  link: string;
  description?: string;
  /** Pre-generated translated summaries keyed by locale code, e.g. "zh-CN", "ja" */
  translations?: Record<string, string>;
  imageUrl?: string;
  pubDate: string;
  source: string;
  sourceKey: string;
  category: string;
  timeAgo: string;
}

/**
 * Returns the best available description for an article given a locale.
 * Prefers a pre-generated translation, then falls back to the original description.
 */
export function getLocalizedDescription(
  article: Pick<NewsArticle, 'description' | 'translations'>,
  locale: string,
): string | undefined {
  return article.translations?.[locale] ?? article.description;
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
 * Decode HTML entities in a string (e.g. &#39; → ', &amp; → &)
 */
function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&'); // &amp; must be last
}

/**
 * Extract the best image URL from an RSS item.
 * Checks: media:content, media:thumbnail, enclosure, img in description
 */
function extractImageUrl(itemXml: string, rawDescription: string): string | null {
  // Priority 1: media:content (most reliable, used by major RSS feeds)
  const mediaContent = itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i);
  if (mediaContent?.[1]) return mediaContent[1];

  // Priority 2: media:thumbnail
  const mediaThumbnail = itemXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
  if (mediaThumbnail?.[1]) return mediaThumbnail[1];

  // Priority 3: enclosure with image type
  const enclosure = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image[^"']*/i);
  if (enclosure?.[1]) return enclosure[1];

  // Priority 4: enclosure without type check (many feeds omit type)
  const enclosureAny = itemXml.match(/<enclosure[^>]+url=["']([^"']+\.(?:jpg|jpeg|png|webp|gif))[^"']*["']/i);
  if (enclosureAny?.[1]) return enclosureAny[1];

  // Priority 5: img tag inside description CDATA
  if (rawDescription) {
    const imgMatch = rawDescription.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch?.[1] && !imgMatch[1].includes('feeds.feedburner') && !imgMatch[1].includes('pixel') && !imgMatch[1].includes('tracker')) {
      return imgMatch[1];
    }
  }

  return null;
}

/**
 * Safely parse a date value, falling back to current date if invalid
 */
function safeDate(value: string | number): Date {
  const date = new Date(value);
  return isNaN(date.getTime()) ? new Date() : date;
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
    
    // Extract image from multiple possible locations
    const rawDesc = descMatch?.[1] || descMatch?.[2] || '';
    const imageUrl = extractImageUrl(itemXml, rawDesc);
    
    const title = decodeHTMLEntities((titleMatch?.[1] || titleMatch?.[2] || '').trim());
    const link = (linkMatch?.[1] || linkMatch?.[2] || '').trim();
    const description = sanitizeDescription(rawDesc);
    const pubDateStr = pubDateMatch?.[1] || '';
    
    if (title && link) {
      const rawDate = pubDateStr ? new Date(pubDateStr) : new Date();
      const pubDate = isNaN(rawDate.getTime()) ? new Date() : rawDate;
      articles.push({
        title,
        link,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
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
  noDataCache?: boolean;
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
        imageurl: string;
        published_on: number;
        source: string;
        categories: string;
      }> };
      if (!response.Data) return [];
      return response.Data.slice(0, 20).map(item => ({
        title: decodeHTMLEntities(item.title),
        link: item.url,
        description: item.body?.slice(0, 200),
        imageUrl: item.imageurl || undefined,
        pubDate: safeDate(item.published_on * 1000).toISOString(),
        source: item.source || 'CryptoCompare',
        sourceKey: 'cryptocompare',
        category: item.categories?.split('|')[0]?.toLowerCase() || 'general',
        timeAgo: getTimeAgo(safeDate(item.published_on * 1000)),
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
        title: decodeHTMLEntities(`${item.project?.name}: ${item.user_title || 'Update'}`),
        link: `https://www.coingecko.com`,
        description: item.description?.slice(0, 200),
        pubDate: safeDate(item.created_at).toISOString(),
        source: 'CoinGecko',
        sourceKey: 'coingecko_updates',
        category: 'general',
        timeAgo: getTimeAgo(safeDate(item.created_at)),
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
        title: decodeHTMLEntities(item.name),
        link: item.link || 'https://coinpaprika.com',
        description: item.description?.slice(0, 200),
        pubDate: safeDate(item.date).toISOString(),
        source: 'CoinPaprika',
        sourceKey: 'coinpaprika',
        category: 'bitcoin',
        timeAgo: getTimeAgo(safeDate(item.date)),
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
        title: decodeHTMLEntities(item.title),
        link: item.url,
        description: item.content?.slice(0, 200),
        pubDate: safeDate(item.published_at).toISOString(),
        source: 'Messari',
        sourceKey: 'messari',
        category: item.tags?.[0]?.name?.toLowerCase() || 'research',
        timeAgo: getTimeAgo(safeDate(item.published_at)),
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
        pubDate: safeDate(parseInt(item.timestamp) * 1000).toISOString(),
        source: 'Alternative.me',
        sourceKey: 'fear_greed',
        category: 'sentiment',
        timeAgo: getTimeAgo(safeDate(parseInt(item.timestamp) * 1000)),
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
        pubDate: safeDate(stats.timestamp).toISOString(),
        source: 'Blockchain.com',
        sourceKey: 'blockchain_stats',
        category: 'bitcoin',
        timeAgo: getTimeAgo(safeDate(stats.timestamp)),
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

  // ═══════════════════════════════════════════════════════════════
  // REDDIT (free, no key needed — public JSON API)
  // ═══════════════════════════════════════════════════════════════
  reddit_crypto: {
    name: 'Reddit r/CryptoCurrency',
    url: 'https://www.reddit.com/r/CryptoCurrency/hot.json?limit=10',
    category: 'social',
    parser: (data: unknown) => {
      const response = data as { data?: { children?: Array<{ data: {
        title: string; url: string; selftext: string; score: number;
        num_comments: number; author: string; created_utc: number; permalink: string;
      } }> } };
      if (!response.data?.children) return [];
      return response.data.children
        .filter(c => c.data.score > 100)
        .slice(0, 8)
        .map(c => {
          const post = c.data;
          return {
            title: decodeHTMLEntities(post.title),
            link: post.url.startsWith('http') ? post.url : `https://reddit.com${post.permalink}`,
            description: post.selftext?.slice(0, 200) || `${post.score.toLocaleString()} upvotes · ${post.num_comments} comments`,
            pubDate: safeDate(post.created_utc * 1000).toISOString(),
            source: 'Reddit r/CryptoCurrency',
            sourceKey: 'reddit_crypto',
            category: 'social',
            timeAgo: getTimeAgo(new Date(post.created_utc * 1000)),
          };
        });
    },
  },

  reddit_bitcoin: {
    name: 'Reddit r/Bitcoin',
    url: 'https://www.reddit.com/r/Bitcoin/hot.json?limit=10',
    category: 'social',
    parser: (data: unknown) => {
      const response = data as { data?: { children?: Array<{ data: {
        title: string; url: string; selftext: string; score: number;
        num_comments: number; author: string; created_utc: number; permalink: string;
      } }> } };
      if (!response.data?.children) return [];
      return response.data.children
        .filter(c => c.data.score > 100)
        .slice(0, 6)
        .map(c => {
          const post = c.data;
          return {
            title: decodeHTMLEntities(post.title),
            link: post.url.startsWith('http') ? post.url : `https://reddit.com${post.permalink}`,
            description: post.selftext?.slice(0, 200) || `${post.score.toLocaleString()} upvotes · ${post.num_comments} comments`,
            pubDate: safeDate(post.created_utc * 1000).toISOString(),
            source: 'Reddit r/Bitcoin',
            sourceKey: 'reddit_bitcoin',
            category: 'bitcoin',
            timeAgo: getTimeAgo(new Date(post.created_utc * 1000)),
          };
        });
    },
  },

  reddit_defi: {
    name: 'Reddit r/defi',
    url: 'https://www.reddit.com/r/defi/hot.json?limit=8',
    category: 'social',
    parser: (data: unknown) => {
      const response = data as { data?: { children?: Array<{ data: {
        title: string; url: string; selftext: string; score: number;
        num_comments: number; created_utc: number; permalink: string;
      } }> } };
      if (!response.data?.children) return [];
      return response.data.children
        .filter(c => c.data.score > 50)
        .slice(0, 5)
        .map(c => {
          const post = c.data;
          return {
            title: decodeHTMLEntities(post.title),
            link: post.url.startsWith('http') ? post.url : `https://reddit.com${post.permalink}`,
            description: post.selftext?.slice(0, 200) || `${post.score.toLocaleString()} upvotes · ${post.num_comments} comments`,
            pubDate: safeDate(post.created_utc * 1000).toISOString(),
            source: 'Reddit r/defi',
            sourceKey: 'reddit_defi',
            category: 'defi',
            timeAgo: getTimeAgo(new Date(post.created_utc * 1000)),
          };
        });
    },
  },

  reddit_ethereum: {
    name: 'Reddit r/ethereum',
    url: 'https://www.reddit.com/r/ethereum/hot.json?limit=8',
    category: 'social',
    parser: (data: unknown) => {
      const response = data as { data?: { children?: Array<{ data: {
        title: string; url: string; selftext: string; score: number;
        num_comments: number; created_utc: number; permalink: string;
      } }> } };
      if (!response.data?.children) return [];
      return response.data.children
        .filter(c => c.data.score > 50)
        .slice(0, 5)
        .map(c => {
          const post = c.data;
          return {
            title: decodeHTMLEntities(post.title),
            link: post.url.startsWith('http') ? post.url : `https://reddit.com${post.permalink}`,
            description: post.selftext?.slice(0, 200) || `${post.score.toLocaleString()} upvotes · ${post.num_comments} comments`,
            pubDate: safeDate(post.created_utc * 1000).toISOString(),
            source: 'Reddit r/ethereum',
            sourceKey: 'reddit_ethereum',
            category: 'ethereum',
            timeAgo: getTimeAgo(new Date(post.created_utc * 1000)),
          };
        });
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // DEFILLAMA RAISES (free, no key needed)
  // Crypto fundraising rounds — high-signal institutional news
  // ═══════════════════════════════════════════════════════════════
  defillama_raises: {
    name: 'DeFiLlama Raises',
    url: 'https://api.llama.fi/raises',
    category: 'institutional',
    noDataCache: true, // 3.78MB response exceeds Next.js 2MB data cache limit
    parser: (data: unknown) => {
      const response = data as { raises?: Array<{
        name: string;
        amount: number | null;
        date: number;
        round: string;
        source: string;
        leadInvestors: string[];
        chains: string[];
        category: string;
        sector: string;
      }> };
      if (!response.raises) return [];
      const cutoff = Date.now() / 1000 - 60 * 60 * 24 * 7; // last 7 days
      return response.raises
        .filter(r => r.date > cutoff && r.source)
        .slice(0, 10)
        .map(r => {
          const amountStr = r.amount ? `$${r.amount}M` : 'undisclosed amount';
          const investors = r.leadInvestors?.length ? ` led by ${r.leadInvestors.slice(0, 2).join(', ')}` : '';
          return {
            title: `💰 ${r.name} raises ${amountStr} in ${r.round || 'funding round'}${investors}`,
            link: r.source || 'https://defillama.com/raises',
            description: `${r.category || ''} ${r.sector || ''} · Chains: ${r.chains?.join(', ') || 'N/A'}`.trim(),
            pubDate: safeDate(r.date * 1000).toISOString(),
            source: 'DeFiLlama Raises',
            sourceKey: 'defillama_raises',
            category: 'institutional',
            timeAgo: getTimeAgo(new Date(r.date * 1000)),
          };
        });
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // BINANCE ANNOUNCEMENTS (public endpoint, no key needed)
  // ═══════════════════════════════════════════════════════════════
  binance_announcements: {
    name: 'Binance Announcements',
    url: 'https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&pageNo=1&pageSize=10&catalogId=48',
    category: 'general',
    parser: (data: unknown) => {
      const response = data as { data?: { catalogs?: Array<{ articles?: Array<{
        id: number; code: string; title: string; releaseDate: number;
      }> }> } };
      const articles = response.data?.catalogs?.[0]?.articles;
      if (!articles) return [];
      return articles.slice(0, 8).map(item => ({
        title: decodeHTMLEntities(item.title),
        link: `https://www.binance.com/en/support/announcement/${item.code}`,
        description: `Binance official announcement`,
        pubDate: safeDate(item.releaseDate).toISOString(),
        source: 'Binance',
        sourceKey: 'binance_announcements',
        category: 'general',
        timeAgo: getTimeAgo(safeDate(item.releaseDate)),
      }));
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // KEY-GATED FREE TIER APIS
  // Sign up for a free key to unlock these sources:
  //
  //  ALPHA_VANTAGE_API_KEY → https://www.alphavantage.co/support/#api-key
  //  FINNHUB_API_KEY       → https://finnhub.io/register
  //  MARKETAUX_API_KEY     → https://www.marketaux.com/register
  //  GNEWS_API_KEY         → https://gnews.io/register
  //
  // Add these to your .env.local file to activate.
  // ═══════════════════════════════════════════════════════════════
  ...(process.env.ALPHA_VANTAGE_API_KEY ? {
    alpha_vantage: {
      name: 'Alpha Vantage News',
      url: `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=blockchain&language=en&sort=LATEST&limit=30&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`,
      category: 'general',
      parser: (data: unknown) => {
        const response = data as { feed?: Array<{
          title: string; url: string; time_published: string; summary: string;
          source: string; overall_sentiment_label: string; overall_sentiment_score: number;
          banner_image?: string;
        }> };
        if (!response.feed) return [];
        return response.feed.slice(0, 20).map(item => ({
          title: decodeHTMLEntities(item.title),
          link: item.url,
          description: item.summary?.slice(0, 200),
          imageUrl: item.banner_image || undefined,
          pubDate: item.time_published
            ? safeDate(`${item.time_published.slice(0, 4)}-${item.time_published.slice(4, 6)}-${item.time_published.slice(6, 8)}T${item.time_published.slice(9, 11)}:${item.time_published.slice(11, 13)}:${item.time_published.slice(13, 15)}Z`).toISOString()
            : new Date().toISOString(),
          source: item.source || 'Alpha Vantage',
          sourceKey: 'alpha_vantage',
          category: item.overall_sentiment_label?.toLowerCase().includes('bull') ? 'markets' : 'general',
          timeAgo: getTimeAgo(new Date()),
        }));
      },
    } as ApiSource,
  } : {}),

  ...(process.env.FINNHUB_API_KEY ? {
    finnhub: {
      name: 'Finnhub',
      url: `https://finnhub.io/api/v1/news?category=crypto&token=${process.env.FINNHUB_API_KEY}`,
      category: 'general',
      parser: (data: unknown) => {
        const items = data as Array<{
          headline: string; url: string; summary: string; source: string;
          datetime: number; image?: string; category: string;
        }>;
        if (!Array.isArray(items)) return [];
        return items.slice(0, 20).map(item => ({
          title: decodeHTMLEntities(item.headline),
          link: item.url,
          description: item.summary?.slice(0, 200),
          imageUrl: item.image || undefined,
          pubDate: safeDate(item.datetime * 1000).toISOString(),
          source: item.source || 'Finnhub',
          sourceKey: 'finnhub',
          category: 'general',
          timeAgo: getTimeAgo(safeDate(item.datetime * 1000)),
        }));
      },
    } as ApiSource,
  } : {}),

  ...(process.env.MARKETAUX_API_KEY ? {
    marketaux: {
      name: 'MarketAux',
      url: `https://api.marketaux.com/v1/news/all?api_token=${process.env.MARKETAUX_API_KEY}&filter_entities=true&language=en&search=crypto+bitcoin+ethereum&limit=25`,
      category: 'general',
      parser: (data: unknown) => {
        const response = data as { data?: Array<{
          uuid: string; title: string; description: string; url: string;
          image_url?: string; published_at: string; source: string; sentiment_score?: number;
        }> };
        if (!response.data) return [];
        return response.data.slice(0, 20).map(item => ({
          title: decodeHTMLEntities(item.title),
          link: item.url,
          description: item.description?.slice(0, 200),
          imageUrl: item.image_url || undefined,
          pubDate: safeDate(item.published_at).toISOString(),
          source: item.source || 'MarketAux',
          sourceKey: 'marketaux',
          category: 'general',
          timeAgo: getTimeAgo(safeDate(item.published_at)),
        }));
      },
    } as ApiSource,
  } : {}),

  ...(process.env.GNEWS_API_KEY ? {
    gnews: {
      name: 'GNews',
      url: `https://gnews.io/api/v4/search?q=cryptocurrency+OR+bitcoin+OR+ethereum&token=${process.env.GNEWS_API_KEY}&lang=en&max=10&sortby=publishedAt`,
      category: 'general',
      parser: (data: unknown) => {
        const response = data as { articles?: Array<{
          title: string; description: string; content: string; url: string;
          image?: string; publishedAt: string; source: { name: string; url: string };
        }> };
        if (!response.articles) return [];
        return response.articles.slice(0, 10).map(item => ({
          title: decodeHTMLEntities(item.title),
          link: item.url,
          description: item.description?.slice(0, 200),
          imageUrl: item.image || undefined,
          pubDate: safeDate(item.publishedAt).toISOString(),
          source: item.source?.name || 'GNews',
          sourceKey: 'gnews',
          category: 'general',
          timeAgo: getTimeAgo(safeDate(item.publishedAt)),
        }));
      },
    } as ApiSource,
  } : {}),
};

/**
 * Fetch from API source with caching
 */
async function fetchApiSource(sourceKey: string): Promise<NewsArticle[]> {
  const cacheKey = `api:${sourceKey}`;
  
  return withCache(newsCache, cacheKey, 300, async () => { // 5 min cache for APIs
    const source = API_SOURCES[sourceKey];
    if (!source) return [];
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout (reduced from 8s for faster cold starts)
      
      // Sources with noDataCache skip the Next.js data cache (responses > 2MB)
      // and rely solely on the in-memory withCache layer (5-min TTL).
      const response = await fetch(source.url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FreeCryptoNews/1.0',
        },
        signal: controller.signal,
        ...(source.noDataCache
          ? { cache: 'no-store' as RequestCache }
          : { next: { revalidate: 300 } }
        ),
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return source.parser(data);
    } catch (error) {
      // APIs are supplementary — log for observability but don't fail the response
      if (process.env.DEBUG_RSS || process.env.NODE_ENV === 'development') {
        const isAbort = error instanceof Error && error.name === 'AbortError';
        console.warn(`[API] ${source.name} failed:`, isAbort ? 'timeout' : (error instanceof Error ? error.message : error));
      }
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
  const source = RSS_SOURCES[sourceKey];
  
  // Skip disabled sources
  if ('disabled' in source && source.disabled) {
    return [];
  }
  
  const cacheKey = `feed:${sourceKey}`;
  
  return withCache(newsCache, cacheKey, 300, async () => { // 5 min cache — RSS feeds don't change faster than this
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout (reduced from 5s for faster cold starts)
      
      // force-cache ensures origin server Cache-Control headers (e.g. no-store)
      // don't break static generation; revalidate: 300 adds ISR on top.
      // Sources with noDataCache skip the Next.js data cache (responses > 2MB)
      // and rely solely on the in-memory withCache layer (5-min TTL).
      const skipDataCache = 'noDataCache' in source && source.noDataCache;
      const fetchOptions: RequestInit & { next?: { revalidate: number } } = {
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml',
          'User-Agent': 'FreeCryptoNews/1.0 (github.com/nirholas/free-crypto-news)',
        },
        signal: controller.signal,
        redirect: 'manual', // Prevent redirect loops hitting own domain
        ...(skipDataCache
          ? { cache: 'no-store' as RequestCache }
          : { cache: 'force-cache' as RequestCache, next: { revalidate: 300 } }
        ),
      };
      const response = await fetch(source.url, fetchOptions);
      
      clearTimeout(timeoutId);
      
      // Detect redirects (3xx) — log warning and bail to prevent self-referential requests
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location') || 'unknown';
        if (process.env.NODE_ENV === 'development' || process.env.DEBUG_RSS) {
          console.warn(`Redirect detected for ${source.name}: ${response.status} → ${location}`);
        }
        return [];
      }
      
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

// SOURCE_REPUTATION_SCORES is now defined in src/lib/source-tiers.ts (imported above).

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
  const isFintech = isFintechSource(article.source);
  // If it's fintech AND has no crypto keywords, apply heavy penalty
  const hasCryptoRelevance = keywordMatches >= 2;
  const fintechPenalty = isFintech ? (hasCryptoRelevance ? 0.6 : 0.25) : 1.0;
  
  // Combined score: 55% reputation, 25% recency, 20% relevance
  // Reputation matters most to keep quality sources in top positions
  const baseScore = (reputationScore * 0.55) + (recencyScore * 0.25) + (relevanceScore * 0.2);
  return baseScore * fintechPenalty;
}

/**
 * Fetch ALL sources in parallel — no sequential batching.
 *
 * Each individual source already has a 3 s timeout (AbortController in
 * fetchFeed) so firing them all at once keeps total wall-clock time at
 * ≤ 3 s instead of `ceil(N/batch) × 3 s`.
 *
 * Node.js handles hundreds of concurrent outbound HTTP requests without
 * issue; the old batching was the root cause of 20 s+ cold starts.
 */
async function fetchAllInParallel(
  sourceKeys: SourceKey[],
  fn: (key: SourceKey) => Promise<NewsArticle[]>,
): Promise<NewsArticle[]> {
  const results = await Promise.allSettled(sourceKeys.map(fn));
  const articles: NewsArticle[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      articles.push(...result.value);
    }
    // Silently ignore rejected promises — already logged in fetchFeed
  }
  return articles;
}

/**
 * Fetch from multiple sources in parallel with concurrency limit.
 * Now includes both RSS feeds and API sources for better reliability.
 *
 * Aggregate-level caching: the combined result is cached for 90 seconds
 * so that all API routes (/news, /breaking, /trending, /stats, /clickbait,
 * /search) that hit the same source set share one fetch cycle instead of
 * each triggering 160+ individual RSS requests on every call.
 */
async function fetchMultipleSources(sourceKeys: SourceKey[], includeApiSources: boolean = true): Promise<NewsArticle[]> {
  // Build a stable aggregate cache key from the source set
  const isAllSources = sourceKeys.length === Object.keys(RSS_SOURCES).length;
  const aggregateKey = `aggregate:${isAllSources ? 'all' : sourceKeys.slice().sort().join(',')}:api=${includeApiSources}`;

  return withCache(newsCache, aggregateKey, 90, async () => {
    // Overall timeout guard: return whatever results are available within 20s
    // to stay under Vercel's function timeout (25s default, 60s Pro)
    const AGGREGATION_TIMEOUT_MS = 20_000;

    const aggregationPromise = (async () => {
      // Fire ALL RSS feeds + API sources in parallel (no batching)
      const [rssArticles, apiArticles] = await Promise.all([
        fetchAllInParallel(sourceKeys, fetchFeed),
        // Only fetch API sources if not filtering by specific RSS source
        includeApiSources ? fetchAllApiSources() : Promise.resolve([]),
      ]);
      return [...rssArticles, ...apiArticles];
    })();

    // Race against a timeout — on timeout, return empty and let cache fill next time
    const timeoutPromise = new Promise<NewsArticle[]>((resolve) =>
      setTimeout(() => {
        console.warn(`[fetchMultipleSources] Aggregation exceeded ${AGGREGATION_TIMEOUT_MS}ms — returning partial results`);
        resolve([]);
      }, AGGREGATION_TIMEOUT_MS)
    );

    const allArticles = await Promise.race([aggregationPromise, timeoutPromise]);

    // Deduplicate by title similarity
    const seen = new Set<string>();
    const deduped = allArticles.filter(article => {
      // Normalize title for dedup
      const normalized = article.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });

    const now = Date.now();
    return deduped
      // Exclude future-dated articles (scheduled events, upcoming webinars, etc.)
      .filter(a => new Date(a.pubDate).getTime() <= now)
      .sort((a, b) =>
        new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
      );
  });
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
  
  // Filter out feed metadata items that aren't real news
  articles = articles.filter(isActualNews);
  
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
    if (!article?.title) return false;
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
  
  const now = new Date();
  const recentArticles = allArticles.filter(article => 
    article && article.pubDate &&
    new Date(article.pubDate) > twoHoursAgo &&
    new Date(article.pubDate) <= now // exclude future-dated articles
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
  
  const now = new Date();
  const recentArticles = allArticles.filter(article => 
    article && article.pubDate &&
    new Date(article.pubDate) > oneDayAgo &&
    new Date(article.pubDate) <= now // exclude future-dated articles
  );
  
  // Score and sort by trending score
  const scoredArticles = recentArticles.map(article => ({
    article,
    score: calculateTrendingScore(article),
  }));
  
  scoredArticles.sort((a, b) => b.score - a.score);
  
  // Ensure source diversity: stricter limits on low-quality sources
  const trendingArticles: NewsArticle[] = [];
  const sourceCounts = new Map<string, number>();
  let fintechCount = 0;
  
  for (const item of scoredArticles) {
    if (trendingArticles.length >= normalizedLimit) break;
    
    const sourceCount = sourceCounts.get(item.article.source) || 0;
    const isFintech = isFintechSource(item.article.source);
    
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
    geopolitical: ['geopolitical', 'sanctions', 'central bank', 'federal reserve', 'fed rate', 'interest rate', 'sec', 'cftc', 'policy', 'war', 'conflict', 'tariff', 'g7', 'g20', 'treasury', 'congress', 'eu regulation', 'mica'],
    security: ['hack', 'exploit', 'vulnerability', 'audit', 'rug pull', 'scam', 'phishing', 'flash loan', 'smart contract bug', 'certik', 'immunefi', 'bounty'],
    developer: ['developer', 'sdk', 'api', 'framework', 'tooling', 'solidity', 'rust', 'smart contract', 'deploy', 'hardhat', 'foundry', 'alchemy'],
  };
  
  const keywords = categoryKeywords[category.toLowerCase()] || [category.toLowerCase()];
  
  const filteredArticles = allArticles.filter(article => {
    if (!article?.title) return false;
    
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
    geopolitical: { name: 'Geopolitical', description: 'Macro-geopolitical events, central bank policy, and regulation that move crypto markets' },
    security: { name: 'Security', description: 'Smart contract audits, exploits, and blockchain security' },
    developer: { name: 'Developer', description: 'Web3 developer tools, infrastructure, and technical updates' },
    layer2: { name: 'Layer 2', description: 'Layer 2 scaling solutions and rollup ecosystems' },
    solana: { name: 'Solana', description: 'Solana ecosystem news and updates' },
    trading: { name: 'Trading', description: 'Market analysis, trading signals, and technical analysis' },
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
 * Filter out feed metadata items that aren't real news articles.
 * Removes mempool spam, raw ticker pairs, hashrate data, price alerts, and extremely short titles.
 */
function isActualNews(a: NewsArticle): boolean {
  const title = (a.title || '').trim();
  // Skip mempool/blockchain status items (₿ / ⚡ prefix)
  if (title.startsWith('₿') || title.startsWith('⚡')) return false;
  // Skip pure ticker/trading pair items (e.g., "SOL-USDT", "BTCUSD")
  if (/^[A-Z]{2,10}[-/][A-Z]{2,10}$/i.test(title)) return false;
  // Skip items that are just price/fee data (sat/vB)
  if (/^\s*₿.*sat\/vB/i.test(title)) return false;
  // Skip blockchain network status items (hashrate / EH/s)
  if (/Bitcoin Network:.*hashrate|EH\/s/i.test(title)) return false;
  // Skip live stream / price alert spam
  if (/^🔴\s*LIVE\b/i.test(title)) return false;
  // Skip titles that are only a price number (e.g., "$67,432.10")
  if (/^\$[\d,.]+$/.test(title)) return false;
  // Skip pure percentage moves (e.g., "+5.2%", "-12.3%")
  if (/^[+-]?\d+(\.\d+)?%$/.test(title)) return false;
  // Skip block height announcements (e.g., "Block 840000")
  if (/^Block\s+\d+$/i.test(title)) return false;
  // Must have at least 5 words to be a real headline
  if (title.split(/\s+/).length < 5) return false;
  return true;
}

/**
 * Optimized homepage data loader.
 * Fetches ALL sources ONCE and derives latest, breaking, and trending from the same dataset.
 * This avoids 3× redundant fetches of 130+ RSS feeds on every page render.
 */
export async function getHomepageNews(options?: {
  latestLimit?: number;
  breakingLimit?: number;
  trendingLimit?: number;
}): Promise<{
  latest: NewsResponse;
  breaking: NewsResponse;
  trending: NewsResponse;
}> {
  const latestLimit = Math.min(Math.max(1, options?.latestLimit ?? 50), 50);
  const breakingLimit = Math.min(Math.max(1, options?.breakingLimit ?? 5), 20);
  const trendingLimit = Math.min(Math.max(1, options?.trendingLimit ?? 10), 50);

  const sourceKeys = (Object.keys(RSS_SOURCES) as SourceKey[]).filter(k => HOMEPAGE_SOURCE_KEYS.has(k));
  const allArticles = await fetchMultipleSources(sourceKeys, true);

  // --- Latest (filtered to remove spam/metadata items) ---
  const latestArticles = allArticles.filter(isActualNews).slice(0, latestLimit);

  // --- Breaking (last 2 hours) ---
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const breakingArticles = allArticles
    .filter(a => a?.pubDate && new Date(a.pubDate) > twoHoursAgo)
    .filter(isActualNews)
    .slice(0, breakingLimit);

  // --- Trending (last 24 hours, scored) ---
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentArticles = allArticles
    .filter(a => a?.pubDate && new Date(a.pubDate) > oneDayAgo)
    .filter(isActualNews);

  const scoredArticles = recentArticles
    .map(article => ({ article, score: calculateTrendingScore(article) }))
    .sort((a, b) => b.score - a.score);

  const trendingArticles: NewsArticle[] = [];
  const sourceCounts = new Map<string, number>();
  let fintechCount = 0;

  for (const item of scoredArticles) {
    if (trendingArticles.length >= trendingLimit) break;
    const sourceCount = sourceCounts.get(item.article.source) || 0;
    const isFintech = isFintechSource(item.article.source);
    const maxForThisSource = isFintech ? 1 : 2;
    const exceedsFintechLimit = isFintech && fintechCount >= 1;
    if (sourceCount < maxForThisSource && !exceedsFintechLimit) {
      trendingArticles.push(item.article);
      sourceCounts.set(item.article.source, sourceCount + 1);
      if (isFintech) fintechCount++;
    }
  }

  const now = new Date().toISOString();
  return {
    latest: {
      articles: latestArticles,
      totalCount: allArticles.length,
      sources: sourceKeys.map(k => RSS_SOURCES[k].name),
      fetchedAt: now,
    } as NewsResponse,
    breaking: {
      articles: breakingArticles,
      totalCount: breakingArticles.length,
      sources: [...new Set(breakingArticles.map(a => a.source))],
      fetchedAt: now,
    } as NewsResponse,
    trending: {
      articles: trendingArticles,
      totalCount: trendingArticles.length,
      sources: [...new Set(trendingArticles.map(a => a.source))],
      fetchedAt: now,
    } as NewsResponse,
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

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
 * Crypto Vision News - RSS Feed Aggregator
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

import sanitizeHtml from "sanitize-html";
import { SOURCE_REPUTATION_SCORES, isFintechSource } from "./source-tiers";

// RSS Feed URLs for crypto news sources (350+ sources)
const RSS_SOURCES = {
  // ═══════════════════════════════════════════════════════════════
  // TIER 1: Major News Outlets
  // ═══════════════════════════════════════════════════════════════
  coindesk: {
    name: "CoinDesk",
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    category: "general",
  },
  theblock: {
    name: "The Block",
    url: "https://www.theblock.co/rss.xml",
    category: "general",
  },
  decrypt: {
    name: "Decrypt",
    url: "https://decrypt.co/feed",
    category: "general",
  },
  cointelegraph: {
    name: "CoinTelegraph",
    url: "https://cointelegraph.com/rss",
    category: "general",
  },
  bitcoinmagazine: {
    name: "Bitcoin Magazine",
    url: "https://bitcoinmagazine.com/.rss/full/",
    category: "bitcoin",
  },
  blockworks: {
    name: "Blockworks",
    url: "https://blockworks.co/feed",
    category: "general",
  },
  defiant: {
    name: "The Defiant",
    url: "https://thedefiant.io/feed",
    category: "defi",
  },

  // ═══════════════════════════════════════════════════════════════
  // TIER 2: Established News Sources
  // ═══════════════════════════════════════════════════════════════
  bitcoinist: {
    name: "Bitcoinist",
    url: "https://bitcoinist.com/feed/",
    category: "bitcoin",
  },
  cryptoslate: {
    name: "CryptoSlate",
    url: "https://cryptoslate.com/feed/",
    category: "general",
  },
  newsbtc: {
    name: "NewsBTC",
    url: "https://www.newsbtc.com/feed/",
    category: "general",
  },
  cryptonews: {
    name: "Crypto.news",
    url: "https://crypto.news/feed/",
    category: "general",
  },
  cryptopotato: {
    name: "CryptoPotato",
    url: "https://cryptopotato.com/feed/",
    category: "general",
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW: DeFi & Web3 Focused Sources
  // ═══════════════════════════════════════════════════════════════
  defirate: {
    name: "DeFi Rate",
    url: "https://defirate.com/feed/",
    category: "defi",
  },
  // ═══════════════════════════════════════════════════════════════
  // NEW: NFT & Metaverse Sources
  // ═══════════════════════════════════════════════════════════════
  nftnow: {
    name: "NFT Now",
    url: "https://nftnow.com/feed/",
    category: "nft",
  },
  nftevening: {
    name: "NFT Evening",
    url: "https://nftevening.com/feed/",
    category: "nft",
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW: Research & Analysis Sources
  // ═══════════════════════════════════════════════════════════════
  messari: {
    name: "Messari",
    url: "https://messari.io/rss",
    category: "research",
  },
  thedefireport: {
    name: "The DeFi Report",
    url: "https://thedefireport.substack.com/feed",
    category: "research",
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW: Trading & Market Analysis
  // ═══════════════════════════════════════════════════════════════
  ambcrypto: {
    name: "AMBCrypto",
    url: "https://ambcrypto.com/feed/",
    category: "trading",
  },
  beincrypto: {
    name: "BeInCrypto",
    url: "https://beincrypto.com/feed/",
    category: "trading",
  },
  u_today: {
    name: "U.Today",
    url: "https://u.today/rss",
    category: "trading",
  },
  cryptobriefing: {
    name: "Crypto Briefing",
    url: "https://cryptobriefing.com/feed/",
    category: "research",
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW: Mining & Infrastructure
  // ═══════════════════════════════════════════════════════════════
  bitcoinmining: {
    name: "Bitcoin Mining News",
    url: "https://bitcoinmagazine.com/tags/mining/.rss/full/",
    category: "mining",
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW: Ethereum-Focused Sources
  // ═══════════════════════════════════════════════════════════════
  etherscan: {
    name: "Etherscan Blog",
    url: "https://etherscan.io/blog?rss",
    category: "ethereum",
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW: Layer 2 & Scaling Solutions
  // ═══════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════
  // NEW: Regulatory & Institutional
  // ═══════════════════════════════════════════════════════════════
  coinbase_blog: {
    name: "Coinbase Blog",
    url: "https://www.coinbase.com/blog/rss.xml",
    category: "institutional",
  },
  binance_blog: {
    name: "Binance Blog",
    url: "https://www.binance.com/en/blog/rss.xml",
    category: "institutional",
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW: Asia-Pacific English Sources
  // ═══════════════════════════════════════════════════════════════
  forkast: {
    name: "Forkast News",
    url: "https://forkast.news/feed/",
    category: "asia",
  },
  coingape: {
    name: "CoinGape",
    url: "https://coingape.com/feed/",
    category: "general",
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW: Bitcoin-Specific Sources
  // ═══════════════════════════════════════════════════════════════
  btctimes: {
    name: "BTC Times",
    url: "https://www.btctimes.com/feed/",
    category: "bitcoin",
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW: Security & Hacks
  // ═══════════════════════════════════════════════════════════════
  slowmist: {
    name: "SlowMist Blog",
    url: "https://slowmist.medium.com/feed",
    category: "security",
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW: Solana Ecosystem
  // ═══════════════════════════════════════════════════════════════
  solana_news: {
    name: "Solana News",
    url: "https://solana.com/news/rss.xml",
    category: "solana",
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW: Additional General News Sources
  // ═══════════════════════════════════════════════════════════════
  dailyhodl: {
    name: "The Daily Hodl",
    url: "https://dailyhodl.com/feed/",
    category: "general",
  },
  coinjournal: {
    name: "CoinJournal",
    url: "https://coinjournal.net/feed/",
    category: "general",
  },
  cryptoglobe: {
    name: "CryptoGlobe",
    url: "https://www.cryptoglobe.com/latest/feed/",
    category: "general",
  },
  zycrypto: {
    name: "ZyCrypto",
    url: "https://zycrypto.com/feed/",
    category: "general",
  },
  cryptodaily: {
    name: "Crypto Daily",
    url: "https://cryptodaily.co.uk/feed",
    category: "general",
  },
  blockonomi: {
    name: "Blockonomi",
    url: "https://blockonomi.com/feed/",
    category: "general",
  },
  usethebitcoin: {
    name: "UseTheBitcoin",
    url: "https://usethebitcoin.com/feed/",
    category: "general",
  },
  nulltx: {
    name: "NullTX",
    url: "https://nulltx.com/feed/",
    category: "general",
  },
  coinspeaker: {
    name: "Coinspeaker",
    url: "https://www.coinspeaker.com/feed/",
    category: "general",
  },
  cryptoninjas: {
    name: "CryptoNinjas",
    url: "https://www.cryptoninjas.net/feed/",
    category: "general",
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW: Additional DeFi Sources
  // ═══════════════════════════════════════════════════════════════
  defipulse: {
    name: "DeFi Pulse Blog",
    url: "https://defipulse.com/blog/feed/",
    category: "defi",
  },
  defillama_news: {
    name: "DefiLlama News",
    url: "https://defillama.com/feed",
    category: "defi",
  },
  uniswap_blog: {
    name: "Uniswap Blog",
    url: "https://uniswap.org/blog/feed.xml",
    category: "defi",
  },
  aave_blog: {
    name: "Aave Blog",
    url: "https://aave.mirror.xyz/feed/atom",
    category: "defi",
  },
  compound_blog: {
    name: "Compound Blog",
    url: "https://medium.com/feed/compound-finance",
    category: "defi",
  },
  makerdao_blog: {
    name: "MakerDAO Blog",
    url: "https://blog.makerdao.com/feed/",
    category: "defi",
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW: Layer 2 & Scaling
  // ═══════════════════════════════════════════════════════════════
  optimism_blog: {
    name: "Optimism Blog",
    url: "https://optimism.mirror.xyz/feed/atom",
    category: "layer2",
  },
  arbitrum_blog: {
    name: "Arbitrum Blog",
    url: "https://arbitrum.io/blog/rss.xml",
    category: "layer2",
  },
  starknet_blog: {
    name: "StarkNet Blog",
    url: "https://starkware.medium.com/feed",
    category: "layer2",
  },
  zksync_blog: {
    name: "zkSync Blog",
    url: "https://zksync.mirror.xyz/feed/atom",
    category: "layer2",
  },
  base_blog: {
    name: "Base Blog",
    url: "https://base.mirror.xyz/feed/atom",
    category: "layer2",
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW: Research & Analysis Deep Dive
  // ═══════════════════════════════════════════════════════════════
  glassnode: {
    name: "Glassnode Insights",
    url: "https://insights.glassnode.com/rss/",
    category: "research",
  },
  delphi_digital: {
    name: "Delphi Digital",
    url: "https://members.delphidigital.io/feed",
    category: "research",
  },
  theblockresearch: {
    name: "The Block Research",
    url: "https://www.theblock.co/research/feed",
    category: "research",
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW: Developer & Tech Sources
  // ═══════════════════════════════════════════════════════════════
  chainlink_blog: {
    name: "Chainlink Blog",
    url: "https://blog.chain.link/feed/",
    category: "developer",
  },
  infura_blog: {
    name: "Infura Blog",
    url: "https://blog.infura.io/feed/",
    category: "developer",
  },
  thegraph_blog: {
    name: "The Graph Blog",
    url: "https://thegraph.com/blog/feed",
    category: "developer",
  },
  foundry_blog: {
    name: "Foundry Blog",
    url: "https://book.getfoundry.sh/feed.xml",
    category: "developer",
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW: Security & Auditing
  // ═══════════════════════════════════════════════════════════════
  certik_blog: {
    name: "CertiK Blog",
    url: "https://www.certik.com/resources/blog/rss.xml",
    category: "security",
  },
  openzeppelin_blog: {
    name: "OpenZeppelin Blog",
    url: "https://blog.openzeppelin.com/feed/",
    category: "security",
  },
  trailofbits: {
    name: "Trail of Bits Blog",
    url: "https://blog.trailofbits.com/feed/",
    category: "security",
  },
  samczsun: {
    name: "samczsun Blog",
    url: "https://samczsun.com/rss/",
    category: "security",
  },
  immunefi_blog: {
    name: "Immunefi Blog",
    url: "https://immunefi.medium.com/feed",
    category: "security",
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW: Trading & Market Analysis Extended
  // ═══════════════════════════════════════════════════════════════
  fxstreet_crypto: {
    name: "FXStreet Crypto",
    url: "https://www.fxstreet.com/cryptocurrencies/news/feed",
    category: "trading",
  },
  tradingview_crypto: {
    name: "TradingView Crypto Ideas",
    url: "https://www.tradingview.com/feed/?sort=recent&stream=crypto",
    category: "trading",
  },
  cryptoquant_blog: {
    name: "CryptoQuant Blog",
    url: "https://cryptoquant.com/blog/feed",
    category: "trading",
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW: Mining & Energy
  // ═══════════════════════════════════════════════════════════════
  hashrateindex: {
    name: "Hashrate Index",
    url: "https://hashrateindex.com/blog/feed/",
    category: "mining",
  },
  compassmining_blog: {
    name: "Compass Mining Blog",
    url: "https://compassmining.io/education/feed/",
    category: "mining",
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW: Mainstream Finance Crypto Coverage
  // ═══════════════════════════════════════════════════════════════
  bloomberg_crypto: {
    name: "Bloomberg Crypto",
    url: "https://www.bloomberg.com/crypto/feed",
    category: "mainstream",
  },
  entrepreneur_crypto: {
    name: "Entrepreneur",
    url: "https://www.entrepreneur.com/topic/cryptocurrency/feed",
    category: "mainstream",
  },
  cnbc_crypto: {
    name: "CNBC Crypto",
    url: "https://www.cnbc.com/id/100727362/device/rss/rss.html",
    category: "mainstream",
  },
  yahoo_crypto: {
    name: "Yahoo Finance Crypto",
    url: "https://finance.yahoo.com/rss/cryptocurrency",
    category: "mainstream",
  },
  wsj_crypto: {
    name: "Wall Street Journal Crypto",
    url: "https://feeds.a.dj.com/rss/RSSWSJD.xml",
    category: "mainstream",
  },
  ft_crypto: {
    name: "Financial Times Crypto",
    url: "https://www.ft.com/cryptocurrencies?format=rss",
    category: "mainstream",
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW: NFT & Gaming Extended
  // ═══════════════════════════════════════════════════════════════
  nftplazas: {
    name: "NFT Plazas",
    url: "https://nftplazas.com/feed/",
    category: "nft",
  },
  playtoearn: {
    name: "PlayToEarn",
    url: "https://playtoearn.net/feed/",
    category: "gaming",
  },
  dappradar_blog: {
    name: "DappRadar Blog",
    url: "https://dappradar.com/blog/feed",
    category: "nft",
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW: Bitcoin Ecosystem Extended
  // ═══════════════════════════════════════════════════════════════
  stackernews: {
    name: "Stacker News",
    url: "https://stacker.news/rss",
    category: "bitcoin",
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW: Alternative L1 Ecosystems
  // ═══════════════════════════════════════════════════════════════
  near_blog: {
    name: "NEAR Protocol Blog",
    url: "https://near.org/blog/feed/",
    category: "altl1",
  },
  avalanche_blog: {
    name: "Avalanche Blog",
    url: "https://medium.com/feed/avalancheavax",
    category: "altl1",
  },
  sui_blog: {
    name: "Sui Blog",
    url: "https://blog.sui.io/feed/",
    category: "altl1",
  },
  aptos_blog: {
    name: "Aptos Blog",
    url: "https://medium.com/feed/aptoslabs",
    category: "altl1",
  },
  cardano_blog: {
    name: "Cardano Blog",
    url: "https://iohk.io/en/blog/posts/feed.rss",
    category: "altl1",
  },
  polkadot_blog: {
    name: "Polkadot Blog",
    url: "https://polkadot.network/blog/feed/",
    category: "altl1",
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW: Stablecoin & CBDC News
  // ═══════════════════════════════════════════════════════════════
  tether_news: {
    name: "Tether News",
    url: "https://tether.to/en/news/feed/",
    category: "stablecoin",
  },

  // ═══════════════════════════════════════════════════════════════
  // INSTITUTIONAL RESEARCH & VC INSIGHTS
  // ═══════════════════════════════════════════════════════════════
  galaxy_research: {
    name: "Galaxy Digital Research",
    url: "https://www.galaxy.com/insights/feed/",
    category: "institutional",
  },
  pantera_capital: {
    name: "Pantera Capital",
    url: "https://panteracapital.com/feed/",
    category: "institutional",
  },
  placeholder_vc: {
    name: "Placeholder VC",
    url: "https://www.placeholder.vc/blog?format=rss",
    category: "institutional",
  },
  variant_fund: {
    name: "Variant Fund",
    url: "https://variant.fund/writing/rss",
    category: "institutional",
  },
  dragonfly_research: {
    name: "Dragonfly Research",
    url: "https://medium.com/feed/dragonfly-research",
    category: "institutional",
  },

  // ═══════════════════════════════════════════════════════════════
  // ASSET MANAGERS & ETF ISSUERS
  // ═══════════════════════════════════════════════════════════════
  grayscale_insights: {
    name: "Grayscale Insights",
    url: "https://grayscale.com/insights/feed/",
    category: "etf",
  },
  bitwise_research: {
    name: "Bitwise Research",
    url: "https://bitwiseinvestments.com/feed/",
    category: "etf",
  },
  coinshares_research: {
    name: "CoinShares Research",
    url: "https://blog.coinshares.com/feed",
    category: "etf",
  },
  ark_invest: {
    name: "ARK Invest",
    url: "https://ark-invest.com/articles/feed/",
    category: "etf",
  },
  twentyone_shares: {
    name: "21Shares Research",
    url: "https://21shares.com/research/feed/",
    category: "etf",
  },
  wisdomtree_blog: {
    name: "WisdomTree Blog",
    url: "https://www.wisdomtree.com/blog/feed",
    category: "etf",
  },

  // ═══════════════════════════════════════════════════════════════
  // DERIVATIVES & OPTIONS MARKET
  // ═══════════════════════════════════════════════════════════════
  deribit_insights: {
    name: "Deribit Insights",
    url: "https://insights.deribit.com/feed/",
    category: "derivatives",
  },

  // ═══════════════════════════════════════════════════════════════
  // ON-CHAIN ANALYTICS & DATA PROVIDERS
  // ═══════════════════════════════════════════════════════════════
  intotheblock: {
    name: "IntoTheBlock",
    url: "https://medium.com/feed/intotheblock",
    category: "onchain",
  },
  coin_metrics: {
    name: "Coin Metrics",
    url: "https://coinmetrics.substack.com/feed",
    category: "onchain",
  },
  woobull: {
    name: "Willy Woo (Woobull)",
    url: "https://woobull.com/feed/",
    category: "onchain",
  },

  // ═══════════════════════════════════════════════════════════════
  // FINTECH & PAYMENTS NEWS
  // ═══════════════════════════════════════════════════════════════
  finextra: {
    name: "Finextra",
    url: "https://www.finextra.com/rss/headlines.aspx",
    category: "fintech",
  },
  pymnts_crypto: {
    name: "PYMNTS Crypto",
    url: "https://www.pymnts.com/cryptocurrency/feed/",
    category: "fintech",
  },
  // ═══════════════════════════════════════════════════════════════
  // MACRO ANALYSIS & INDEPENDENT RESEARCHERS
  // ═══════════════════════════════════════════════════════════════
  lyn_alden: {
    name: "Lyn Alden",
    url: "https://www.lynalden.com/feed/",
    category: "macro",
  },
  alhambra_partners: {
    name: "Alhambra Partners",
    url: "https://www.alhambrapartners.com/feed/",
    category: "macro",
  },
  // ═══════════════════════════════════════════════════════════════
  // QUANT & SYSTEMATIC TRADING RESEARCH
  // ═══════════════════════════════════════════════════════════════
  aqr_insights: {
    name: "AQR Insights",
    url: "https://www.aqr.com/Insights/feed",
    category: "quant",
  },
  alpha_architect: {
    name: "Alpha Architect",
    url: "https://alphaarchitect.com/feed/",
    category: "quant",
  },
  // ═══════════════════════════════════════════════════════════════
  // ADDITIONAL CRYPTO JOURNALISM
  // ═══════════════════════════════════════════════════════════════
  unchained_crypto: {
    name: "Unchained Crypto",
    url: "https://unchainedcrypto.com/feed/",
    category: "journalism",
  },
  protos: {
    name: "Protos",
    url: "https://protos.com/feed/",
    category: "journalism",
  },
  daily_gwei: {
    name: "The Daily Gwei",
    url: "https://thedailygwei.substack.com/feed",
    category: "ethereum",
  },
  wu_blockchain: {
    name: "Wu Blockchain",
    url: "https://wublock.substack.com/feed",
    category: "asia",
  },

  // ═══════════════════════════════════════════════════════════════
  // TRADITIONAL FINANCE BLOGS
  // ═══════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════
  // ADDITIONAL CRYPTO NEWS (from HQ DeFi Dashboard)
  // ═══════════════════════════════════════════════════════════════
  dailycoin: {
    name: "DailyCoin",
    url: "https://dailycoin.com/feed/",
    category: "general",
  },
  coinpedia: {
    name: "CoinPedia",
    url: "https://coinpedia.org/feed/",
    category: "general",
  },
  thenewscrypto: {
    name: "TheNewsCrypto",
    url: "https://thenewscrypto.com/feed/",
    category: "general",
  },
  cryptonewsflash: {
    name: "Crypto-News Flash",
    url: "https://www.crypto-news-flash.com/feed/",
    category: "general",
  },
  finance_magnates_crypto: {
    name: "Finance Magnates Crypto",
    url: "https://www.financemagnates.com/cryptocurrency/feed/",
    category: "general",
  },
  insidebitcoins: {
    name: "InsideBitcoins",
    url: "https://insidebitcoins.com/feed",
    category: "general",
  },
  thecryptobasic: {
    name: "TheCryptoBasic",
    url: "https://thecryptobasic.com/feed/",
    category: "general",
  },
  bitcoincom: {
    name: "Bitcoin.com News",
    url: "https://news.bitcoin.com/feed/",
    category: "bitcoin",
  },
  coincentral_news: {
    name: "CoinCentral",
    url: "https://coincentral.com/news/feed/",
    category: "general",
  },
  cryptonewsz: {
    name: "CryptoNewsZ",
    url: "https://www.cryptonewsz.com/feed/",
    category: "general",
  },

  // ═══════════════════════════════════════════════════════════════
  // MAINSTREAM FINANCE & BUSINESS NEWS
  // These major outlets heavily cover crypto, macro, and policy
  // decisions that directly move crypto markets.
  // ═══════════════════════════════════════════════════════════════
  wsj_business: {
    name: "Wall Street Journal",
    url: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",
    category: "mainstream",
  },
  nyt_business: {
    name: "New York Times Business",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",
    category: "mainstream",
  },
  economist: {
    name: "The Economist",
    url: "https://www.economist.com/sections/economics/rss.xml",
    category: "mainstream",
  },
  marketwatch: {
    name: "MarketWatch",
    url: "https://feeds.marketwatch.com/marketwatch/topstories/",
    category: "mainstream",
  },
  seekingalpha: {
    name: "Seeking Alpha",
    url: "https://seekingalpha.com/market_currents.xml",
    category: "mainstream",
  },
  nikkei_asia: {
    name: "Nikkei Asia",
    url: "https://asia.nikkei.com/rss/feed/nar",
    category: "mainstream",
  },
  economic_times_india: {
    name: "Economic Times India Markets",
    url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
    category: "mainstream",
  },

  // ═══════════════════════════════════════════════════════════════
  // MACRO & GEOPOLITICAL (moves crypto markets)
  // Central bank decisions, regulation, sanctions, and geopolitical
  // events are top market movers for crypto. These wire services and
  // policy sources provide the earliest signals.
  // ═══════════════════════════════════════════════════════════════
  bbc_world: {
    name: "BBC World",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    category: "geopolitical",
  },
  federal_reserve: {
    name: "Federal Reserve",
    url: "https://www.federalreserve.gov/feeds/press_all.xml",
    category: "geopolitical",
  },
  sec_press: {
    name: "SEC Press Releases",
    url: "https://www.sec.gov/news/pressreleases.rss",
    category: "geopolitical",
  },
  dw_news: {
    name: "DW News",
    url: "https://rss.dw.com/xml/rss-en-all",
    category: "geopolitical",
  },
  cbc_news: {
    name: "CBC News",
    url: "https://www.cbc.ca/cmlink/1.1244475",
    category: "geopolitical",
  },
  al_jazeera: {
    name: "Al Jazeera",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    category: "geopolitical",
  },

  // =========================================================================
  // ADDITIONAL SOURCES — Scaling to 200+
  // =========================================================================

  // Exchange Blogs
  kraken_blog: {
    name: "Kraken Blog",
    url: "https://blog.kraken.com/feed/",
    category: "institutional",
  },
  okx_blog: {
    name: "OKX Blog",
    url: "https://www.okx.com/academy/en/feed",
    category: "institutional",
  },
  bybit_blog: {
    name: "Bybit Blog",
    url: "https://blog.bybit.com/feed/",
    category: "institutional",
  },
  bitfinex_blog: {
    name: "Bitfinex Blog",
    url: "https://blog.bitfinex.com/feed/",
    category: "institutional",
  },
  gemini_blog: {
    name: "Gemini Blog",
    url: "https://www.gemini.com/blog/feed",
    category: "institutional",
  },

  // DeFi Protocols
  lido_blog: {
    name: "Lido Blog",
    url: "https://blog.lido.fi/rss/",
    category: "defi",
  },
  curve_blog: {
    name: "Curve Blog",
    url: "https://news.curve.fi/rss/",
    category: "defi",
  },
  eigenlayer_blog: {
    name: "EigenLayer Blog",
    url: "https://www.blog.eigenlayer.xyz/rss/",
    category: "defi",
  },
  pendle_blog: {
    name: "Pendle Blog",
    url: "https://medium.com/feed/pendle",
    category: "defi",
  },
  ethena_blog: {
    name: "Ethena Blog",
    url: "https://mirror.xyz/ethena/feed/atom",
    category: "defi",
  },

  // Layer 2 & Rollups
  scroll_blog: {
    name: "Scroll Blog",
    url: "https://scroll.io/blog/feed",
    category: "layer2",
  },
  linea_blog: {
    name: "Linea Blog",
    url: "https://linea.mirror.xyz/feed/atom",
    category: "layer2",
  },
  blast_blog: {
    name: "Blast Blog",
    url: "https://mirror.xyz/blastofficial.eth/feed/atom",
    category: "layer2",
  },

  // Alt L1 Ecosystem Extended
  sei_blog: {
    name: "Sei Blog",
    url: "https://blog.sei.io/rss/",
    category: "altl1",
  },
  injective_blog: {
    name: "Injective Blog",
    url: "https://blog.injective.com/feed/",
    category: "altl1",
  },
  celestia_blog: {
    name: "Celestia Blog",
    url: "https://blog.celestia.org/rss/",
    category: "altl1",
  },

  // Bitcoin Ecosystem Extended
  nostr_blog: {
    name: "Nostr Protocol",
    url: "https://nostr.com/feed.xml",
    category: "bitcoin",
  },

  // Privacy & ZK
  zcash_blog: {
    name: "Zcash Blog",
    url: "https://electriccoin.co/blog/feed/",
    category: "security",
  },
  aztec_blog: {
    name: "Aztec Blog",
    url: "https://medium.com/feed/aztec-protocol",
    category: "layer2",
  },

  // RWA (Real World Assets)
  centrifuge_blog: {
    name: "Centrifuge Blog",
    url: "https://medium.com/feed/centrifuge",
    category: "defi",
  },
  ondo_finance: {
    name: "Ondo Finance Blog",
    url: "https://blog.ondo.finance/rss/",
    category: "defi",
  },

  // AI x Crypto
  fetch_ai_blog: {
    name: "Fetch.ai Blog",
    url: "https://fetch.ai/blog/feed",
    category: "altl1",
  },
  render_blog: {
    name: "Render Network Blog",
    url: "https://medium.com/feed/render-token",
    category: "altl1",
  },

  // Oracles & Infrastructure
  pyth_blog: {
    name: "Pyth Network Blog",
    url: "https://pyth.network/blog/feed",
    category: "developer",
  },
  api3_blog: {
    name: "API3 Blog",
    url: "https://medium.com/feed/api3",
    category: "developer",
  },

  // Governance & DAOs
  snapshot_blog: {
    name: "Snapshot Blog",
    url: "https://snapshot.mirror.xyz/feed/atom",
    category: "defi",
  },
  tally_blog: {
    name: "Tally Blog",
    url: "https://blog.tally.xyz/feed",
    category: "defi",
  },

  // Security Extended
  chainalysis_blog: {
    name: "Chainalysis Blog",
    url: "https://www.chainalysis.com/blog/feed/",
    category: "security",
  },
  elliptic_blog: {
    name: "Elliptic Blog",
    url: "https://www.elliptic.co/blog/rss.xml",
    category: "security",
  },
  // Payments & Stablecoins Extended
  stripe_crypto: {
    name: "Stripe Blog (Crypto)",
    url: "https://stripe.com/blog/feed.rss",
    category: "fintech",
  },
  paypal_newsroom: {
    name: "PayPal Newsroom",
    url: "https://newsroom.paypal-corp.com/feed",
    category: "fintech",
  },

  // Derivatives Extended
  // Podcasts (show notes via RSS)
  unchained_podcast: {
    name: "Unchained Podcast",
    url: "https://feeds.simplecast.com/JGE3yC0V",
    category: "journalism",
    noDataCache: true, // 11.9MB feed exceeds Next.js 2MB data cache limit
  },
  // =========================================================================
  // CRYPTO MEDIA — High-Volume News Sources
  // =========================================================================
  watcherguru: {
    name: "Watcher Guru",
    url: "https://watcher.guru/news/feed",
    category: "general",
  },
  cryptopolitan: {
    name: "Cryptopolitan",
    url: "https://www.cryptopolitan.com/feed/",
    category: "general",
  },
  coinedition: {
    name: "CoinEdition",
    url: "https://coinedition.com/feed/",
    category: "general",
  },
  bitcoinworld: {
    name: "BitcoinWorld",
    url: "https://bitcoinworld.co.in/feed/",
    category: "general",
  },
  // =========================================================================
  // EXCHANGE & PLATFORM BLOGS
  // =========================================================================
  coinmarketcap_blog: {
    name: "CoinMarketCap Blog",
    url: "https://blog.coinmarketcap.com/feed/",
    category: "institutional",
  },
  coingecko_blog: {
    name: "CoinGecko Blog",
    url: "https://blog.coingecko.com/feed/",
    category: "institutional",
  },
  kucoin_blog: {
    name: "KuCoin Blog",
    url: "https://www.kucoin.com/blog/rss.xml",
    category: "institutional",
  },
  cryptocom_blog: {
    name: "Crypto.com Blog",
    url: "https://crypto.com/company-news/feed",
    category: "institutional",
  },
  bitget_blog: {
    name: "Bitget Blog",
    url: "https://www.bitget.com/blog/feed",
    category: "institutional",
  },

  // =========================================================================
  // DEFI PROTOCOLS — Major DEX/Lending/Yield
  // =========================================================================
  synthetix_blog: {
    name: "Synthetix Blog",
    url: "https://blog.synthetix.io/rss/",
    category: "defi",
  },
  oneinch_blog: {
    name: "1inch Blog",
    url: "https://blog.1inch.io/feed",
    category: "defi",
  },
  yearn_blog: {
    name: "Yearn Finance Blog",
    url: "https://blog.yearn.fi/feed",
    category: "defi",
  },
  gmx_blog: {
    name: "GMX Blog",
    url: "https://medium.com/feed/@gmx.io",
    category: "defi",
  },
  jupiter_blog: {
    name: "Jupiter Blog",
    url: "https://station.jup.ag/blog/rss.xml",
    category: "defi",
  },
  morpho_blog: {
    name: "Morpho Blog",
    url: "https://medium.com/feed/morpho-labs",
    category: "defi",
  },

  // =========================================================================
  // CROSS-CHAIN & INTEROPERABILITY
  // =========================================================================
  layerzero_blog: {
    name: "LayerZero Blog",
    url: "https://medium.com/feed/layerzero-official",
    category: "developer",
  },

  // =========================================================================
  // TECH / MAINSTREAM — Crypto Coverage
  // =========================================================================
  techcrunch_crypto: {
    name: "TechCrunch Crypto",
    url: "https://techcrunch.com/category/cryptocurrency/feed/",
    category: "mainstream",
  },
  // =========================================================================
  // POLICY & REGULATION
  // =========================================================================
  coincenter: {
    name: "Coin Center",
    url: "https://www.coincenter.org/feed/",
    category: "geopolitical",
  },
  cftc_press: {
    name: "CFTC Press Releases",
    url: "https://www.cftc.gov/PressRoom/PressReleases/RSS",
    category: "geopolitical",
  },
  // =========================================================================
  // SOLANA ECOSYSTEM
  // =========================================================================
  phantom_blog: {
    name: "Phantom Blog",
    url: "https://phantom.app/blog/feed",
    category: "solana",
  },
  marinade_blog: {
    name: "Marinade Finance Blog",
    url: "https://medium.com/feed/marinade-finance",
    category: "solana",
  },
  jito_blog: {
    name: "Jito Blog",
    url: "https://www.jito.network/blog/rss.xml",
    category: "solana",
  },

  // =========================================================================
  // AI x CRYPTO — Emerging Narrative
  // =========================================================================
  bittensor_blog: {
    name: "Bittensor Blog",
    url: "https://blog.bittensor.com/feed",
    category: "altl1",
  },
  // =========================================================================
  // DATA ANALYTICS PLATFORMS
  // =========================================================================
  dune_blog: {
    name: "Dune Analytics Blog",
    url: "https://dune.com/blog/feed",
    category: "onchain",
  },
  artemis_blog: {
    name: "Artemis Blog",
    url: "https://www.artemis.xyz/blog/feed",
    category: "onchain",
  },

  // =========================================================================
  // GENERAL CRYPTO NEWS — Extended Coverage
  // =========================================================================
  cryptoslam: {
    name: "CryptoSlam Blog",
    url: "https://www.cryptoslam.io/blog/feed/",
    category: "general",
  },
  thecoinrepublic: {
    name: "The Coin Republic",
    url: "https://www.thecoinrepublic.com/feed/",
    category: "general",
  },
  cryptotvplus: {
    name: "CryptoTvPlus",
    url: "https://cryptotvplus.com/feed/",
    category: "general",
  },
  blocktempo: {
    name: "BlockTempo",
    url: "https://www.blocktempo.com/feed/",
    category: "general",
  },

  // =========================================================================
  // DEFI PROTOCOLS — Extended
  // =========================================================================
  balancer_blog: {
    name: "Balancer Blog",
    url: "https://medium.com/feed/balancer-protocol",
    category: "defi",
  },
  radiant_blog: {
    name: "Radiant Capital Blog",
    url: "https://medium.com/feed/@radiantcapital",
    category: "defi",
  },
  instadapp_blog: {
    name: "Instadapp Blog",
    url: "https://blog.instadapp.io/rss/",
    category: "defi",
  },
  sushi_blog: {
    name: "SushiSwap Blog",
    url: "https://medium.com/feed/sushiswap-org",
    category: "defi",
  },

  // =========================================================================
  // GAMEFI & METAVERSE
  // =========================================================================
  gamingguild_blog: {
    name: "Yield Guild Games Blog",
    url: "https://medium.com/feed/yield-guild-games",
    category: "gaming",
  },
  ronin_blog: {
    name: "Ronin Blog",
    url: "https://roninchain.com/blog/feed",
    category: "gaming",
  },
  gala_blog: {
    name: "Gala Games Blog",
    url: "https://blog.gala.games/feed",
    category: "gaming",
  },

  // =========================================================================
  // PRIVACY & ZERO KNOWLEDGE — Extended
  // =========================================================================
  risc_zero_blog: {
    name: "RISC Zero Blog",
    url: "https://www.risczero.com/blog/feed",
    category: "security",
  },
  espresso_blog: {
    name: "Espresso Systems Blog",
    url: "https://medium.com/feed/espresso-systems",
    category: "layer2",
  },
  // =========================================================================
  // SOLANA ECOSYSTEM — Extended
  // =========================================================================
  orca_blog: {
    name: "Orca Blog",
    url: "https://medium.com/feed/orca-so",
    category: "solana",
  },
  raydium_blog: {
    name: "Raydium Blog",
    url: "https://medium.com/feed/@raydium",
    category: "solana",
  },
  solflare_blog: {
    name: "Solflare Blog",
    url: "https://medium.com/feed/solflare",
    category: "solana",
  },

  // =========================================================================
  // BITCOIN ECOSYSTEM — Extended
  // =========================================================================
  bitcoinops: {
    name: "Bitcoin Optech",
    url: "https://bitcoinops.org/feed.xml",
    category: "bitcoin",
  },
  casa_blog: {
    name: "Casa Blog",
    url: "https://blog.keys.casa/rss/",
    category: "bitcoin",
  },

  // =========================================================================
  // REGULATION & COMPLIANCE
  // =========================================================================
  fireblocks_blog: {
    name: "Fireblocks Blog",
    url: "https://www.fireblocks.com/blog/feed/",
    category: "institutional",
  },

  // =========================================================================
  // VENTURE & INSTITUTIONAL — Extended
  // =========================================================================
  polychain_blog: {
    name: "Polychain Capital Blog",
    url: "https://medium.com/feed/@polychain",
    category: "institutional",
  },
  electric_capital: {
    name: "Electric Capital Blog",
    url: "https://medium.com/feed/electric-capital",
    category: "institutional",
  },
  framework_blog: {
    name: "Framework Ventures Blog",
    url: "https://medium.com/feed/framework-ventures",
    category: "institutional",
  },

  // =========================================================================
  // INFRASTRUCTURE & WALLETS
  // =========================================================================
  trezor_blog: {
    name: "Trezor Blog",
    url: "https://blog.trezor.io/feed",
    category: "security",
  },
  safe_blog: {
    name: "Safe (Gnosis Safe) Blog",
    url: "https://safe.global/blog/feed",
    category: "security",
  },
  biconomy_blog: {
    name: "Biconomy Blog",
    url: "https://medium.com/feed/biconomy",
    category: "developer",
  },

  // =========================================================================
  // RESTAKING & LIQUID STAKING
  // =========================================================================
  rocketpool_blog: {
    name: "Rocket Pool Blog",
    url: "https://medium.com/feed/rocket-pool",
    category: "ethereum",
  },
  ssv_network_blog: {
    name: "SSV Network Blog",
    url: "https://medium.com/feed/ssv-network",
    category: "ethereum",
  },
  etherfi_blog: {
    name: "ether.fi Blog",
    url: "https://medium.com/feed/@ether.fi",
    category: "defi",
  },
  kelpdao_blog: {
    name: "Kelp DAO Blog",
    url: "https://medium.com/feed/@kelp_dao",
    category: "defi",
  },

  // =========================================================================
  // BRIDGES & MEV
  // =========================================================================
  across_blog: {
    name: "Across Protocol Blog",
    url: "https://medium.com/feed/across-protocol",
    category: "defi",
  },
  // =========================================================================
  // COSMOS ECOSYSTEM
  // =========================================================================
  osmosis_blog: {
    name: "Osmosis Blog",
    url: "https://medium.com/feed/osmosis",
    category: "altl1",
  },
  stride_blog: {
    name: "Stride Blog",
    url: "https://medium.com/feed/@stride_zone",
    category: "altl1",
  },

  // =========================================================================
  // DERIVATIVES & PERPS — Expanding Coverage
  // =========================================================================
  hyperliquid_blog: {
    name: "Hyperliquid Blog",
    url: "https://medium.com/feed/@hyperliquid",
    category: "derivatives",
  },
  vertex_blog: {
    name: "Vertex Protocol Blog",
    url: "https://medium.com/feed/vertex-protocol",
    category: "derivatives",
  },
  aevo_blog: {
    name: "Aevo Blog",
    url: "https://medium.com/feed/@aevo-exchange",
    category: "derivatives",
  },
  kwenta_blog: {
    name: "Kwenta Blog",
    url: "https://mirror.xyz/kwenta.eth/feed/atom",
    category: "derivatives",
  },
  lyra_blog: {
    name: "Lyra Finance Blog",
    url: "https://medium.com/feed/lyra-finance",
    category: "derivatives",
  },
  gains_network_blog: {
    name: "gTrade Blog",
    url: "https://medium.com/feed/gains-network",
    category: "derivatives",
  },

  // =========================================================================
  // STABLECOINS & PAYMENTS — Expanding Coverage
  // =========================================================================
  mountain_protocol: {
    name: "Mountain Protocol Blog",
    url: "https://medium.com/feed/@mountainprotocol",
    category: "stablecoin",
  },
  paypal_crypto: {
    name: "PayPal Crypto Newsroom",
    url: "https://newsroom.paypal-corp.com/feed",
    category: "stablecoin",
  },
  first_digital: {
    name: "First Digital Labs Blog",
    url: "https://medium.com/feed/@firstdigitallabs",
    category: "stablecoin",
  },

  // =========================================================================
  // ASIA-PACIFIC — Expanding Coverage
  // =========================================================================
  cryptotimes_india: {
    name: "The Crypto Times India",
    url: "https://www.cryptotimes.io/feed/",
    category: "asia",
  },
  chaindebrief: {
    name: "Chain Debrief",
    url: "https://chaindebrief.com/feed/",
    category: "asia",
  },
  blockhead_tech: {
    name: "Blockhead",
    url: "https://blockhead.co/feed/",
    category: "asia",
  },
  bitpinas: {
    name: "BitPinas",
    url: "https://bitpinas.com/feed/",
    category: "asia",
  },
  coinlive: {
    name: "Coinlive",
    url: "https://www.coinlive.com/feed",
    category: "asia",
  },

  // =========================================================================
  // TRADFI & INSTITUTIONAL — Expanding Coverage
  // =========================================================================
  // =========================================================================
  // MACRO & CENTRAL BANKS — Expanding Coverage
  // =========================================================================
  federal_reserve_notes: {
    name: "Federal Reserve FEDS Notes",
    url: "https://www.federalreserve.gov/feeds/feds_notes.xml",
    category: "macro",
  },
  bis_speeches: {
    name: "BIS Speeches",
    url: "https://www.bis.org/doclist/cbspeeches.rss",
    category: "macro",
  },
  ecb_press: {
    name: "ECB Press Releases",
    url: "https://www.ecb.europa.eu/rss/press.html",
    category: "macro",
  },
  boe_speeches: {
    name: "Bank of England Speeches",
    url: "https://www.bankofengland.co.uk/rss/speeches",
    category: "macro",
  },

  // =========================================================================
  // MINING & ENERGY — Expanding Coverage
  // =========================================================================
  theminermag: {
    name: "The Miner Mag",
    url: "https://www.theminermag.com/feed/",
    category: "mining",
  },
  // =========================================================================
  // CRYPTO JOURNALISM & NEWSLETTERS — Expanding Coverage
  // =========================================================================
  milkroad: {
    name: "Milk Road",
    url: "https://www.milkroad.com/feed/",
    category: "journalism",
  },
  defiprime: {
    name: "DeFi Prime",
    url: "https://defiprime.com/feed.xml",
    category: "journalism",
  },
  thedefiedge: {
    name: "The DeFi Edge",
    url: "https://thedefiedge.substack.com/feed",
    category: "journalism",
  },
  tokenomicsdao: {
    name: "Tokenomics DAO",
    url: "https://tokenomicsdao.substack.com/feed",
    category: "journalism",
  },
  cryptoweekly: {
    name: "Crypto Weekly",
    url: "https://cryptoweekly.co/feed/",
    category: "journalism",
  },
  metaversal: {
    name: "Metaversal",
    url: "https://metaversal.banklesshq.com/feed",
    category: "journalism",
  },

  // =========================================================================
  // NFT & DIGITAL ART — Expanding Coverage
  // =========================================================================
  superrare_blog: {
    name: "SuperRare Blog",
    url: "https://medium.com/feed/superrare",
    category: "nft",
  },
  blur_blog: {
    name: "Blur Blog",
    url: "https://mirror.xyz/blurdao.eth/feed/atom",
    category: "nft",
  },
  // =========================================================================
  // TRADING & MARKET ANALYSIS — Expanding Coverage
  // =========================================================================
  santiment_blog: {
    name: "Santiment Blog",
    url: "https://santiment.net/blog/feed/",
    category: "trading",
  },
  ccdata_research: {
    name: "CCData Research",
    url: "https://ccdata.io/blog/feed",
    category: "trading",
  },
  coinalyze_blog: {
    name: "Coinalyze Blog",
    url: "https://coinalyze.net/blog/feed/",
    category: "trading",
  },
  material_indicators: {
    name: "Material Indicators Blog",
    url: "https://materialindicators.substack.com/feed",
    category: "trading",
  },

  // =========================================================================
  // PREDICTION MARKETS
  // =========================================================================
  polymarket_blog: {
    name: "Polymarket Blog",
    url: "https://mirror.xyz/polymarket.eth/feed/atom",
    category: "defi",
  },

  // =========================================================================
  // SOCIALFI & DECENTRALIZED SOCIAL
  // =========================================================================
  farcaster_blog: {
    name: "Farcaster Blog",
    url: "https://www.farcaster.xyz/blog/feed",
    category: "social",
  },

  // =========================================================================
  // ADDITIONAL PODCASTS
  // =========================================================================
  // =========================================================================
  // ETHEREUM ECOSYSTEM — Expanding Coverage
  // =========================================================================
  ef_blog: {
    name: "Ethereum Foundation Blog",
    url: "https://blog.ethereum.org/feed.xml",
    category: "ethereum",
  },
  ethereum_cat_herders: {
    name: "Ethereum Cat Herders",
    url: "https://medium.com/feed/ethereum-cat-herders",
    category: "ethereum",
  },
  // =========================================================================
  // BITCOIN ECOSYSTEM — Expanding Coverage
  // =========================================================================
  mempool_space: {
    name: "Mempool.space Blog",
    url: "https://mempool.space/blog/feed",
    category: "bitcoin",
  },
  unchained_capital: {
    name: "Unchained Capital Blog",
    url: "https://unchained.com/blog/feed/",
    category: "bitcoin",
  },
  blockstream_blog: {
    name: "Blockstream Blog",
    url: "https://blog.blockstream.com/feed/",
    category: "bitcoin",
  },

  // =========================================================================
  // RESEARCH & ON-CHAIN — Expanding Coverage
  // =========================================================================
  // =========================================================================
  // WAVE 4 — MAINSTREAM MEDIA (rebuilding from 14 disabled)
  // =========================================================================
  guardian_tech: {
    name: "The Guardian Tech",
    url: "https://www.theguardian.com/technology/rss",
    category: "mainstream",
  },
  bbc_business: {
    name: "BBC Business",
    url: "https://feeds.bbci.co.uk/news/business/rss.xml",
    category: "mainstream",
  },
  barrons: {
    name: "Barrons",
    url: "https://www.barrons.com/feed",
    category: "mainstream",
  },
  business_insider_markets: {
    name: "Business Insider Markets",
    url: "https://www.businessinsider.com/sai/rss",
    category: "mainstream",
  },
  fortune_crypto: {
    name: "Fortune Crypto",
    url: "https://fortune.com/section/crypto/feed/",
    category: "mainstream",
  },
  vice_tech: {
    name: "Vice Motherboard",
    url: "https://www.vice.com/en/rss/topic/tech",
    category: "mainstream",
  },
  axios_crypto: {
    name: "Axios Crypto",
    url: "https://api.axios.com/feed/newsletters/axios-crypto",
    category: "mainstream",
  },
  thestreet_crypto: {
    name: "TheStreet Crypto",
    url: "https://www.thestreet.com/cryptocurrency/feed",
    category: "mainstream",
  },
  benzinga_crypto: {
    name: "Benzinga Crypto",
    url: "https://www.benzinga.com/feed/cryptocurrency",
    category: "mainstream",
  },
  kitco_crypto: {
    name: "Kitco Crypto",
    url: "https://www.kitco.com/feed/crypto-news.rss",
    category: "mainstream",
  },

  // =========================================================================
  // WAVE 4 — GEOPOLITICAL & REGULATION (rebuilding from 9 disabled)
  // =========================================================================
  treasury_press: {
    name: "US Treasury Press",
    url: "https://home.treasury.gov/system/files/136/rss-press-releases.xml",
    category: "geopolitical",
  },
  atlantic_council_crypto: {
    name: "Atlantic Council Crypto",
    url: "https://www.atlanticcouncil.org/category/programs/geoeconomics-center/digital-currencies/feed/",
    category: "geopolitical",
  },

  // =========================================================================
  // WAVE 4 — ON-CHAIN ANALYTICS (5→10+)
  // =========================================================================
  messari_research: {
    name: "Messari Protocol Services",
    url: "https://messari.io/research/feed",
    category: "onchain",
  },
  blockchair_news: {
    name: "Blockchair News",
    url: "https://blockchair.com/news/feed",
    category: "onchain",
  },
  defined_fi_blog: {
    name: "Defined.fi Blog",
    url: "https://www.defined.fi/blog/feed",
    category: "onchain",
  },
  parsec_blog: {
    name: "Parsec Finance Blog",
    url: "https://parsec.fi/blog/rss.xml",
    category: "onchain",
  },

  // =========================================================================
  // WAVE 4 — NFT & METAVERSE (rebuilding from 6 disabled)
  // =========================================================================
  nifty_gateway_blog: {
    name: "Nifty Gateway Blog",
    url: "https://medium.com/feed/nifty-gateway",
    category: "nft",
  },
  mirror_xyz_blog: {
    name: "Mirror Blog",
    url: "https://dev.mirror.xyz/feed/atom",
    category: "nft",
  },

  // =========================================================================
  // WAVE 4 — GAMING & GAMEFI
  // =========================================================================
  stepn_blog: {
    name: "STEPN Blog",
    url: "https://medium.com/feed/@aspect_build",
    category: "gaming",
  },
  mythical_games_blog: {
    name: "Mythical Games Blog",
    url: "https://mythicalgames.com/blog/feed",
    category: "gaming",
  },
  animoca_blog: {
    name: "Animoca Brands Blog",
    url: "https://www.animocabrands.com/blog-feed.xml",
    category: "gaming",
  },
  beam_gaming_blog: {
    name: "Beam Blog",
    url: "https://medium.com/feed/onbeam",
    category: "gaming",
  },

  // =========================================================================
  // WAVE 4 — SOCIAL & COMMUNITY PLATFORMS
  // =========================================================================
  steemit_crypto: {
    name: "Steemit Crypto",
    url: "https://steemit.com/created/cryptocurrency.rss",
    category: "social",
  },
  paragraph_xyz: {
    name: "Paragraph Blog",
    url: "https://paragraph.xyz/blog/feed",
    category: "social",
  },

  // =========================================================================
  // WAVE 4 — FINTECH EXPANDED
  // =========================================================================
  coinbase_institutional: {
    name: "Coinbase Institutional",
    url: "https://www.coinbase.com/institutional/research/feed",
    category: "fintech",
  },
  ripple_blog: {
    name: "Ripple Blog",
    url: "https://ripple.com/insights/feed/",
    category: "fintech",
  },
  stellar_blog: {
    name: "Stellar Blog",
    url: "https://stellar.org/blog/feed",
    category: "fintech",
  },

  // =========================================================================
  // WAVE 4 — PRIVACY & ZK
  // =========================================================================
  mina_blog: {
    name: "Mina Protocol Blog",
    url: "https://minaprotocol.com/blog/feed",
    category: "security",
  },
  // =========================================================================
  // WAVE 4 — RWA / TOKENIZATION
  // =========================================================================
  securitize_blog: {
    name: "Securitize Blog",
    url: "https://securitize.io/blog/feed",
    category: "tradfi",
  },
  polymesh_blog: {
    name: "Polymesh Blog",
    url: "https://polymesh.network/blog/feed",
    category: "tradfi",
  },
  blackrock_digital: {
    name: "BlackRock Digital Assets",
    url: "https://www.blackrock.com/corporate/insights/digital-assets/rss",
    category: "tradfi",
  },
  franklin_templeton_digital: {
    name: "Franklin Templeton Digital",
    url: "https://www.franklintempleton.com/articles/digital-assets/feed",
    category: "tradfi",
  },

  // =========================================================================
  // WAVE 4 — MACRO & ECONOMICS EXPANDED
  // =========================================================================
  fred_blog: {
    name: "FRED Blog (St. Louis Fed)",
    url: "https://fredblog.stlouisfed.org/feed/",
    category: "macro",
  },
  wolf_street: {
    name: "Wolf Street",
    url: "https://wolfstreet.com/feed/",
    category: "macro",
  },
  zerohedge: {
    name: "ZeroHedge",
    url: "https://cms.zerohedge.com/fullrss2.xml",
    category: "macro",
  },

  // =========================================================================
  // WAVE 4 — ETF / ASSET MGMT EXPANDED
  // =========================================================================
  hashdex_research: {
    name: "Hashdex Research",
    url: "https://hashdex.com/en/research/feed",
    category: "etf",
  },
  osprey_funds_blog: {
    name: "Osprey Funds Blog",
    url: "https://ospreyfunds.io/blog/feed/",
    category: "etf",
  },

  // =========================================================================
  // WAVE 4 — ASIA-PACIFIC EXPANDED
  // =========================================================================
  coinpost_en: {
    name: "CoinPost (EN)",
    url: "https://coinpost.jp/?feed=rss2",
    category: "asia",
  },
  kr_crypto: {
    name: "Chain Catcher",
    url: "https://www.chaincatcher.com/rss",
    category: "asia",
  },

  // =========================================================================
  // WAVE 4 — DERIVATIVES & STRUCTURED PRODUCTS
  // =========================================================================
  laevitas_blog: {
    name: "Laevitas Blog",
    url: "https://laevitas.ch/blog/feed",
    category: "derivatives",
  },
  paradigm_trading: {
    name: "Paradigm (Trading)",
    url: "https://www.paradigm.co/blog/rss.xml",
    category: "derivatives",
  },
  amberdata_blog: {
    name: "Amberdata Blog",
    url: "https://blog.amberdata.io/rss/",
    category: "derivatives",
  },

  // =========================================================================
  // WAVE 4 — ETHEREUM ECOSYSTEM EXPANDED
  // =========================================================================
  lido_dao_blog: {
    name: "Lido DAO Governance",
    url: "https://research.lido.fi/latest.rss",
    category: "ethereum",
  },
  ens_blog: {
    name: "ENS Blog",
    url: "https://blog.ens.domains/feed",
    category: "ethereum",
  },

  // =========================================================================
  // WAVE 4 — SOLANA ECOSYSTEM EXPANDED
  // =========================================================================
  metaplex_blog: {
    name: "Metaplex Blog",
    url: "https://www.metaplex.com/blog/feed",
    category: "solana",
  },
  squads_blog: {
    name: "Squads Blog",
    url: "https://squads.so/blog/feed",
    category: "solana",
  },
  marginfi_blog: {
    name: "marginfi Blog",
    url: "https://medium.com/feed/marginfi",
    category: "solana",
  },

  // =========================================================================
  // WAVE 4 — STABLECOINS EXPANDED
  // =========================================================================
  paxos_blog: {
    name: "Paxos Blog",
    url: "https://paxos.com/blog/feed/",
    category: "stablecoin",
  },
  makerdao_gov: {
    name: "MakerDAO Governance",
    url: "https://forum.makerdao.com/latest.rss",
    category: "stablecoin",
  },

  // =========================================================================
  // WAVE 4 — MINING EXPANDED
  // =========================================================================
  blockware_research: {
    name: "Blockware Solutions Research",
    url: "https://www.blockwaresolutions.com/research-and-publications/feed",
    category: "mining",
  },
  luxor_tech_blog: {
    name: "Luxor Technology Blog",
    url: "https://luxor.tech/blog/feed",
    category: "mining",
  },

  // =========================================================================
  // WAVE 4 — JOURNALISM / INVESTIGATIVE
  // =========================================================================
  coffeezilla_pod: {
    name: "Coffeezilla",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCFQMnBA3CS502aghlcr0_aw",
    category: "journalism",
  },
  molly_white: {
    name: "Molly White Blog",
    url: "https://www.citationneeded.news/rss/",
    category: "journalism",
  },

  // =========================================================================
  // WAVE 5 — DePIN (Decentralized Physical Infrastructure Networks)
  // Hot 2025-2026 narrative. Real-world infrastructure meets crypto.
  // =========================================================================
  helium_blog: {
    name: "Helium Blog",
    url: "https://blog.helium.com/feed",
    category: "depin",
  },
  hivemapper_blog: {
    name: "Hivemapper Blog",
    url: "https://blog.hivemapper.com/feed",
    category: "depin",
  },
  iotex_blog: {
    name: "IoTeX Blog",
    url: "https://iotex.io/blog/feed",
    category: "depin",
  },
  dimo_blog: {
    name: "DIMO Blog",
    url: "https://dimo.co/blog/feed",
    category: "depin",
  },
  peaq_blog: {
    name: "peaq Network Blog",
    url: "https://www.peaq.network/blog/feed",
    category: "depin",
  },
  geodnet_blog: {
    name: "GEODNET Blog",
    url: "https://medium.com/feed/@geodnet",
    category: "depin",
  },
  xnet_blog: {
    name: "XNET Blog",
    url: "https://medium.com/feed/@xaboratory",
    category: "depin",
  },

  // =========================================================================
  // WAVE 5 — AI x CRYPTO (Expanded 2025-2026 Narrative)
  // =========================================================================
  virtuals_protocol: {
    name: "Virtuals Protocol Blog",
    url: "https://medium.com/feed/@virtuals-protocol",
    category: "ai_crypto",
  },
  near_ai_blog: {
    name: "NEAR AI Blog",
    url: "https://pages.near.org/blog/feed/",
    category: "ai_crypto",
  },
  zero_gravity_blog: {
    name: "0G Labs Blog",
    url: "https://0g.ai/blog/feed",
    category: "ai_crypto",
  },
  sentient_blog: {
    name: "Sentient Blog",
    url: "https://medium.com/feed/@sentientAGI",
    category: "ai_crypto",
  },
  morpheus_blog: {
    name: "Morpheus AI Blog",
    url: "https://medium.com/feed/@morpheusai",
    category: "ai_crypto",
  },
  gensyn_blog: {
    name: "Gensyn Blog",
    url: "https://medium.com/feed/@gensyn",
    category: "ai_crypto",
  },

  // =========================================================================
  // WAVE 5 — BITCOIN L2s & BITCOIN DeFi
  // Exploding category in 2025: programmable bitcoin layers.
  // =========================================================================
  stacks_blog: {
    name: "Stacks Blog",
    url: "https://www.stacks.org/blog/feed",
    category: "bitcoin",
  },
  bob_bitcoin_blog: {
    name: "BOB (Build on Bitcoin) Blog",
    url: "https://blog.gobob.xyz/rss/",
    category: "bitcoin",
  },
  babylonchain_blog: {
    name: "Babylon Chain Blog",
    url: "https://medium.com/feed/@babylonchain",
    category: "bitcoin",
  },
  alex_lab_blog: {
    name: "ALEX Lab Blog",
    url: "https://medium.com/feed/alexgobtc",
    category: "bitcoin",
  },

  // =========================================================================
  // WAVE 5 — RESTAKING & AVS (Active Validator Services)
  // =========================================================================
  symbiotic_blog: {
    name: "Symbiotic Blog",
    url: "https://medium.com/feed/@symbiotic-fi",
    category: "ethereum",
  },
  karak_blog: {
    name: "Karak Blog",
    url: "https://blog.karak.network/feed",
    category: "ethereum",
  },
  puffer_finance_blog: {
    name: "Puffer Finance Blog",
    url: "https://medium.com/feed/@paborman",
    category: "ethereum",
  },
  renzo_blog: {
    name: "Renzo Protocol Blog",
    url: "https://medium.com/feed/@renzoprotocol",
    category: "ethereum",
  },

  // =========================================================================
  // WAVE 5 — INTENT & CHAIN ABSTRACTION
  // "Chain abstraction" is a top 2025-2026 infrastructure narrative.
  // =========================================================================
  particle_network_blog: {
    name: "Particle Network Blog",
    url: "https://blog.particle.network/rss/",
    category: "developer",
  },
  socket_blog: {
    name: "Socket Protocol Blog",
    url: "https://mirror.xyz/nichanank.eth/feed/atom",
    category: "developer",
  },
  connext_blog: {
    name: "Connext Blog",
    url: "https://medium.com/feed/connext",
    category: "developer",
  },

  // =========================================================================
  // WAVE 5 — APPCHAINS & MODULAR INFRA
  // =========================================================================
  dymension_blog: {
    name: "Dymension Blog",
    url: "https://medium.com/feed/@dymension",
    category: "altl1",
  },
  saga_blog: {
    name: "Saga Blog",
    url: "https://medium.com/feed/@sagaxyz",
    category: "altl1",
  },
  avail_blog: {
    name: "Avail Blog",
    url: "https://blog.availproject.org/rss/",
    category: "altl1",
  },
  altlayer_blog: {
    name: "AltLayer Blog",
    url: "https://blog.altlayer.io/feed",
    category: "layer2",
  },
  caldera_blog: {
    name: "Caldera Blog",
    url: "https://caldera.mirror.xyz/feed/atom",
    category: "layer2",
  },
  conduit_blog: {
    name: "Conduit Blog",
    url: "https://conduit.mirror.xyz/feed/atom",
    category: "layer2",
  },

  // =========================================================================
  // WAVE 5 — DATA AVAILABILITY & PARALLEL EXECUTION
  // =========================================================================
  megaeth_blog: {
    name: "MegaETH Blog",
    url: "https://mirror.xyz/megaeth.eth/feed/atom",
    category: "layer2",
  },
  eclipse_blog: {
    name: "Eclipse Blog",
    url: "https://mirror.xyz/eclipsemainnet.eth/feed/atom",
    category: "layer2",
  },
  movement_blog: {
    name: "Movement Labs Blog",
    url: "https://medium.com/feed/@movementlabsxyz",
    category: "altl1",
  },

  // =========================================================================
  // WAVE 5 — ACCOUNT ABSTRACTION / SMART WALLETS
  // =========================================================================
  pimlico_blog: {
    name: "Pimlico Blog",
    url: "https://www.pimlico.io/blog/feed",
    category: "developer",
  },
  zerodev_blog: {
    name: "ZeroDev Blog",
    url: "https://docs.zerodev.app/blog/atom.xml",
    category: "developer",
  },
  rhinestone_blog: {
    name: "Rhinestone Blog",
    url: "https://blog.rhinestone.wtf/feed",
    category: "developer",
  },

  // =========================================================================
  // WAVE 5 — GLOBAL REGULATORS & POLICY (beyond US)
  // =========================================================================
  uk_fca_crypto: {
    name: "UK FCA Crypto",
    url: "https://www.fca.org.uk/news/rss.xml",
    category: "geopolitical",
  },
  mas_singapore: {
    name: "MAS Singapore Fintech",
    url: "https://www.mas.gov.sg/rss/fintech",
    category: "geopolitical",
  },
  rba_speeches: {
    name: "RBA Speeches (Australia)",
    url: "https://www.rba.gov.au/rss/rss-cb-speeches.xml",
    category: "geopolitical",
  },
  eba_news: {
    name: "EBA News (EU Banking)",
    url: "https://www.eba.europa.eu/rss.xml",
    category: "geopolitical",
  },

  // =========================================================================
  // WAVE 5 — TOP CRYPTO NEWSLETTERS (Substack)
  // =========================================================================
  the_rollup_newsletter: {
    name: "The Rollup",
    url: "https://therollup.substack.com/feed",
    category: "journalism",
  },
  token_dispatch: {
    name: "Token Dispatch",
    url: "https://tokendispatch.substack.com/feed",
    category: "journalism",
  },
  onchain_times: {
    name: "Onchain Times",
    url: "https://onchaintimes.substack.com/feed",
    category: "journalism",
  },
  defi_weekly: {
    name: "DeFi Weekly",
    url: "https://defiweekly.substack.com/feed",
    category: "journalism",
  },
  blocmates: {
    name: "Blocmates",
    url: "https://blocmates.com/feed/",
    category: "journalism",
  },

  // =========================================================================
  // WAVE 5 — VIDEO/YOUTUBE RSS (crypto educators)
  // =========================================================================
  coin_bureau_yt: {
    name: "Coin Bureau",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCqK_GSMbpiV8spgD3ZGloSw",
    category: "journalism",
  },
  benjamin_cowen_yt: {
    name: "Benjamin Cowen",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCRvqjQPSeaWn-uEx-w0XOIg",
    category: "journalism",
  },
  raoul_pal_yt: {
    name: "Raoul Pal (Real Vision)",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCBH5VZE_Y4F3CMcPIzPEB5A",
    category: "journalism",
  },

  // =========================================================================
  // WAVE 5 — PERPETUAL/DERIVATIVES EXCHANGES (new entrants)
  // =========================================================================
  rabbitx_blog: {
    name: "RabbitX Blog",
    url: "https://medium.com/feed/@rabbitx_io",
    category: "derivatives",
  },
  bluefin_blog: {
    name: "Bluefin Blog",
    url: "https://medium.com/feed/@bluefinapp",
    category: "derivatives",
  },

  // =========================================================================
  // WAVE 5 — TOKENIZATION / RWA EXPANDED
  // =========================================================================
  tokeny_blog: {
    name: "Tokeny Blog",
    url: "https://tokeny.com/blog/feed/",
    category: "tradfi",
  },
  backed_finance_blog: {
    name: "Backed Finance Blog",
    url: "https://medium.com/feed/@backedfi",
    category: "tradfi",
  },
  superstate_blog: {
    name: "Superstate Blog",
    url: "https://medium.com/feed/@superstatefunds",
    category: "tradfi",
  },
  maple_v2_blog: {
    name: "Maple Finance V2 Blog",
    url: "https://medium.com/feed/@maplefinance",
    category: "defi",
  },

  // =========================================================================
  // WAVE 5 — ADDITIONAL CRYPTO MEDIA (high quality, recently launched)
  // =========================================================================
  thevrsoldier: {
    name: "The VR Soldier",
    url: "https://thevrsoldier.com/feed/",
    category: "general",
  },
  blockhead_news: {
    name: "Blockhead News",
    url: "https://blockhead.co/feed/",
    category: "general",
  },
  cryptodnes: {
    name: "CryptoDnes",
    url: "https://www.cryptodnes.bg/en/feed/",
    category: "general",
  },
  cypherhunter_blog: {
    name: "CypherHunter Blog",
    url: "https://www.cypherhunter.com/blog/feed/",
    category: "general",
  },
} as const;

type SourceKey = keyof typeof RSS_SOURCES;

/**
 * Sources shown on the homepage feed.
 * Restricted to Tier 1 and Tier 2 sources — keeps the homepage
 * focused, credible, and high-signal.
 */
const HOMEPAGE_SOURCE_KEYS = new Set([
  // ═══════════════════════════════════════════════════════════════
  // Tier 1 — Major crypto news outlets
  // ═══════════════════════════════════════════════════════════════
  "coindesk",
  "theblock",
  "decrypt",
  "cointelegraph",
  "bitcoinmagazine",
  "blockworks",
  "defiant",

  // ═══════════════════════════════════════════════════════════════
  // Tier 1 — Mainstream / institutional media
  // ═══════════════════════════════════════════════════════════════
  "bloomberg_crypto",
  "reuters_crypto",
  "wsj_crypto",
  "ft_crypto",
  "cnbc_crypto",
  "forbes_crypto",
  "yahoo_crypto",
  "techcrunch_crypto",
  "wired_crypto",
  "guardian_tech",
  "bbc_business",
  "cnn_business",
  "barrons",
  "business_insider_markets",
  "fortune_crypto",
  "axios_crypto",
  "entrepreneur_crypto",

  // ═══════════════════════════════════════════════════════════════
  // Tier 1 — Institutional / research
  // ═══════════════════════════════════════════════════════════════
  "fidelity_digital",
  "blackrock_digital",
  "coinbase_institutional",
  "franklin_templeton_digital",

  // ═══════════════════════════════════════════════════════════════
  // Tier 1 — Geopolitical / Central Banks
  // ═══════════════════════════════════════════════════════════════
  "bis_speeches",
  "imf_blog",
  "ecb_press",
  "treasury_press",
  "boe_speeches",
  "atlantic_council_crypto",

  // ═══════════════════════════════════════════════════════════════
  // Tier 2 — Established crypto (quality editorial only)
  // ═══════════════════════════════════════════════════════════════
  "unchained_crypto",
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
  article: Pick<NewsArticle, "description" | "translations">,
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
  status: "active" | "unavailable" | "unknown";
}

/**
 * Strip CDATA wrapper from a string if present
 * e.g. <![CDATA[https://example.com]]> → https://example.com
 */
function stripCDATA(text: string): string {
  const match = text.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return match ? match[1].trim() : text;
}

/**
 * Decode HTML entities in a string (e.g. &#39; → ', &amp; → &)
 */
function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&"); // &amp; must be last
}

/**
 * Extract the best image URL from an RSS item.
 * Checks: media:content, media:thumbnail, enclosure, img in description
 */
function extractImageUrl(
  itemXml: string,
  rawDescription: string,
): string | null {
  // Priority 1: media:content (most reliable, used by major RSS feeds)
  const mediaContent = itemXml.match(
    /<media:content[^>]+url=["']([^"']+)["']/i,
  );
  if (mediaContent?.[1]) return mediaContent[1];

  // Priority 2: media:thumbnail
  const mediaThumbnail = itemXml.match(
    /<media:thumbnail[^>]+url=["']([^"']+)["']/i,
  );
  if (mediaThumbnail?.[1]) return mediaThumbnail[1];

  // Priority 3: enclosure with image type
  const enclosure = itemXml.match(
    /<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image[^"']*/i,
  );
  if (enclosure?.[1]) return enclosure[1];

  // Priority 4: enclosure without type check (many feeds omit type)
  const enclosureAny = itemXml.match(
    /<enclosure[^>]+url=["']([^"']+\.(?:jpg|jpeg|png|webp|gif))[^"']*["']/i,
  );
  if (enclosureAny?.[1]) return enclosureAny[1];

  // Priority 5: img tag inside description CDATA
  if (rawDescription) {
    const imgMatch = rawDescription.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (
      imgMatch?.[1] &&
      !imgMatch[1].includes("feeds.feedburner") &&
      !imgMatch[1].includes("pixel") &&
      !imgMatch[1].includes("tracker")
    ) {
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
function parseRSSFeed(
  xml: string,
  sourceKey: string,
  sourceName: string,
  category: string,
): NewsArticle[] {
  const articles: NewsArticle[] = [];

  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  const titleRegex = /<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/i;
  const linkRegex =
    /<link><!\[CDATA\[(.*?)\]\]>(?:<\/link>)?|<link>(.*?)<\/link>/i;
  const descRegex =
    /<description><!\[CDATA\[([\s\S]*?)\]\]>|<description>([\s\S]*?)<\/description>/i;
  const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/i;

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const titleMatch = itemXml.match(titleRegex);
    const linkMatch = itemXml.match(linkRegex);
    const descMatch = itemXml.match(descRegex);
    const pubDateMatch = itemXml.match(pubDateRegex);

    // Extract image from multiple possible locations
    const rawDesc = descMatch?.[1] || descMatch?.[2] || "";
    const imageUrl = extractImageUrl(itemXml, rawDesc);

    const title = decodeHTMLEntities(
      (titleMatch?.[1] || titleMatch?.[2] || "").trim(),
    );
    const link = stripCDATA((linkMatch?.[1] || linkMatch?.[2] || "").trim());
    const description = sanitizeDescription(rawDesc);
    const pubDateStr = pubDateMatch?.[1] || "";

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
    return "";
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

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

import { newsCache, withCache } from "./cache";

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
    name: "CryptoCompare",
    url: "https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest",
    category: "general",
    parser: (data: unknown) => {
      const response = data as {
        Data?: Array<{
          title: string;
          url: string;
          body: string;
          imageurl: string;
          published_on: number;
          source: string;
          categories: string;
        }>;
      };
      if (!response.Data) return [];
      return response.Data.slice(0, 20).map((item) => ({
        title: decodeHTMLEntities(item.title),
        link: item.url,
        description: item.body?.slice(0, 200),
        imageUrl: item.imageurl || undefined,
        pubDate: safeDate(item.published_on * 1000).toISOString(),
        source: item.source || "CryptoCompare",
        sourceKey: "cryptocompare",
        category: item.categories?.split("|")[0]?.toLowerCase() || "general",
        timeAgo: getTimeAgo(safeDate(item.published_on * 1000)),
      }));
    },
  },

  // CoinGecko Status Updates (free)
  coingecko_updates: {
    name: "CoinGecko Updates",
    url: "https://api.coingecko.com/api/v3/status_updates",
    category: "general",
    parser: (data: unknown) => {
      const response = data as {
        status_updates?: Array<{
          description: string;
          created_at: string;
          project: { name: string };
          user_title: string;
        }>;
      };
      if (!response.status_updates) return [];
      return response.status_updates.slice(0, 10).map((item) => ({
        title: decodeHTMLEntities(
          `${item.project?.name}: ${item.user_title || "Update"}`,
        ),
        link: `https://www.coingecko.com`,
        description: item.description?.slice(0, 200),
        pubDate: safeDate(item.created_at).toISOString(),
        source: "CoinGecko",
        sourceKey: "coingecko_updates",
        category: "general",
        timeAgo: getTimeAgo(safeDate(item.created_at)),
      }));
    },
  },

  // CoinPaprika News (free)
  coinpaprika: {
    name: "CoinPaprika",
    url: "https://api.coinpaprika.com/v1/coins/btc-bitcoin/events",
    category: "bitcoin",
    parser: (data: unknown) => {
      const events = data as Array<{
        name: string;
        description: string;
        link: string;
        date: string;
      }>;
      if (!Array.isArray(events)) return [];
      return events.slice(0, 10).map((item) => ({
        title: decodeHTMLEntities(item.name),
        link: item.link || "https://coinpaprika.com",
        description: item.description?.slice(0, 200),
        pubDate: safeDate(item.date).toISOString(),
        source: "CoinPaprika",
        sourceKey: "coinpaprika",
        category: "bitcoin",
        timeAgo: getTimeAgo(safeDate(item.date)),
      }));
    },
  },

  // CoinCap News (free)
  coincap: {
    name: "CoinCap",
    url: "https://api.coincap.io/v2/assets?limit=10",
    category: "markets",
    parser: (data: unknown) => {
      // CoinCap doesn't have news, but we can generate market updates
      const response = data as {
        data?: Array<{
          name: string;
          symbol: string;
          priceUsd: string;
          changePercent24Hr: string;
        }>;
      };
      if (!response.data) return [];
      // Only return significant movers (>5% change)
      const movers = response.data.filter(
        (a) => Math.abs(parseFloat(a.changePercent24Hr || "0")) > 5,
      );
      return movers.slice(0, 5).map((item) => {
        const change = parseFloat(item.changePercent24Hr || "0");
        const direction = change > 0 ? "📈" : "📉";
        return {
          title: `${direction} ${item.name} (${item.symbol}) ${change > 0 ? "+" : ""}${change.toFixed(1)}% in 24h`,
          link: `https://coincap.io/assets/${item.name.toLowerCase()}`,
          description: `${item.name} is trading at $${parseFloat(item.priceUsd).toLocaleString()}`,
          pubDate: new Date().toISOString(),
          source: "CoinCap",
          sourceKey: "coincap",
          category: "markets",
          timeAgo: "just now",
        };
      });
    },
  },

  // LunarCrush Galaxy Score (free tier)
  lunarcrush: {
    name: "LunarCrush",
    url: "https://lunarcrush.com/api4/public/coins/list?sort=galaxy_score&limit=5",
    category: "social",
    parser: (data: unknown) => {
      const response = data as {
        data?: Array<{
          name: string;
          symbol: string;
          galaxy_score: number;
          alt_rank: number;
          social_volume: number;
        }>;
      };
      if (!response.data) return [];
      return response.data.slice(0, 5).map((item) => ({
        title: `🌙 ${item.name} (${item.symbol}) Galaxy Score: ${item.galaxy_score}`,
        link: `https://lunarcrush.com/coins/${item.symbol.toLowerCase()}`,
        description: `Social volume: ${item.social_volume?.toLocaleString() || "N/A"}, Alt Rank: #${item.alt_rank}`,
        pubDate: new Date().toISOString(),
        source: "LunarCrush",
        sourceKey: "lunarcrush",
        category: "social",
        timeAgo: "just now",
      }));
    },
  },

  // Fear & Greed Index (Alternative.me - free)
  fear_greed: {
    name: "Fear & Greed",
    url: "https://api.alternative.me/fng/?limit=1",
    category: "sentiment",
    parser: (data: unknown) => {
      const response = data as {
        data?: Array<{
          value: string;
          value_classification: string;
          timestamp: string;
        }>;
      };
      if (!response.data?.[0]) return [];
      const item = response.data[0];
      const emoji =
        parseInt(item.value) < 25
          ? "😨"
          : parseInt(item.value) < 50
            ? "😟"
            : parseInt(item.value) < 75
              ? "😊"
              : "🤑";
      return [
        {
          title: `${emoji} Crypto Fear & Greed Index: ${item.value} (${item.value_classification})`,
          link: "https://alternative.me/crypto/fear-and-greed-index/",
          description: `The market sentiment is currently "${item.value_classification}" with a score of ${item.value}/100`,
          pubDate: safeDate(parseInt(item.timestamp) * 1000).toISOString(),
          source: "Alternative.me",
          sourceKey: "fear_greed",
          category: "sentiment",
          timeAgo: getTimeAgo(safeDate(parseInt(item.timestamp) * 1000)),
        },
      ];
    },
  },

  // Blockchain.com Stats (free)
  blockchain_stats: {
    name: "Blockchain Stats",
    url: "https://api.blockchain.info/stats",
    category: "bitcoin",
    parser: (data: unknown) => {
      const stats = data as {
        market_price_usd: number;
        hash_rate: number;
        n_tx: number;
        timestamp: number;
      };
      if (!stats.market_price_usd) return [];
      return [
        {
          title: `₿ Bitcoin Network: ${(stats.hash_rate / 1e18).toFixed(1)} EH/s hashrate, ${stats.n_tx.toLocaleString()} txs today`,
          link: "https://www.blockchain.com/explorer/charts",
          description: `BTC price: $${stats.market_price_usd.toLocaleString()}`,
          pubDate: safeDate(stats.timestamp).toISOString(),
          source: "Blockchain.com",
          sourceKey: "blockchain_stats",
          category: "bitcoin",
          timeAgo: getTimeAgo(safeDate(stats.timestamp)),
        },
      ];
    },
  },

  // Etherscan Gas Tracker (free)
  etherscan_gas: {
    name: "Etherscan Gas",
    url: "https://api.etherscan.io/api?module=gastracker&action=gasoracle",
    category: "ethereum",
    parser: (data: unknown) => {
      const response = data as {
        result?: {
          SafeGasPrice: string;
          ProposeGasPrice: string;
          FastGasPrice: string;
        };
      };
      if (!response.result?.SafeGasPrice) return [];
      const { SafeGasPrice, ProposeGasPrice, FastGasPrice } = response.result;
      return [
        {
          title: `⛽ ETH Gas: 🐢 ${SafeGasPrice} | 🚶 ${ProposeGasPrice} | 🚀 ${FastGasPrice} Gwei`,
          link: "https://etherscan.io/gastracker",
          description: `Current Ethereum gas prices. Fast: ${FastGasPrice} Gwei, Standard: ${ProposeGasPrice} Gwei, Safe: ${SafeGasPrice} Gwei`,
          pubDate: new Date().toISOString(),
          source: "Etherscan",
          sourceKey: "etherscan_gas",
          category: "ethereum",
          timeAgo: "just now",
        },
      ];
    },
  },

  // Mempool.space Bitcoin Fees (free)
  mempool_fees: {
    name: "Mempool Fees",
    url: "https://mempool.space/api/v1/fees/recommended",
    category: "bitcoin",
    parser: (data: unknown) => {
      const fees = data as {
        fastestFee: number;
        halfHourFee: number;
        hourFee: number;
        economyFee: number;
      };
      if (!fees.fastestFee) return [];
      return [
        {
          title: `₿ BTC Fees: ⚡ ${fees.fastestFee} | ⏱️ ${fees.halfHourFee} | 🕐 ${fees.hourFee} sat/vB`,
          link: "https://mempool.space",
          description: `Fastest: ${fees.fastestFee} sat/vB, 30min: ${fees.halfHourFee} sat/vB, 1hr: ${fees.hourFee} sat/vB, Economy: ${fees.economyFee} sat/vB`,
          pubDate: new Date().toISOString(),
          source: "Mempool.space",
          sourceKey: "mempool_fees",
          category: "bitcoin",
          timeAgo: "just now",
        },
      ];
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // REDDIT (free, no key needed — public JSON API)
  // ═══════════════════════════════════════════════════════════════
  reddit_crypto: {
    name: "Reddit r/CryptoCurrency",
    url: "https://www.reddit.com/r/CryptoCurrency/hot.json?limit=10",
    category: "social",
    parser: (data: unknown) => {
      const response = data as {
        data?: {
          children?: Array<{
            data: {
              title: string;
              url: string;
              selftext: string;
              score: number;
              num_comments: number;
              author: string;
              created_utc: number;
              permalink: string;
            };
          }>;
        };
      };
      if (!response.data?.children) return [];
      return response.data.children
        .filter((c) => c.data.score > 100)
        .slice(0, 8)
        .map((c) => {
          const post = c.data;
          return {
            title: decodeHTMLEntities(post.title),
            link: post.url.startsWith("http")
              ? post.url
              : `https://reddit.com${post.permalink}`,
            description:
              post.selftext?.slice(0, 200) ||
              `${post.score.toLocaleString()} upvotes · ${post.num_comments} comments`,
            pubDate: safeDate(post.created_utc * 1000).toISOString(),
            source: "Reddit r/CryptoCurrency",
            sourceKey: "reddit_crypto",
            category: "social",
            timeAgo: getTimeAgo(new Date(post.created_utc * 1000)),
          };
        });
    },
  },

  reddit_bitcoin: {
    name: "Reddit r/Bitcoin",
    url: "https://www.reddit.com/r/Bitcoin/hot.json?limit=10",
    category: "social",
    parser: (data: unknown) => {
      const response = data as {
        data?: {
          children?: Array<{
            data: {
              title: string;
              url: string;
              selftext: string;
              score: number;
              num_comments: number;
              author: string;
              created_utc: number;
              permalink: string;
            };
          }>;
        };
      };
      if (!response.data?.children) return [];
      return response.data.children
        .filter((c) => c.data.score > 100)
        .slice(0, 6)
        .map((c) => {
          const post = c.data;
          return {
            title: decodeHTMLEntities(post.title),
            link: post.url.startsWith("http")
              ? post.url
              : `https://reddit.com${post.permalink}`,
            description:
              post.selftext?.slice(0, 200) ||
              `${post.score.toLocaleString()} upvotes · ${post.num_comments} comments`,
            pubDate: safeDate(post.created_utc * 1000).toISOString(),
            source: "Reddit r/Bitcoin",
            sourceKey: "reddit_bitcoin",
            category: "bitcoin",
            timeAgo: getTimeAgo(new Date(post.created_utc * 1000)),
          };
        });
    },
  },

  reddit_defi: {
    name: "Reddit r/defi",
    url: "https://www.reddit.com/r/defi/hot.json?limit=8",
    category: "social",
    parser: (data: unknown) => {
      const response = data as {
        data?: {
          children?: Array<{
            data: {
              title: string;
              url: string;
              selftext: string;
              score: number;
              num_comments: number;
              created_utc: number;
              permalink: string;
            };
          }>;
        };
      };
      if (!response.data?.children) return [];
      return response.data.children
        .filter((c) => c.data.score > 50)
        .slice(0, 5)
        .map((c) => {
          const post = c.data;
          return {
            title: decodeHTMLEntities(post.title),
            link: post.url.startsWith("http")
              ? post.url
              : `https://reddit.com${post.permalink}`,
            description:
              post.selftext?.slice(0, 200) ||
              `${post.score.toLocaleString()} upvotes · ${post.num_comments} comments`,
            pubDate: safeDate(post.created_utc * 1000).toISOString(),
            source: "Reddit r/defi",
            sourceKey: "reddit_defi",
            category: "defi",
            timeAgo: getTimeAgo(new Date(post.created_utc * 1000)),
          };
        });
    },
  },

  reddit_ethereum: {
    name: "Reddit r/ethereum",
    url: "https://www.reddit.com/r/ethereum/hot.json?limit=8",
    category: "social",
    parser: (data: unknown) => {
      const response = data as {
        data?: {
          children?: Array<{
            data: {
              title: string;
              url: string;
              selftext: string;
              score: number;
              num_comments: number;
              created_utc: number;
              permalink: string;
            };
          }>;
        };
      };
      if (!response.data?.children) return [];
      return response.data.children
        .filter((c) => c.data.score > 50)
        .slice(0, 5)
        .map((c) => {
          const post = c.data;
          return {
            title: decodeHTMLEntities(post.title),
            link: post.url.startsWith("http")
              ? post.url
              : `https://reddit.com${post.permalink}`,
            description:
              post.selftext?.slice(0, 200) ||
              `${post.score.toLocaleString()} upvotes · ${post.num_comments} comments`,
            pubDate: safeDate(post.created_utc * 1000).toISOString(),
            source: "Reddit r/ethereum",
            sourceKey: "reddit_ethereum",
            category: "ethereum",
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
    name: "DeFiLlama Raises",
    url: "https://api.llama.fi/raises",
    category: "institutional",
    noDataCache: true, // 3.78MB response exceeds Next.js 2MB data cache limit
    parser: (data: unknown) => {
      const response = data as {
        raises?: Array<{
          name: string;
          amount: number | null;
          date: number;
          round: string;
          source: string;
          leadInvestors: string[];
          chains: string[];
          category: string;
          sector: string;
        }>;
      };
      if (!response.raises) return [];
      const cutoff = Date.now() / 1000 - 60 * 60 * 24 * 7; // last 7 days
      return response.raises
        .filter((r) => r.date > cutoff && r.source)
        .slice(0, 10)
        .map((r) => {
          const amountStr = r.amount ? `$${r.amount}M` : "undisclosed amount";
          const investors = r.leadInvestors?.length
            ? ` led by ${r.leadInvestors.slice(0, 2).join(", ")}`
            : "";
          return {
            title: `💰 ${r.name} raises ${amountStr} in ${r.round || "funding round"}${investors}`,
            link: r.source || "https://defillama.com/raises",
            description:
              `${r.category || ""} ${r.sector || ""} · Chains: ${r.chains?.join(", ") || "N/A"}`.trim(),
            pubDate: safeDate(r.date * 1000).toISOString(),
            source: "DeFiLlama Raises",
            sourceKey: "defillama_raises",
            category: "institutional",
            timeAgo: getTimeAgo(new Date(r.date * 1000)),
          };
        });
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // BINANCE ANNOUNCEMENTS (public endpoint, no key needed)
  // ═══════════════════════════════════════════════════════════════
  binance_announcements: {
    name: "Binance Announcements",
    url: "https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&pageNo=1&pageSize=10&catalogId=48",
    category: "general",
    parser: (data: unknown) => {
      const response = data as {
        data?: {
          catalogs?: Array<{
            articles?: Array<{
              id: number;
              code: string;
              title: string;
              releaseDate: number;
            }>;
          }>;
        };
      };
      const articles = response.data?.catalogs?.[0]?.articles;
      if (!articles) return [];
      return articles.slice(0, 8).map((item) => ({
        title: decodeHTMLEntities(item.title),
        link: `https://www.binance.com/en/support/announcement/${item.code}`,
        description: `Binance official announcement`,
        pubDate: safeDate(item.releaseDate).toISOString(),
        source: "Binance",
        sourceKey: "binance_announcements",
        category: "general",
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
  ...(process.env.ALPHA_VANTAGE_API_KEY
    ? {
        alpha_vantage: {
          name: "Alpha Vantage News",
          url: `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=blockchain&language=en&sort=LATEST&limit=30&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`,
          category: "general",
          parser: (data: unknown) => {
            const response = data as {
              feed?: Array<{
                title: string;
                url: string;
                time_published: string;
                summary: string;
                source: string;
                overall_sentiment_label: string;
                overall_sentiment_score: number;
                banner_image?: string;
              }>;
            };
            if (!response.feed) return [];
            return response.feed.slice(0, 20).map((item) => ({
              title: decodeHTMLEntities(item.title),
              link: item.url,
              description: item.summary?.slice(0, 200),
              imageUrl: item.banner_image || undefined,
              pubDate: item.time_published
                ? safeDate(
                    `${item.time_published.slice(0, 4)}-${item.time_published.slice(4, 6)}-${item.time_published.slice(6, 8)}T${item.time_published.slice(9, 11)}:${item.time_published.slice(11, 13)}:${item.time_published.slice(13, 15)}Z`,
                  ).toISOString()
                : new Date().toISOString(),
              source: item.source || "Alpha Vantage",
              sourceKey: "alpha_vantage",
              category: item.overall_sentiment_label
                ?.toLowerCase()
                .includes("bull")
                ? "markets"
                : "general",
              timeAgo: getTimeAgo(new Date()),
            }));
          },
        } as ApiSource,
      }
    : {}),

  ...(process.env.FINNHUB_API_KEY
    ? {
        finnhub: {
          name: "Finnhub",
          url: `https://finnhub.io/api/v1/news?category=crypto&token=${process.env.FINNHUB_API_KEY}`,
          category: "general",
          parser: (data: unknown) => {
            const items = data as Array<{
              headline: string;
              url: string;
              summary: string;
              source: string;
              datetime: number;
              image?: string;
              category: string;
            }>;
            if (!Array.isArray(items)) return [];
            return items.slice(0, 20).map((item) => ({
              title: decodeHTMLEntities(item.headline),
              link: item.url,
              description: item.summary?.slice(0, 200),
              imageUrl: item.image || undefined,
              pubDate: safeDate(item.datetime * 1000).toISOString(),
              source: item.source || "Finnhub",
              sourceKey: "finnhub",
              category: "general",
              timeAgo: getTimeAgo(safeDate(item.datetime * 1000)),
            }));
          },
        } as ApiSource,
      }
    : {}),

  ...(process.env.MARKETAUX_API_KEY
    ? {
        marketaux: {
          name: "MarketAux",
          url: `https://api.marketaux.com/v1/news/all?api_token=${process.env.MARKETAUX_API_KEY}&filter_entities=true&language=en&search=crypto+bitcoin+ethereum&limit=25`,
          category: "general",
          parser: (data: unknown) => {
            const response = data as {
              data?: Array<{
                uuid: string;
                title: string;
                description: string;
                url: string;
                image_url?: string;
                published_at: string;
                source: string;
                sentiment_score?: number;
              }>;
            };
            if (!response.data) return [];
            return response.data.slice(0, 20).map((item) => ({
              title: decodeHTMLEntities(item.title),
              link: item.url,
              description: item.description?.slice(0, 200),
              imageUrl: item.image_url || undefined,
              pubDate: safeDate(item.published_at).toISOString(),
              source: item.source || "MarketAux",
              sourceKey: "marketaux",
              category: "general",
              timeAgo: getTimeAgo(safeDate(item.published_at)),
            }));
          },
        } as ApiSource,
      }
    : {}),

  ...(process.env.GNEWS_API_KEY
    ? {
        gnews: {
          name: "GNews",
          url: `https://gnews.io/api/v4/search?q=cryptocurrency+OR+bitcoin+OR+ethereum&token=${process.env.GNEWS_API_KEY}&lang=en&max=10&sortby=publishedAt`,
          category: "general",
          parser: (data: unknown) => {
            const response = data as {
              articles?: Array<{
                title: string;
                description: string;
                content: string;
                url: string;
                image?: string;
                publishedAt: string;
                source: { name: string; url: string };
              }>;
            };
            if (!response.articles) return [];
            return response.articles.slice(0, 10).map((item) => ({
              title: decodeHTMLEntities(item.title),
              link: item.url,
              description: item.description?.slice(0, 200),
              imageUrl: item.image || undefined,
              pubDate: safeDate(item.publishedAt).toISOString(),
              source: item.source?.name || "GNews",
              sourceKey: "gnews",
              category: "general",
              timeAgo: getTimeAgo(safeDate(item.publishedAt)),
            }));
          },
        } as ApiSource,
      }
    : {}),
};

/**
 * Fetch from API source with caching
 */
async function fetchApiSource(sourceKey: string): Promise<NewsArticle[]> {
  const cacheKey = `api:${sourceKey}`;

  return withCache(newsCache, cacheKey, 300, async () => {
    // 5 min cache for APIs
    const source = API_SOURCES[sourceKey];
    if (!source) return [];

    const domain = DomainSemaphore.domainOf(source.url);

    // Skip if domain is in 429 back-off
    if (domainSemaphore.isBackedOff(domain)) return [];

    await domainSemaphore.acquire(domain);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout (reduced from 8s for faster cold starts)

      // Sources with noDataCache skip the Next.js data cache (responses > 2MB)
      // and rely solely on the in-memory withCache layer (5-min TTL).
      // Use short ISR (60s) instead of no-store to avoid tainting routes as
      // fully dynamic during static generation (Turbopack treats no-store as
      // revalidate: 0 which blocks SSG).
      const response = await fetch(source.url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "FreeCryptoNews/1.0",
        },
        signal: controller.signal,
        ...(source.noDataCache
          ? { next: { revalidate: 60 } }
          : { next: { revalidate: 300 } }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle 429 with domain-level back-off
        if (response.status === 429) {
          const retryAfter = response.headers.get("retry-after");
          const backoffMs = retryAfter
            ? Number(retryAfter) > 0
              ? Number(retryAfter) * 1000
              : 60_000
            : 60_000;
          domainSemaphore.markBackoff(domain, backoffMs);
        }
        return [];
      }

      const data = await response.json();
      return source.parser(data);
    } catch (error) {
      // APIs are supplementary — log for observability but don't fail the response
      if (process.env.DEBUG_RSS || process.env.NODE_ENV === "development") {
        const isAbort = error instanceof Error && error.name === "AbortError";
        console.warn(
          `[API] ${source.name} failed:`,
          isAbort ? "timeout" : error instanceof Error ? error.message : error,
        );
      }
      return [];
    } finally {
      domainSemaphore.release(domain);
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
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    }
  }
  return articles;
}

/**
 * Fetch RSS feed from a source with caching and domain-level throttling.
 * Uses domainSemaphore to limit concurrent requests per domain (max 3)
 * to avoid 429 rate-limit storms from medium.com, mirror.xyz, etc.
 */
async function fetchFeed(sourceKey: SourceKey): Promise<NewsArticle[]> {
  const source = RSS_SOURCES[sourceKey];

  // Skip disabled sources
  if ("disabled" in source && source.disabled) {
    return [];
  }

  const domain = DomainSemaphore.domainOf(source.url);

  // If this domain is in 429 back-off, skip the fetch entirely
  if (domainSemaphore.isBackedOff(domain)) {
    return [];
  }

  const cacheKey = `feed:${sourceKey}`;

  return withCache(newsCache, cacheKey, 300, async () => {
    // 5 min cache — RSS feeds don't change faster than this

    // Acquire a domain-level slot before making the request
    await domainSemaphore.acquire(domain);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout (reduced from 5s for faster cold starts)

      // force-cache ensures origin server Cache-Control headers (e.g. no-store)
      // don't break static generation; revalidate: 300 adds ISR on top.
      // Sources with noDataCache skip the Next.js data cache (responses > 2MB)
      // and rely solely on the in-memory withCache layer (5-min TTL).
      // Use short ISR (60s) instead of no-store to avoid tainting routes as
      // fully dynamic during static generation.
      const skipDataCache = "noDataCache" in source && source.noDataCache;
      const fetchOptions: RequestInit & { next?: { revalidate: number } } = {
        headers: {
          Accept: "application/rss+xml, application/xml, text/xml",
          "User-Agent":
            "FreeCryptoNews/1.0 (github.com/nirholas/free-crypto-news)",
        },
        signal: controller.signal,
        redirect: "manual", // Prevent redirect loops hitting own domain
        ...(skipDataCache
          ? { next: { revalidate: 60 } }
          : {
              cache: "force-cache" as RequestCache,
              next: { revalidate: 300 },
            }),
      };
      const response = await fetch(source.url, fetchOptions);

      clearTimeout(timeoutId);

      // Detect redirects (3xx) — log warning and bail to prevent self-referential requests
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location") || "unknown";
        if (process.env.NODE_ENV === "development" || process.env.DEBUG_RSS) {
          console.warn(
            `Redirect detected for ${source.name}: ${response.status} → ${location}`,
          );
        }
        return [];
      }

      if (!response.ok) {
        // Handle 429 Too Many Requests — back off the entire domain
        if (response.status === 429) {
          const retryAfter = response.headers.get("retry-after");
          // Default 60s backoff; honour Retry-After header if present
          const backoffMs = retryAfter
            ? Number(retryAfter) > 0
              ? Number(retryAfter) * 1000
              : 60_000
            : 60_000;
          domainSemaphore.markBackoff(domain, backoffMs);
          if (process.env.DEBUG_RSS || process.env.NODE_ENV === "development") {
            console.warn(
              `[429] ${source.name} (${domain}) — backing off ${backoffMs / 1000}s`,
            );
          }
        } else if (
          process.env.NODE_ENV === "development" &&
          process.env.DEBUG_RSS
        ) {
          console.warn(`Failed to fetch ${source.name}: ${response.status}`);
        }
        return [];
      }

      const xml = await response.text();
      return parseRSSFeed(xml, sourceKey, source.name, source.category);
    } catch (error) {
      // Only log non-abort errors in production, or all errors with DEBUG_RSS
      const isAbortError =
        error instanceof Error && error.name === "AbortError";
      if (
        process.env.DEBUG_RSS ||
        (!isAbortError && process.env.NODE_ENV === "production")
      ) {
        console.warn(
          `Error fetching ${source.name}:`,
          isAbortError ? "timeout" : error,
        );
      }
      return [];
    } finally {
      domainSemaphore.release(domain);
    }
  });
}

// SOURCE_REPUTATION_SCORES is now defined in src/lib/source-tiers.ts (imported above).

/**
 * Crypto relevance keywords for content scoring
 */
const CRYPTO_KEYWORDS = [
  "bitcoin",
  "btc",
  "ethereum",
  "eth",
  "crypto",
  "blockchain",
  "defi",
  "nft",
  "altcoin",
  "token",
  "mining",
  "wallet",
  "exchange",
  "trading",
  "stablecoin",
  "satoshi",
  "web3",
  "dao",
  "dapp",
  "smart contract",
  "layer 2",
  "rollup",
  "price",
  "bull",
  "bear",
  "halving",
  "node",
  "validator",
  "staking",
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
  const recencyScore = Math.min(
    80,
    Math.max(0, 100 * Math.exp(-ageInHours / 3)),
  );

  // Source reputation score - this is now more important
  const reputationScore =
    SOURCE_REPUTATION_SCORES[article.source] ||
    SOURCE_REPUTATION_SCORES["default"];

  // Crypto relevance score: check title and description for crypto keywords
  const searchText =
    `${article.title} ${article.description || ""}`.toLowerCase();
  const keywordMatches = CRYPTO_KEYWORDS.filter((keyword) =>
    searchText.includes(keyword),
  ).length;
  const relevanceScore = Math.min(100, keywordMatches * 15); // 15 points per keyword, max 100

  // Strong penalty for fintech/payments-only content that lacks crypto keywords
  const isFintech = isFintechSource(article.source);
  // If it's fintech AND has no crypto keywords, apply heavy penalty
  const hasCryptoRelevance = keywordMatches >= 2;
  const fintechPenalty = isFintech ? (hasCryptoRelevance ? 0.6 : 0.25) : 1.0;

  // Combined score: 55% reputation, 25% recency, 20% relevance
  // Reputation matters most to keep quality sources in top positions
  const baseScore =
    reputationScore * 0.55 + recencyScore * 0.25 + relevanceScore * 0.2;
  return baseScore * fintechPenalty;
}

/**
 * Domain-level concurrency limiter.
 *
 * Prevents firing 45+ simultaneous requests to medium.com (or similar)
 * which triggers 429 Too Many Requests. Each domain gets a semaphore with
 * a configurable max-concurrency (default 3).
 */
class DomainSemaphore {
  private queues = new Map<string, Array<() => void>>();
  private active = new Map<string, number>();
  /** Domains currently in 429 back-off with the timestamp they can resume. */
  private backoff = new Map<string, number>();
  private maxConcurrency: number;

  constructor(maxConcurrency = 3) {
    this.maxConcurrency = maxConcurrency;
  }

  /** Extract registrable domain (e.g. "medium.com" from "https://medium.com/feed/foo"). */
  static domainOf(url: string): string {
    try {
      const host = new URL(url).hostname; // e.g. "slowmist.medium.com"
      const parts = host.split(".");
      // Take last two parts for most TLDs (medium.com, mirror.xyz, grayscale.com)
      return parts.slice(-2).join(".");
    } catch {
      return "unknown";
    }
  }

  /** Mark a domain as rate-limited; no new requests for `ms` milliseconds. */
  markBackoff(domain: string, ms: number): void {
    this.backoff.set(domain, Date.now() + ms);
  }

  /** Check if a domain is currently in back-off. */
  isBackedOff(domain: string): boolean {
    const until = this.backoff.get(domain);
    if (!until) return false;
    if (Date.now() >= until) {
      this.backoff.delete(domain);
      return false;
    }
    return true;
  }

  /** Acquire a slot for the given domain; resolves when a slot is available. */
  acquire(domain: string): Promise<void> {
    const current = this.active.get(domain) || 0;
    if (current < this.maxConcurrency) {
      this.active.set(domain, current + 1);
      return Promise.resolve();
    }
    // Queue up
    return new Promise<void>((resolve) => {
      let queue = this.queues.get(domain);
      if (!queue) {
        queue = [];
        this.queues.set(domain, queue);
      }
      queue.push(resolve);
    });
  }

  /** Release a slot for the given domain. */
  release(domain: string): void {
    const queue = this.queues.get(domain);
    if (queue && queue.length > 0) {
      const next = queue.shift()!;
      if (queue.length === 0) this.queues.delete(domain);
      next(); // hand slot to next waiter (active count stays the same)
    } else {
      const current = this.active.get(domain) || 1;
      if (current <= 1) {
        this.active.delete(domain);
      } else {
        this.active.set(domain, current - 1);
      }
    }
  }
}

/**
 * Singleton domain semaphore — max 3 concurrent requests per domain.
 * This prevents 429s from medium.com (~45 feeds), mirror.xyz (~12 feeds), etc.
 */
const domainSemaphore = new DomainSemaphore(3);

/**
 * Fetch ALL sources in parallel with domain-level concurrency limiting.
 *
 * Each individual source already has a 3 s timeout (AbortController in
 * fetchFeed) so firing them all at once keeps total wall-clock time low.
 * The domain semaphore ensures we don't fire 45+ requests to medium.com
 * simultaneously, which was causing 429 rate-limit storms.
 */
async function fetchAllInParallel(
  sourceKeys: SourceKey[],
  fn: (key: SourceKey) => Promise<NewsArticle[]>,
): Promise<NewsArticle[]> {
  const results = await Promise.allSettled(sourceKeys.map(fn));
  const articles: NewsArticle[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
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
async function fetchMultipleSources(
  sourceKeys: SourceKey[],
  includeApiSources: boolean = true,
): Promise<NewsArticle[]> {
  // Build a stable aggregate cache key from the source set
  const isAllSources = sourceKeys.length === Object.keys(RSS_SOURCES).length;
  const aggregateKey = `aggregate:${isAllSources ? "all" : sourceKeys.slice().sort().join(",")}:api=${includeApiSources}`;

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
        console.warn(
          `[fetchMultipleSources] Aggregation exceeded ${AGGREGATION_TIMEOUT_MS}ms — returning partial results`,
        );
        resolve([]);
      }, AGGREGATION_TIMEOUT_MS),
    );

    const allArticles = await Promise.race([
      aggregationPromise,
      timeoutPromise,
    ]);

    // Deduplicate by title similarity
    const seen = new Set<string>();
    const deduped = allArticles.filter((article) => {
      // Normalize title for dedup
      const normalized = article.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 50);
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });

    const now = Date.now();
    return (
      deduped
        // Exclude future-dated articles (scheduled events, upcoming webinars, etc.)
        .filter((a) => new Date(a.pubDate).getTime() <= now)
        .sort(
          (a, b) =>
            new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
        )
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
  /** When true, restrict to HOMEPAGE_SOURCE_KEYS (curated T1/T2 sources) */
  homepageOnly?: boolean;
}

function filterByDateRange(
  articles: NewsArticle[],
  from?: Date | string,
  to?: Date | string,
): NewsArticle[] {
  let filtered = articles.filter((a) => a && a.pubDate);

  if (from) {
    const fromDate = typeof from === "string" ? new Date(from) : from;
    filtered = filtered.filter((a) => new Date(a.pubDate) >= fromDate);
  }

  if (to) {
    const toDate = typeof to === "string" ? new Date(to) : to;
    filtered = filtered.filter((a) => new Date(a.pubDate) <= toDate);
  }

  return filtered;
}

export async function getLatestNews(
  limit: number = 10,
  source?: string,
  options?: NewsQueryOptions,
): Promise<NewsResponse> {
  const normalizedLimit = Math.min(Math.max(1, limit), 50);

  let sourceKeys: SourceKey[];
  let includeApiSources = true;

  if (source && source in RSS_SOURCES) {
    sourceKeys = [source as SourceKey];
    // Don't mix in API sources when filtering by a specific RSS source
    includeApiSources = false;
  } else if (source) {
    // Source was provided but not found in RSS_SOURCES — return empty instead
    // of falling through to fetch ALL 350+ sources (which causes 429 storms
    // on medium.com, mirror.xyz, etc.)
    return {
      articles: [],
      totalCount: 0,
      sources: [],
      fetchedAt: new Date().toISOString(),
    } as NewsResponse;
  } else if (options?.category) {
    // Filter sources by category
    sourceKeys = (Object.keys(RSS_SOURCES) as SourceKey[]).filter(
      (key) => RSS_SOURCES[key].category === options.category,
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
  } else if (options?.homepageOnly) {
    // Restrict to curated homepage sources (T1/T2 only)
    sourceKeys = (Object.keys(RSS_SOURCES) as SourceKey[]).filter((k) =>
      HOMEPAGE_SOURCE_KEYS.has(k),
    );
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
    sources: sourceKeys.map((k) => RSS_SOURCES[k].name),
    fetchedAt: new Date().toISOString(),
    ...(options?.category && { category: options.category }),
    ...(options?.page && {
      pagination: {
        page,
        perPage,
        totalPages: Math.ceil(articles.length / perPage),
        hasMore: startIndex + perPage < articles.length,
      },
    }),
  } as NewsResponse;
}

export async function searchNews(
  keywords: string,
  limit: number = 10,
): Promise<NewsResponse> {
  const normalizedLimit = Math.min(Math.max(1, limit), 30);
  const searchTerms = (keywords || "")
    .toLowerCase()
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  // If no valid search terms, return empty result
  if (searchTerms.length === 0) {
    return {
      articles: [],
      totalCount: 0,
      sources: [],
      fetchedAt: new Date().toISOString(),
    };
  }

  const allArticles = await fetchMultipleSources(
    Object.keys(RSS_SOURCES) as SourceKey[],
  );

  const matchingArticles = allArticles.filter((article) => {
    if (!article?.title) return false;
    const searchText =
      `${article.title} ${article.description || ""}`.toLowerCase();
    return searchTerms.some((term) => searchText.includes(term));
  });

  return {
    articles: matchingArticles.slice(0, normalizedLimit),
    totalCount: matchingArticles.length,
    sources: [...new Set(matchingArticles.map((a) => a.source))],
    fetchedAt: new Date().toISOString(),
  };
}

export async function getBreakingNews(
  limit: number = 5,
): Promise<NewsResponse> {
  const normalizedLimit = Math.min(Math.max(1, limit), 20);
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const allArticles = await fetchMultipleSources(
    Object.keys(RSS_SOURCES) as SourceKey[],
  );

  const now = new Date();
  const recentArticles = allArticles.filter(
    (article) =>
      article &&
      article.pubDate &&
      new Date(article.pubDate) > twoHoursAgo &&
      new Date(article.pubDate) <= now, // exclude future-dated articles
  );

  return {
    articles: recentArticles.slice(0, normalizedLimit),
    totalCount: recentArticles.length,
    sources: [...new Set(recentArticles.map((a) => a.source))],
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Get trending news articles
 * Prioritizes reputable US sources and recent articles
 */
export async function getTrendingNews(
  limit: number = 10,
): Promise<NewsResponse> {
  const normalizedLimit = Math.min(Math.max(1, limit), 50);

  // Get recent articles (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const allArticles = await fetchMultipleSources(
    Object.keys(RSS_SOURCES) as SourceKey[],
  );

  const now = new Date();
  const recentArticles = allArticles.filter(
    (article) =>
      article &&
      article.pubDate &&
      new Date(article.pubDate) > oneDayAgo &&
      new Date(article.pubDate) <= now, // exclude future-dated articles
  );

  // Score and sort by trending score
  const scoredArticles = recentArticles.map((article) => ({
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
    sources: [...new Set(trendingArticles.map((a) => a.source))],
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Get news by category (bitcoin, ethereum, defi, nft, regulation, markets, etc.)
 */
export async function getNewsByCategory(
  category: string,
  limit: number = 30,
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

  // Prefer category-scoped sources to avoid fetching 350+ feeds.
  // Fall back to all sources only when no RSS_SOURCES match the category.
  const categorySources = (Object.keys(RSS_SOURCES) as SourceKey[]).filter(
    (key) => RSS_SOURCES[key].category === category.toLowerCase(),
  );
  const sourceKeysToFetch =
    categorySources.length > 0
      ? categorySources
      : (Object.keys(RSS_SOURCES) as SourceKey[]);

  const allArticles = await fetchMultipleSources(
    sourceKeysToFetch,
    categorySources.length === 0,
  );

  // Category keyword mappings
  const categoryKeywords: Record<string, string[]> = {
    bitcoin: [
      "bitcoin",
      "btc",
      "satoshi",
      "lightning",
      "halving",
      "miner",
      "ordinals",
      "inscription",
      "sats",
    ],
    ethereum: [
      "ethereum",
      "eth",
      "vitalik",
      "erc-20",
      "erc-721",
      "layer 2",
      "l2",
      "rollup",
      "arbitrum",
      "optimism",
      "base",
    ],
    defi: [
      "defi",
      "yield",
      "lending",
      "liquidity",
      "amm",
      "dex",
      "aave",
      "uniswap",
      "compound",
      "curve",
      "maker",
      "lido",
      "staking",
      "vault",
      "protocol",
      "tvl",
    ],
    nft: [
      "nft",
      "non-fungible",
      "opensea",
      "blur",
      "ordinals",
      "inscription",
      "collection",
      "pfp",
      "digital art",
    ],
    regulation: [
      "regulation",
      "sec",
      "cftc",
      "lawsuit",
      "legal",
      "compliance",
      "tax",
      "government",
      "congress",
      "senate",
      "bill",
      "law",
      "policy",
      "ban",
      "restrict",
    ],
    markets: [
      "market",
      "price",
      "trading",
      "bull",
      "bear",
      "rally",
      "crash",
      "etf",
      "futures",
      "options",
      "liquidation",
      "volume",
      "chart",
      "analysis",
    ],
    mining: [
      "mining",
      "miner",
      "hashrate",
      "difficulty",
      "pow",
      "proof of work",
      "asic",
      "pool",
    ],
    stablecoin: [
      "stablecoin",
      "usdt",
      "usdc",
      "dai",
      "tether",
      "circle",
      "peg",
      "depeg",
    ],
    exchange: [
      "exchange",
      "binance",
      "coinbase",
      "kraken",
      "okx",
      "bybit",
      "trading",
      "listing",
      "delist",
    ],
    layer2: [
      "layer 2",
      "l2",
      "rollup",
      "arbitrum",
      "optimism",
      "base",
      "zksync",
      "polygon",
      "scaling",
    ],
    geopolitical: [
      "geopolitical",
      "sanctions",
      "central bank",
      "federal reserve",
      "fed rate",
      "interest rate",
      "sec",
      "cftc",
      "policy",
      "war",
      "conflict",
      "tariff",
      "g7",
      "g20",
      "treasury",
      "congress",
      "eu regulation",
      "mica",
    ],
    security: [
      "hack",
      "exploit",
      "vulnerability",
      "audit",
      "rug pull",
      "scam",
      "phishing",
      "flash loan",
      "smart contract bug",
      "certik",
      "immunefi",
      "bounty",
    ],
    developer: [
      "developer",
      "sdk",
      "api",
      "framework",
      "tooling",
      "solidity",
      "rust",
      "smart contract",
      "deploy",
      "hardhat",
      "foundry",
      "alchemy",
    ],
  };

  const keywords = categoryKeywords[category.toLowerCase()] || [
    category.toLowerCase(),
  ];

  const filteredArticles = allArticles.filter((article) => {
    if (!article?.title) return false;

    // Check source category first
    if (article.category === category.toLowerCase()) return true;
    if (category === "bitcoin" && article.sourceKey === "bitcoinmagazine")
      return true;
    if (category === "defi" && article.sourceKey === "defiant") return true;

    // Then check keywords
    const searchText =
      `${article.title} ${article.description || ""}`.toLowerCase();
    return keywords.some((term) => searchText.includes(term));
  });

  return {
    articles: filteredArticles.slice(0, normalizedLimit),
    totalCount: filteredArticles.length,
    sources: [...new Set(filteredArticles.map((a) => a.source))],
    fetchedAt: new Date().toISOString(),
  };
}

export async function getSources(): Promise<{ sources: SourceInfo[] }> {
  // During production build, return sources without status checks to prevent
  // 60-second page timeout (200+ HEAD requests overwhelm build workers).
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return {
      sources: (Object.keys(RSS_SOURCES) as SourceKey[]).map((key) => ({
        key,
        name: RSS_SOURCES[key].name,
        url: RSS_SOURCES[key].url,
        category: RSS_SOURCES[key].category,
        status: "active" as const,
      })),
    };
  }

  return withCache(newsCache, "sources-list", 300, async () => {
    const SOURCES_TIMEOUT_MS = 15_000;
    const PER_REQUEST_TIMEOUT_MS = 3_000;

    const sourcesPromise = (async () => {
      const sourceChecks = await Promise.allSettled(
        (Object.keys(RSS_SOURCES) as SourceKey[]).map(async (key) => {
          const source = RSS_SOURCES[key];
          const controller = new AbortController();
          const timer = setTimeout(
            () => controller.abort(),
            PER_REQUEST_TIMEOUT_MS,
          );
          try {
            const response = await fetch(source.url, {
              method: "HEAD",
              signal: controller.signal,
              headers: { "User-Agent": "FreeCryptoNews/1.0" },
            });
            return {
              key,
              name: source.name,
              url: source.url,
              category: source.category,
              status: response.ok ? "active" : "unavailable",
            } as SourceInfo;
          } catch {
            return {
              key,
              name: source.name,
              url: source.url,
              category: source.category,
              status: "unavailable",
            } as SourceInfo;
          } finally {
            clearTimeout(timer);
          }
        }),
      );

      return sourceChecks
        .filter(
          (r): r is PromiseFulfilledResult<SourceInfo> =>
            r.status === "fulfilled",
        )
        .map((r) => r.value);
    })();

    // Fallback: return all sources as 'unknown' status if aggregate times out
    const timeoutPromise = new Promise<SourceInfo[]>((resolve) =>
      setTimeout(() => {
        console.warn(
          `[getSources] Exceeded ${SOURCES_TIMEOUT_MS}ms — returning sources without status check`,
        );
        resolve(
          (Object.keys(RSS_SOURCES) as SourceKey[]).map(
            (key) =>
              ({
                key,
                name: RSS_SOURCES[key].name,
                url: RSS_SOURCES[key].url,
                category: RSS_SOURCES[key].category,
                status: "unknown" as const,
              }) as SourceInfo,
          ),
        );
      }, SOURCES_TIMEOUT_MS),
    );

    return { sources: await Promise.race([sourcesPromise, timeoutPromise]) };
  });
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
  }>;
} {
  const categoryMeta: Record<string, { name: string; description: string }> = {
    general: { name: "General", description: "Broad crypto industry news" },
    bitcoin: {
      name: "Bitcoin",
      description: "Bitcoin-specific news and analysis",
    },
    defi: {
      name: "DeFi",
      description: "Decentralized finance protocols and yields",
    },
    nft: {
      name: "NFTs",
      description: "Non-fungible tokens and digital collectibles",
    },
    research: {
      name: "Research",
      description: "Deep-dive analysis and reports",
    },
    institutional: {
      name: "Institutional",
      description: "VC and institutional investor insights",
    },
    etf: { name: "ETFs", description: "Crypto ETF and asset manager news" },
    derivatives: {
      name: "Derivatives",
      description: "Options, futures, and structured products",
    },
    onchain: { name: "On-Chain", description: "Blockchain data and analytics" },
    fintech: {
      name: "Fintech",
      description: "Financial technology and payments",
    },
    macro: {
      name: "Macro",
      description: "Macroeconomic analysis and commentary",
    },
    quant: {
      name: "Quant",
      description: "Quantitative and systematic trading research",
    },
    journalism: {
      name: "Investigative",
      description: "In-depth journalism and exposés",
    },
    ethereum: { name: "Ethereum", description: "Ethereum ecosystem news" },
    asia: { name: "Asia", description: "Asian market coverage" },
    tradfi: { name: "TradFi", description: "Traditional finance institutions" },
    mainstream: {
      name: "Mainstream",
      description: "Major media crypto coverage",
    },
    mining: { name: "Mining", description: "Bitcoin mining and hashrate" },
    gaming: { name: "Gaming", description: "Blockchain gaming and metaverse" },
    altl1: { name: "Alt L1s", description: "Alternative layer-1 blockchains" },
    stablecoin: {
      name: "Stablecoins",
      description: "Stablecoin and CBDC news",
    },
    geopolitical: {
      name: "Geopolitical",
      description:
        "Macro-geopolitical events, central bank policy, and regulation that move crypto markets",
    },
    security: {
      name: "Security",
      description: "Smart contract audits, exploits, and blockchain security",
    },
    developer: {
      name: "Developer",
      description:
        "Web3 developer tools, infrastructure, and technical updates",
    },
    layer2: {
      name: "Layer 2",
      description: "Layer 2 scaling solutions and rollup ecosystems",
    },
    solana: {
      name: "Solana",
      description: "Solana ecosystem news and updates",
    },
    trading: {
      name: "Trading",
      description: "Market analysis, trading signals, and technical analysis",
    },
  };

  // Count sources per category
  const sourceCounts: Record<string, number> = {};
  for (const key of Object.keys(RSS_SOURCES) as SourceKey[]) {
    const cat = RSS_SOURCES[key].category;
    sourceCounts[cat] = (sourceCounts[cat] || 0) + 1;
  }

  return {
    categories: Object.entries(categoryMeta)
      .map(([id, meta]) => ({
        id,
        name: meta.name,
        description: meta.description,
        sourceCount: sourceCounts[id] || 0,
      }))
      .filter((c) => c.sourceCount > 0)
      .sort((a, b) => b.sourceCount - a.sourceCount),
  };
}

// Convenience function for DeFi-specific news
export async function getDefiNews(limit: number = 10): Promise<NewsResponse> {
  return getNewsByCategory("defi", limit);
}

// Convenience function for Bitcoin-specific news
export async function getBitcoinNews(
  limit: number = 10,
): Promise<NewsResponse> {
  return getNewsByCategory("bitcoin", limit);
}

// Convenience function for Ethereum-specific news
export async function getEthereumNews(
  limit: number = 10,
): Promise<NewsResponse> {
  return getNewsByCategory("ethereum", limit);
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
} from "./international-sources";

export type {
  InternationalSource,
  InternationalArticle,
  InternationalNewsResponse,
  InternationalNewsOptions,
} from "./international-sources";

// Re-export translation functions
export {
  translateInternationalArticles,
  translateInternationalNewsResponse,
  isTranslationAvailable,
  getInternationalTranslationCacheStats,
  clearInternationalTranslationCache,
} from "./source-translator";

/**
 * Get combined news from both English and international sources
 * Returns a mixed feed sorted by publication date
 */
export async function getGlobalNews(
  limit: number = 20,
  options?: {
    includeInternational?: boolean;
    translateInternational?: boolean;
    languages?: ("ko" | "zh" | "ja" | "es")[];
  },
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
  const { getInternationalNews: fetchIntlNews } =
    await import("./international-sources");
  const {
    translateInternationalNewsResponse: translateIntlNews,
    isTranslationAvailable: checkTranslation,
  } = await import("./source-translator");

  // Fetch international news
  let intlNews = await fetchIntlNews({
    language: languages?.length === 1 ? languages[0] : "all",
    limit: Math.ceil(normalizedLimit / 2),
  });

  // Translate if requested and available
  if (translateInternational && checkTranslation()) {
    try {
      intlNews = await translateIntlNews(intlNews);
    } catch (error) {
      console.warn("Failed to translate international news:", error);
    }
  }

  // Filter by specific languages if provided
  let intlArticles = intlNews.articles;
  if (languages && languages.length > 0) {
    intlArticles = intlArticles.filter((a) =>
      languages.includes(a.language as "ko" | "zh" | "ja" | "es"),
    );
  }

  // Convert international articles to standard format
  const convertedIntlArticles: NewsArticle[] = intlArticles.map((article) => ({
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
    .sort(
      (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
    )
    .slice(0, normalizedLimit);

  return {
    articles: allArticles,
    totalCount: englishNews.totalCount + intlNews.total,
    sources: [
      ...englishNews.sources,
      ...new Set(intlArticles.map((a) => a.source)),
    ],
    fetchedAt: new Date().toISOString(),
    internationalCount: convertedIntlArticles.length,
  };
}

/**
 * Filter out feed metadata items that aren't real news articles.
 * Removes mempool spam, raw ticker pairs, hashrate data, price alerts, and extremely short titles.
 */
function isActualNews(a: NewsArticle): boolean {
  const title = (a.title || "").trim();
  // Skip mempool/blockchain status items (₿ / ⚡ prefix)
  if (title.startsWith("₿") || title.startsWith("⚡")) return false;
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

  const sourceKeys = (Object.keys(RSS_SOURCES) as SourceKey[]).filter((k) =>
    HOMEPAGE_SOURCE_KEYS.has(k),
  );
  const allArticles = await fetchMultipleSources(sourceKeys, true);

  // --- Latest (filtered to remove spam/metadata items) ---
  const latestArticles = allArticles.filter(isActualNews).slice(0, latestLimit);

  // --- Breaking (last 2 hours) ---
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const breakingArticles = allArticles
    .filter((a) => a?.pubDate && new Date(a.pubDate) > twoHoursAgo)
    .filter(isActualNews)
    .slice(0, breakingLimit);

  // --- Trending (last 24 hours, scored) ---
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentArticles = allArticles
    .filter((a) => a?.pubDate && new Date(a.pubDate) > oneDayAgo)
    .filter(isActualNews);

  const scoredArticles = recentArticles
    .map((article) => ({ article, score: calculateTrendingScore(article) }))
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
      sources: sourceKeys.map((k) => RSS_SOURCES[k].name),
      fetchedAt: now,
    } as NewsResponse,
    breaking: {
      articles: breakingArticles,
      totalCount: breakingArticles.length,
      sources: [...new Set(breakingArticles.map((a) => a.source))],
      fetchedAt: now,
    } as NewsResponse,
    trending: {
      articles: trendingArticles,
      totalCount: trendingArticles.length,
      sources: [...new Set(trendingArticles.map((a) => a.source))],
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
export function getSourceInfo(
  sourceKey: string,
): { name: string; url: string; category: string } | null {
  const source = RSS_SOURCES[sourceKey as SourceKey];
  if (!source) return null;
  return {
    name: source.name,
    url: source.url,
    category: source.category,
  };
}

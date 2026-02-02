/**
 * International Crypto News Sources
 * 
 * Aggregates news from 75 international crypto news sources across 18 languages:
 * - Korean (ko): 9 sources - Block Media, TokenPost, CoinDesk Korea, Decenter, Cobak, The B.Chain, Upbit Blog, Blockchain Today Korea, CryptoQuant Blog
 * - Chinese (zh): 10 sources - 8BTC, Jinse Finance, Odaily, ChainNews, PANews, TechFlow, Foresight News, BlockBeats, MarsBit, Wu Blockchain
 * - Japanese (ja): 6 sources - CoinPost, CoinDesk Japan, Cointelegraph Japan, btcnews.jp, Crypto Times Japan, CoinJinja
 * - Spanish (es): 5 sources - Cointelegraph Español, Diario Bitcoin, CriptoNoticias, BeInCrypto Español, Bitcoiner Today
 * - Portuguese (pt): 5 sources - Cointelegraph Brasil, Livecoins, Portal do Bitcoin, BeInCrypto Brasil, Bitcoin Block
 * - German (de): 4 sources - BTC-ECHO, Cointelegraph Deutsch, Coincierge, CryptoMonday
 * - French (fr): 4 sources - Journal du Coin, Cryptonaute, Cointelegraph France, Cryptoast
 * - Russian (ru): 3 sources - ForkLog, Cointelegraph Russia, Bits.Media
 * - Turkish (tr): 3 sources - Cointelegraph Türkçe, Koin Medya, Coinsider
 * - Italian (it): 3 sources - Cointelegraph Italia, The Cryptonomist, Criptovalute.it
 * - Indonesian (id): 3 sources - Cointelegraph Indonesia, Blockchain Media, Pintu Academy
 * - Dutch (nl): 2 sources - Bitcoin Magazine NL, Crypto Insiders
 * - Polish (pl): 2 sources - Kryptowaluty.pl, Bitcoin.pl
 * - Vietnamese (vi): 2 sources - Tạp chí Bitcoin, Coin68
 * - Thai (th): 2 sources - Siam Blockchain, Bitcoin Addict Thailand
 * - Arabic (ar): 2 sources - Cointelegraph Arabic, ArabiCrypto
 * - Hindi (hi): 5 sources - CoinSwitch, CoinDCX, WazirX, ZebPay, Crypto News India
 * - Persian/Farsi (fa): 4 sources - Arz Digital, Mihan Blockchain, Ramz Arz, Nobitex
 * 
 * Supports automatic translation to English via the source-translator module.
 */

import sanitizeHtml from 'sanitize-html';
import { newsCache, withCache } from './cache';

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export interface InternationalSource {
  key: string;
  name: string;
  url: string;
  rss: string;
  language: 'ko' | 'zh' | 'ja' | 'es' | 'pt' | 'de' | 'fr' | 'ru' | 'tr' | 'it' | 'id' | 'nl' | 'pl' | 'vi' | 'th' | 'ar' | 'hi' | 'fa';
  category: string;
  region: 'asia' | 'europe' | 'latam' | 'mena' | 'sea';
  encoding?: string;
}

export interface InternationalArticle {
  id: string;
  title: string;
  titleEnglish?: string;
  description: string;
  descriptionEnglish?: string;
  link: string;
  source: string;
  sourceKey: string;
  language: string;
  pubDate: string;
  category: string;
  region: 'asia' | 'europe' | 'latam' | 'mena' | 'sea';
  timeAgo: string;
}

export interface InternationalNewsResponse {
  articles: InternationalArticle[];
  total: number;
  languages: string[];
  regions: string[];
  translated: boolean;
}

// ═══════════════════════════════════════════════════════════════
// SOURCE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const KOREAN_SOURCES: InternationalSource[] = [
  {
    key: 'blockmedia',
    name: 'Block Media',
    url: 'https://www.blockmedia.co.kr',
    rss: 'https://www.blockmedia.co.kr/feed/',
    language: 'ko',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'tokenpost',
    name: 'TokenPost',
    url: 'https://www.tokenpost.kr',
    rss: 'https://www.tokenpost.kr/rss',
    language: 'ko',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'coindeskkorea',
    name: 'CoinDesk Korea',
    url: 'https://www.coindeskkorea.com',
    rss: 'https://www.coindeskkorea.com/feed/',
    language: 'ko',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'blockchaintoday_ko',
    name: 'Blockchain Today Korea',
    url: 'https://www.blockchaintoday.co.kr',
    rss: 'https://www.blockchaintoday.co.kr/rss/',
    language: 'ko',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'decenter',
    name: 'Decenter',
    url: 'https://decenter.kr',
    rss: 'https://decenter.kr/rss/allArticle.xml',
    language: 'ko',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'thebchain',
    name: 'The B.Chain',
    url: 'https://www.thebchain.co.kr',
    rss: 'https://www.thebchain.co.kr/rss/',
    language: 'ko',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'cryptoquant_blog',
    name: 'CryptoQuant Blog',
    url: 'https://cryptoquant.com/blog',
    rss: 'https://cryptoquant.com/blog/feed/',
    language: 'ko',
    category: 'analysis',
    region: 'asia',
  },
  {
    key: 'cobak',
    name: 'Cobak',
    url: 'https://cobak.co.kr',
    rss: 'https://cobak.co.kr/feed/',
    language: 'ko',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'upbit_blog',
    name: 'Upbit Blog',
    url: 'https://upbit.com/service_center/notice',
    rss: 'https://upbit.com/service_center/notice/feed/',
    language: 'ko',
    category: 'exchange',
    region: 'asia',
  },
];

const CHINESE_SOURCES: InternationalSource[] = [
  {
    key: '8btc',
    name: '8BTC (巴比特)',
    url: 'https://www.8btc.com',
    rss: 'https://www.8btc.com/feed',
    language: 'zh',
    category: 'general',
    region: 'asia',
    encoding: 'UTF-8',
  },
  {
    key: 'jinse',
    name: 'Jinse Finance (金色财经)',
    url: 'https://www.jinse.com',
    rss: 'https://www.jinse.com/rss',
    language: 'zh',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'odaily',
    name: 'Odaily (星球日报)',
    url: 'https://www.odaily.news',
    rss: 'https://www.odaily.news/rss',
    language: 'zh',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'chainnews',
    name: 'ChainNews (链闻)',
    url: 'https://www.chainnews.com',
    rss: 'https://www.chainnews.com/rss',
    language: 'zh',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'panewslab',
    name: 'PANews (PA财经)',
    url: 'https://www.panewslab.com',
    rss: 'https://www.panewslab.com/rss',
    language: 'zh',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'techflow',
    name: 'TechFlow (深潮)',
    url: 'https://www.techflowpost.com',
    rss: 'https://www.techflowpost.com/rss',
    language: 'zh',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'foresightnews',
    name: 'Foresight News',
    url: 'https://foresightnews.pro',
    rss: 'https://foresightnews.pro/rss',
    language: 'zh',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'blockbeats',
    name: 'BlockBeats (律动)',
    url: 'https://www.theblockbeats.info',
    rss: 'https://www.theblockbeats.info/rss',
    language: 'zh',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'marsbit',
    name: 'MarsBit (火星财经)',
    url: 'https://news.marsbit.co',
    rss: 'https://news.marsbit.co/rss',
    language: 'zh',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'wublockchain',
    name: 'Wu Blockchain',
    url: 'https://wublock.substack.com',
    rss: 'https://wublock.substack.com/feed',
    language: 'zh',
    category: 'analysis',
    region: 'asia',
  },
];

const JAPANESE_SOURCES: InternationalSource[] = [
  {
    key: 'coinpost',
    name: 'CoinPost',
    url: 'https://coinpost.jp',
    rss: 'https://coinpost.jp/rss',
    language: 'ja',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'coindeskjapan',
    name: 'CoinDesk Japan',
    url: 'https://www.coindeskjapan.com',
    rss: 'https://www.coindeskjapan.com/feed/',
    language: 'ja',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'cointelegraphjp',
    name: 'Cointelegraph Japan',
    url: 'https://jp.cointelegraph.com',
    rss: 'https://jp.cointelegraph.com/rss',
    language: 'ja',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'btcnewsjp',
    name: 'btcnews.jp',
    url: 'https://btcnews.jp',
    rss: 'https://btcnews.jp/feed/',
    language: 'ja',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'crypto_times_jp',
    name: 'Crypto Times Japan',
    url: 'https://crypto-times.jp',
    rss: 'https://crypto-times.jp/feed/',
    language: 'ja',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'coinjinja',
    name: 'CoinJinja',
    url: 'https://www.coinjinja.com',
    rss: 'https://www.coinjinja.com/feed/',
    language: 'ja',
    category: 'general',
    region: 'asia',
  },
];

const SPANISH_SOURCES: InternationalSource[] = [
  {
    key: 'cointelegraphes',
    name: 'Cointelegraph Español',
    url: 'https://es.cointelegraph.com',
    rss: 'https://es.cointelegraph.com/rss',
    language: 'es',
    category: 'general',
    region: 'latam',
  },
  {
    key: 'diariobitcoin',
    name: 'Diario Bitcoin',
    url: 'https://www.diariobitcoin.com',
    rss: 'https://www.diariobitcoin.com/feed/',
    language: 'es',
    category: 'general',
    region: 'latam',
  },
  {
    key: 'criptonoticias',
    name: 'CriptoNoticias',
    url: 'https://www.criptonoticias.com',
    rss: 'https://www.criptonoticias.com/feed/',
    language: 'es',
    category: 'general',
    region: 'latam',
  },
  {
    key: 'beincryptoes',
    name: 'BeInCrypto Español',
    url: 'https://es.beincrypto.com',
    rss: 'https://es.beincrypto.com/feed/',
    language: 'es',
    category: 'general',
    region: 'latam',
  },
  {
    key: 'bitcoinertoday',
    name: 'Bitcoiner Today',
    url: 'https://bitcoinertoday.com',
    rss: 'https://bitcoinertoday.com/feed/',
    language: 'es',
    category: 'general',
    region: 'latam',
  },
];

// ═══════════════════════════════════════════════════════════════
// NEW: PORTUGUESE SOURCES (Brazil & Portugal)
// ═══════════════════════════════════════════════════════════════
const PORTUGUESE_SOURCES: InternationalSource[] = [
  {
    key: 'cointelegraphbr',
    name: 'Cointelegraph Brasil',
    url: 'https://br.cointelegraph.com',
    rss: 'https://br.cointelegraph.com/rss',
    language: 'pt',
    category: 'general',
    region: 'latam',
  },
  {
    key: 'livecoins',
    name: 'Livecoins',
    url: 'https://livecoins.com.br',
    rss: 'https://livecoins.com.br/feed/',
    language: 'pt',
    category: 'general',
    region: 'latam',
  },
  {
    key: 'portaldobitcoin',
    name: 'Portal do Bitcoin',
    url: 'https://portaldobitcoin.uol.com.br',
    rss: 'https://portaldobitcoin.uol.com.br/feed/',
    language: 'pt',
    category: 'general',
    region: 'latam',
  },
  {
    key: 'beincryptopr',
    name: 'BeInCrypto Brasil',
    url: 'https://br.beincrypto.com',
    rss: 'https://br.beincrypto.com/feed/',
    language: 'pt',
    category: 'general',
    region: 'latam',
  },
  {
    key: 'bitcoinblock',
    name: 'Bitcoin Block',
    url: 'https://bitcoinblock.com.br',
    rss: 'https://bitcoinblock.com.br/feed/',
    language: 'pt',
    category: 'bitcoin',
    region: 'latam',
  },
];

// ═══════════════════════════════════════════════════════════════
// NEW: GERMAN SOURCES
// ═══════════════════════════════════════════════════════════════
const GERMAN_SOURCES: InternationalSource[] = [
  {
    key: 'btcecho',
    name: 'BTC-ECHO',
    url: 'https://www.btc-echo.de',
    rss: 'https://www.btc-echo.de/feed/',
    language: 'de',
    category: 'general',
    region: 'europe',
  },
  {
    key: 'cointelegraphde',
    name: 'Cointelegraph Deutsch',
    url: 'https://de.cointelegraph.com',
    rss: 'https://de.cointelegraph.com/rss',
    language: 'de',
    category: 'general',
    region: 'europe',
  },
  {
    key: 'coincierge',
    name: 'Coincierge',
    url: 'https://coincierge.de',
    rss: 'https://coincierge.de/feed/',
    language: 'de',
    category: 'general',
    region: 'europe',
  },
  {
    key: 'cryptomonday',
    name: 'CryptoMonday',
    url: 'https://cryptomonday.de',
    rss: 'https://cryptomonday.de/feed/',
    language: 'de',
    category: 'general',
    region: 'europe',
  },
];

// ═══════════════════════════════════════════════════════════════
// NEW: FRENCH SOURCES
// ═══════════════════════════════════════════════════════════════
const FRENCH_SOURCES: InternationalSource[] = [
  {
    key: 'journalducoin',
    name: 'Journal du Coin',
    url: 'https://journalducoin.com',
    rss: 'https://journalducoin.com/feed/',
    language: 'fr',
    category: 'general',
    region: 'europe',
  },
  {
    key: 'cryptonaute',
    name: 'Cryptonaute',
    url: 'https://cryptonaute.fr',
    rss: 'https://cryptonaute.fr/feed/',
    language: 'fr',
    category: 'general',
    region: 'europe',
  },
  {
    key: 'cointelegraphfr',
    name: 'Cointelegraph France',
    url: 'https://fr.cointelegraph.com',
    rss: 'https://fr.cointelegraph.com/rss',
    language: 'fr',
    category: 'general',
    region: 'europe',
  },
  {
    key: 'cryptoast',
    name: 'Cryptoast',
    url: 'https://cryptoast.fr',
    rss: 'https://cryptoast.fr/feed/',
    language: 'fr',
    category: 'general',
    region: 'europe',
  },
];

// ═══════════════════════════════════════════════════════════════
// NEW: RUSSIAN SOURCES
// ═══════════════════════════════════════════════════════════════
const RUSSIAN_SOURCES: InternationalSource[] = [
  {
    key: 'forklog',
    name: 'ForkLog',
    url: 'https://forklog.com',
    rss: 'https://forklog.com/feed/',
    language: 'ru',
    category: 'general',
    region: 'europe',
  },
  {
    key: 'cointelegraphru',
    name: 'Cointelegraph Russia',
    url: 'https://ru.cointelegraph.com',
    rss: 'https://ru.cointelegraph.com/rss',
    language: 'ru',
    category: 'general',
    region: 'europe',
  },
  {
    key: 'bits_media',
    name: 'Bits.Media',
    url: 'https://bits.media',
    rss: 'https://bits.media/rss/',
    language: 'ru',
    category: 'general',
    region: 'europe',
  },
];

// ═══════════════════════════════════════════════════════════════
// NEW: TURKISH SOURCES
// ═══════════════════════════════════════════════════════════════
const TURKISH_SOURCES: InternationalSource[] = [
  {
    key: 'cointelegraphtr',
    name: 'Cointelegraph Türkçe',
    url: 'https://tr.cointelegraph.com',
    rss: 'https://tr.cointelegraph.com/rss',
    language: 'tr',
    category: 'general',
    region: 'europe',
  },
  {
    key: 'koinmedya',
    name: 'Koin Medya',
    url: 'https://koinmedya.com',
    rss: 'https://koinmedya.com/feed/',
    language: 'tr',
    category: 'general',
    region: 'europe',
  },
  {
    key: 'coinsider',
    name: 'Coinsider',
    url: 'https://coinsider.com.tr',
    rss: 'https://coinsider.com.tr/feed/',
    language: 'tr',
    category: 'general',
    region: 'europe',
  },
];

// ═══════════════════════════════════════════════════════════════
// NEW: ITALIAN SOURCES
// ═══════════════════════════════════════════════════════════════
const ITALIAN_SOURCES: InternationalSource[] = [
  {
    key: 'cointelegraphit',
    name: 'Cointelegraph Italia',
    url: 'https://it.cointelegraph.com',
    rss: 'https://it.cointelegraph.com/rss',
    language: 'it',
    category: 'general',
    region: 'europe',
  },
  {
    key: 'cryptonomist',
    name: 'The Cryptonomist',
    url: 'https://it.cryptonomist.ch',
    rss: 'https://it.cryptonomist.ch/feed/',
    language: 'it',
    category: 'general',
    region: 'europe',
  },
  {
    key: 'criptovaluteit',
    name: 'Criptovalute.it',
    url: 'https://www.criptovalute.it',
    rss: 'https://www.criptovalute.it/feed/',
    language: 'it',
    category: 'general',
    region: 'europe',
  },
];

// ═══════════════════════════════════════════════════════════════
// NEW: INDONESIAN SOURCES
// ═══════════════════════════════════════════════════════════════
const INDONESIAN_SOURCES: InternationalSource[] = [
  {
    key: 'cointelegraphid',
    name: 'Cointelegraph Indonesia',
    url: 'https://id.cointelegraph.com',
    rss: 'https://id.cointelegraph.com/rss',
    language: 'id',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'blockchainmedia',
    name: 'Blockchain Media',
    url: 'https://blockchainmedia.id',
    rss: 'https://blockchainmedia.id/feed/',
    language: 'id',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'pintu_academy',
    name: 'Pintu Academy',
    url: 'https://pintu.co.id/academy',
    rss: 'https://pintu.co.id/academy/feed/',
    language: 'id',
    category: 'education',
    region: 'asia',
  },
];

// ═══════════════════════════════════════════════════════════════
// NEW: DUTCH SOURCES
// ═══════════════════════════════════════════════════════════════
const DUTCH_SOURCES: InternationalSource[] = [
  {
    key: 'bitcoinmagazine_nl',
    name: 'Bitcoin Magazine NL',
    url: 'https://bitcoinmagazine.nl',
    rss: 'https://bitcoinmagazine.nl/feed/',
    language: 'nl',
    category: 'bitcoin',
    region: 'europe',
  },
  {
    key: 'crypto_insiders',
    name: 'Crypto Insiders',
    url: 'https://www.crypto-insiders.nl',
    rss: 'https://www.crypto-insiders.nl/feed/',
    language: 'nl',
    category: 'general',
    region: 'europe',
  },
  {
    key: 'blox_nl',
    name: 'Blox',
    url: 'https://blox.nl',
    rss: 'https://blox.nl/nieuws/feed/',
    language: 'nl',
    category: 'general',
    region: 'europe',
  },
];

// ═══════════════════════════════════════════════════════════════
// NEW: POLISH SOURCES
// ═══════════════════════════════════════════════════════════════
const POLISH_SOURCES: InternationalSource[] = [
  {
    key: 'kryptowaluty',
    name: 'Kryptowaluty.pl',
    url: 'https://kryptowaluty.pl',
    rss: 'https://kryptowaluty.pl/feed/',
    language: 'pl',
    category: 'general',
    region: 'europe',
  },
  {
    key: 'bitcoin_pl',
    name: 'Bitcoin.pl',
    url: 'https://bitcoin.pl',
    rss: 'https://bitcoin.pl/feed/',
    language: 'pl',
    category: 'bitcoin',
    region: 'europe',
  },
  {
    key: 'comparic',
    name: 'Comparic',
    url: 'https://comparic.pl',
    rss: 'https://comparic.pl/feed/',
    language: 'pl',
    category: 'trading',
    region: 'europe',
  },
];

// ═══════════════════════════════════════════════════════════════
// NEW: VIETNAMESE SOURCES
// ═══════════════════════════════════════════════════════════════
const VIETNAMESE_SOURCES: InternationalSource[] = [
  {
    key: 'tapchibitcoin',
    name: 'Tạp chí Bitcoin',
    url: 'https://tapchibitcoin.io',
    rss: 'https://tapchibitcoin.io/feed/',
    language: 'vi',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'coin68',
    name: 'Coin68',
    url: 'https://coin68.com',
    rss: 'https://coin68.com/feed/',
    language: 'vi',
    category: 'general',
    region: 'asia',
  },
];

// ═══════════════════════════════════════════════════════════════
// NEW: THAI SOURCES
// ═══════════════════════════════════════════════════════════════
const THAI_SOURCES: InternationalSource[] = [
  {
    key: 'siamblockchain',
    name: 'Siam Blockchain',
    url: 'https://siamblockchain.com',
    rss: 'https://siamblockchain.com/feed/',
    language: 'th',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'bitcoinaddictth',
    name: 'Bitcoin Addict Thailand',
    url: 'https://bitcoinaddict.org',
    rss: 'https://bitcoinaddict.org/feed/',
    language: 'th',
    category: 'general',
    region: 'asia',
  },
];

// ═══════════════════════════════════════════════════════════════
// NEW: ARABIC SOURCES
// ═══════════════════════════════════════════════════════════════
const ARABIC_SOURCES: InternationalSource[] = [
  {
    key: 'cointelegraphar',
    name: 'Cointelegraph Arabic',
    url: 'https://ar.cointelegraph.com',
    rss: 'https://ar.cointelegraph.com/rss',
    language: 'ar',
    category: 'general',
    region: 'mena',
  },
  {
    key: 'arabicrypto',
    name: 'ArabiCrypto',
    url: 'https://arabicrypto.io',
    rss: 'https://arabicrypto.io/feed/',
    language: 'ar',
    category: 'general',
    region: 'mena',
  },
];

// ═══════════════════════════════════════════════════════════════
// NEW: HINDI / INDIAN SOURCES
// ═══════════════════════════════════════════════════════════════
const HINDI_SOURCES: InternationalSource[] = [
  {
    key: 'coinswitch',
    name: 'CoinSwitch Kuber Blog',
    url: 'https://coinswitch.co/blog',
    rss: 'https://coinswitch.co/blog/feed',
    language: 'hi',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'coindcx',
    name: 'CoinDCX Blog',
    url: 'https://coindcx.com/blog',
    rss: 'https://coindcx.com/blog/feed/',
    language: 'hi',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'wazirx',
    name: 'WazirX Blog',
    url: 'https://wazirx.com/blog',
    rss: 'https://wazirx.com/blog/feed/',
    language: 'hi',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'zebpay',
    name: 'ZebPay Blog',
    url: 'https://zebpay.com/blog',
    rss: 'https://zebpay.com/blog/feed/',
    language: 'hi',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'cryptonewsindia',
    name: 'Crypto News India',
    url: 'https://cryptonewsindia.com',
    rss: 'https://cryptonewsindia.com/feed/',
    language: 'hi',
    category: 'general',
    region: 'asia',
  },
];

// ═══════════════════════════════════════════════════════════════
// NEW: PERSIAN / FARSI SOURCES
// ═══════════════════════════════════════════════════════════════
const PERSIAN_SOURCES: InternationalSource[] = [
  {
    key: 'arzdigital',
    name: 'Arz Digital (ارز دیجیتال)',
    url: 'https://arzdigital.com',
    rss: 'https://arzdigital.com/feed/',
    language: 'fa',
    category: 'general',
    region: 'mena',
  },
  {
    key: 'mihanblockchain',
    name: 'Mihan Blockchain (میهن بلاکچین)',
    url: 'https://mihanblockchain.com',
    rss: 'https://mihanblockchain.com/feed/',
    language: 'fa',
    category: 'general',
    region: 'mena',
  },
  {
    key: 'ramzarz',
    name: 'Ramz Arz (رمزارز)',
    url: 'https://ramzarz.news',
    rss: 'https://ramzarz.news/feed/',
    language: 'fa',
    category: 'general',
    region: 'mena',
  },
  {
    key: 'nobitex',
    name: 'Nobitex Blog',
    url: 'https://nobitex.ir/blog',
    rss: 'https://nobitex.ir/blog/feed/',
    language: 'fa',
    category: 'general',
    region: 'mena',
  },
];

// All international sources combined
export const INTERNATIONAL_SOURCES: InternationalSource[] = [
  ...KOREAN_SOURCES,
  ...CHINESE_SOURCES,
  ...JAPANESE_SOURCES,
  ...SPANISH_SOURCES,
  ...PORTUGUESE_SOURCES,
  ...GERMAN_SOURCES,
  ...FRENCH_SOURCES,
  ...RUSSIAN_SOURCES,
  ...TURKISH_SOURCES,
  ...ITALIAN_SOURCES,
  ...INDONESIAN_SOURCES,
  ...DUTCH_SOURCES,
  ...POLISH_SOURCES,
  ...VIETNAMESE_SOURCES,
  ...THAI_SOURCES,
  ...ARABIC_SOURCES,
  ...HINDI_SOURCES,
  ...PERSIAN_SOURCES,
];

// Source lookup by language
export const SOURCES_BY_LANGUAGE: Record<string, InternationalSource[]> = {
  ko: KOREAN_SOURCES,
  zh: CHINESE_SOURCES,
  ja: JAPANESE_SOURCES,
  es: SPANISH_SOURCES,
  pt: PORTUGUESE_SOURCES,
  de: GERMAN_SOURCES,
  fr: FRENCH_SOURCES,
  ru: RUSSIAN_SOURCES,
  tr: TURKISH_SOURCES,
  it: ITALIAN_SOURCES,
  id: INDONESIAN_SOURCES,
  nl: DUTCH_SOURCES,
  pl: POLISH_SOURCES,
  vi: VIETNAMESE_SOURCES,
  th: THAI_SOURCES,
  ar: ARABIC_SOURCES,
  hi: HINDI_SOURCES,
  fa: PERSIAN_SOURCES,
};

// Source lookup by region
export const SOURCES_BY_REGION: Record<string, InternationalSource[]> = {
  asia: [...KOREAN_SOURCES, ...CHINESE_SOURCES, ...JAPANESE_SOURCES, ...HINDI_SOURCES],
  latam: [...SPANISH_SOURCES, ...PORTUGUESE_SOURCES],
  europe: [...GERMAN_SOURCES, ...FRENCH_SOURCES, ...RUSSIAN_SOURCES, ...TURKISH_SOURCES, ...ITALIAN_SOURCES, ...DUTCH_SOURCES, ...POLISH_SOURCES],
  mena: [...ARABIC_SOURCES, ...PERSIAN_SOURCES],
  sea: [...INDONESIAN_SOURCES, ...VIETNAMESE_SOURCES, ...THAI_SOURCES],
};

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a unique article ID from source and link
 */
function generateArticleId(sourceKey: string, link: string): string {
  const hash = link
    .split('')
    .reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
  return `${sourceKey}-${Math.abs(hash).toString(36)}`;
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

/**
 * Sanitize and truncate description
 */
function sanitizeDescription(raw: string): string {
  if (!raw) return '';

  const sanitized = sanitizeHtml(raw, {
    allowedTags: [],
    allowedAttributes: {},
  });

  return sanitized.trim().slice(0, 300);
}

/**
 * Decode HTML entities in text
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }

  // Handle numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));

  return decoded;
}

// ═══════════════════════════════════════════════════════════════
// RSS PARSING
// ═══════════════════════════════════════════════════════════════

/**
 * Parse RSS XML to extract articles for international sources
 * Handles different encodings and RSS formats
 */
export function parseInternationalRSSFeed(
  xml: string,
  source: InternationalSource
): InternationalArticle[] {
  const articles: InternationalArticle[] = [];

  // Regex patterns for RSS item extraction
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  const titleRegex = /<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/i;
  const linkRegex = /<link>(.*?)<\/link>|<link><!\[CDATA\[(.*?)\]\]>|<link[^>]*href="([^"]*)"[^>]*\/?>/i;
  const descRegex = /<description><!\[CDATA\[([\s\S]*?)\]\]>|<description>([\s\S]*?)<\/description>/i;
  const pubDateRegex = /<pubDate>(.*?)<\/pubDate>|<dc:date>(.*?)<\/dc:date>|<published>(.*?)<\/published>/i;
  const contentRegex = /<content:encoded><!\[CDATA\[([\s\S]*?)\]\]>|<content:encoded>([\s\S]*?)<\/content:encoded>/i;

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const titleMatch = itemXml.match(titleRegex);
    const linkMatch = itemXml.match(linkRegex);
    const descMatch = itemXml.match(descRegex);
    const pubDateMatch = itemXml.match(pubDateRegex);
    const contentMatch = itemXml.match(contentRegex);

    let title = (titleMatch?.[1] || titleMatch?.[2] || '').trim();
    const link = (linkMatch?.[1] || linkMatch?.[2] || linkMatch?.[3] || '').trim();
    let description = sanitizeDescription(
      descMatch?.[1] || descMatch?.[2] || contentMatch?.[1] || contentMatch?.[2] || ''
    );
    const pubDateStr = pubDateMatch?.[1] || pubDateMatch?.[2] || pubDateMatch?.[3] || '';

    // Decode HTML entities
    title = decodeHtmlEntities(title);
    description = decodeHtmlEntities(description);

    if (title && link) {
      const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();
      const articleId = generateArticleId(source.key, link);

      articles.push({
        id: articleId,
        title,
        description,
        link,
        source: source.name,
        sourceKey: source.key,
        language: source.language,
        pubDate: pubDate.toISOString(),
        category: source.category,
        region: source.region,
        timeAgo: getTimeAgo(pubDate),
      });
    }
  }

  return articles;
}

// ═══════════════════════════════════════════════════════════════
// SOURCE FETCHING
// ═══════════════════════════════════════════════════════════════

// Track source health
const sourceHealth: Map<string, { failures: number; lastCheck: number }> = new Map();

/**
 * Check if a source is healthy (not too many recent failures)
 */
function isSourceHealthy(sourceKey: string): boolean {
  const health = sourceHealth.get(sourceKey);
  if (!health) return true;

  // Reset failures after 1 hour
  if (Date.now() - health.lastCheck > 3600000) {
    sourceHealth.delete(sourceKey);
    return true;
  }

  // Mark as unhealthy after 3 consecutive failures
  return health.failures < 3;
}

/**
 * Record a source fetch result
 */
function recordSourceResult(sourceKey: string, success: boolean): void {
  const health = sourceHealth.get(sourceKey) || { failures: 0, lastCheck: Date.now() };

  if (success) {
    health.failures = 0;
  } else {
    health.failures++;
  }
  health.lastCheck = Date.now();

  sourceHealth.set(sourceKey, health);
}

/**
 * Fetch RSS feed from an international source with caching
 */
async function fetchInternationalFeed(source: InternationalSource): Promise<InternationalArticle[]> {
  const cacheKey = `intl-feed:${source.key}`;

  // Skip unhealthy sources
  if (!isSourceHealthy(source.key)) {
    console.warn(`Skipping unhealthy source: ${source.name}`);
    return [];
  }

  return withCache(newsCache, cacheKey, 300, async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for international sources

      const response = await fetch(source.rss, {
        headers: {
          Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml',
          'User-Agent': 'FreeCryptoNews/1.0 (github.com/nirholas/free-crypto-news)',
          'Accept-Charset': 'UTF-8',
        },
        signal: controller.signal,
        next: { revalidate: 300 },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Failed to fetch ${source.name}: ${response.status}`);
        recordSourceResult(source.key, false);
        return [];
      }

      // Get response as array buffer to handle different encodings
      const buffer = await response.arrayBuffer();
      let xml: string;

      // Try to detect encoding from content-type header or XML declaration
      const contentType = response.headers.get('content-type') || '';
      const encodingMatch = contentType.match(/charset=([^\s;]+)/i);
      let encoding = encodingMatch?.[1]?.toUpperCase() || source.encoding || 'UTF-8';

      // Common encoding mappings
      const encodingMap: Record<string, string> = {
        'GB2312': 'GBK',
        'GB18030': 'GBK',
      };
      encoding = encodingMap[encoding] || encoding;

      try {
        const decoder = new TextDecoder(encoding);
        xml = decoder.decode(buffer);
      } catch {
        // Fallback to UTF-8
        const decoder = new TextDecoder('UTF-8');
        xml = decoder.decode(buffer);
      }

      const articles = parseInternationalRSSFeed(xml, source);
      recordSourceResult(source.key, true);
      return articles;
    } catch (error) {
      console.warn(`Error fetching ${source.name}:`, error);
      recordSourceResult(source.key, false);
      return [];
    }
  });
}

/**
 * Fetch from multiple international sources in parallel
 */
async function fetchMultipleInternationalSources(
  sources: InternationalSource[]
): Promise<InternationalArticle[]> {
  const results = await Promise.allSettled(sources.map((source) => fetchInternationalFeed(source)));

  const articles: InternationalArticle[] = [];
  const seenLinks = new Set<string>();

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const article of result.value) {
        // Deduplicate by link
        if (!seenLinks.has(article.link)) {
          seenLinks.add(article.link);
          articles.push(article);
        }
      }
    }
  }

  return articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

export interface InternationalNewsOptions {
  language?: 'ko' | 'zh' | 'ja' | 'es' | 'pt' | 'de' | 'fr' | 'ru' | 'tr' | 'it' | 'nl' | 'pl' | 'id' | 'vi' | 'th' | 'ar' | 'all';
  region?: 'asia' | 'europe' | 'latam' | 'mena' | 'sea' | 'all';
  limit?: number;
}

/**
 * Get international news articles
 */
export async function getInternationalNews(
  options: InternationalNewsOptions = {}
): Promise<InternationalNewsResponse> {
  const { language = 'all', region = 'all', limit = 20 } = options;
  const normalizedLimit = Math.min(Math.max(1, limit), 100);

  // Determine which sources to fetch from
  let sources: InternationalSource[] = [];

  if (language !== 'all') {
    sources = SOURCES_BY_LANGUAGE[language] || [];
  } else if (region !== 'all') {
    sources = SOURCES_BY_REGION[region] || [];
  } else {
    sources = INTERNATIONAL_SOURCES;
  }

  // Apply region filter if both language and region specified
  if (language !== 'all' && region !== 'all') {
    sources = sources.filter((s) => s.region === region);
  }

  const articles = await fetchMultipleInternationalSources(sources);
  const limitedArticles = articles.slice(0, normalizedLimit);

  // Collect unique languages and regions
  const uniqueLanguages = [...new Set(limitedArticles.map((a) => a.language))];
  const uniqueRegions = [...new Set(limitedArticles.map((a) => a.region))];

  return {
    articles: limitedArticles,
    total: articles.length,
    languages: uniqueLanguages,
    regions: uniqueRegions,
    translated: false, // Will be set to true by the translator
  };
}

/**
 * Get news by specific language
 */
export async function getNewsByLanguage(
  language: 'ko' | 'zh' | 'ja' | 'es',
  limit: number = 20
): Promise<InternationalNewsResponse> {
  return getInternationalNews({ language, limit });
}

/**
 * Get news by region
 */
export async function getNewsByRegion(
  region: 'asia' | 'latam',
  limit: number = 20
): Promise<InternationalNewsResponse> {
  return getInternationalNews({ region, limit });
}

/**
 * Get all available international sources with their status
 */
export async function getInternationalSources(): Promise<{
  sources: Array<InternationalSource & { status: 'active' | 'unavailable' | 'degraded' }>;
}> {
  const sourceStatuses = INTERNATIONAL_SOURCES.map((source) => {
    const health = sourceHealth.get(source.key);
    let status: 'active' | 'unavailable' | 'degraded' = 'active';

    if (health) {
      if (health.failures >= 3) {
        status = 'unavailable';
      } else if (health.failures > 0) {
        status = 'degraded';
      }
    }

    return {
      ...source,
      status,
    };
  });

  return { sources: sourceStatuses };
}

/**
 * Get source health statistics
 */
export function getSourceHealthStats(): {
  healthy: number;
  degraded: number;
  unhealthy: number;
  total: number;
} {
  let healthy = 0;
  let degraded = 0;
  let unhealthy = 0;

  for (const source of INTERNATIONAL_SOURCES) {
    const health = sourceHealth.get(source.key);
    if (!health || health.failures === 0) {
      healthy++;
    } else if (health.failures >= 3) {
      unhealthy++;
    } else {
      degraded++;
    }
  }

  return {
    healthy,
    degraded,
    unhealthy,
    total: INTERNATIONAL_SOURCES.length,
  };
}

/**
 * Clear source health data (for testing or reset)
 */
export function resetSourceHealth(): void {
  sourceHealth.clear();
}

// Export source arrays for external use
export { KOREAN_SOURCES, CHINESE_SOURCES, JAPANESE_SOURCES, SPANISH_SOURCES };

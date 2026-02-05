/**
 * Source Page - News from a specific publisher
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Posts from '@/components/Posts';
import { getLatestNews } from '@/lib/crypto-news';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Enable on-demand ISR for sources not pre-rendered
export const dynamicParams = true;

// Source metadata - 82 sources total (7 English + 75 International)
const sourceInfo: Record<string, {
  name: string;
  description: string;
  website: string;
  twitter?: string;
  focus: string[];
  founded?: string;
  language?: string;
  region?: string;
}> = {
  // ═══════════════════════════════════════════════════════════════
  // ENGLISH SOURCES
  // ═══════════════════════════════════════════════════════════════
  coindesk: {
    name: 'CoinDesk',
    description: 'CoinDesk is a leading media platform for the crypto asset and blockchain technology community. Founded in 2013, CoinDesk provides news, data, events, research, and educational content.',
    website: 'https://www.coindesk.com',
    twitter: 'CoinDesk',
    focus: ['News', 'Markets', 'Research', 'Events'],
    founded: '2013',
    language: 'English',
    region: 'Global',
  },
  theblock: {
    name: 'The Block',
    description: 'The Block is a leading research, analysis, and news publication in the digital asset space. Known for in-depth journalism and comprehensive market research.',
    website: 'https://www.theblock.co',
    twitter: 'TheBlock__',
    focus: ['Research', 'Analysis', 'Data', 'Enterprise'],
    founded: '2018',
    language: 'English',
    region: 'Global',
  },
  decrypt: {
    name: 'Decrypt',
    description: 'Decrypt is a media company providing news, information, and educational content about cryptocurrencies, blockchain technology, and the decentralized web.',
    website: 'https://decrypt.co',
    twitter: 'decaborating',
    focus: ['News', 'Learn', 'Culture', 'Gaming'],
    founded: '2018',
    language: 'English',
    region: 'Global',
  },
  cointelegraph: {
    name: 'CoinTelegraph',
    description: 'Cointelegraph is the leading independent digital media resource covering a wide range of news on blockchain technology, crypto assets, and emerging fintech trends.',
    website: 'https://cointelegraph.com',
    twitter: 'Cointelegraph',
    focus: ['News', 'Markets', 'Magazine', 'Research'],
    founded: '2013',
    language: 'English',
    region: 'Global',
  },
  bitcoinmagazine: {
    name: 'Bitcoin Magazine',
    description: 'Bitcoin Magazine is the oldest and most established source of news, information and expert commentary on Bitcoin. Focused exclusively on Bitcoin and its ecosystem.',
    website: 'https://bitcoinmagazine.com',
    twitter: 'BitcoinMagazine',
    focus: ['Bitcoin', 'Lightning', 'Culture', 'Events'],
    founded: '2011',
    language: 'English',
    region: 'Global',
  },
  blockworks: {
    name: 'Blockworks',
    description: 'Blockworks is a financial media brand that delivers breaking news and premium insights about digital assets to investors worldwide.',
    website: 'https://blockworks.co',
    twitter: 'Blockworks_',
    focus: ['Institutional', 'Markets', 'Research', 'Podcasts'],
    founded: '2018',
    language: 'English',
    region: 'Global',
  },
  defiant: {
    name: 'The Defiant',
    description: 'The Defiant is the leading news site for DeFi and Web3. Covering decentralized finance, DAOs, NFTs, and the open financial system.',
    website: 'https://thedefiant.io',
    twitter: 'DefiantNews',
    focus: ['DeFi', 'DAOs', 'Web3', 'Tutorials'],
    founded: '2019',
    language: 'English',
    region: 'Global',
  },

  // ═══════════════════════════════════════════════════════════════
  // KOREAN SOURCES
  // ═══════════════════════════════════════════════════════════════
  blockmedia: {
    name: 'Block Media',
    description: 'Leading Korean crypto news outlet covering blockchain, cryptocurrency markets, and Korean crypto regulations.',
    website: 'https://www.blockmedia.co.kr',
    focus: ['News', 'Markets', 'Korea'],
    language: 'Korean',
    region: 'Asia',
  },
  tokenpost: {
    name: 'TokenPost',
    description: 'Major Korean cryptocurrency news platform with comprehensive coverage of global and Korean crypto markets.',
    website: 'https://www.tokenpost.kr',
    focus: ['News', 'Markets', 'Analysis'],
    language: 'Korean',
    region: 'Asia',
  },
  coindeskkorea: {
    name: 'CoinDesk Korea',
    description: 'Korean edition of CoinDesk, providing localized crypto news and market analysis for Korean readers.',
    website: 'https://www.coindeskkorea.com',
    focus: ['News', 'Markets', 'Korea'],
    language: 'Korean',
    region: 'Asia',
  },
  decenter: {
    name: 'Decenter',
    description: 'Korean blockchain and crypto news from the digital economy perspective.',
    website: 'https://decenter.kr',
    focus: ['Blockchain', 'Economy', 'Tech'],
    language: 'Korean',
    region: 'Asia',
  },

  // ═══════════════════════════════════════════════════════════════
  // CHINESE SOURCES
  // ═══════════════════════════════════════════════════════════════
  '8btc': {
    name: '8BTC (巴比特)',
    description: 'One of China\'s earliest and most influential crypto media platforms, founded in 2011.',
    website: 'https://www.8btc.com',
    focus: ['News', 'Research', 'Community'],
    language: 'Chinese',
    region: 'Asia',
    founded: '2011',
  },
  jinsefinance: {
    name: 'Jinse Finance (金色财经)',
    description: 'Major Chinese crypto and blockchain news platform with extensive market coverage.',
    website: 'https://www.jinse.com',
    focus: ['News', 'Markets', 'DeFi'],
    language: 'Chinese',
    region: 'Asia',
  },
  odaily: {
    name: 'Odaily (星球日报)',
    description: 'Leading Chinese blockchain media covering crypto news, projects, and market analysis.',
    website: 'https://www.odaily.news',
    focus: ['News', 'Projects', 'Analysis'],
    language: 'Chinese',
    region: 'Asia',
  },
  panews: {
    name: 'PANews (PA财经)',
    description: 'Chinese crypto news platform focusing on blockchain industry and market developments.',
    website: 'https://www.panewslab.com',
    focus: ['News', 'Industry', 'Markets'],
    language: 'Chinese',
    region: 'Asia',
  },
  blockbeats: {
    name: 'BlockBeats (律动)',
    description: 'Chinese blockchain media known for deep dives into DeFi, NFTs, and Web3 projects.',
    website: 'https://www.theblockbeats.info',
    focus: ['DeFi', 'NFT', 'Web3'],
    language: 'Chinese',
    region: 'Asia',
  },
  wublockchain: {
    name: 'Wu Blockchain',
    description: 'Influential Chinese crypto journalist covering mining, exchanges, and China crypto policy.',
    website: 'https://wublock.substack.com',
    twitter: 'WuBlockchain',
    focus: ['Mining', 'China', 'Policy'],
    language: 'Chinese',
    region: 'Asia',
  },

  // ═══════════════════════════════════════════════════════════════
  // JAPANESE SOURCES
  // ═══════════════════════════════════════════════════════════════
  coinpost: {
    name: 'CoinPost',
    description: 'Japan\'s largest crypto news platform with comprehensive market coverage and analysis.',
    website: 'https://coinpost.jp',
    focus: ['News', 'Markets', 'Japan'],
    language: 'Japanese',
    region: 'Asia',
  },
  coindeskjapan: {
    name: 'CoinDesk Japan',
    description: 'Japanese edition of CoinDesk, providing localized crypto news for Japanese readers.',
    website: 'https://www.coindeskjapan.com',
    focus: ['News', 'Markets', 'Japan'],
    language: 'Japanese',
    region: 'Asia',
  },
  cointelegraphjapan: {
    name: 'Cointelegraph Japan',
    description: 'Japanese edition of Cointelegraph covering global and Japanese crypto markets.',
    website: 'https://jp.cointelegraph.com',
    focus: ['News', 'Markets', 'Analysis'],
    language: 'Japanese',
    region: 'Asia',
  },

  // ═══════════════════════════════════════════════════════════════
  // SPANISH SOURCES
  // ═══════════════════════════════════════════════════════════════
  cointelegraphes: {
    name: 'Cointelegraph Español',
    description: 'Spanish edition of Cointelegraph covering Latin American and global crypto markets.',
    website: 'https://es.cointelegraph.com',
    focus: ['News', 'Markets', 'LatAm'],
    language: 'Spanish',
    region: 'Latin America',
  },
  diariobitcoin: {
    name: 'Diario Bitcoin',
    description: 'Spanish-language crypto news covering Latin American markets and global developments.',
    website: 'https://www.diariobitcoin.com',
    focus: ['News', 'LatAm', 'Markets'],
    language: 'Spanish',
    region: 'Latin America',
  },
  criptonoticias: {
    name: 'CriptoNoticias',
    description: 'Leading Spanish crypto news platform with focus on Latin American adoption.',
    website: 'https://www.criptonoticias.com',
    focus: ['News', 'Adoption', 'LatAm'],
    language: 'Spanish',
    region: 'Latin America',
  },
  beincryptoes: {
    name: 'BeInCrypto Español',
    description: 'Spanish edition of BeInCrypto with Latin American crypto coverage.',
    website: 'https://es.beincrypto.com',
    focus: ['News', 'Markets', 'Education'],
    language: 'Spanish',
    region: 'Latin America',
  },

  // ═══════════════════════════════════════════════════════════════
  // PORTUGUESE SOURCES
  // ═══════════════════════════════════════════════════════════════
  cointelegraphbrasil: {
    name: 'Cointelegraph Brasil',
    description: 'Brazilian edition of Cointelegraph covering Brazilian and global crypto markets.',
    website: 'https://br.cointelegraph.com',
    focus: ['News', 'Brazil', 'Markets'],
    language: 'Portuguese',
    region: 'Latin America',
  },
  livecoins: {
    name: 'Livecoins',
    description: 'Brazilian crypto news portal with market analysis and trading insights.',
    website: 'https://livecoins.com.br',
    focus: ['News', 'Trading', 'Brazil'],
    language: 'Portuguese',
    region: 'Latin America',
  },
  portaldobitcoin: {
    name: 'Portal do Bitcoin',
    description: 'Major Brazilian crypto news platform covering markets and adoption in Brazil.',
    website: 'https://portaldobitcoin.uol.com.br',
    focus: ['News', 'Brazil', 'Adoption'],
    language: 'Portuguese',
    region: 'Latin America',
  },

  // ═══════════════════════════════════════════════════════════════
  // GERMAN SOURCES
  // ═══════════════════════════════════════════════════════════════
  btcecho: {
    name: 'BTC-ECHO',
    description: 'Germany\'s leading crypto news platform with comprehensive market coverage.',
    website: 'https://www.btc-echo.de',
    focus: ['News', 'Markets', 'Germany'],
    language: 'German',
    region: 'Europe',
    founded: '2014',
  },
  cointelegraphde: {
    name: 'Cointelegraph Deutsch',
    description: 'German edition of Cointelegraph covering European and global crypto markets.',
    website: 'https://de.cointelegraph.com',
    focus: ['News', 'Markets', 'Europe'],
    language: 'German',
    region: 'Europe',
  },
  cryptomonday: {
    name: 'CryptoMonday',
    description: 'German crypto news and education platform with market analysis.',
    website: 'https://cryptomonday.de',
    focus: ['News', 'Education', 'Germany'],
    language: 'German',
    region: 'Europe',
  },

  // ═══════════════════════════════════════════════════════════════
  // FRENCH SOURCES
  // ═══════════════════════════════════════════════════════════════
  journalducoin: {
    name: 'Journal du Coin',
    description: 'France\'s leading crypto news platform with in-depth market analysis.',
    website: 'https://journalducoin.com',
    focus: ['News', 'Analysis', 'France'],
    language: 'French',
    region: 'Europe',
  },
  cryptonaute: {
    name: 'Cryptonaute',
    description: 'French crypto news and trading platform with market insights.',
    website: 'https://cryptonaute.fr',
    focus: ['News', 'Trading', 'France'],
    language: 'French',
    region: 'Europe',
  },
  cointelegraphfr: {
    name: 'Cointelegraph France',
    description: 'French edition of Cointelegraph covering European and global crypto.',
    website: 'https://fr.cointelegraph.com',
    focus: ['News', 'Markets', 'Europe'],
    language: 'French',
    region: 'Europe',
  },
  cryptoast: {
    name: 'Cryptoast',
    description: 'French crypto news and education platform with comprehensive coverage.',
    website: 'https://cryptoast.fr',
    focus: ['News', 'Education', 'France'],
    language: 'French',
    region: 'Europe',
  },

  // ═══════════════════════════════════════════════════════════════
  // RUSSIAN SOURCES
  // ═══════════════════════════════════════════════════════════════
  forklog: {
    name: 'ForkLog',
    description: 'Leading Russian-language crypto news platform covering CIS markets.',
    website: 'https://forklog.com',
    focus: ['News', 'CIS', 'Markets'],
    language: 'Russian',
    region: 'Europe',
  },
  cointelegraphru: {
    name: 'Cointelegraph Russia',
    description: 'Russian edition of Cointelegraph covering Russian and global crypto markets.',
    website: 'https://ru.cointelegraph.com',
    focus: ['News', 'Russia', 'Markets'],
    language: 'Russian',
    region: 'Europe',
  },
  bitsmedia: {
    name: 'Bits.Media',
    description: 'Russian crypto news platform with market analysis and mining coverage.',
    website: 'https://bits.media',
    focus: ['News', 'Mining', 'Russia'],
    language: 'Russian',
    region: 'Europe',
  },

  // ═══════════════════════════════════════════════════════════════
  // TURKISH SOURCES
  // ═══════════════════════════════════════════════════════════════
  cointelegraphtr: {
    name: 'Cointelegraph Türkçe',
    description: 'Turkish edition of Cointelegraph covering Turkish and global crypto markets.',
    website: 'https://tr.cointelegraph.com',
    focus: ['News', 'Turkey', 'Markets'],
    language: 'Turkish',
    region: 'MENA',
  },
  koinmedya: {
    name: 'Koin Medya',
    description: 'Turkish crypto news platform with local market focus.',
    website: 'https://koinmedya.com',
    focus: ['News', 'Turkey', 'Markets'],
    language: 'Turkish',
    region: 'MENA',
  },

  // ═══════════════════════════════════════════════════════════════
  // ITALIAN SOURCES
  // ═══════════════════════════════════════════════════════════════
  cointelegraphit: {
    name: 'Cointelegraph Italia',
    description: 'Italian edition of Cointelegraph covering Italian and European crypto markets.',
    website: 'https://it.cointelegraph.com',
    focus: ['News', 'Italy', 'Europe'],
    language: 'Italian',
    region: 'Europe',
  },
  cryptonomist: {
    name: 'The Cryptonomist',
    description: 'Italian crypto news platform with comprehensive market coverage.',
    website: 'https://cryptonomist.ch',
    focus: ['News', 'Markets', 'Italy'],
    language: 'Italian',
    region: 'Europe',
  },

  // ═══════════════════════════════════════════════════════════════
  // INDONESIAN SOURCES
  // ═══════════════════════════════════════════════════════════════
  cointelegraphid: {
    name: 'Cointelegraph Indonesia',
    description: 'Indonesian edition of Cointelegraph covering SEA crypto markets.',
    website: 'https://id.cointelegraph.com',
    focus: ['News', 'Indonesia', 'SEA'],
    language: 'Indonesian',
    region: 'Southeast Asia',
  },
  pintuacademy: {
    name: 'Pintu Academy',
    description: 'Indonesian crypto education and news platform from Pintu exchange.',
    website: 'https://pintu.co.id/academy',
    focus: ['Education', 'Indonesia', 'Trading'],
    language: 'Indonesian',
    region: 'Southeast Asia',
  },

  // ═══════════════════════════════════════════════════════════════
  // DUTCH SOURCES
  // ═══════════════════════════════════════════════════════════════
  bitcoinmagazinenl: {
    name: 'Bitcoin Magazine NL',
    description: 'Dutch Bitcoin news and education platform.',
    website: 'https://bitcoinmagazine.nl',
    focus: ['Bitcoin', 'Netherlands', 'News'],
    language: 'Dutch',
    region: 'Europe',
  },
  cryptoinsiders: {
    name: 'Crypto Insiders',
    description: 'Dutch crypto news platform with market analysis and trading insights.',
    website: 'https://www.crypto-insiders.nl',
    focus: ['News', 'Trading', 'Netherlands'],
    language: 'Dutch',
    region: 'Europe',
  },

  // ═══════════════════════════════════════════════════════════════
  // POLISH SOURCES
  // ═══════════════════════════════════════════════════════════════
  kryptowaluty: {
    name: 'Kryptowaluty.pl',
    description: 'Polish crypto news portal with market coverage.',
    website: 'https://kryptowaluty.pl',
    focus: ['News', 'Poland', 'Markets'],
    language: 'Polish',
    region: 'Europe',
  },
  bitcoinpl: {
    name: 'Bitcoin.pl',
    description: 'Polish Bitcoin and crypto news platform.',
    website: 'https://bitcoin.pl',
    focus: ['Bitcoin', 'Poland', 'News'],
    language: 'Polish',
    region: 'Europe',
  },

  // ═══════════════════════════════════════════════════════════════
  // VIETNAMESE SOURCES
  // ═══════════════════════════════════════════════════════════════
  tapchibitcoin: {
    name: 'Tạp chí Bitcoin',
    description: 'Vietnamese Bitcoin and crypto news magazine.',
    website: 'https://tapchibitcoin.io',
    focus: ['Bitcoin', 'Vietnam', 'News'],
    language: 'Vietnamese',
    region: 'Southeast Asia',
  },
  coin68: {
    name: 'Coin68',
    description: 'Vietnamese crypto news platform with comprehensive market coverage.',
    website: 'https://coin68.com',
    focus: ['News', 'Vietnam', 'Markets'],
    language: 'Vietnamese',
    region: 'Southeast Asia',
  },

  // ═══════════════════════════════════════════════════════════════
  // THAI SOURCES
  // ═══════════════════════════════════════════════════════════════
  siamblockchain: {
    name: 'Siam Blockchain',
    description: 'Thailand\'s leading crypto news platform.',
    website: 'https://siamblockchain.com',
    focus: ['News', 'Thailand', 'SEA'],
    language: 'Thai',
    region: 'Southeast Asia',
  },
  bitcoinaddictthailand: {
    name: 'Bitcoin Addict Thailand',
    description: 'Thai Bitcoin and crypto news community.',
    website: 'https://bitcoinaddict.org',
    focus: ['Bitcoin', 'Thailand', 'Community'],
    language: 'Thai',
    region: 'Southeast Asia',
  },

  // ═══════════════════════════════════════════════════════════════
  // ARABIC SOURCES
  // ═══════════════════════════════════════════════════════════════
  cointelegraphar: {
    name: 'Cointelegraph Arabic',
    description: 'Arabic edition of Cointelegraph covering MENA crypto markets.',
    website: 'https://ar.cointelegraph.com',
    focus: ['News', 'MENA', 'Markets'],
    language: 'Arabic',
    region: 'MENA',
  },
  arabicrypto: {
    name: 'ArabiCrypto',
    description: 'Arabic crypto news platform covering Middle East markets.',
    website: 'https://arabicrypto.com',
    focus: ['News', 'Middle East', 'Markets'],
    language: 'Arabic',
    region: 'MENA',
  },

  // ═══════════════════════════════════════════════════════════════
  // INDIAN/HINDI SOURCES
  // ═══════════════════════════════════════════════════════════════
  coinswitchkuber: {
    name: 'CoinSwitch Kuber Blog',
    description: 'Indian crypto exchange blog with market news and education.',
    website: 'https://coinswitch.co/blog',
    focus: ['News', 'India', 'Education'],
    language: 'English/Hindi',
    region: 'South Asia',
  },
  coindcx: {
    name: 'CoinDCX Blog',
    description: 'Indian crypto exchange blog with market analysis.',
    website: 'https://blog.coindcx.com',
    focus: ['News', 'India', 'Trading'],
    language: 'English/Hindi',
    region: 'South Asia',
  },
  wazirx: {
    name: 'WazirX Blog',
    description: 'Indian crypto exchange blog with regulatory news and market updates.',
    website: 'https://wazirx.com/blog',
    focus: ['News', 'India', 'Regulation'],
    language: 'English/Hindi',
    region: 'South Asia',
  },

  // ═══════════════════════════════════════════════════════════════
  // PERSIAN/FARSI SOURCES
  // ═══════════════════════════════════════════════════════════════
  arzdigital: {
    name: 'Arz Digital (ارز دیجیتال)',
    description: 'Iran\'s leading crypto news and education platform.',
    website: 'https://arzdigital.com',
    focus: ['News', 'Iran', 'Education'],
    language: 'Persian',
    region: 'MENA',
  },
  mihanblockchain: {
    name: 'Mihan Blockchain (میهن بلاکچین)',
    description: 'Persian crypto news platform covering Iranian market.',
    website: 'https://mihanblockchain.com',
    focus: ['News', 'Iran', 'Blockchain'],
    language: 'Persian',
    region: 'MENA',
  },

  // ═══════════════════════════════════════════════════════════════
  // MORE ENGLISH SOURCES
  // ═══════════════════════════════════════════════════════════════
  unchained: {
    name: 'Unchained',
    description: 'Crypto news and podcast platform by Laura Shin with in-depth interviews.',
    website: 'https://unchainedcrypto.com',
    twitter: 'Unchained_pod',
    focus: ['Podcasts', 'Interviews', 'Analysis'],
    founded: '2017',
    language: 'English',
    region: 'Global',
  },
  bankless: {
    name: 'Bankless',
    description: 'Leading Web3 media platform focused on DeFi, DAOs, and Ethereum.',
    website: 'https://www.bankless.com',
    twitter: 'BanklessHQ',
    focus: ['DeFi', 'Ethereum', 'Web3', 'Podcasts'],
    founded: '2019',
    language: 'English',
    region: 'Global',
  },
  dailyhodl: {
    name: 'The Daily Hodl',
    description: 'Crypto news covering Bitcoin, Ethereum, XRP, and altcoins.',
    website: 'https://dailyhodl.com',
    twitter: 'TheDailyHodl',
    focus: ['News', 'Altcoins', 'Markets'],
    language: 'English',
    region: 'Global',
  },
  cryptoslate: {
    name: 'CryptoSlate',
    description: 'Crypto news and research platform with comprehensive coin data.',
    website: 'https://cryptoslate.com',
    twitter: 'CryptoSlate',
    focus: ['News', 'Research', 'Data'],
    founded: '2017',
    language: 'English',
    region: 'Global',
  },
  cryptobriefing: {
    name: 'Crypto Briefing',
    description: 'In-depth crypto research, analysis, and news.',
    website: 'https://cryptobriefing.com',
    twitter: 'CryptoBriefing',
    focus: ['Research', 'Analysis', 'DeFi'],
    language: 'English',
    region: 'Global',
  },
  ambcrypto: {
    name: 'AMBCrypto',
    description: 'Crypto news and analysis platform covering global markets.',
    website: 'https://ambcrypto.com',
    twitter: 'AMBCrypto',
    focus: ['News', 'Analysis', 'Markets'],
    language: 'English',
    region: 'Global',
  },
  beincrypto: {
    name: 'BeInCrypto',
    description: 'Global crypto news platform with educational content.',
    website: 'https://beincrypto.com',
    twitter: 'beaborating',
    focus: ['News', 'Education', 'Markets'],
    language: 'English',
    region: 'Global',
  },
  newsbtc: {
    name: 'NewsBTC',
    description: 'Bitcoin and crypto news with technical analysis.',
    website: 'https://www.newsbtc.com',
    twitter: 'newsaborating',
    focus: ['News', 'Technical Analysis', 'Bitcoin'],
    language: 'English',
    region: 'Global',
  },
  cryptopotato: {
    name: 'CryptoPotato',
    description: 'Crypto news and market analysis platform.',
    website: 'https://cryptopotato.com',
    twitter: 'Crypto_Potato',
    focus: ['News', 'Markets', 'Guides'],
    language: 'English',
    region: 'Global',
  },
  u_today: {
    name: 'U.Today',
    description: 'Crypto and blockchain news platform.',
    website: 'https://u.today',
    twitter: 'Uaborating',
    focus: ['News', 'Markets', 'Analysis'],
    language: 'English',
    region: 'Global',
  },

  // ═══════════════════════════════════════════════════════════════
  // ADDITIONAL ASIAN SOURCES
  // ═══════════════════════════════════════════════════════════════
  cryptonews: {
    name: 'CryptoNews',
    description: 'Multi-language crypto news platform with global coverage.',
    website: 'https://cryptonews.com',
    focus: ['News', 'Markets', 'Global'],
    language: 'English',
    region: 'Global',
  },
  bitcoinist: {
    name: 'Bitcoinist',
    description: 'Bitcoin and crypto news with market analysis.',
    website: 'https://bitcoinist.com',
    twitter: 'bitcoinist',
    focus: ['Bitcoin', 'News', 'Markets'],
    language: 'English',
    region: 'Global',
  },
  cryptoglobe: {
    name: 'CryptoGlobe',
    description: 'Crypto news and analysis platform.',
    website: 'https://www.cryptoglobe.com',
    focus: ['News', 'Markets', 'Analysis'],
    language: 'English',
    region: 'Global',
  },
  zycrypto: {
    name: 'ZyCrypto',
    description: 'Crypto news covering Bitcoin, Ethereum, and altcoins.',
    website: 'https://zycrypto.com',
    focus: ['News', 'Altcoins', 'Markets'],
    language: 'English',
    region: 'Global',
  },
  finbold: {
    name: 'Finbold',
    description: 'Finance and crypto news platform.',
    website: 'https://finbold.com',
    focus: ['Finance', 'Crypto', 'Markets'],
    language: 'English',
    region: 'Global',
  },
  coingape: {
    name: 'CoinGape',
    description: 'Crypto news and market analysis.',
    website: 'https://coingape.com',
    twitter: 'CoinGape',
    focus: ['News', 'Markets', 'Analysis'],
    language: 'English',
    region: 'Global',
  },
  cryptopolitan: {
    name: 'Cryptopolitan',
    description: 'Global crypto news and analysis platform.',
    website: 'https://www.cryptopolitan.com',
    focus: ['News', 'Analysis', 'Markets'],
    language: 'English',
    region: 'Global',
  },
  nftevening: {
    name: 'NFT Evening',
    description: 'NFT and Web3 news platform.',
    website: 'https://nftevening.com',
    focus: ['NFT', 'Web3', 'Art'],
    language: 'English',
    region: 'Global',
  },
  nftnow: {
    name: 'nft now',
    description: 'Leading NFT media and culture platform.',
    website: 'https://nftnow.com',
    twitter: 'naborating_',
    focus: ['NFT', 'Culture', 'Art'],
    language: 'English',
    region: 'Global',
  },

  // ═══════════════════════════════════════════════════════════════
  // SPECIALIZED SOURCES
  // ═══════════════════════════════════════════════════════════════
  dlnews: {
    name: 'DL News',
    description: 'Crypto investigative journalism and news.',
    website: 'https://www.dlnews.com',
    twitter: 'DaboratingNews',
    focus: ['Investigation', 'News', 'Analysis'],
    language: 'English',
    region: 'Global',
  },
  protos: {
    name: 'Protos',
    description: 'Web3 journalism focused on investigation and analysis.',
    website: 'https://protos.com',
    twitter: 'ProtosNews',
    focus: ['Investigation', 'Web3', 'Analysis'],
    language: 'English',
    region: 'Global',
  },
  thedefireport: {
    name: 'The DeFi Report',
    description: 'DeFi focused research and analysis.',
    website: 'https://thedefireport.io',
    focus: ['DeFi', 'Research', 'Analysis'],
    language: 'English',
    region: 'Global',
  },
  messari: {
    name: 'Messari',
    description: 'Crypto research and data platform with in-depth analysis.',
    website: 'https://messari.io',
    twitter: 'MessariCrypto',
    focus: ['Research', 'Data', 'Analysis'],
    language: 'English',
    region: 'Global',
  },
  delphi: {
    name: 'Delphi Digital',
    description: 'Independent crypto research and advisory firm.',
    website: 'https://delphidigital.io',
    twitter: 'Delphi_Digital',
    focus: ['Research', 'Advisory', 'Analysis'],
    language: 'English',
    region: 'Global',
  },
};

type SourceKey = keyof typeof sourceInfo;

interface PageProps {
  params: Promise<{ source: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { source } = await params;
  const info = sourceInfo[source as SourceKey];
  
  if (!info) {
    return {
      title: 'Source Not Found',
    };
  }
  
  return {
    title: `${info.name} News`,
    description: `Latest crypto news from ${info.name}. ${info.description}`,
  };
}

export function generateStaticParams() {
  // Skip during Vercel build - use ISR instead
  if (process.env.VERCEL_ENV || process.env.CI) {
    return [];
  }
  return Object.keys(sourceInfo).map(source => ({ source }));
}

export const revalidate = 60;

export default async function SourcePage({ params }: PageProps) {
  const { source } = await params;
  const info = sourceInfo[source as SourceKey];
  
  if (!info) {
    notFound();
  }
  
  const newsData = await getLatestNews(50, source);
  
  // Get all sources for navigation
  const allSources = Object.entries(sourceInfo);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <Header />
        
        <main className="px-4 py-8">
          {/* Source Header */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{info.name}</h1>
                <p className="text-gray-600 dark:text-slate-400 mb-4">{info.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {info.focus.map(tag => (
                    <span key={tag} className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 px-3 py-1 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
                  {info.founded && (
                    <span>Founded: {info.founded}</span>
                  )}
                  <a 
                    href={info.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Visit Website →
                  </a>
                  {info.twitter && (
                    <a 
                      href={`https://twitter.com/${info.twitter}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      @{info.twitter}
                    </a>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                  Active Source
                </span>
              </div>
            </div>
          </div>

          {/* Source Navigation */}
          <div className="flex overflow-x-auto gap-2 pb-4 mb-6 scrollbar-hide">
            {allSources.map(([key, src]) => (
              <Link
                key={key}
                href={`/source/${key}`}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition ${
                  key === source
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                {src.name}
              </Link>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
              <p className="text-gray-500 dark:text-slate-400 text-sm">Articles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{newsData.totalCount}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
              <p className="text-gray-500 dark:text-slate-400 text-sm">Focus</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{info.focus[0]}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
              <p className="text-gray-500 dark:text-slate-400 text-sm">Since</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{info.founded || 'N/A'}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
              <p className="text-gray-500 dark:text-slate-400 text-sm">Status</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">Active</p>
            </div>
          </div>

          {/* Articles */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Latest from {info.name}
            </h2>
          </div>
          
          {newsData.articles.length > 0 ? (
            <Posts articles={newsData.articles} />
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-8 text-center">
              <p className="text-gray-600 dark:text-slate-400">No articles available at the moment.</p>
              <p className="text-gray-500 dark:text-slate-500 text-sm mt-2">Check back soon for updates.</p>
            </div>
          )}
        </main>
        
        <Footer />
      </div>
    </div>
  );
}

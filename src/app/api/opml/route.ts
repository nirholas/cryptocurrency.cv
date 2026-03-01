/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { NextResponse } from 'next/server';

export const runtime = 'edge';

const RSS_SOURCES = [
  // Tier 1 — Major Crypto News
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', htmlUrl: 'https://coindesk.com', category: 'Crypto News' },
  { name: 'The Block', url: 'https://www.theblock.co/rss.xml', htmlUrl: 'https://theblock.co', category: 'Crypto News' },
  { name: 'Decrypt', url: 'https://decrypt.co/feed', htmlUrl: 'https://decrypt.co', category: 'Crypto News' },
  { name: 'CoinTelegraph', url: 'https://cointelegraph.com/rss', htmlUrl: 'https://cointelegraph.com', category: 'Crypto News' },
  { name: 'Bitcoin Magazine', url: 'https://bitcoinmagazine.com/.rss/full/', htmlUrl: 'https://bitcoinmagazine.com', category: 'Bitcoin' },
  { name: 'Blockworks', url: 'https://blockworks.co/feed', htmlUrl: 'https://blockworks.co', category: 'Crypto News' },
  { name: 'The Defiant', url: 'https://thedefiant.io/feed', htmlUrl: 'https://thedefiant.io', category: 'DeFi' },
  // Tier 2 — Established Crypto
  { name: 'Watcher Guru', url: 'https://watcher.guru/news/feed', htmlUrl: 'https://watcher.guru', category: 'Crypto News' },
  { name: 'Cryptopolitan', url: 'https://www.cryptopolitan.com/feed/', htmlUrl: 'https://cryptopolitan.com', category: 'Crypto News' },
  { name: 'CoinEdition', url: 'https://coinedition.com/feed/', htmlUrl: 'https://coinedition.com', category: 'Crypto News' },
  { name: 'The Daily Hodl', url: 'https://dailyhodl.com/feed/', htmlUrl: 'https://dailyhodl.com', category: 'Crypto News' },
  { name: 'CryptoSlate', url: 'https://cryptoslate.com/feed/', htmlUrl: 'https://cryptoslate.com', category: 'Crypto News' },
  { name: 'U.Today', url: 'https://u.today/rss', htmlUrl: 'https://u.today', category: 'Crypto News' },
  { name: 'BeInCrypto', url: 'https://beincrypto.com/feed/', htmlUrl: 'https://beincrypto.com', category: 'Crypto News' },
  { name: 'DL News', url: 'https://www.dlnews.com/feed/', htmlUrl: 'https://dlnews.com', category: 'Crypto News' },
  { name: 'Protos', url: 'https://protos.com/feed/', htmlUrl: 'https://protos.com', category: 'Crypto News' },
  // Mainstream
  { name: 'TechCrunch Crypto', url: 'https://techcrunch.com/category/cryptocurrency/feed/', htmlUrl: 'https://techcrunch.com', category: 'Mainstream' },
  { name: 'Bloomberg Crypto', url: 'https://www.bloomberg.com/crypto/feed', htmlUrl: 'https://bloomberg.com', category: 'Mainstream' },
  { name: 'Forbes Crypto', url: 'https://www.forbes.com/crypto-blockchain/feed/', htmlUrl: 'https://forbes.com', category: 'Mainstream' },
  // Research & Data
  { name: 'CoinMarketCap Blog', url: 'https://blog.coinmarketcap.com/feed/', htmlUrl: 'https://coinmarketcap.com', category: 'Research' },
  { name: 'CoinGecko Blog', url: 'https://blog.coingecko.com/feed/', htmlUrl: 'https://coingecko.com', category: 'Research' },
  { name: 'Glassnode Insights', url: 'https://insights.glassnode.com/rss/', htmlUrl: 'https://glassnode.com', category: 'Research' },
  { name: 'Nansen Blog', url: 'https://www.nansen.ai/research/feed', htmlUrl: 'https://nansen.ai', category: 'Research' },
  { name: 'Messari', url: 'https://messari.io/rss', htmlUrl: 'https://messari.io', category: 'Research' },
  // Bitcoin
  { name: 'Bitcoin Optech', url: 'https://bitcoinops.org/feed.xml', htmlUrl: 'https://bitcoinops.org', category: 'Bitcoin' },
  { name: 'Stacker News', url: 'https://stacker.news/rss', htmlUrl: 'https://stacker.news', category: 'Bitcoin' },
  // DeFi
  { name: 'Rekt News', url: 'https://rekt.news/rss.xml', htmlUrl: 'https://rekt.news', category: 'DeFi' },
  { name: 'Uniswap Blog', url: 'https://uniswap.org/blog/feed.xml', htmlUrl: 'https://uniswap.org', category: 'DeFi' },
  // Solana
  { name: 'Helius Blog', url: 'https://www.helius.dev/blog/feed', htmlUrl: 'https://helius.dev', category: 'Solana' },
  { name: 'Solana News', url: 'https://solana.com/news/rss.xml', htmlUrl: 'https://solana.com', category: 'Solana' },
  // Security
  { name: 'Chainalysis Blog', url: 'https://www.chainalysis.com/blog/feed/', htmlUrl: 'https://chainalysis.com', category: 'Security' },
  { name: 'Ledger Blog', url: 'https://www.ledger.com/blog/feed', htmlUrl: 'https://ledger.com', category: 'Security' },
  // Policy
  { name: 'Coin Center', url: 'https://www.coincenter.org/feed/', htmlUrl: 'https://coincenter.org', category: 'Policy' },
  { name: 'SEC Press Releases', url: 'https://www.sec.gov/news/pressreleases.rss', htmlUrl: 'https://sec.gov', category: 'Policy' },
  // Wave 4 — Mainstream
  { name: 'The Guardian Tech', url: 'https://www.theguardian.com/technology/rss', htmlUrl: 'https://theguardian.com', category: 'Mainstream' },
  { name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', htmlUrl: 'https://bbc.co.uk', category: 'Mainstream' },
  { name: 'Fortune Crypto', url: 'https://fortune.com/section/crypto/feed/', htmlUrl: 'https://fortune.com', category: 'Mainstream' },
  { name: "Barron's", url: 'https://www.barrons.com/feed', htmlUrl: 'https://barrons.com', category: 'Mainstream' },
  { name: 'Axios Crypto', url: 'https://www.axios.com/pro/crypto-deals/feed', htmlUrl: 'https://axios.com', category: 'Mainstream' },
  // Wave 4 — Geopolitical / Central Banks
  { name: 'BIS Innovation Hub', url: 'https://www.bis.org/doclist/bis_fsi_publs.rss', htmlUrl: 'https://bis.org', category: 'Policy' },
  { name: 'IMF Fintech Notes', url: 'https://www.imf.org/en/Publications/RSS?type=Fintech%20Notes', htmlUrl: 'https://imf.org', category: 'Policy' },
  { name: 'Atlantic Council', url: 'https://www.atlanticcouncil.org/category/programs/geoeconomics/feed/', htmlUrl: 'https://atlanticcouncil.org', category: 'Policy' },
  // Wave 4 — On-chain
  { name: 'Santiment Blog', url: 'https://santiment.net/blog/feed/', htmlUrl: 'https://santiment.net', category: 'Research' },
  // Wave 4 — Social
  { name: 'Farcaster Blog', url: 'https://www.farcaster.xyz/blog/rss.xml', htmlUrl: 'https://farcaster.xyz', category: 'Social' },
  { name: 'Lens Protocol Blog', url: 'https://lens.xyz/blog/rss.xml', htmlUrl: 'https://lens.xyz', category: 'Social' },
  // Wave 4 — TradFi / RWA
  { name: 'Securitize Blog', url: 'https://securitize.io/blog/rss.xml', htmlUrl: 'https://securitize.io', category: 'TradFi' },
  // Wave 4 — ETF
  { name: 'Fidelity Digital Assets', url: 'https://www.fidelitydigitalassets.com/blog/rss.xml', htmlUrl: 'https://fidelitydigitalassets.com', category: 'ETF' },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function GET() {
  const outlines = RSS_SOURCES.map(source => 
    `      <outline text="${escapeXml(source.name)}" title="${escapeXml(source.name)}" type="rss" xmlUrl="${escapeXml(source.url)}" htmlUrl="${escapeXml(source.htmlUrl)}"/>`
  ).join('\n');

  const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Free Crypto News - All Sources</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
    <ownerName>Free Crypto News</ownerName>
    <docs>https://github.com/nirholas/free-crypto-news</docs>
  </head>
  <body>
    <outline text="Crypto News Sources" title="Crypto News Sources">
${outlines}
    </outline>
    <outline text="Free Crypto News Aggregated Feeds" title="Aggregated Feeds">
      <outline text="All News" title="All News" type="rss" xmlUrl="https://cryptocurrency.cv/api/rss" htmlUrl="https://cryptocurrency.cv"/>
      <outline text="DeFi News" title="DeFi News" type="rss" xmlUrl="https://cryptocurrency.cv/api/rss?feed=defi" htmlUrl="https://cryptocurrency.cv"/>
      <outline text="Bitcoin News" title="Bitcoin News" type="rss" xmlUrl="https://cryptocurrency.cv/api/rss?feed=bitcoin" htmlUrl="https://cryptocurrency.cv"/>
    </outline>
  </body>
</opml>`;

  return new NextResponse(opml, {
    headers: {
      'Content-Type': 'text/x-opml; charset=utf-8',
      'Content-Disposition': 'attachment; filename="free-crypto-news.opml"',
      'Cache-Control': 'public, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

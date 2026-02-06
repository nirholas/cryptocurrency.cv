import { NextResponse } from 'next/server';

export const runtime = 'edge';

const RSS_SOURCES = [
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', htmlUrl: 'https://coindesk.com', category: 'Crypto News' },
  { name: 'The Block', url: 'https://www.theblock.co/rss.xml', htmlUrl: 'https://theblock.co', category: 'Crypto News' },
  { name: 'Decrypt', url: 'https://decrypt.co/feed', htmlUrl: 'https://decrypt.co', category: 'Crypto News' },
  { name: 'CoinTelegraph', url: 'https://cointelegraph.com/rss', htmlUrl: 'https://cointelegraph.com', category: 'Crypto News' },
  { name: 'Bitcoin Magazine', url: 'https://bitcoinmagazine.com/.rss/full/', htmlUrl: 'https://bitcoinmagazine.com', category: 'Bitcoin' },
  { name: 'Blockworks', url: 'https://blockworks.co/feed', htmlUrl: 'https://blockworks.co', category: 'Crypto News' },
  { name: 'The Defiant', url: 'https://thedefiant.io/feed', htmlUrl: 'https://thedefiant.io', category: 'DeFi' },
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

import { NextResponse } from 'next/server';

export const runtime = 'edge';

const RSS_SOURCES = {
  coindesk: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
  theblock: 'https://www.theblock.co/rss.xml',
  decrypt: 'https://decrypt.co/feed',
  cointelegraph: 'https://cointelegraph.com/rss',
  bitcoinmagazine: 'https://bitcoinmagazine.com/.rss/full/',
  blockworks: 'https://blockworks.co/feed',
  defiant: 'https://thedefiant.io/feed',
} as const;

interface SourceHealth {
  source: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastArticle?: string;
  error?: string;
}

export async function GET() {
  const startTime = Date.now();
  
  const healthChecks = await Promise.allSettled(
    Object.entries(RSS_SOURCES).map(async ([key, url]): Promise<SourceHealth> => {
      const checkStart = Date.now();
      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/rss+xml, application/xml, text/xml',
            'User-Agent': 'FreeCryptoNews/1.0 HealthCheck',
          },
          signal: AbortSignal.timeout(10000), // 10s timeout
        });
        
        const responseTime = Date.now() - checkStart;
        
        if (!response.ok) {
          return {
            source: key,
            status: 'down',
            responseTime,
            error: `HTTP ${response.status}`,
          };
        }
        
        const xml = await response.text();
        
        // Check if we got valid RSS
        const hasItems = xml.includes('<item>') || xml.includes('<entry>');
        const titleMatch = xml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/);
        
        if (!hasItems) {
          return {
            source: key,
            status: 'degraded',
            responseTime,
            error: 'No articles found in feed',
          };
        }
        
        return {
          source: key,
          status: responseTime > 5000 ? 'degraded' : 'healthy',
          responseTime,
          lastArticle: titleMatch?.[1]?.slice(0, 100),
        };
      } catch (error) {
        return {
          source: key,
          status: 'down',
          responseTime: Date.now() - checkStart,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    })
  );
  
  const sources = healthChecks
    .filter((r): r is PromiseFulfilledResult<SourceHealth> => r.status === 'fulfilled')
    .map(r => r.value);
  
  const healthyCount = sources.filter(s => s.status === 'healthy').length;
  const degradedCount = sources.filter(s => s.status === 'degraded').length;
  const downCount = sources.filter(s => s.status === 'down').length;
  
  // Overall status
  let overallStatus: 'healthy' | 'degraded' | 'down';
  if (healthyCount >= 5) {
    overallStatus = 'healthy';
  } else if (healthyCount >= 3) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'down';
  }
  
  const result = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    totalResponseTime: Date.now() - startTime,
    summary: {
      healthy: healthyCount,
      degraded: degradedCount,
      down: downCount,
      total: sources.length,
    },
    sources,
  };
  
  const statusCode = overallStatus === 'down' ? 503 : 200;
  
  return NextResponse.json(result, {
    status: statusCode,
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

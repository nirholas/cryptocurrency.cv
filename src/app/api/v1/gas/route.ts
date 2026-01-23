/**
 * Premium API v1 - Gas Prices Endpoint
 *
 * Returns current gas prices for major networks
 * Requires x402 payment or valid API key
 *
 * @price $0.001 per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';

const ENDPOINT = '/api/v1/gas';

interface GasData {
  network: string;
  chainId: number;
  symbol: string;
  slow: number | null;
  standard: number | null;
  fast: number | null;
  instant?: number | null;
  baseFee?: number | null;
  unit: string;
  source: string;
  timestamp: string;
}

export async function GET(request: NextRequest) {
  // Check authentication
  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const searchParams = request.nextUrl.searchParams;
  const network = searchParams.get('network');

  try {
    const gasData: GasData[] = [];

    // Fetch Ethereum gas from multiple sources
    const ethGasPromise = fetchEthereumGas();
    const polygonGasPromise = fetchPolygonGas();

    const [ethGas, polygonGas] = await Promise.all([ethGasPromise, polygonGasPromise]);

    if (ethGas) gasData.push(ethGas);
    if (polygonGas) gasData.push(polygonGas);

    // Add static estimates for other networks
    gasData.push({
      network: 'base',
      chainId: 8453,
      symbol: 'ETH',
      slow: 0.001,
      standard: 0.002,
      fast: 0.005,
      unit: 'gwei',
      source: 'estimate',
      timestamp: new Date().toISOString(),
    });

    gasData.push({
      network: 'arbitrum',
      chainId: 42161,
      symbol: 'ETH',
      slow: 0.01,
      standard: 0.1,
      fast: 0.25,
      unit: 'gwei',
      source: 'estimate',
      timestamp: new Date().toISOString(),
    });

    gasData.push({
      network: 'optimism',
      chainId: 10,
      symbol: 'ETH',
      slow: 0.001,
      standard: 0.001,
      fast: 0.002,
      unit: 'gwei',
      source: 'estimate',
      timestamp: new Date().toISOString(),
    });

    // Filter by network if specified
    let filteredData = gasData;
    if (network) {
      filteredData = gasData.filter((g) => g.network.toLowerCase() === network.toLowerCase());
    }

    return NextResponse.json(
      {
        success: true,
        data: filteredData,
        meta: {
          endpoint: ENDPOINT,
          networkCount: filteredData.length,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('[API] /v1/gas error:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch gas prices' },
      { status: 502 }
    );
  }
}

async function fetchEthereumGas(): Promise<GasData | null> {
  try {
    // Try Blocknative API (free tier available)
    const response = await fetch('https://api.blocknative.com/gasprices/blockprices', {
      headers: { Accept: 'application/json' },
      next: { revalidate: 15 },
    });

    if (response.ok) {
      const data = await response.json();
      const prices = data.blockPrices?.[0]?.estimatedPrices || [];

      return {
        network: 'ethereum',
        chainId: 1,
        symbol: 'ETH',
        slow: prices.find((p: { confidence: number }) => p.confidence === 70)?.price || null,
        standard: prices.find((p: { confidence: number }) => p.confidence === 90)?.price || null,
        fast: prices.find((p: { confidence: number }) => p.confidence === 99)?.price || null,
        baseFee: data.blockPrices?.[0]?.baseFeePerGas || null,
        unit: 'gwei',
        source: 'blocknative',
        timestamp: new Date().toISOString(),
      };
    }
  } catch {
    // Fallback with estimates
  }

  return {
    network: 'ethereum',
    chainId: 1,
    symbol: 'ETH',
    slow: 15,
    standard: 25,
    fast: 40,
    instant: 60,
    unit: 'gwei',
    source: 'estimate',
    timestamp: new Date().toISOString(),
  };
}

async function fetchPolygonGas(): Promise<GasData | null> {
  try {
    const response = await fetch('https://gasstation.polygon.technology/v2', {
      headers: { Accept: 'application/json' },
      next: { revalidate: 15 },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        network: 'polygon',
        chainId: 137,
        symbol: 'MATIC',
        slow: data.safeLow?.maxFee || null,
        standard: data.standard?.maxFee || null,
        fast: data.fast?.maxFee || null,
        baseFee: data.estimatedBaseFee || null,
        unit: 'gwei',
        source: 'polygon-gasstation',
        timestamp: new Date().toISOString(),
      };
    }
  } catch {
    // Return fallback
  }

  return {
    network: 'polygon',
    chainId: 137,
    symbol: 'MATIC',
    slow: 30,
    standard: 50,
    fast: 100,
    unit: 'gwei',
    source: 'estimate',
    timestamp: new Date().toISOString(),
  };
}

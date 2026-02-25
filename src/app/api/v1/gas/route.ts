/**
 * Premium API v1 - Gas Prices Endpoint
 *
 * Returns current gas prices for major networks.
 * Uses provider framework (Etherscan + Blocknative + Owlracle)
 * with circuit breakers and caching, falling back to direct API calls.
 * Requires x402 payment or valid API key.
 *
 * @price $0.001 per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';
import { registry } from '@/lib/providers/registry';
import type { GasPrice } from '@/lib/providers/adapters/gas';

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
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  // Check authentication
  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const searchParams = request.nextUrl.searchParams;
  const network = searchParams.get('network');

  try {
    logger.info('Fetching gas prices', { network });

    const gasData: GasData[] = [];

    // Layer 1: Provider framework for Ethereum gas (fallback between Etherscan + Blocknative + Owlracle)
    let ethGasFromProvider = false;
    if (!network || network.toLowerCase() === 'ethereum') {
      try {
        const result = await registry.fetch<GasPrice>('gas-fees');
        const gp = result.data;
        gasData.push({
          network: gp.chain || 'ethereum',
          chainId: gp.chainId || 1,
          symbol: 'ETH',
          slow: gp.slow,
          standard: gp.standard,
          fast: gp.fast,
          instant: gp.instant,
          baseFee: gp.baseFee,
          unit: gp.unit || 'gwei',
          source: result.lineage.provider,
          timestamp: gp.lastUpdated || new Date().toISOString(),
        });
        ethGasFromProvider = true;
      } catch { /* provider chain miss — fall through to direct fetch */ }
    }

    // Layer 2: Direct fetch fallback for Ethereum gas
    if (!ethGasFromProvider && (!network || network.toLowerCase() === 'ethereum')) {
      const ethGas = await fetchEthereumGas();
      if (ethGas) gasData.push(ethGas);
    }

    // Polygon gas (not yet in provider framework)
    if (!network || network.toLowerCase() === 'polygon') {
      const polygonGas = await fetchPolygonGas();
      if (polygonGas) gasData.push(polygonGas);
    }

    // Add static estimates for other networks
    if (!network || network.toLowerCase() === 'base') {
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
    }

    if (!network || network.toLowerCase() === 'arbitrum') {
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
    }

    if (!network || network.toLowerCase() === 'optimism') {
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
    }

    // Filter by network if specified
    let filteredData = gasData;
    if (network) {
      filteredData = gasData.filter((g) => g.network.toLowerCase() === network.toLowerCase());
    }

    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);

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
          'X-Cache': ethGasFromProvider ? 'PROVIDER' : 'DIRECT',
        },
      }
    );
  } catch (error) {
    logger.error('Failed to fetch gas prices', error);
    return ApiError.internal('Failed to fetch gas prices', error);
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

/**
 * 🔮 Chainlink Oracle for News Data
 * 
 * Provides news sentiment data for on-chain consumption.
 * Compatible with Chainlink External Adapter format.
 * 
 * GET /api/oracle/chainlink - Get oracle data
 * POST /api/oracle/chainlink - Chainlink job format
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://cryptocurrency.cv';

// Edge-compatible SHA-256 hash function
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface OracleData {
  sentiment: number; // 0-100
  fearGreed: number; // 0-100
  breakingNewsCount: number;
  topNarrative: string;
  lastUpdate: number;
  dataHash: string;
}

// Get oracle data for on-chain use
async function getOracleData(): Promise<OracleData> {
  // Fetch sentiment
  let sentiment = 50;
  let fearGreed = 50;
  let breakingCount = 0;
  let topNarrative = 'NEUTRAL';
  
  try {
    const [sentimentRes, fgRes, newsRes] = await Promise.all([
      fetch(`${API_BASE}/api/sentiment?limit=20`),
      fetch(`${API_BASE}/api/fear-greed`),
      fetch(`${API_BASE}/api/breaking?limit=10`),
    ]);
    
    if (sentimentRes.ok) {
      const data = await sentimentRes.json();
      sentiment = data.market?.score || 50;
    }
    
    if (fgRes.ok) {
      const data = await fgRes.json();
      fearGreed = data.value || 50;
    }
    
    if (newsRes.ok) {
      const data = await newsRes.json();
      breakingCount = data.articles?.filter((a: any) => a.isBreaking)?.length || 0;
    }
    
    // Determine top narrative
    if (sentiment > 70) topNarrative = 'BULLISH';
    else if (sentiment < 30) topNarrative = 'BEARISH';
    else topNarrative = 'NEUTRAL';
    
  } catch (error) {
    console.error('Oracle data fetch error:', error);
  }
  
  const lastUpdate = Math.floor(Date.now() / 1000);
  
  // Create data hash for verification using Web Crypto API
  const dataString = `${sentiment}:${fearGreed}:${breakingCount}:${topNarrative}:${lastUpdate}`;
  const fullHash = await sha256(dataString);
  const dataHash = fullHash.slice(0, 16);
  
  return {
    sentiment,
    fearGreed,
    breakingNewsCount: breakingCount,
    topNarrative,
    lastUpdate,
    dataHash,
  };
}

// Chainlink External Adapter format
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get('format') || 'standard';
  
  const data = await getOracleData();
  
  // Standard format
  if (format === 'standard') {
    return NextResponse.json({
      jobRunID: Date.now().toString(),
      data: {
        result: data.sentiment,
        sentiment: data.sentiment,
        fearGreed: data.fearGreed,
        breakingNewsCount: data.breakingNewsCount,
        topNarrative: data.topNarrative,
        timestamp: data.lastUpdate,
        dataHash: data.dataHash,
      },
      result: data.sentiment,
      statusCode: 200,
    });
  }
  
  // Packed format for on-chain (single uint256)
  if (format === 'packed') {
    // Pack: sentiment (8 bits) | fearGreed (8 bits) | breakingCount (8 bits) | narrative (8 bits) | timestamp (32 bits)
    const narrativeCode = { BULLISH: 1, NEUTRAL: 2, BEARISH: 3 }[data.topNarrative] || 2;
    
    const packed = BigInt(data.sentiment) << BigInt(56) |
                   BigInt(data.fearGreed) << BigInt(48) |
                   BigInt(data.breakingNewsCount) << BigInt(40) |
                   BigInt(narrativeCode) << BigInt(32) |
                   BigInt(data.lastUpdate & 0xFFFFFFFF);
    
    return NextResponse.json({
      jobRunID: Date.now().toString(),
      data: {
        result: packed.toString(),
        packed: `0x${packed.toString(16).padStart(16, '0')}`,
      },
      result: packed.toString(),
      statusCode: 200,
    });
  }
  
  // ABI-encoded for direct contract consumption
  if (format === 'abi') {
    // Simple ABI encoding for: (uint8 sentiment, uint8 fearGreed, uint8 breakingCount, uint8 narrative, uint32 timestamp)
    const narrativeCode = { BULLISH: 1, NEUTRAL: 2, BEARISH: 3 }[data.topNarrative] || 2;
    
    const encoded = [
      data.sentiment.toString(16).padStart(64, '0'),
      data.fearGreed.toString(16).padStart(64, '0'),
      data.breakingNewsCount.toString(16).padStart(64, '0'),
      narrativeCode.toString(16).padStart(64, '0'),
      data.lastUpdate.toString(16).padStart(64, '0'),
    ].join('');
    
    return NextResponse.json({
      jobRunID: Date.now().toString(),
      data: {
        result: `0x${encoded}`,
        decoded: data,
      },
      result: `0x${encoded}`,
      statusCode: 200,
    });
  }
  
  return NextResponse.json({ error: 'Unknown format' }, { status: 400 });
}

// Chainlink job POST format
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, data: requestData } = body;
    
    const oracleData = await getOracleData();
    
    // Determine what to return based on request
    let result = oracleData.sentiment;
    
    if (requestData?.metric === 'fearGreed') {
      result = oracleData.fearGreed;
    } else if (requestData?.metric === 'breakingCount') {
      result = oracleData.breakingNewsCount;
    }
    
    return NextResponse.json({
      jobRunID: id || Date.now().toString(),
      data: {
        ...oracleData,
        result,
      },
      result,
      statusCode: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      jobRunID: Date.now().toString(),
      status: 'errored',
      error: message,
      statusCode: 500,
    }, { status: 500 });
  }
}

/**
 * Portfolio Holding API
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  addHolding,
  removeHolding,
  updateHolding,
} from '@/lib/portfolio';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { portfolioId, coinId, symbol, name, amount, averageBuyPrice } = body;

    if (!portfolioId || !coinId || !symbol || !name || amount === undefined || averageBuyPrice === undefined) {
      return NextResponse.json(
        { error: 'portfolioId, coinId, symbol, name, amount, and averageBuyPrice are required' },
        { status: 400 }
      );
    }

    const portfolio = await addHolding(portfolioId, {
      coinId,
      symbol,
      name,
      amount,
      averageBuyPrice,
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, portfolio }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { portfolioId, coinId, amount, averageBuyPrice } = body;

    if (!portfolioId || !coinId) {
      return NextResponse.json(
        { error: 'portfolioId and coinId are required' },
        { status: 400 }
      );
    }

    if (amount === undefined && averageBuyPrice === undefined) {
      return NextResponse.json(
        { error: 'At least one of amount or averageBuyPrice is required' },
        { status: 400 }
      );
    }

    const portfolio = await updateHolding(portfolioId, coinId, {
      amount,
      averageBuyPrice,
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio or holding not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, portfolio });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const portfolioId = searchParams.get('portfolioId');
  const coinId = searchParams.get('coinId');

  if (!portfolioId || !coinId) {
    return NextResponse.json(
      { error: 'portfolioId and coinId are required' },
      { status: 400 }
    );
  }

  const portfolio = await removeHolding(portfolioId, coinId);

  if (!portfolio) {
    return NextResponse.json(
      { error: 'Portfolio not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, portfolio });
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { type NextRequest, NextResponse } from 'next/server';
import { readJsonBody } from '@/lib/json-body';

interface Transaction {
  date: string;
  type: 'buy' | 'sell' | 'transfer';
  asset: string;
  amount: number;
  price: number;
  fee: number;
}

interface TaxEvent {
  date: string;
  asset: string;
  proceeds: number;
  cost_basis: number;
  gain_loss: number;
  holding_period: 'short' | 'long';
  type: 'capital_gain' | 'capital_loss';
}

export async function POST(request: NextRequest) {
  try {
    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const { transactions, year, method = 'fifo' } = jsonBody.body;
    
    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: 'Transactions array required' }, { status: 400 });
    }

    const targetYear = year || new Date().getFullYear();
    const taxEvents: TaxEvent[] = [];
    const holdings: Map<string, { amount: number; cost: number; date: string }[]> = new Map();

    // Process transactions
    transactions
      .sort((a: Transaction, b: Transaction) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((tx: Transaction) => {
        if (tx.type === 'buy') {
          const existing = holdings.get(tx.asset) || [];
          existing.push({
            amount: tx.amount,
            cost: tx.price * tx.amount + tx.fee,
            date: tx.date
          });
          holdings.set(tx.asset, existing);
        } else if (tx.type === 'sell') {
          const sellDate = new Date(tx.date);
          if (sellDate.getFullYear() !== targetYear) return;

          const existing = holdings.get(tx.asset) || [];
          let remainingToSell = tx.amount;
          const proceeds = tx.price * tx.amount - tx.fee;

          while (remainingToSell > 0 && existing.length > 0) {
            const lot = method === 'fifo' ? existing[0] : existing[existing.length - 1];
            const sellAmount = Math.min(remainingToSell, lot.amount);
            const costBasis = (lot.cost / lot.amount) * sellAmount;
            const gainLoss = (proceeds / tx.amount) * sellAmount - costBasis;
            
            const buyDate = new Date(lot.date);
            const holdingDays = (sellDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24);
            
            taxEvents.push({
              date: tx.date,
              asset: tx.asset,
              proceeds: (proceeds / tx.amount) * sellAmount,
              cost_basis: costBasis,
              gain_loss: gainLoss,
              holding_period: holdingDays > 365 ? 'long' : 'short',
              type: gainLoss >= 0 ? 'capital_gain' : 'capital_loss'
            });

            lot.amount -= sellAmount;
            lot.cost -= costBasis;
            remainingToSell -= sellAmount;

            if (lot.amount <= 0) {
              if (method === 'fifo') existing.shift();
              else existing.pop();
            }
          }
          holdings.set(tx.asset, existing);
        }
      });

    // Calculate summary
    const shortTermGains = taxEvents
      .filter(e => e.holding_period === 'short' && e.gain_loss > 0)
      .reduce((sum, e) => sum + e.gain_loss, 0);
    const shortTermLosses = taxEvents
      .filter(e => e.holding_period === 'short' && e.gain_loss < 0)
      .reduce((sum, e) => sum + Math.abs(e.gain_loss), 0);
    const longTermGains = taxEvents
      .filter(e => e.holding_period === 'long' && e.gain_loss > 0)
      .reduce((sum, e) => sum + e.gain_loss, 0);
    const longTermLosses = taxEvents
      .filter(e => e.holding_period === 'long' && e.gain_loss < 0)
      .reduce((sum, e) => sum + Math.abs(e.gain_loss), 0);

    return NextResponse.json({
      tax_year: targetYear,
      method,
      summary: {
        short_term: {
          gains: shortTermGains,
          losses: shortTermLosses,
          net: shortTermGains - shortTermLosses
        },
        long_term: {
          gains: longTermGains,
          losses: longTermLosses,
          net: longTermGains - longTermLosses
        },
        total_net: (shortTermGains - shortTermLosses) + (longTermGains - longTermLosses)
      },
      events: taxEvents,
      disclaimer: 'This is for informational purposes only. Consult a tax professional.'
    });
  } catch (error) {
    console.error('Tax report error:', error);
    return NextResponse.json({ error: 'Tax report generation failed' }, { status: 500 });
  }
}

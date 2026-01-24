import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Portfolio Tax Report Generation API
 * 
 * Generates tax reports for crypto transactions including:
 * - Capital gains/losses (short-term and long-term)
 * - Cost basis calculations (FIFO, LIFO, HIFO, SpecID)
 * - Income from staking, airdrops, mining
 * - Form 8949 compatible output
 * - Multiple jurisdiction support
 */

interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'transfer' | 'swap' | 'stake' | 'unstake' | 'airdrop' | 'mining' | 'interest';
  asset: string;
  amount: number;
  price: number;
  fee?: number;
  feeAsset?: string;
  timestamp: string;
  source: string;
  txHash?: string;
  notes?: string;
}

interface TaxLot {
  id: string;
  asset: string;
  amount: number;
  costBasis: number;
  acquiredAt: string;
  source: string;
}

interface CapitalGain {
  asset: string;
  acquiredAt: string;
  disposedAt: string;
  proceeds: number;
  costBasis: number;
  gain: number;
  holdingPeriod: 'short' | 'long';
  method: string;
  txId: string;
}

interface IncomeEvent {
  type: 'staking' | 'airdrop' | 'mining' | 'interest' | 'other';
  asset: string;
  amount: number;
  fairMarketValue: number;
  timestamp: string;
  source: string;
}

interface TaxSummary {
  taxYear: number;
  jurisdiction: string;
  capitalGains: {
    shortTerm: { gains: number; losses: number; net: number };
    longTerm: { gains: number; losses: number; net: number };
    total: { gains: number; losses: number; net: number };
  };
  income: {
    staking: number;
    airdrops: number;
    mining: number;
    interest: number;
    total: number;
  };
  transactions: {
    disposals: number;
    acquisitions: number;
    income: number;
  };
  costBasisMethod: string;
  warnings: string[];
}

interface TaxReport {
  summary: TaxSummary;
  capitalGains: CapitalGain[];
  incomeEvents: IncomeEvent[];
  form8949: Form8949Entry[];
  lots: TaxLot[];
  generatedAt: string;
}

interface Form8949Entry {
  description: string;
  dateAcquired: string;
  dateSold: string;
  proceeds: number;
  costBasis: number;
  adjustmentCode?: string;
  adjustmentAmount?: number;
  gainOrLoss: number;
  category: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; // Form 8949 categories
}

// Cost basis calculation methods
type CostBasisMethod = 'FIFO' | 'LIFO' | 'HIFO' | 'SPEC_ID';

// In-memory storage for demo (use database in production)
const portfolioTransactions: Map<string, Transaction[]> = new Map();

/**
 * GET: Generate tax report
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const portfolioId = searchParams.get('portfolio_id') || 'demo';
  const taxYear = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
  const jurisdiction = searchParams.get('jurisdiction') || 'US';
  const costBasisMethod = (searchParams.get('method')?.toUpperCase() as CostBasisMethod) || 'FIFO';
  const format = searchParams.get('format') || 'json'; // json, csv, form8949
  
  // Get stored transactions or return empty array (user must POST transactions first)
  let transactions = portfolioTransactions.get(portfolioId);
  if (!transactions || transactions.length === 0) {
    transactions = getEmptyTransactions();
    portfolioTransactions.set(portfolioId, transactions);
  }
  
  // Filter to tax year
  const yearStart = new Date(`${taxYear}-01-01T00:00:00Z`);
  const yearEnd = new Date(`${taxYear}-12-31T23:59:59Z`);
  
  const yearTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.timestamp);
    return txDate >= yearStart && txDate <= yearEnd;
  });
  
  // Calculate tax report
  const report = calculateTaxReport(
    yearTransactions, 
    transactions, // All historical for cost basis
    taxYear, 
    jurisdiction, 
    costBasisMethod
  );
  
  // Return based on format
  if (format === 'csv') {
    return new NextResponse(generateCsv(report), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="crypto-tax-${taxYear}.csv"`,
      },
    });
  }
  
  if (format === 'form8949') {
    return NextResponse.json({
      form8949: report.form8949,
      instructions: getForm8949Instructions(jurisdiction),
    });
  }
  
  return NextResponse.json(report);
}

/**
 * POST: Add transaction for tax calculation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const portfolioId = body.portfolio_id || 'demo';
    
    // Validate required fields
    if (!body.type || !body.asset || !body.amount || !body.price || !body.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: type, asset, amount, price, timestamp' },
        { status: 400 }
      );
    }
    
    const transaction: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: body.type,
      asset: body.asset.toUpperCase(),
      amount: parseFloat(body.amount),
      price: parseFloat(body.price),
      fee: body.fee ? parseFloat(body.fee) : undefined,
      feeAsset: body.fee_asset,
      timestamp: body.timestamp,
      source: body.source || 'manual',
      txHash: body.tx_hash,
      notes: body.notes,
    };
    
    // Add to portfolio
    const existing = portfolioTransactions.get(portfolioId) || [];
    existing.push(transaction);
    portfolioTransactions.set(portfolioId, existing);
    
    return NextResponse.json({
      message: 'Transaction recorded',
      transaction,
      totalTransactions: existing.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

/**
 * DELETE: Clear portfolio transactions
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const portfolioId = searchParams.get('portfolio_id') || 'demo';
  
  portfolioTransactions.delete(portfolioId);
  
  return NextResponse.json({
    message: 'Portfolio transactions cleared',
    portfolio_id: portfolioId,
  });
}

function calculateTaxReport(
  yearTransactions: Transaction[],
  allTransactions: Transaction[],
  taxYear: number,
  jurisdiction: string,
  method: CostBasisMethod
): TaxReport {
  const capitalGains: CapitalGain[] = [];
  const incomeEvents: IncomeEvent[] = [];
  const form8949: Form8949Entry[] = [];
  const warnings: string[] = [];
  
  // Build tax lots from all acquisitions
  const lots = buildTaxLots(allTransactions, method);
  
  // Process disposals
  const disposals = yearTransactions.filter(tx => 
    tx.type === 'sell' || tx.type === 'swap'
  );
  
  // Long-term threshold based on jurisdiction
  const longTermDays = jurisdiction === 'US' ? 365 : 365; // Most countries use 1 year
  
  for (const disposal of disposals) {
    const result = calculateGainForDisposal(disposal, lots, method, longTermDays);
    if (result) {
      capitalGains.push(result.gain);
      form8949.push(result.form8949Entry);
    } else {
      warnings.push(`Could not find cost basis for ${disposal.amount} ${disposal.asset} on ${disposal.timestamp}`);
    }
  }
  
  // Process income events
  const incomeTypes = ['staking', 'airdrop', 'mining', 'interest'] as const;
  for (const tx of yearTransactions) {
    if (incomeTypes.includes(tx.type as typeof incomeTypes[number])) {
      incomeEvents.push({
        type: tx.type as typeof incomeTypes[number],
        asset: tx.asset,
        amount: tx.amount,
        fairMarketValue: tx.amount * tx.price,
        timestamp: tx.timestamp,
        source: tx.source,
      });
    }
  }
  
  // Calculate summary
  const shortTermGains = capitalGains.filter(g => g.holdingPeriod === 'short');
  const longTermGains = capitalGains.filter(g => g.holdingPeriod === 'long');
  
  const summary: TaxSummary = {
    taxYear,
    jurisdiction,
    capitalGains: {
      shortTerm: {
        gains: shortTermGains.filter(g => g.gain > 0).reduce((s, g) => s + g.gain, 0),
        losses: Math.abs(shortTermGains.filter(g => g.gain < 0).reduce((s, g) => s + g.gain, 0)),
        net: shortTermGains.reduce((s, g) => s + g.gain, 0),
      },
      longTerm: {
        gains: longTermGains.filter(g => g.gain > 0).reduce((s, g) => s + g.gain, 0),
        losses: Math.abs(longTermGains.filter(g => g.gain < 0).reduce((s, g) => s + g.gain, 0)),
        net: longTermGains.reduce((s, g) => s + g.gain, 0),
      },
      total: {
        gains: capitalGains.filter(g => g.gain > 0).reduce((s, g) => s + g.gain, 0),
        losses: Math.abs(capitalGains.filter(g => g.gain < 0).reduce((s, g) => s + g.gain, 0)),
        net: capitalGains.reduce((s, g) => s + g.gain, 0),
      },
    },
    income: {
      staking: incomeEvents.filter(e => e.type === 'staking').reduce((s, e) => s + e.fairMarketValue, 0),
      airdrops: incomeEvents.filter(e => e.type === 'airdrop').reduce((s, e) => s + e.fairMarketValue, 0),
      mining: incomeEvents.filter(e => e.type === 'mining').reduce((s, e) => s + e.fairMarketValue, 0),
      interest: incomeEvents.filter(e => e.type === 'interest').reduce((s, e) => s + e.fairMarketValue, 0),
      total: incomeEvents.reduce((s, e) => s + e.fairMarketValue, 0),
    },
    transactions: {
      disposals: disposals.length,
      acquisitions: yearTransactions.filter(tx => tx.type === 'buy').length,
      income: incomeEvents.length,
    },
    costBasisMethod: method,
    warnings,
  };
  
  return {
    summary,
    capitalGains,
    incomeEvents,
    form8949,
    lots: lots.filter(l => l.amount > 0),
    generatedAt: new Date().toISOString(),
  };
}

function buildTaxLots(transactions: Transaction[], method: CostBasisMethod): TaxLot[] {
  const lots: TaxLot[] = [];
  
  // Acquisitions create tax lots
  const acquisitions = transactions.filter(tx => 
    ['buy', 'airdrop', 'mining', 'staking', 'interest'].includes(tx.type)
  ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  for (const tx of acquisitions) {
    const costBasis = tx.amount * tx.price + (tx.fee || 0);
    lots.push({
      id: `lot_${tx.id}`,
      asset: tx.asset,
      amount: tx.amount,
      costBasis,
      acquiredAt: tx.timestamp,
      source: tx.source,
    });
  }
  
  return lots;
}

function calculateGainForDisposal(
  disposal: Transaction,
  lots: TaxLot[],
  method: CostBasisMethod,
  longTermDays: number
): { gain: CapitalGain; form8949Entry: Form8949Entry } | null {
  // Find matching lots by asset
  const assetLots = lots
    .filter(l => l.asset === disposal.asset && l.amount > 0)
    .sort((a, b) => {
      switch (method) {
        case 'LIFO':
          return new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime();
        case 'HIFO':
          return (b.costBasis / b.amount) - (a.costBasis / a.amount);
        case 'FIFO':
        default:
          return new Date(a.acquiredAt).getTime() - new Date(b.acquiredAt).getTime();
      }
    });
  
  if (assetLots.length === 0) {
    return null;
  }
  
  let remainingAmount = disposal.amount;
  let totalCostBasis = 0;
  let acquiredAt = assetLots[0].acquiredAt;
  
  // Consume lots based on method
  for (const lot of assetLots) {
    if (remainingAmount <= 0) break;
    
    const useAmount = Math.min(lot.amount, remainingAmount);
    const useCostBasis = (useAmount / lot.amount) * lot.costBasis;
    
    totalCostBasis += useCostBasis;
    lot.amount -= useAmount;
    lot.costBasis -= useCostBasis;
    remainingAmount -= useAmount;
    
    // Use earliest acquisition date for holding period
    if (new Date(lot.acquiredAt) < new Date(acquiredAt)) {
      acquiredAt = lot.acquiredAt;
    }
  }
  
  const proceeds = disposal.amount * disposal.price - (disposal.fee || 0);
  const gain = proceeds - totalCostBasis;
  const disposalDate = new Date(disposal.timestamp);
  const acquisitionDate = new Date(acquiredAt);
  const holdingDays = Math.floor((disposalDate.getTime() - acquisitionDate.getTime()) / (1000 * 60 * 60 * 24));
  const holdingPeriod: 'short' | 'long' = holdingDays > longTermDays ? 'long' : 'short';
  
  // Determine Form 8949 category
  // A/B/C = Short-term, D/E/F = Long-term
  // A/D = Reported to IRS, B/E = Not reported, C/F = No 1099-B
  const category: Form8949Entry['category'] = holdingPeriod === 'short' ? 'C' : 'F';
  
  return {
    gain: {
      asset: disposal.asset,
      acquiredAt,
      disposedAt: disposal.timestamp,
      proceeds,
      costBasis: totalCostBasis,
      gain,
      holdingPeriod,
      method,
      txId: disposal.id,
    },
    form8949Entry: {
      description: `${disposal.amount} ${disposal.asset}`,
      dateAcquired: formatDateForForm(acquiredAt),
      dateSold: formatDateForForm(disposal.timestamp),
      proceeds: Math.round(proceeds * 100) / 100,
      costBasis: Math.round(totalCostBasis * 100) / 100,
      gainOrLoss: Math.round(gain * 100) / 100,
      category,
    },
  };
}

function formatDateForForm(isoDate: string): string {
  const date = new Date(isoDate);
  return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
}

function generateCsv(report: TaxReport): string {
  const lines = [
    'Description,Date Acquired,Date Sold,Proceeds,Cost Basis,Gain/Loss,Holding Period',
  ];
  
  for (const entry of report.form8949) {
    lines.push([
      entry.description,
      entry.dateAcquired,
      entry.dateSold,
      entry.proceeds.toFixed(2),
      entry.costBasis.toFixed(2),
      entry.gainOrLoss.toFixed(2),
      entry.category.match(/[ABC]/) ? 'Short-term' : 'Long-term',
    ].join(','));
  }
  
  return lines.join('\n');
}

function getForm8949Instructions(jurisdiction: string): object {
  if (jurisdiction === 'US') {
    return {
      form: 'Form 8949',
      categories: {
        A: 'Short-term transactions reported on 1099-B with basis reported to IRS',
        B: 'Short-term transactions reported on 1099-B without basis reported to IRS',
        C: 'Short-term transactions not reported on 1099-B',
        D: 'Long-term transactions reported on 1099-B with basis reported to IRS',
        E: 'Long-term transactions reported on 1099-B without basis reported to IRS',
        F: 'Long-term transactions not reported on 1099-B',
      },
      notes: [
        'Crypto transactions typically fall under categories C or F',
        'Include fees in cost basis',
        'Report each transaction separately',
        'Total flows to Schedule D',
      ],
      disclaimer: 'This is for informational purposes only. Consult a tax professional.',
    };
  }
  
  return {
    jurisdiction,
    disclaimer: 'Tax rules vary by jurisdiction. Consult a local tax professional.',
  };
}

function getEmptyTransactions(): Transaction[] {
  // Return empty transactions - user must provide real transaction data
  // via POST endpoint or connect to exchange APIs
  return [];
}

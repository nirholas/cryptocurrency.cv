'use client';

import { useState, useEffect, useCallback } from 'react';
import { FireIcon, ClockIcon, BoltIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface GasPrice {
  low: number;
  average: number;
  high: number;
  instant: number;
  baseFee: number;
  lastBlock: number;
  timestamp: number;
}

interface EtherscanGasResponse {
  status: string;
  message: string;
  result: {
    LastBlock: string;
    SafeGasPrice: string;
    ProposeGasPrice: string;
    FastGasPrice: string;
    suggestBaseFee: string;
  };
}

interface OwlracleGasResponse {
  timestamp: string;
  lastBlock: number;
  avgTime: number;
  avgTx: number;
  avgGas: number;
  speeds: Array<{
    acceptance: number;
    gasPrice: number;
    estimatedFee: number;
  }>;
  baseFee: number;
}

const PRIORITY_LABELS = {
  low: { label: 'Low', time: '~10 min', icon: ClockIcon, color: 'text-gray-500' },
  average: { label: 'Standard', time: '~3 min', icon: ClockIcon, color: 'text-gray-600' },
  high: { label: 'Fast', time: '~1 min', icon: BoltIcon, color: 'text-slate-700' },
  instant: { label: 'Instant', time: '<30 sec', icon: FireIcon, color: 'text-slate-900' },
};

const TX_GAS_LIMITS = {
  transfer: { gas: 21000, label: 'ETH Transfer', description: 'Simple ETH send' },
  erc20: { gas: 65000, label: 'ERC20 Transfer', description: 'Token transfer' },
  swap: { gas: 150000, label: 'DEX Swap', description: 'Uniswap/1inch swap' },
  nft: { gas: 85000, label: 'NFT Mint', description: 'Mint or transfer NFT' },
  contract: { gas: 200000, label: 'Contract Deploy', description: 'Deploy smart contract' },
  approve: { gas: 46000, label: 'Token Approve', description: 'Approve spending' },
} as const;

function estimateTxCost(gasPrice: number, gasLimit: number, ethPrice: number): string {
  const gweiToEth = (gasPrice * gasLimit) / 1e9;
  const usdCost = gweiToEth * ethPrice;
  return usdCost.toFixed(2);
}

function estimateEthCost(gasPrice: number, gasLimit: number): string {
  const ethCost = (gasPrice * gasLimit) / 1e9;
  if (ethCost < 0.0001) return ethCost.toExponential(2);
  if (ethCost < 0.001) return ethCost.toFixed(5);
  return ethCost.toFixed(4);
}

// Multiple data sources for reliability
async function fetchGasFromEtherscan(): Promise<GasPrice | null> {
  try {
    // Use public etherscan endpoint (rate limited but free)
    const response = await fetch(
      'https://api.etherscan.io/api?module=gastracker&action=gasoracle',
      { cache: 'no-store' }
    );
    
    if (!response.ok) return null;
    
    const data: EtherscanGasResponse = await response.json();
    
    if (data.status !== '1') return null;
    
    const baseFee = parseFloat(data.result.suggestBaseFee) || 0;
    const safe = parseInt(data.result.SafeGasPrice) || 0;
    const propose = parseInt(data.result.ProposeGasPrice) || 0;
    const fast = parseInt(data.result.FastGasPrice) || 0;
    
    return {
      low: safe,
      average: propose,
      high: fast,
      instant: Math.ceil(fast * 1.25),
      baseFee: Math.round(baseFee),
      lastBlock: parseInt(data.result.LastBlock) || 0,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Etherscan gas fetch failed:', error);
    return null;
  }
}

async function fetchGasFromOwlracle(): Promise<GasPrice | null> {
  try {
    // Owlracle free API
    const response = await fetch(
      'https://api.owlracle.info/v4/eth/gas',
      { cache: 'no-store' }
    );
    
    if (!response.ok) return null;
    
    const data: OwlracleGasResponse = await response.json();
    
    if (!data.speeds || data.speeds.length < 4) return null;
    
    // Speeds are sorted by acceptance rate (35%, 60%, 90%, 100%)
    return {
      low: Math.round(data.speeds[0]?.gasPrice || 0),
      average: Math.round(data.speeds[1]?.gasPrice || 0),
      high: Math.round(data.speeds[2]?.gasPrice || 0),
      instant: Math.round(data.speeds[3]?.gasPrice || 0),
      baseFee: Math.round(data.baseFee || 0),
      lastBlock: data.lastBlock || 0,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Owlracle gas fetch failed:', error);
    return null;
  }
}

// Blocknative public endpoint
async function fetchGasFromBlocknative(): Promise<GasPrice | null> {
  try {
    const response = await fetch(
      'https://api.blocknative.com/gasprices/blockprices',
      { 
        cache: 'no-store',
        headers: {
          'Authorization': process.env.NEXT_PUBLIC_BLOCKNATIVE_API_KEY || '',
        }
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const prices = data.blockPrices?.[0]?.estimatedPrices;
    
    if (!prices || prices.length < 4) return null;
    
    return {
      low: Math.round(prices.find((p: { confidence: number }) => p.confidence === 70)?.price || prices[3]?.price || 0),
      average: Math.round(prices.find((p: { confidence: number }) => p.confidence === 90)?.price || prices[2]?.price || 0),
      high: Math.round(prices.find((p: { confidence: number }) => p.confidence === 95)?.price || prices[1]?.price || 0),
      instant: Math.round(prices.find((p: { confidence: number }) => p.confidence === 99)?.price || prices[0]?.price || 0),
      baseFee: Math.round(data.blockPrices?.[0]?.baseFee || 0),
      lastBlock: data.blockPrices?.[0]?.blockNumber || 0,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Blocknative gas fetch failed:', error);
    return null;
  }
}

// Try multiple sources with fallback
async function fetchGasData(): Promise<GasPrice | null> {
  // Try Etherscan first (most reliable for Ethereum mainnet)
  const etherscanData = await fetchGasFromEtherscan();
  if (etherscanData && etherscanData.low > 0) {
    return etherscanData;
  }
  
  // Try Owlracle as backup
  const owlracleData = await fetchGasFromOwlracle();
  if (owlracleData && owlracleData.low > 0) {
    return owlracleData;
  }
  
  // Try Blocknative as last resort
  const blocknativeData = await fetchGasFromBlocknative();
  if (blocknativeData && blocknativeData.low > 0) {
    return blocknativeData;
  }
  
  return null;
}

export function GasTracker() {
  const [gasData, setGasData] = useState<GasPrice | null>(null);
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<keyof typeof TX_GAS_LIMITS>('transfer');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    setError(null);
    
    try {
      // Fetch ETH price
      const priceRes = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
        { cache: 'no-store' }
      );
      if (priceRes.ok) {
        const priceData = await priceRes.json();
        setEthPrice(priceData.ethereum?.usd || 0);
      }

      // Fetch gas data from multiple sources
      const gas = await fetchGasData();
      
      if (gas) {
        setGasData(gas);
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError('Unable to fetch gas prices. Please try again.');
      }
    } catch (e) {
      console.error('Failed to fetch gas:', e);
      setError('Failed to fetch gas prices');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // Refresh every 15 seconds for live gas prices
    const interval = setInterval(() => fetchData(false), 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !gasData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:opacity-90 transition-opacity"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!gasData) return null;

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {lastUpdate && (
            <>Updated {lastUpdate.toLocaleTimeString()}</>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Gas Prices Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['low', 'average', 'high', 'instant'] as const).map((priority) => {
          const info = PRIORITY_LABELS[priority];
          const Icon = info.icon;
          const gwei = gasData[priority];
          const cost = estimateTxCost(gwei, TX_GAS_LIMITS[selectedTx].gas, ethPrice);
          const ethCost = estimateEthCost(gwei, TX_GAS_LIMITS[selectedTx].gas);

          return (
            <div
              key={priority}
              className={`p-5 rounded-xl border transition-all ${
                priority === 'instant'
                  ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white'
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon
                  className={`w-5 h-5 ${priority === 'instant' ? 'text-white dark:text-slate-900' : 'text-gray-600 dark:text-gray-400'}`}
                />
                <span
                  className={`text-sm font-medium ${priority === 'instant' ? 'text-white dark:text-slate-900' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  {info.label}
                </span>
              </div>
              <div
                className={`text-3xl font-bold font-mono ${priority === 'instant' ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-white'}`}
              >
                {gwei}
              </div>
              <div
                className={`text-sm ${priority === 'instant' ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}`}
              >
                gwei
              </div>
              <div
                className={`mt-2 text-xs space-y-0.5 ${priority === 'instant' ? 'text-gray-400 dark:text-gray-500' : 'text-gray-400 dark:text-gray-500'}`}
              >
                <div>{info.time}</div>
                <div>{ethCost} ETH</div>
                <div className="font-medium">≈ ${cost}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction Type Selector */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
        <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">
          Estimate costs for:
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {Object.entries(TX_GAS_LIMITS).map(([id, info]) => (
            <button
              key={id}
              onClick={() => setSelectedTx(id as keyof typeof TX_GAS_LIMITS)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                selectedTx === id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              <div>{info.label}</div>
              <div className="text-xs opacity-60 mt-0.5">{info.gas.toLocaleString()} gas</div>
            </button>
          ))}
        </div>

        {/* Cost Summary */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-900 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {TX_GAS_LIMITS[selectedTx].description} cost at each speed:
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['low', 'average', 'high', 'instant'] as const).map((priority) => {
              const gwei = gasData[priority];
              const cost = estimateTxCost(gwei, TX_GAS_LIMITS[selectedTx].gas, ethPrice);
              return (
                <div key={priority} className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">
                    {PRIORITY_LABELS[priority].label}
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                    ${cost}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Network Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400 px-2">
        <div className="flex items-center gap-4">
          <span>Base Fee: {gasData.baseFee} gwei</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Block #{gasData.lastBlock.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>ETH: ${ethPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Data Source Attribution */}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        Gas data from Etherscan, Owlracle, and Blocknative. Prices refresh every 15 seconds.
      </p>
    </div>
  );
}

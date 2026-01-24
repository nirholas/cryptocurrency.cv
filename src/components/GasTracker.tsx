'use client';

import { useState, useEffect } from 'react';
import { FireIcon, ClockIcon, BoltIcon } from '@heroicons/react/24/outline';

interface GasPrice {
  low: number;
  average: number;
  high: number;
  instant: number;
  baseFee: number;
  lastBlock: number;
  timestamp: number;
}

const PRIORITY_LABELS = {
  low: { label: 'Low', time: '~10 min', icon: ClockIcon },
  average: { label: 'Average', time: '~3 min', icon: ClockIcon },
  high: { label: 'Fast', time: '~1 min', icon: BoltIcon },
  instant: { label: 'Instant', time: '<30 sec', icon: FireIcon },
};

function estimateTxCost(gasPrice: number, gasLimit: number, ethPrice: number): string {
  const gweiToEth = (gasPrice * gasLimit) / 1e9;
  const usdCost = gweiToEth * ethPrice;
  return usdCost.toFixed(2);
}

export function GasTracker() {
  const [gasData, setGasData] = useState<GasPrice | null>(null);
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<'transfer' | 'swap' | 'nft' | 'contract'>(
    'transfer'
  );

  const TX_GAS_LIMITS = {
    transfer: 21000,
    swap: 150000,
    nft: 85000,
    contract: 200000,
  };

  useEffect(() => {
    async function fetchGas() {
      try {
        // Fetch ETH price
        const priceRes = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
        );
        if (priceRes.ok) {
          const priceData = await priceRes.json();
          setEthPrice(priceData.ethereum?.usd || 0);
        }

        // Simulate gas data (in production, use etherscan or similar API)
        // For demo, generate realistic-looking gas prices
        const baseFee = 15 + Math.random() * 30;
        setGasData({
          low: Math.floor(baseFee * 0.8),
          average: Math.floor(baseFee * 1.1),
          high: Math.floor(baseFee * 1.5),
          instant: Math.floor(baseFee * 2),
          baseFee: Math.floor(baseFee),
          lastBlock: 19000000 + Math.floor(Math.random() * 100000),
          timestamp: Date.now(),
        });
      } catch (e) {
        console.error('Failed to fetch gas:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchGas();
    const interval = setInterval(fetchGas, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, []);

  if (loading || !gasData) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-black rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gas Prices Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['low', 'average', 'high', 'instant'] as const).map((priority) => {
          const info = PRIORITY_LABELS[priority];
          const Icon = info.icon;
          const gwei = gasData[priority];
          const cost = estimateTxCost(gwei, TX_GAS_LIMITS[selectedTx], ethPrice);

          return (
            <div
              key={priority}
              className={`p-5 rounded-xl border transition-colors ${
                priority === 'instant'
                  ? 'bg-black dark:bg-white border-slate-900 dark:border-white'
                  : 'bg-white dark:bg-black border-gray-200 dark:border-slate-700'
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
                className={`mt-2 text-xs ${priority === 'instant' ? 'text-gray-400 dark:text-gray-500' : 'text-gray-400 dark:text-gray-500'}`}
              >
                {info.time} · ~${cost}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction Type Selector */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-slate-700 rounded-xl p-6">
        <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">
          Estimate costs for:
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'transfer', label: 'ETH Transfer', gas: '21,000' },
            { id: 'swap', label: 'Token Swap', gas: '150,000' },
            { id: 'nft', label: 'NFT Mint', gas: '85,000' },
            { id: 'contract', label: 'Contract Call', gas: '200,000' },
          ].map((tx) => (
            <button
              key={tx.id}
              onClick={() => setSelectedTx(tx.id as typeof selectedTx)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTx === tx.id
                  ? 'bg-black dark:bg-white text-white dark:text-slate-900'
                  : 'bg-gray-100 dark:bg-black text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {tx.label}
              <span className="ml-2 text-xs opacity-60">{tx.gas} gas</span>
            </button>
          ))}
        </div>

        {/* Cost Summary */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['low', 'average', 'high', 'instant'] as const).map((priority) => {
            const gwei = gasData[priority];
            const cost = estimateTxCost(gwei, TX_GAS_LIMITS[selectedTx], ethPrice);
            return (
              <div key={priority} className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
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

      {/* Base Fee Info */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 px-2">
        <span>Base Fee: {gasData.baseFee} gwei</span>
        <span>Block #{gasData.lastBlock.toLocaleString()}</span>
        <span>ETH: ${ethPrice.toLocaleString()}</span>
      </div>
    </div>
  );
}

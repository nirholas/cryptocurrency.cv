'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowsRightLeftIcon, CalculatorIcon } from '@heroicons/react/24/outline';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
}

interface CalculatorProps {
  coins?: Coin[];
}

export function CryptoCalculator({ coins = [] }: CalculatorProps) {
  const [fromCoin, setFromCoin] = useState<string>('bitcoin');
  const [toCoin, setToCoin] = useState<string>('ethereum');
  const [fromAmount, setFromAmount] = useState<string>('1');
  const [toAmount, setToAmount] = useState<string>('');
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Profit calculator state
  const [buyPrice, setBuyPrice] = useState<string>('');
  const [sellPrice, setSellPrice] = useState<string>('');
  const [investment, setInvestment] = useState<string>('1000');

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,binancecoin,solana,ripple,cardano,dogecoin,polkadot,litecoin,chainlink,uniswap,avalanche-2,polygon,cosmos&vs_currencies=usd'
        );
        if (res.ok) {
          const data = await res.json();
          const priceMap: Record<string, number> = {};
          for (const [id, val] of Object.entries(data)) {
            priceMap[id] = (val as { usd: number }).usd;
          }
          setPrices(priceMap);
        }
      } catch (e) {
        console.error('Failed to fetch prices:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchPrices();
  }, []);

  const coinList =
    coins.length > 0
      ? coins
      : [
          {
            id: 'bitcoin',
            symbol: 'BTC',
            name: 'Bitcoin',
            image: '',
            current_price: prices.bitcoin || 0,
          },
          {
            id: 'ethereum',
            symbol: 'ETH',
            name: 'Ethereum',
            image: '',
            current_price: prices.ethereum || 0,
          },
          {
            id: 'tether',
            symbol: 'USDT',
            name: 'Tether',
            image: '',
            current_price: prices.tether || 1,
          },
          {
            id: 'binancecoin',
            symbol: 'BNB',
            name: 'BNB',
            image: '',
            current_price: prices.binancecoin || 0,
          },
          {
            id: 'solana',
            symbol: 'SOL',
            name: 'Solana',
            image: '',
            current_price: prices.solana || 0,
          },
          {
            id: 'ripple',
            symbol: 'XRP',
            name: 'XRP',
            image: '',
            current_price: prices.ripple || 0,
          },
          {
            id: 'cardano',
            symbol: 'ADA',
            name: 'Cardano',
            image: '',
            current_price: prices.cardano || 0,
          },
          {
            id: 'dogecoin',
            symbol: 'DOGE',
            name: 'Dogecoin',
            image: '',
            current_price: prices.dogecoin || 0,
          },
        ];

  const calculate = useCallback(() => {
    const fromPrice =
      prices[fromCoin] || coinList.find((c) => c.id === fromCoin)?.current_price || 0;
    const toPrice = prices[toCoin] || coinList.find((c) => c.id === toCoin)?.current_price || 0;

    if (fromPrice && toPrice && fromAmount) {
      const usdValue = parseFloat(fromAmount) * fromPrice;
      const result = usdValue / toPrice;
      setToAmount(result.toFixed(8));
    }
  }, [fromCoin, toCoin, fromAmount, prices, coinList]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  const swapCoins = () => {
    setFromCoin(toCoin);
    setToCoin(fromCoin);
    setFromAmount(toAmount);
  };

  const profitCalc = () => {
    const buy = parseFloat(buyPrice) || 0;
    const sell = parseFloat(sellPrice) || 0;
    const inv = parseFloat(investment) || 0;

    if (buy <= 0) return { profit: 0, percent: 0, coins: 0, finalValue: 0 };

    const coins = inv / buy;
    const finalValue = coins * sell;
    const profit = finalValue - inv;
    const percent = ((sell - buy) / buy) * 100;

    return { profit, percent, coins, finalValue };
  };

  const { profit, percent, coins: coinsBought, finalValue } = profitCalc();

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-black rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Converter */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <ArrowsRightLeftIcon className="w-5 h-5" />
          Crypto Converter
        </h3>

        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* From */}
          <div className="flex-1 w-full">
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              From
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-white text-lg font-mono"
                placeholder="0.00"
              />
              <select
                value={fromCoin}
                onChange={(e) => setFromCoin(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-white font-medium"
              >
                {coinList.map((coin) => (
                  <option key={coin.id} value={coin.id}>
                    {coin.symbol.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <button
            onClick={swapCoins}
            className="p-3 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-black transition-colors"
            aria-label="Swap currencies"
          >
            <ArrowsRightLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* To */}
          <div className="flex-1 w-full">
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">To</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={toAmount}
                readOnly
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-black text-slate-900 dark:text-white text-lg font-mono"
                placeholder="0.00"
              />
              <select
                value={toCoin}
                onChange={(e) => setToCoin(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-white font-medium"
              >
                {coinList.map((coin) => (
                  <option key={coin.id} value={coin.id}>
                    {coin.symbol.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
          1 {coinList.find((c) => c.id === fromCoin)?.symbol.toUpperCase()} ={' '}
          {((prices[fromCoin] || 0) / (prices[toCoin] || 1)).toFixed(6)}{' '}
          {coinList.find((c) => c.id === toCoin)?.symbol.toUpperCase()}
        </p>
      </div>

      {/* Profit Calculator */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <CalculatorIcon className="w-5 h-5" />
          Profit Calculator
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Buy Price ($)
            </label>
            <input
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-white font-mono"
              placeholder="40000"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Sell Price ($)
            </label>
            <input
              type="number"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-white font-mono"
              placeholder="50000"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Investment ($)
            </label>
            <input
              type="number"
              value={investment}
              onChange={(e) => setInvestment(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-white font-mono"
              placeholder="1000"
            />
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-black rounded-lg text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">Coins Bought</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              {coinsBought.toFixed(6)}
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-black rounded-lg text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">Final Value</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              ${finalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-black rounded-lg text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">Profit/Loss</div>
            <div
              className={`text-xl font-bold font-mono ${profit >= 0 ? 'text-slate-900 dark:text-white' : 'text-gray-500'}`}
            >
              {profit >= 0 ? '+' : ''}$
              {profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-black rounded-lg text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">Return %</div>
            <div
              className={`text-xl font-bold font-mono ${percent >= 0 ? 'text-slate-900 dark:text-white' : 'text-gray-500'}`}
            >
              {percent >= 0 ? '+' : ''}
              {percent.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

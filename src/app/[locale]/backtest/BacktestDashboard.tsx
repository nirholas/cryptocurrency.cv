'use client';

import { useState } from 'react';

interface BacktestResult {
  strategy: string;
  period: string;
  trades: number;
  winRate: number;
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  profitFactor: number;
  trades_list: Array<{
    date: string;
    signal: string;
    asset: string;
    entry: number;
    exit: number;
    pnl: number;
  }>;
}

export default function BacktestDashboard() {
  const [strategy, setStrategy] = useState('sentiment');
  const [asset, setAsset] = useState('BTC');
  const [period, setPeriod] = useState('1y');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);

  const handleBacktest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/research/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy, asset, period }),
      });
      if (res.ok) {
        const json = await res.json();
        setResult(json);
      }
    } catch (err) {
      console.error('Backtest failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const strategies = [
    { value: 'sentiment', label: 'Sentiment-Based', description: 'Trade on sentiment changes' },
    { value: 'breakingnews', label: 'Breaking News', description: 'Trade on breaking news events' },
    { value: 'whale', label: 'Whale Alerts', description: 'Trade on whale movements' },
    { value: 'influencer', label: 'Influencer Calls', description: 'Follow influencer signals' },
    { value: 'feargreed', label: 'Fear & Greed', description: 'Contrarian F&G strategy' },
  ];

  return (
    <div className="space-y-6">
      {/* Strategy Selection */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
        <h3 className="text-lg font-bold text-white mb-4">Configure Backtest</h3>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {strategies.map((s) => (
            <button
              key={s.value}
              onClick={() => setStrategy(s.value)}
              className={`p-4 rounded-lg text-left transition-colors ${
                strategy === s.value
                  ? 'bg-purple-600 border border-purple-500'
                  : 'bg-gray-700/50 border border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="font-bold text-white">{s.label}</div>
              <div className="text-sm text-gray-400">{s.description}</div>
            </button>
          ))}
        </div>

        <form onSubmit={handleBacktest} className="flex flex-wrap gap-4">
          <select
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            className="bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-3"
          >
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="ETH">Ethereum (ETH)</option>
            <option value="SOL">Solana (SOL)</option>
            <option value="XRP">XRP</option>
            <option value="DOGE">Dogecoin (DOGE)</option>
          </select>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-3"
          >
            <option value="1m">1 Month</option>
            <option value="3m">3 Months</option>
            <option value="6m">6 Months</option>
            <option value="1y">1 Year</option>
            <option value="2y">2 Years</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
          >
            {loading ? 'Running...' : 'Run Backtest'}
          </button>
        </form>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[
              { label: 'Trades', value: result.trades.toString() },
              { label: 'Win Rate', value: `${result.winRate}%`, color: result.winRate >= 50 ? 'text-green-400' : 'text-red-400' },
              { label: 'Total Return', value: `${result.totalReturn >= 0 ? '+' : ''}${result.totalReturn}%`, color: result.totalReturn >= 0 ? 'text-green-400' : 'text-red-400' },
              { label: 'Sharpe Ratio', value: result.sharpeRatio.toFixed(2) },
              { label: 'Max Drawdown', value: `${result.maxDrawdown}%`, color: 'text-red-400' },
              { label: 'Profit Factor', value: result.profitFactor.toFixed(2), color: result.profitFactor >= 1 ? 'text-green-400' : 'text-red-400' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center"
              >
                <div className="text-sm text-gray-500 mb-1">{stat.label}</div>
                <div className={`text-2xl font-bold ${stat.color || 'text-white'}`}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Trade List */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white">Trade History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-700/50 text-gray-400">
                  <tr>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Signal</th>
                    <th className="text-left px-4 py-3">Asset</th>
                    <th className="text-right px-4 py-3">Entry</th>
                    <th className="text-right px-4 py-3">Exit</th>
                    <th className="text-right px-4 py-3">P&L</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  {result.trades_list.slice(0, 10).map((trade, i) => (
                    <tr key={i} className="border-t border-gray-700/50">
                      <td className="px-4 py-3">{trade.date}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            trade.signal === 'long'
                              ? 'bg-green-400/10 text-green-400'
                              : 'bg-red-400/10 text-red-400'
                          }`}
                        >
                          {trade.signal.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">{trade.asset}</td>
                      <td className="px-4 py-3 text-right">${trade.entry.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">${trade.exit.toLocaleString()}</td>
                      <td
                        className={`px-4 py-3 text-right font-bold ${
                          trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {trade.pnl >= 0 ? '+' : ''}
                        {trade.pnl}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="text-center py-12 text-gray-400">
          Configure your backtest parameters above and click &ldquo;Run Backtest&rdquo; to see results.
        </div>
      )}
    </div>
  );
}

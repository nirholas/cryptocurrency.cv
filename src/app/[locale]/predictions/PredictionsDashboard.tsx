'use client';

import { useState, useEffect, useCallback } from 'react';

/** Dashboard component for price predictions and leaderboards */

// =============================================================================
// Types
// =============================================================================

interface Prediction {
  id: string;
  userId: string;
  asset: string;
  assetName: string;
  predictionType: 'price_above' | 'price_below' | 'price_range';
  targetPrice: number;
  targetPriceUpper?: number;
  deadline: string;
  confidence: number;
  status: 'pending' | 'correct' | 'incorrect' | 'cancelled';
  priceAtCreation: number;
  priceAtResolution?: number;
  resolvedAt?: string;
  createdAt: string;
  reasoning?: string;
}

interface UserStats {
  userId: string;
  totalPredictions: number;
  correctPredictions: number;
  incorrectPredictions: number;
  pendingPredictions: number;
  accuracy: number;
  streak: number;
  points: number;
  rank?: number;
}

interface LeaderboardEntry {
  userId: string;
  displayName?: string;
  accuracy: number;
  totalPredictions: number;
  correctPredictions: number;
  points: number;
  streak: number;
}

// =============================================================================
// Component
// =============================================================================

type TabType = 'create' | 'my-predictions' | 'leaderboard';

export default function PredictionsDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [asset, setAsset] = useState('bitcoin');
  const [predictionType, setPredictionType] = useState<'price_above' | 'price_below'>('price_above');
  const [targetPrice, setTargetPrice] = useState('');
  const [deadline, setDeadline] = useState('7d');
  const [confidence, setConfidence] = useState(50);
  const [reasoning, setReasoning] = useState('');
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Current prices for reference
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({
    bitcoin: 98500,
    ethereum: 3850,
    solana: 185,
    xrp: 2.45,
    cardano: 0.92,
    dogecoin: 0.38,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [predictionsRes, statsRes, leaderboardRes] = await Promise.all([
        fetch('/api/predictions?status=all&limit=50'),
        fetch('/api/predictions?action=stats'),
        fetch('/api/predictions?action=leaderboard&limit=20'),
      ]);

      if (predictionsRes.ok) {
        const data = await predictionsRes.json();
        setPredictions(data.predictions || []);
      }
      
      if (statsRes.ok) {
        const data = await statsRes.json();
        setUserStats(data.stats || null);
      }
      
      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json();
        setLeaderboard(data.leaderboard || []);
      }

      // Fetch current prices
      try {
        const priceRes = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple,cardano,dogecoin&vs_currencies=usd'
        );
        if (priceRes.ok) {
          const priceData = await priceRes.json();
          setCurrentPrices({
            bitcoin: priceData.bitcoin?.usd || 98500,
            ethereum: priceData.ethereum?.usd || 3850,
            solana: priceData.solana?.usd || 185,
            xrp: priceData.ripple?.usd || 2.45,
            cardano: priceData.cardano?.usd || 0.92,
            dogecoin: priceData.dogecoin?.usd || 0.38,
          });
        }
      } catch {
        // Use default prices
      }
    } catch (err) {
      setError('Failed to load predictions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreatePrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      setCreateMessage({ type: 'error', text: 'Please enter a valid target price' });
      return;
    }

    setCreating(true);
    setCreateMessage(null);

    try {
      const deadlineDate = new Date();
      switch (deadline) {
        case '1d':
          deadlineDate.setDate(deadlineDate.getDate() + 1);
          break;
        case '7d':
          deadlineDate.setDate(deadlineDate.getDate() + 7);
          break;
        case '30d':
          deadlineDate.setDate(deadlineDate.getDate() + 30);
          break;
        case '90d':
          deadlineDate.setDate(deadlineDate.getDate() + 90);
          break;
      }

      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset,
          predictionType,
          targetPrice: price,
          deadline: deadlineDate.toISOString(),
          confidence,
          reasoning: reasoning.trim() || undefined,
        }),
      });

      if (response.ok) {
        setCreateMessage({ type: 'success', text: 'Prediction created successfully!' });
        setTargetPrice('');
        setReasoning('');
        setConfidence(50);
        fetchData();
      } else {
        const data = await response.json();
        setCreateMessage({ type: 'error', text: data.error || 'Failed to create prediction' });
      }
    } catch (err) {
      setCreateMessage({ type: 'error', text: 'Failed to create prediction' });
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    } else if (price >= 1) {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    } else {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: Prediction['status']) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400">⏳ Pending</span>;
      case 'correct':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">✅ Correct</span>;
      case 'incorrect':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">❌ Incorrect</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400">🚫 Cancelled</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Stats Card */}
      {userStats && (
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-6">
          <h3 className="font-bold text-white mb-4">Your Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{userStats.totalPredictions}</div>
              <div className="text-xs text-gray-400">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{userStats.correctPredictions}</div>
              <div className="text-xs text-gray-400">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{userStats.accuracy.toFixed(1)}%</div>
              <div className="text-xs text-gray-400">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{userStats.streak}</div>
              <div className="text-xs text-gray-400">Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{userStats.points.toLocaleString()}</div>
              <div className="text-xs text-gray-400">Points</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {(['create', 'my-predictions', 'leaderboard'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === tab
                ? 'bg-amber-500 text-gray-900'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {tab === 'create' && '➕ Create'}
            {tab === 'my-predictions' && '📋 My Predictions'}
            {tab === 'leaderboard' && '🏆 Leaderboard'}
          </button>
        ))}
      </div>

      {/* Create Prediction Form */}
      {activeTab === 'create' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-6">Create New Prediction</h3>
          
          {createMessage && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              createMessage.type === 'success'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {createMessage.text}
            </div>
          )}

          <form onSubmit={handleCreatePrediction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Asset Selection */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Asset</label>
                <select
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="bitcoin">Bitcoin (BTC) - {formatPrice(currentPrices.bitcoin)}</option>
                  <option value="ethereum">Ethereum (ETH) - {formatPrice(currentPrices.ethereum)}</option>
                  <option value="solana">Solana (SOL) - {formatPrice(currentPrices.solana)}</option>
                  <option value="xrp">XRP - {formatPrice(currentPrices.xrp)}</option>
                  <option value="cardano">Cardano (ADA) - {formatPrice(currentPrices.cardano)}</option>
                  <option value="dogecoin">Dogecoin (DOGE) - {formatPrice(currentPrices.dogecoin)}</option>
                </select>
              </div>

              {/* Prediction Type */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Direction</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPredictionType('price_above')}
                    className={`flex-1 px-4 py-3 rounded-lg border font-medium transition-colors ${
                      predictionType === 'price_above'
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-gray-900 text-gray-300 border-gray-700 hover:bg-gray-800'
                    }`}
                  >
                    📈 Above
                  </button>
                  <button
                    type="button"
                    onClick={() => setPredictionType('price_below')}
                    className={`flex-1 px-4 py-3 rounded-lg border font-medium transition-colors ${
                      predictionType === 'price_below'
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : 'bg-gray-900 text-gray-300 border-gray-700 hover:bg-gray-800'
                    }`}
                  >
                    📉 Below
                  </button>
                </div>
              </div>

              {/* Target Price */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Target Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder={currentPrices[asset as keyof typeof currentPrices]?.toString() || '0'}
                    className="w-full pl-8 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Timeframe</label>
                <select
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="1d">24 Hours</option>
                  <option value="7d">1 Week</option>
                  <option value="30d">1 Month</option>
                  <option value="90d">3 Months</option>
                </select>
              </div>
            </div>

            {/* Confidence Slider */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Confidence Level: <span className="text-white font-bold">{confidence}%</span>
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={confidence}
                onChange={(e) => setConfidence(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low risk (10%)</span>
                <span>High risk (100%)</span>
              </div>
            </div>

            {/* Reasoning */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Reasoning (optional)</label>
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="Why do you think this will happen?"
                rows={3}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={creating || !targetPrice}
              className="w-full px-6 py-3 bg-amber-500 text-gray-900 rounded-lg font-bold hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>🎱 Submit Prediction</>
              )}
            </button>
          </form>
        </div>
      )}

      {/* My Predictions */}
      {activeTab === 'my-predictions' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-bold text-white">Your Predictions</h3>
          </div>
          {predictions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p>No predictions yet. Create your first one!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {predictions.map((pred) => (
                <div key={pred.id} className="p-4 hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white">{pred.assetName || pred.asset.toUpperCase()}</span>
                        {getStatusBadge(pred.status)}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {pred.predictionType === 'price_above' ? '📈 Above' : '📉 Below'}{' '}
                        <span className="text-white">{formatPrice(pred.targetPrice)}</span>
                        {' by '}{formatDate(pred.deadline)}
                      </div>
                      {pred.reasoning && (
                        <div className="text-xs text-gray-500 mt-2 italic">&quot;{pred.reasoning}&quot;</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">
                        Created: {formatDate(pred.createdAt)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Confidence: {pred.confidence}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-bold text-white">🏆 Top Predictors</h3>
          </div>
          {leaderboard.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p>No leaderboard data yet. Be the first to make predictions!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {leaderboard.map((entry, index) => (
                <div key={entry.userId} className="p-4 flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-500 text-gray-900' :
                    index === 1 ? 'bg-gray-300 text-gray-900' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white">
                      {entry.displayName || `Predictor #${entry.userId.slice(0, 8)}`}
                    </div>
                    <div className="text-xs text-gray-400">
                      {entry.totalPredictions} predictions • {entry.correctPredictions} correct
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-400">{entry.accuracy.toFixed(1)}%</div>
                    <div className="text-xs text-gray-400">{entry.points.toLocaleString()} pts</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';

interface OnchainEvent {
  id: string;
  type: 'transfer' | 'swap' | 'mint' | 'burn' | 'stake' | 'unstake' | 'governance';
  chain: string;
  asset: string;
  amount: string;
  usdValue: number;
  from: string;
  to: string;
  timestamp: string;
  txHash: string;
  relatedNews: Array<{ title: string; link: string; publishedAt: string }>;
}

export default function OnchainDashboard() {
  const [events, setEvents] = useState<OnchainEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventType, setEventType] = useState<string>('all');
  const [chain, setChain] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        if (eventType !== 'all') params.set('type', eventType);
        if (chain !== 'all') params.set('chain', chain);
        const res = await fetch(`/api/onchain?${params}`);
        if (res.ok) {
          const json = await res.json();
          setEvents(json.events || []);
        }
      } catch (err) {
        console.error('Failed to fetch on-chain events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [eventType, chain]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'transfer':
        return '↔️';
      case 'swap':
        return '🔄';
      case 'mint':
        return '🪙';
      case 'burn':
        return '🔥';
      case 'stake':
        return '📥';
      case 'unstake':
        return '📤';
      case 'governance':
        return '🗳️';
      default:
        return '📊';
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return 'Unknown';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatUSD = (value: number) => {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2"
        >
          <option value="all">All Events</option>
          <option value="transfer">Transfers</option>
          <option value="swap">Swaps</option>
          <option value="mint">Mints</option>
          <option value="burn">Burns</option>
          <option value="stake">Stakes</option>
          <option value="governance">Governance</option>
        </select>
        <select
          value={chain}
          onChange={(e) => setChain(e.target.value)}
          className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2"
        >
          <option value="all">All Chains</option>
          <option value="ethereum">Ethereum</option>
          <option value="bitcoin">Bitcoin</option>
          <option value="solana">Solana</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="polygon">Polygon</option>
          <option value="base">Base</option>
        </select>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getTypeIcon(event.type)}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white capitalize">
                      {event.type}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded text-xs capitalize">
                      {event.chain}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {event.amount} {event.asset}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">
                  {formatUSD(event.usdValue)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <span className="text-gray-500">From: </span>
                <span className="text-purple-400 font-mono">{formatAddress(event.from)}</span>
              </div>
              <div>
                <span className="text-gray-500">To: </span>
                <span className="text-purple-400 font-mono">{formatAddress(event.to)}</span>
              </div>
            </div>

            {event.relatedNews.length > 0 && (
              <div className="bg-gray-700/50 rounded-lg p-3 mb-3">
                <div className="text-xs text-gray-500 mb-2">Related News</div>
                {event.relatedNews.slice(0, 2).map((news, i) => (
                  <a
                    key={i}
                    href={news.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-gray-400 hover:text-purple-400 mb-1"
                  >
                    {news.title}
                  </a>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-gray-700">
              <a
                href={`https://etherscan.io/tx/${event.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-purple-400"
              >
                View Transaction →
              </a>
              <span>{new Date(event.timestamp).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No on-chain events found matching your criteria.
        </div>
      )}
    </div>
  );
}

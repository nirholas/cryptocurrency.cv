'use client';

import { useState, useEffect } from 'react';

interface Entity {
  name: string;
  type: 'person' | 'company' | 'protocol' | 'ticker' | 'exchange';
  mentions: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  recentArticles: Array<{ title: string; link: string }>;
  relatedEntities: string[];
}

export default function EntitiesDashboard() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = type !== 'all' ? `?type=${type}` : '';
        const res = await fetch(`/api/entities${params}`);
        if (res.ok) {
          const json = await res.json();
          setEntities(json.entities || []);
        }
      } catch (err) {
        console.error('Failed to fetch entities:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [type]);

  const getTypeIcon = (t: string) => {
    switch (t) {
      case 'person':
        return '👤';
      case 'company':
        return '🏢';
      case 'protocol':
        return '🔗';
      case 'ticker':
        return '📊';
      case 'exchange':
        return '💱';
      default:
        return '📌';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-400';
      case 'negative':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
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
      <div className="flex flex-wrap gap-2">
        {['all', 'person', 'company', 'protocol', 'ticker', 'exchange'].map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-4 py-2 rounded-lg capitalize flex items-center gap-2 ${
              type === t
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {t !== 'all' && <span>{getTypeIcon(t)}</span>}
            {t === 'all' ? 'All Types' : t}
          </button>
        ))}
      </div>

      {/* Entity Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {entities.map((entity) => (
          <div
            key={entity.name}
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 hover:border-purple-500/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getTypeIcon(entity.type)}</span>
                <div>
                  <h3 className="text-lg font-bold text-white">{entity.name}</h3>
                  <span className="text-gray-500 text-sm capitalize">{entity.type}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-purple-400">{entity.mentions}</div>
                <div className="text-xs text-gray-500">mentions</div>
              </div>
            </div>

            <div className={`text-sm mb-3 ${getSentimentColor(entity.sentiment)}`}>
              Sentiment: {entity.sentiment}
            </div>

            {entity.recentArticles.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1">Recent mentions:</div>
                <ul className="space-y-1">
                  {entity.recentArticles.slice(0, 2).map((article, i) => (
                    <li key={i}>
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-400 hover:text-purple-400 line-clamp-1"
                      >
                        {article.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {entity.relatedEntities.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-3 border-t border-gray-700">
                {entity.relatedEntities.slice(0, 4).map((related) => (
                  <span
                    key={related}
                    className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded text-xs"
                  >
                    {related}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {entities.length === 0 && (
        <div className="text-center py-12 text-gray-400">No entities found.</div>
      )}
    </div>
  );
}

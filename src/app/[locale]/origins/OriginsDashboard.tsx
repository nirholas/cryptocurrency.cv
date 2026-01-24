'use client';

import { useState, useEffect } from 'react';

interface Origin {
  storyId: string;
  headline: string;
  originalSource: {
    name: string;
    link: string;
    publishedAt: string;
  };
  propagation: Array<{
    source: string;
    publishedAt: string;
    delay: string;
    similarity: number;
  }>;
  totalCoverage: number;
}

export default function OriginsDashboard() {
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/origins?limit=10');
        if (res.ok) {
          const json = await res.json();
          setOrigins(json.stories || []);
        }
      } catch (err) {
        console.error('Failed to fetch origins:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/origins?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const json = await res.json();
        setOrigins(json.stories || []);
      }
    } catch (err) {
      console.error('Failed to search origins:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && origins.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a story or paste a URL..."
          className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
        >
          Find Origin
        </button>
      </form>

      {/* Story Cards */}
      <div className="space-y-6">
        {origins.map((story) => (
          <div
            key={story.storyId}
            className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white mb-2">{story.headline}</h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-purple-400">
                  {story.totalCoverage} sources covered this story
                </span>
              </div>
            </div>

            {/* Original Source */}
            <div className="p-4 bg-green-500/10 border-b border-gray-700">
              <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
                <span>✓</span>
                <span>Original Source</span>
              </div>
              <a
                href={story.originalSource.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white font-medium hover:text-green-400"
              >
                {story.originalSource.name}
              </a>
              <div className="text-gray-500 text-sm mt-1">
                Published: {new Date(story.originalSource.publishedAt).toLocaleString()}
              </div>
            </div>

            {/* Propagation Timeline */}
            <div className="p-4">
              <div className="text-sm text-gray-500 mb-3">Propagation Timeline</div>
              <div className="space-y-2">
                {story.propagation.slice(0, 5).map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 px-3 bg-gray-700/50 rounded"
                  >
                    <div>
                      <span className="text-white">{item.source}</span>
                      <span className="text-gray-500 text-sm ml-2">+{item.delay}</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {item.similarity}% match
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {origins.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-400">
          No origin data found. Try searching for a specific story.
        </div>
      )}
    </div>
  );
}

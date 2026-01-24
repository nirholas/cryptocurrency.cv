'use client';

import { useState, useEffect } from 'react';

interface Article {
  id: string;
  title: string;
  source: string;
  link: string;
  clickbaitScore: number;
  techniques: string[];
  analysis: string;
  publishedAt: string;
}

export default function ClickbaitDashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'low'>('all');
  const [url, setUrl] = useState('');
  const [checkResult, setCheckResult] = useState<Article | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/clickbait?limit=20');
        if (res.ok) {
          const json = await res.json();
          setArticles(json.articles || []);
        }
      } catch (err) {
        console.error('Failed to fetch articles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    try {
      const res = await fetch('/api/clickbait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        const json = await res.json();
        setCheckResult(json);
      }
    } catch (err) {
      console.error('Failed to check URL:', err);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-400 bg-red-400/10';
    if (score >= 40) return 'text-yellow-400 bg-yellow-400/10';
    return 'text-green-400 bg-green-400/10';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'High Clickbait';
    if (score >= 40) return 'Moderate';
    return 'Low Clickbait';
  };

  const filteredArticles = articles.filter((a) => {
    if (filter === 'high') return a.clickbaitScore >= 70;
    if (filter === 'low') return a.clickbaitScore < 40;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* URL Checker */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
        <h3 className="text-lg font-bold text-white mb-3">Check a URL</h3>
        <form onSubmit={handleCheck} className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a news article URL..."
            className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
          >
            Analyze
          </button>
        </form>

        {checkResult && (
          <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium truncate max-w-[70%]">
                {checkResult.title}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(
                  checkResult.clickbaitScore
                )}`}
              >
                {checkResult.clickbaitScore}%
              </span>
            </div>
            <p className="text-gray-400 text-sm">{checkResult.analysis}</p>
            {checkResult.techniques.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {checkResult.techniques.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 bg-red-400/10 text-red-400 rounded text-xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { value: 'all' as const, label: 'All' },
          { value: 'high' as const, label: '🚩 High Clickbait' },
          { value: 'low' as const, label: '✓ Quality Headlines' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg ${
              filter === f.value
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Articles List */}
      <div className="space-y-3">
        {filteredArticles.map((article) => (
          <div
            key={article.id}
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 flex items-center gap-4"
          >
            <div
              className={`w-16 h-16 flex flex-col items-center justify-center rounded-lg shrink-0 ${getScoreColor(
                article.clickbaitScore
              )}`}
            >
              <span className="text-2xl font-bold">{article.clickbaitScore}</span>
              <span className="text-xs">%</span>
            </div>

            <div className="flex-1 min-w-0">
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white font-medium hover:text-purple-400 line-clamp-1"
              >
                {article.title}
              </a>
              <div className="text-sm text-gray-500">{article.source}</div>
              {article.techniques.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {article.techniques.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded text-xs"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <span
              className={`text-sm px-3 py-1 rounded-full shrink-0 ${getScoreColor(
                article.clickbaitScore
              )}`}
            >
              {getScoreLabel(article.clickbaitScore)}
            </span>
          </div>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No articles found matching your filter.
        </div>
      )}
    </div>
  );
}

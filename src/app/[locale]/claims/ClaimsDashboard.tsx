'use client';

import { useState, useEffect } from 'react';

interface Claim {
  id: string;
  claim: string;
  type: 'prediction' | 'statement' | 'statistic' | 'opinion' | 'attribution';
  subject: string;
  confidence: number;
  articleTitle: string;
  articleLink: string;
  source: string;
  extractedAt: string;
}

export default function ClaimsDashboard() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = type !== 'all' ? `?type=${type}` : '';
        const res = await fetch(`/api/claims${params}`);
        if (res.ok) {
          const json = await res.json();
          setClaims(json.claims || []);
        }
      } catch (err) {
        console.error('Failed to fetch claims:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [type]);

  const getTypeColor = (t: string) => {
    switch (t) {
      case 'prediction':
        return 'bg-blue-400/10 text-blue-400';
      case 'statement':
        return 'bg-gray-400/10 text-gray-400';
      case 'statistic':
        return 'bg-green-400/10 text-green-400';
      case 'opinion':
        return 'bg-purple-400/10 text-purple-400';
      case 'attribution':
        return 'bg-yellow-400/10 text-yellow-400';
      default:
        return 'bg-gray-400/10 text-gray-400';
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
        {['all', 'prediction', 'statement', 'statistic', 'opinion', 'attribution'].map(
          (t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-4 py-2 rounded-lg capitalize ${
                type === t
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {t === 'all' ? 'All Types' : t + 's'}
            </button>
          )
        )}
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {claims.map((claim) => (
          <div
            key={claim.id}
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-5"
          >
            <div className="flex justify-between items-start gap-4 mb-3">
              <p className="text-lg text-white">&ldquo;{claim.claim}&rdquo;</p>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 capitalize ${getTypeColor(
                  claim.type
                )}`}
              >
                {claim.type}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
              <span>
                Subject: <span className="text-purple-400">{claim.subject}</span>
              </span>
              <span>
                Confidence: <span className="text-white">{claim.confidence}%</span>
              </span>
            </div>

            <div className="text-sm border-t border-gray-700 pt-3 flex justify-between items-center">
              <a
                href={claim.articleLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-purple-400 truncate max-w-[70%]"
              >
                {claim.source} - {claim.articleTitle}
              </a>
              <span className="text-gray-500 text-xs">
                {new Date(claim.extractedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {claims.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No claims found matching your criteria.
        </div>
      )}
    </div>
  );
}

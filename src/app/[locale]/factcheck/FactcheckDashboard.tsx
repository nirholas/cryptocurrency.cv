'use client';

import { useState, useEffect } from 'react';

interface Claim {
  id: string;
  claim: string;
  source: string;
  articleTitle: string;
  articleLink: string;
  claimType: 'prediction' | 'statement' | 'statistic' | 'attribution';
  verdict: 'verified' | 'unverified' | 'false' | 'misleading' | 'pending';
  confidence: number;
  evidence: string[];
  analysis: string;
  checkedAt: string;
}

export default function FactcheckDashboard() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [type, setType] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        if (type !== 'all') params.set('type', type);
        const res = await fetch(`/api/factcheck?${params}`);
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

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'verified':
        return 'text-green-400 bg-green-400/10';
      case 'false':
        return 'text-red-400 bg-red-400/10';
      case 'misleading':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'unverified':
        return 'text-gray-400 bg-gray-400/10';
      default:
        return 'text-blue-400 bg-blue-400/10';
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'verified':
        return '✓';
      case 'false':
        return '✗';
      case 'misleading':
        return '⚠';
      case 'unverified':
        return '?';
      default:
        return '⏳';
    }
  };

  const filteredClaims = claims.filter(
    (c) => filter === 'all' || c.verdict === filter
  );

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
        <div className="flex gap-2">
          {['all', 'verified', 'false', 'misleading', 'pending'].map((v) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`px-4 py-2 rounded-lg capitalize ${
                filter === v
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2"
        >
          <option value="all">All Types</option>
          <option value="prediction">Predictions</option>
          <option value="statement">Statements</option>
          <option value="statistic">Statistics</option>
          <option value="attribution">Attributions</option>
        </select>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {filteredClaims.map((claim) => (
          <div
            key={claim.id}
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-5"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <p className="text-lg text-white font-medium mb-2">
                  &ldquo;{claim.claim}&rdquo;
                </p>
                <div className="text-sm text-gray-400">
                  Source:{' '}
                  <a
                    href={claim.articleLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:underline"
                  >
                    {claim.source} - {claim.articleTitle}
                  </a>
                </div>
              </div>
              <span
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${getVerdictColor(
                  claim.verdict
                )}`}
              >
                <span>{getVerdictIcon(claim.verdict)}</span>
                {claim.verdict.toUpperCase()}
              </span>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4 mb-3">
              <div className="text-sm text-gray-300 mb-2">
                <strong>Analysis:</strong>
              </div>
              <p className="text-gray-400 text-sm">{claim.analysis}</p>
            </div>

            {claim.evidence.length > 0 && (
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Evidence:</div>
                <ul className="list-disc list-inside text-sm text-gray-400">
                  {claim.evidence.slice(0, 3).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-700 text-xs text-gray-500">
              <span className="capitalize">{claim.claimType}</span>
              <span>Confidence: {claim.confidence}%</span>
              <span>{new Date(claim.checkedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredClaims.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No claims found matching your criteria.
        </div>
      )}
    </div>
  );
}

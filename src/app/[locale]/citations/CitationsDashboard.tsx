'use client';

import { useState, useEffect } from 'react';

interface SourceNode {
  id: string;
  name: string;
  type: 'outlet' | 'blog' | 'twitter' | 'official';
  inboundCitations: number;
  outboundCitations: number;
  credibilityScore: number;
}

interface Citation {
  id: string;
  source: string;
  cites: string;
  articleTitle: string;
  citedArticleTitle: string;
  citationType: 'direct' | 'paraphrase' | 'reference';
  date: string;
}

export default function CitationsDashboard() {
  const [sources, setSources] = useState<SourceNode[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sourcesRes, citationsRes] = await Promise.all([
          fetch('/api/citations?type=sources'),
          fetch('/api/citations?type=recent'),
        ]);
        if (sourcesRes.ok) {
          const json = await sourcesRes.json();
          setSources(json.sources || []);
        }
        if (citationsRes.ok) {
          const json = await citationsRes.json();
          setCitations(json.citations || []);
        }
      } catch (err) {
        console.error('Failed to fetch citations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case 'outlet':
        return '📰';
      case 'blog':
        return '📝';
      case 'twitter':
        return '🐦';
      case 'official':
        return '✓';
      default:
        return '📄';
    }
  };

  const getCredibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const filteredCitations = selectedSource
    ? citations.filter(
        (c) => c.source === selectedSource || c.cites === selectedSource
      )
    : citations;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Sources */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
        <h3 className="text-lg font-bold text-white mb-4">Top Cited Sources</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {sources.slice(0, 8).map((source) => (
            <button
              key={source.id}
              onClick={() =>
                setSelectedSource(
                  selectedSource === source.name ? null : source.name
                )
              }
              className={`p-4 rounded-lg text-left transition-colors ${
                selectedSource === source.name
                  ? 'bg-purple-600 border border-purple-500'
                  : 'bg-gray-700/50 border border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span>{getSourceTypeIcon(source.type)}</span>
                <span className="font-bold text-white truncate">
                  {source.name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Cited by:</span>
                  <span className="text-white ml-1">{source.inboundCitations}</span>
                </div>
                <div>
                  <span className="text-gray-500">Cites:</span>
                  <span className="text-white ml-1">{source.outboundCitations}</span>
                </div>
              </div>
              <div
                className={`text-xs mt-2 ${getCredibilityColor(
                  source.credibilityScore
                )}`}
              >
                Credibility: {source.credibilityScore}%
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Citations */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">
            {selectedSource ? `Citations for ${selectedSource}` : 'Recent Citations'}
          </h3>
          {selectedSource && (
            <button
              onClick={() => setSelectedSource(null)}
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              Clear filter
            </button>
          )}
        </div>
        <div className="divide-y divide-gray-700">
          {filteredCitations.slice(0, 10).map((citation) => (
            <div key={citation.id} className="p-4">
              <div className="flex items-center gap-2 text-sm mb-2">
                <span className="font-bold text-purple-400">{citation.source}</span>
                <span className="text-gray-500">→</span>
                <span className="font-bold text-blue-400">{citation.cites}</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs capitalize ${
                    citation.citationType === 'direct'
                      ? 'bg-green-400/10 text-green-400'
                      : citation.citationType === 'paraphrase'
                      ? 'bg-yellow-400/10 text-yellow-400'
                      : 'bg-gray-400/10 text-gray-400'
                  }`}
                >
                  {citation.citationType}
                </span>
              </div>
              <div className="text-sm text-white mb-1">{citation.articleTitle}</div>
              <div className="text-xs text-gray-500">
                Citing: {citation.citedArticleTitle}
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredCitations.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No citations found.
        </div>
      )}
    </div>
  );
}

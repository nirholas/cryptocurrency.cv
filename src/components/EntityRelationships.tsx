/**
 * Entity Relationships Component
 * Displays partnerships, competitors, and investors for a coin
 * Surfaces /api/ai/relationships API
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Relationship {
  id: string;
  type: 'partnership' | 'investor' | 'competitor' | 'integration' | 'team' | 'acquired';
  entity: string;
  entityType: 'company' | 'person' | 'protocol' | 'exchange' | 'fund';
  description?: string;
  url?: string;
  confidence: number;
  sourceCount: number;
}

interface EntityRelationshipsProps {
  coinId: string;
  coinName: string;
  maxItems?: number;
  className?: string;
}

const relationshipConfig: Record<string, { label: string; icon: string; color: string }> = {
  partnership: { label: 'Partners', icon: '🤝', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  investor: { label: 'Investors', icon: '💰', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  competitor: { label: 'Competitors', icon: '⚔️', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  integration: { label: 'Integrations', icon: '🔗', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  team: { label: 'Team', icon: '👥', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  acquired: { label: 'Acquisitions', icon: '🏢', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
};

const entityTypeIcons: Record<string, string> = {
  company: '🏢',
  person: '👤',
  protocol: '⚙️',
  exchange: '📊',
  fund: '💼',
};

export function EntityRelationships({ 
  coinId, 
  coinName,
  maxItems = 6,
  className = ''
}: EntityRelationshipsProps) {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    const fetchRelationships = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/ai/relationships?coin=${encodeURIComponent(coinId)}`);
        if (response.ok) {
          const data = await response.json();
          setRelationships(data.relationships || []);
        } else {
          setError('Failed to load relationships');
        }
      } catch (err) {
        setError('Failed to load relationships');
        console.error('Failed to fetch relationships:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRelationships();
  }, [coinId]);

  if (loading) {
    return (
      <div className={`animate-pulse space-y-3 ${className}`}>
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || relationships.length === 0) {
    return null;
  }

  // Group by type
  const grouped = relationships.reduce((acc, rel) => {
    if (!acc[rel.type]) acc[rel.type] = [];
    acc[rel.type].push(rel);
    return acc;
  }, {} as Record<string, Relationship[]>);

  const types = Object.keys(grouped);
  const filteredRelationships = selectedType 
    ? grouped[selectedType] || []
    : relationships.slice(0, maxItems);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span>🔗</span>
          {coinName} Ecosystem
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {relationships.length} connections
        </span>
      </div>

      {/* Type filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedType(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedType === null
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          All
        </button>
        {types.map(type => {
          const config = relationshipConfig[type] || relationshipConfig.partnership;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedType === type
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {config.icon} {config.label} ({grouped[type].length})
            </button>
          );
        })}
      </div>

      {/* Relationship cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredRelationships.map((rel) => {
          const config = relationshipConfig[rel.type] || relationshipConfig.partnership;
          const entityIcon = entityTypeIcons[rel.entityType] || '🔹';

          return (
            <div
              key={rel.id}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                  {config.icon} {config.label}
                </span>
                <span className="text-xs text-gray-400" title={`${rel.sourceCount} sources`}>
                  📰 {rel.sourceCount}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{entityIcon}</span>
                <span className="font-semibold text-gray-900 dark:text-white truncate">
                  {rel.entity}
                </span>
              </div>
              
              {rel.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {rel.description}
                </p>
              )}
              
              {rel.url && (
                <a
                  href={rel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  Learn more
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              
              {/* Confidence indicator */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${rel.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">
                  {Math.round(rel.confidence * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more */}
      {!selectedType && relationships.length > maxItems && (
        <button
          onClick={() => setSelectedType(types[0])}
          className="w-full py-2 text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          View all {relationships.length} relationships →
        </button>
      )}
    </div>
  );
}

/**
 * Compact version for sidebars
 */
export function EntityRelationshipsCompact({ 
  coinId, 
  coinName,
  maxItems = 4,
  className = ''
}: EntityRelationshipsProps) {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelationships = async () => {
      try {
        const response = await fetch(`/api/ai/relationships?coin=${encodeURIComponent(coinId)}&limit=${maxItems}`);
        if (response.ok) {
          const data = await response.json();
          setRelationships(data.relationships || []);
        }
      } catch (err) {
        console.error('Failed to fetch relationships:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRelationships();
  }, [coinId, maxItems]);

  if (loading || relationships.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        🔗 Key Relationships
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {relationships.slice(0, maxItems).map((rel) => {
          const config = relationshipConfig[rel.type] || relationshipConfig.partnership;
          return (
            <span
              key={rel.id}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${config.color}`}
              title={rel.description || `${rel.type}: ${rel.entity}`}
            >
              {config.icon} {rel.entity}
            </span>
          );
        })}
        {relationships.length > maxItems && (
          <Link
            href={`/coin/${coinId}?tab=ecosystem`}
            className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            +{relationships.length - maxItems} more
          </Link>
        )}
      </div>
    </div>
  );
}

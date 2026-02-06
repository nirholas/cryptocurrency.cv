/**
 * Free Crypto News React Components
 * 
 * 100% FREE - no API keys required!
 * 
 * @example
 * ```tsx
 * import { CryptoNews, useCryptoNews } from '@nirholas/react-crypto-news';
 * 
 * // Simple usage
 * <CryptoNews limit={10} />
 * 
 * // With hook for custom UI
 * const { articles, loading } = useCryptoNews({ limit: 5 });
 * ```
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface NewsArticle {
  title: string;
  link: string;
  description?: string;
  pubDate: string;
  source: string;
  sourceKey: string;
  category: string;
  timeAgo: string;
}

export interface NewsResponse {
  articles: NewsArticle[];
  totalCount: number;
  sources: string[];
  fetchedAt: string;
}

export interface TrendingTopic {
  topic: string;
  count: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export interface UseCryptoNewsOptions {
  /** API endpoint: 'news' | 'bitcoin' | 'defi' | 'breaking' | 'search' */
  endpoint?: 'news' | 'bitcoin' | 'defi' | 'breaking' | 'search';
  /** Maximum articles to fetch */
  limit?: number;
  /** Search query (for search endpoint) */
  query?: string;
  /** Filter by source */
  source?: string;
  /** Auto-refresh interval in ms (0 to disable) */
  refreshInterval?: number;
  /** Custom base URL for self-hosted instances */
  baseUrl?: string;
}

export interface UseCryptoNewsResult {
  articles: NewsArticle[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  lastUpdated: Date | null;
}

export interface CryptoNewsProps {
  /** Display variant */
  variant?: 'list' | 'cards' | 'compact' | 'ticker';
  /** Maximum articles to show */
  limit?: number;
  /** API endpoint */
  endpoint?: 'news' | 'bitcoin' | 'defi' | 'breaking';
  /** Filter by source */
  source?: string;
  /** Show source badge */
  showSource?: boolean;
  /** Show time ago */
  showTime?: boolean;
  /** Show description */
  showDescription?: boolean;
  /** Auto-refresh interval in ms */
  refreshInterval?: number;
  /** Custom base URL */
  baseUrl?: string;
  /** Theme */
  theme?: 'light' | 'dark' | 'auto';
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Called when article is clicked */
  onArticleClick?: (article: NewsArticle) => void;
  /** Custom article renderer */
  renderArticle?: (article: NewsArticle, index: number) => React.ReactNode;
  /** Loading state renderer */
  renderLoading?: () => React.ReactNode;
  /** Error state renderer */
  renderError?: (error: Error) => React.ReactNode;
  /** Empty state renderer */
  renderEmpty?: () => React.ReactNode;
  /** Header renderer */
  renderHeader?: () => React.ReactNode;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const DEFAULT_BASE_URL = 'https://cryptocurrency.cv';

const SOURCE_COLORS: Record<string, string> = {
  coindesk: '#1652f0',
  theblock: '#000000',
  decrypt: '#2c2c2c',
  cointelegraph: '#ffb800',
  bitcoinmagazine: '#f7931a',
  blockworks: '#7c3aed',
  defiant: '#10b981',
};

// ═══════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════

/**
 * Hook to fetch crypto news
 */
export function useCryptoNews(options: UseCryptoNewsOptions = {}): UseCryptoNewsResult {
  const {
    endpoint = 'news',
    limit = 10,
    query,
    source,
    refreshInterval = 0,
    baseUrl = DEFAULT_BASE_URL,
  } = options;

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let url = `${baseUrl}/api/${endpoint}?limit=${limit}`;
      if (source) url += `&source=${source}`;
      if (query && endpoint === 'search') url += `&q=${encodeURIComponent(query)}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data: NewsResponse = await response.json();
      setArticles(data.articles || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch news'));
    } finally {
      setLoading(false);
    }
  }, [endpoint, limit, query, source, baseUrl]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchNews, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, fetchNews]);

  return { articles, loading, error, refresh: fetchNews, lastUpdated };
}

/**
 * Hook to fetch trending topics
 */
export function useTrendingTopics(options: { limit?: number; hours?: number; baseUrl?: string } = {}) {
  const { limit = 10, hours = 24, baseUrl = DEFAULT_BASE_URL } = options;

  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchTrending() {
      try {
        setLoading(true);
        const response = await fetch(`${baseUrl}/api/trending?limit=${limit}&hours=${hours}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setTopics(data.trending || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch trending'));
      } finally {
        setLoading(false);
      }
    }
    fetchTrending();
  }, [limit, hours, baseUrl]);

  return { topics, loading, error };
}

/**
 * Hook to search news
 */
export function useSearchNews(query: string, options: { limit?: number; baseUrl?: string } = {}) {
  return useCryptoNews({ ...options, endpoint: 'search', query });
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  listItem: {
    padding: '12px 0',
    borderBottom: '1px solid var(--border-color, #e5e7eb)',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  card: {
    border: '1px solid var(--border-color, #e5e7eb)',
    borderRadius: '8px',
    padding: '16px',
    background: 'var(--card-bg, #fff)',
    transition: 'box-shadow 0.2s',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text-color, #111)',
  },
  link: {
    color: 'inherit',
    textDecoration: 'none',
  },
  description: {
    margin: '0 0 8px 0',
    fontSize: '13px',
    color: 'var(--text-secondary, #666)',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: 'var(--text-tertiary, #888)',
  },
  sourceBadge: (source: string) => ({
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500,
    background: SOURCE_COLORS[source] || '#6b7280',
    color: '#fff',
  }),
  ticker: {
    display: 'flex',
    overflow: 'hidden',
    whiteSpace: 'nowrap' as const,
  },
  tickerTrack: {
    display: 'flex',
    animation: 'scroll 30s linear infinite',
  },
  tickerItem: {
    padding: '8px 24px',
    borderRight: '1px solid var(--border-color, #e5e7eb)',
  },
  loading: {
    padding: '20px',
    textAlign: 'center' as const,
    color: 'var(--text-secondary, #666)',
  },
  error: {
    padding: '20px',
    textAlign: 'center' as const,
    color: '#ef4444',
  },
  dark: {
    '--text-color': '#f3f4f6',
    '--text-secondary': '#9ca3af',
    '--text-tertiary': '#6b7280',
    '--border-color': '#374151',
    '--card-bg': '#1f2937',
    '--bg': '#111827',
  } as React.CSSProperties,
  light: {
    '--text-color': '#111827',
    '--text-secondary': '#6b7280',
    '--text-tertiary': '#9ca3af',
    '--border-color': '#e5e7eb',
    '--card-bg': '#ffffff',
    '--bg': '#ffffff',
  } as React.CSSProperties,
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════

/**
 * Article item component
 */
function ArticleItem({
  article,
  variant,
  showSource,
  showTime,
  showDescription,
  onClick,
}: {
  article: NewsArticle;
  variant: 'list' | 'cards' | 'compact' | 'ticker';
  showSource: boolean;
  showTime: boolean;
  showDescription: boolean;
  onClick?: (article: NewsArticle) => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(article);
    }
  };

  if (variant === 'compact') {
    return (
      <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color, #e5e7eb)' }}>
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...styles.link, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          onClick={handleClick}
        >
          <span style={{ fontSize: '13px' }}>{article.title}</span>
          {showTime && <span style={{ fontSize: '11px', color: 'var(--text-tertiary, #888)' }}>{article.timeAgo}</span>}
        </a>
      </div>
    );
  }

  if (variant === 'ticker') {
    return (
      <div style={styles.tickerItem}>
        <a href={article.link} target="_blank" rel="noopener noreferrer" style={styles.link} onClick={handleClick}>
          {showSource && <span style={{ fontWeight: 600 }}>{article.source}: </span>}
          {article.title}
        </a>
      </div>
    );
  }

  const content = (
    <>
      <h3 style={styles.title}>
        <a href={article.link} target="_blank" rel="noopener noreferrer" style={styles.link} onClick={handleClick}>
          {article.title}
        </a>
      </h3>
      {showDescription && article.description && (
        <p style={styles.description}>{article.description}</p>
      )}
      <div style={styles.meta}>
        {showSource && <span style={styles.sourceBadge(article.sourceKey)}>{article.source}</span>}
        {showTime && <span>{article.timeAgo}</span>}
      </div>
    </>
  );

  if (variant === 'cards') {
    return <div style={styles.card}>{content}</div>;
  }

  return <li style={styles.listItem}>{content}</li>;
}

/**
 * Main CryptoNews component
 */
export function CryptoNews({
  variant = 'list',
  limit = 10,
  endpoint = 'news',
  source,
  showSource = true,
  showTime = true,
  showDescription = true,
  refreshInterval = 0,
  baseUrl,
  theme = 'auto',
  className,
  style,
  onArticleClick,
  renderArticle,
  renderLoading,
  renderError,
  renderEmpty,
  renderHeader,
}: CryptoNewsProps) {
  const { articles, loading, error, lastUpdated } = useCryptoNews({
    endpoint,
    limit,
    source,
    refreshInterval,
    baseUrl,
  });

  // Determine theme
  const themeStyles = useMemo(() => {
    if (theme === 'dark') return styles.dark;
    if (theme === 'light') return styles.light;
    // Auto: check system preference
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return styles.dark;
    }
    return styles.light;
  }, [theme]);

  if (loading && articles.length === 0) {
    if (renderLoading) return <>{renderLoading()}</>;
    return <div style={{ ...styles.container, ...styles.loading, ...themeStyles }}>Loading crypto news...</div>;
  }

  if (error) {
    if (renderError) return <>{renderError(error)}</>;
    return <div style={{ ...styles.container, ...styles.error, ...themeStyles }}>Error: {error.message}</div>;
  }

  if (articles.length === 0) {
    if (renderEmpty) return <>{renderEmpty()}</>;
    return <div style={{ ...styles.container, ...styles.loading, ...themeStyles }}>No news found</div>;
  }

  const containerStyle = {
    ...styles.container,
    ...themeStyles,
    ...style,
  };

  // Ticker variant
  if (variant === 'ticker') {
    return (
      <div className={className} style={{ ...containerStyle, overflow: 'hidden' }}>
        <style>{`
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
        <div style={styles.tickerTrack}>
          {[...articles, ...articles].map((article, i) =>
            renderArticle ? (
              renderArticle(article, i)
            ) : (
              <ArticleItem
                key={`${article.link}-${i}`}
                article={article}
                variant="ticker"
                showSource={showSource}
                showTime={showTime}
                showDescription={showDescription}
                onClick={onArticleClick}
              />
            )
          )}
        </div>
      </div>
    );
  }

  // Cards variant
  if (variant === 'cards') {
    return (
      <div className={className} style={containerStyle}>
        {renderHeader?.()}
        <div style={styles.cardGrid}>
          {articles.map((article, i) =>
            renderArticle ? (
              renderArticle(article, i)
            ) : (
              <ArticleItem
                key={article.link}
                article={article}
                variant="cards"
                showSource={showSource}
                showTime={showTime}
                showDescription={showDescription}
                onClick={onArticleClick}
              />
            )
          )}
        </div>
      </div>
    );
  }

  // List/Compact variant
  return (
    <div className={className} style={containerStyle}>
      {renderHeader?.()}
      <ul style={styles.list}>
        {articles.map((article, i) =>
          renderArticle ? (
            renderArticle(article, i)
          ) : (
            <ArticleItem
              key={article.link}
              article={article}
              variant={variant}
              showSource={showSource}
              showTime={showTime}
              showDescription={showDescription}
              onClick={onArticleClick}
            />
          )
        )}
      </ul>
    </div>
  );
}

/**
 * Bitcoin-specific news component
 */
export function BitcoinNews(props: Omit<CryptoNewsProps, 'endpoint'>) {
  return <CryptoNews {...props} endpoint="bitcoin" />;
}

/**
 * DeFi-specific news component
 */
export function DefiNews(props: Omit<CryptoNewsProps, 'endpoint'>) {
  return <CryptoNews {...props} endpoint="defi" />;
}

/**
 * Breaking news component
 */
export function BreakingNews(props: Omit<CryptoNewsProps, 'endpoint'>) {
  return <CryptoNews {...props} endpoint="breaking" />;
}

/**
 * News ticker component
 */
export function NewsTicker(props: Omit<CryptoNewsProps, 'variant'>) {
  return <CryptoNews {...props} variant="ticker" showDescription={false} />;
}

/**
 * Trending topics component
 */
export function TrendingTopics({
  limit = 10,
  hours = 24,
  baseUrl,
  theme = 'auto',
  className,
  style,
}: {
  limit?: number;
  hours?: number;
  baseUrl?: string;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
  style?: React.CSSProperties;
}) {
  const { topics, loading, error } = useTrendingTopics({ limit, hours, baseUrl });

  const themeStyles = useMemo(() => {
    if (theme === 'dark') return styles.dark;
    if (theme === 'light') return styles.light;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return styles.dark;
    }
    return styles.light;
  }, [theme]);

  if (loading) return <div style={{ ...styles.container, ...styles.loading, ...themeStyles }}>Loading trends...</div>;
  if (error) return <div style={{ ...styles.container, ...styles.error, ...themeStyles }}>Error loading trends</div>;

  const getSentimentEmoji = (sentiment: string) => {
    if (sentiment === 'bullish') return '🟢';
    if (sentiment === 'bearish') return '🔴';
    return '⚪';
  };

  return (
    <div className={className} style={{ ...styles.container, ...themeStyles, ...style }}>
      <ul style={styles.list}>
        {topics.map((topic) => (
          <li key={topic.topic} style={{ ...styles.listItem, display: 'flex', justifyContent: 'space-between' }}>
            <span>
              {getSentimentEmoji(topic.sentiment)} {topic.topic}
            </span>
            <span style={{ color: 'var(--text-tertiary, #888)' }}>{topic.count} mentions</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Default export
export default CryptoNews;

/**
 * Article Clustering Utility
 * Groups related news articles from different sources about the same story.
 * Inspired by Google News "Full Coverage" story clustering.
 *
 * Uses keyword overlap scoring to detect when multiple outlets cover
 * the same event, enabling multi-perspective presentation.
 *
 * @module lib/clustering
 */

interface ClusterArticle {
  title: string;
  link: string;
  description?: string;
  pubDate: string;
  source: string;
  timeAgo: string;
}

export interface ArticleCluster {
  articles: ClusterArticle[];
  similarity: number;
}

// Common stop words to exclude from keyword extraction
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'it', 'its',
  'this', 'that', 'these', 'those', 'i', 'we', 'you', 'he', 'she',
  'they', 'my', 'our', 'your', 'his', 'her', 'their', 'what', 'which',
  'who', 'whom', 'how', 'when', 'where', 'why', 'not', 'no', 'nor',
  'so', 'if', 'than', 'too', 'very', 'just', 'about', 'above', 'after',
  'again', 'all', 'also', 'am', 'any', 'because', 'before', 'between',
  'both', 'each', 'few', 'more', 'most', 'other', 'over', 'same',
  'some', 'such', 'then', 'there', 'through', 'under', 'until', 'up',
  'while', 'says', 'said', 'new', 'news', 'crypto', 'cryptocurrency',
]);

/**
 * Extract significant keywords from a title
 */
function extractKeywords(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w))
  );
}

/**
 * Calculate keyword overlap score between two titles (0-1)
 */
function keywordOverlap(title1: string, title2: string): number {
  const kw1 = extractKeywords(title1);
  const kw2 = extractKeywords(title2);

  if (kw1.size === 0 || kw2.size === 0) return 0;

  let overlap = 0;
  for (const word of kw1) {
    if (kw2.has(word)) overlap++;
  }

  const minSize = Math.min(kw1.size, kw2.size);
  return overlap / minSize;
}

/**
 * Cluster related articles from different sources about the same story.
 *
 * @param articles - Array of news articles to cluster
 * @param threshold - Minimum keyword overlap score to consider articles related (0-1)
 * @param maxClusters - Maximum number of clusters to return
 * @param minClusterSize - Minimum articles needed to form a cluster (must be from different sources)
 * @returns Array of article clusters, sorted by cluster size (largest first)
 */
export function clusterArticles(
  articles: ClusterArticle[],
  threshold = 0.45,
  maxClusters = 5,
  minClusterSize = 2,
): ArticleCluster[] {
  const assigned = new Set<number>();
  const clusters: ArticleCluster[] = [];

  for (let i = 0; i < articles.length && clusters.length < maxClusters * 2; i++) {
    if (assigned.has(i)) continue;

    const cluster: ClusterArticle[] = [articles[i]];
    const clusterSources = new Set([articles[i].source]);
    let totalSimilarity = 0;
    let comparisons = 0;

    for (let j = i + 1; j < articles.length; j++) {
      if (assigned.has(j)) continue;
      // Require different sources for clustering
      if (clusterSources.has(articles[j].source)) continue;

      const score = keywordOverlap(articles[i].title, articles[j].title);
      if (score >= threshold) {
        cluster.push(articles[j]);
        clusterSources.add(articles[j].source);
        assigned.add(j);
        totalSimilarity += score;
        comparisons++;
      }
    }

    if (cluster.length >= minClusterSize) {
      assigned.add(i);
      clusters.push({
        articles: cluster,
        similarity: comparisons > 0 ? totalSimilarity / comparisons : 0,
      });
    }
  }

  // Sort by cluster size (more sources = bigger story), then by similarity
  return clusters
    .sort((a, b) => b.articles.length - a.articles.length || b.similarity - a.similarity)
    .slice(0, maxClusters);
}

#!/usr/bin/env node

/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Story Clustering Engine
 * 
 * Groups related articles about the same events:
 * - Detects duplicate/similar stories across sources
 * - Tracks story "size" by number of sources covering it
 * - Identifies which source broke the story first
 * - Detects coordinated narratives (same story, same time, multiple outlets)
 */

const crypto = require('crypto');

// =============================================================================
// CONFIGURATION
// =============================================================================

// Similarity thresholds
const SIMILARITY_THRESHOLDS = {
  title: 0.6,      // Title similarity for clustering
  combined: 0.5    // Combined title+description similarity
};

// Time windows
const TIME_WINDOWS = {
  same_event: 24 * 60 * 60 * 1000,     // 24 hours - same event window
  coordinated: 30 * 60 * 1000,          // 30 minutes - coordinated release detection
  first_mover: 60 * 60 * 1000           // 1 hour - first mover advantage window
};

// Stop words to ignore in similarity
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'between',
  'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
  'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just',
  'crypto', 'bitcoin', 'btc', 'ethereum', 'eth', 'cryptocurrency', 'blockchain'
]);

// =============================================================================
// TEXT PROCESSING
// =============================================================================

/**
 * Normalize text for comparison
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenize text into words
 */
function tokenize(text) {
  const normalized = normalizeText(text);
  return normalized
    .split(' ')
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Extract key entities/terms from text
 */
function extractKeyTerms(text) {
  const tokens = tokenize(text);
  
  // Count term frequency
  const termFreq = {};
  tokens.forEach(token => {
    termFreq[token] = (termFreq[token] || 0) + 1;
  });
  
  // Return terms sorted by frequency
  return Object.entries(termFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([term]) => term);
}

/**
 * Calculate Jaccard similarity between two sets of tokens
 */
function jaccardSimilarity(tokens1, tokens2) {
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Calculate cosine similarity using term frequency vectors
 */
function cosineSimilarity(tokens1, tokens2) {
  const freq1 = {};
  const freq2 = {};
  
  tokens1.forEach(t => freq1[t] = (freq1[t] || 0) + 1);
  tokens2.forEach(t => freq2[t] = (freq2[t] || 0) + 1);
  
  const allTerms = new Set([...tokens1, ...tokens2]);
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  allTerms.forEach(term => {
    const v1 = freq1[term] || 0;
    const v2 = freq2[term] || 0;
    dotProduct += v1 * v2;
    mag1 += v1 * v1;
    mag2 += v2 * v2;
  });
  
  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

/**
 * Calculate combined similarity score
 */
function calculateSimilarity(article1, article2) {
  const title1Tokens = tokenize(article1.title);
  const title2Tokens = tokenize(article2.title);
  
  const desc1Tokens = tokenize(article1.description || '');
  const desc2Tokens = tokenize(article2.description || '');
  
  const combined1 = [...title1Tokens, ...desc1Tokens];
  const combined2 = [...title2Tokens, ...desc2Tokens];
  
  const titleSimilarity = jaccardSimilarity(title1Tokens, title2Tokens);
  const combinedSimilarity = cosineSimilarity(combined1, combined2);
  
  return {
    title: titleSimilarity,
    combined: combinedSimilarity,
    score: (titleSimilarity * 0.6) + (combinedSimilarity * 0.4)
  };
}

// =============================================================================
// CLUSTERING ENGINE
// =============================================================================

class StoryCluster {
  constructor(seedArticle) {
    this.id = crypto.randomUUID();
    this.articles = [seedArticle];
    this.first_seen = new Date(seedArticle.first_seen || seedArticle.pub_date);
    this.key_terms = extractKeyTerms(seedArticle.title + ' ' + (seedArticle.description || ''));
    this.sources = new Set([seedArticle.source]);
    this.canonical_title = seedArticle.title;
  }

  addArticle(article) {
    this.articles.push(article);
    this.sources.add(article.source);
    
    const articleTime = new Date(article.first_seen || article.pub_date);
    if (articleTime < this.first_seen) {
      this.first_seen = articleTime;
      this.canonical_title = article.title; // Earlier article becomes canonical
    }
    
    // Update key terms
    const newTerms = extractKeyTerms(article.title + ' ' + (article.description || ''));
    const allTerms = [...this.key_terms, ...newTerms];
    const termFreq = {};
    allTerms.forEach(t => termFreq[t] = (termFreq[t] || 0) + 1);
    this.key_terms = Object.entries(termFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([term]) => term);
  }

  matches(article) {
    // Check time window
    const articleTime = new Date(article.first_seen || article.pub_date);
    const timeDiff = Math.abs(articleTime - this.first_seen);
    if (timeDiff > TIME_WINDOWS.same_event) return false;
    
    // Check similarity against all articles in cluster (use most similar)
    let maxSimilarity = 0;
    for (const clusterArticle of this.articles) {
      const sim = calculateSimilarity(article, clusterArticle);
      maxSimilarity = Math.max(maxSimilarity, sim.score);
    }
    
    return maxSimilarity >= SIMILARITY_THRESHOLDS.combined;
  }

  toJSON() {
    return {
      cluster_id: this.id,
      canonical_title: this.canonical_title,
      key_terms: this.key_terms,
      source_count: this.sources.size,
      sources: [...this.sources],
      article_count: this.articles.length,
      first_seen: this.first_seen.toISOString(),
      articles: this.articles.map(a => ({
        id: a.id,
        title: a.title,
        source: a.source,
        first_seen: a.first_seen,
        link: a.link
      })),
      story_size: this.getStorySize(),
      first_mover: this.getFirstMover(),
      is_coordinated: this.isCoordinated()
    };
  }

  getStorySize() {
    // Story size based on source diversity and article count
    const sourceDiversity = this.sources.size;
    
    if (sourceDiversity >= 10) return 'mega';
    if (sourceDiversity >= 5) return 'large';
    if (sourceDiversity >= 3) return 'medium';
    if (sourceDiversity >= 2) return 'small';
    return 'single';
  }

  getFirstMover() {
    // Find who published first
    let earliest = this.articles[0];
    let earliestTime = new Date(earliest.first_seen || earliest.pub_date);
    
    for (const article of this.articles) {
      const articleTime = new Date(article.first_seen || article.pub_date);
      if (articleTime < earliestTime) {
        earliest = article;
        earliestTime = articleTime;
      }
    }
    
    return {
      source: earliest.source,
      title: earliest.title,
      first_seen: earliestTime.toISOString(),
      lead_time_minutes: this.articles.length > 1 
        ? Math.round((new Date(this.articles.find(a => a !== earliest)?.first_seen || a.pub_date) - earliestTime) / 60000)
        : 0
    };
  }

  isCoordinated() {
    // Detect if multiple sources published within coordinated time window
    if (this.sources.size < 3) return false;
    
    const times = this.articles.map(a => new Date(a.first_seen || a.pub_date).getTime());
    times.sort((a, b) => a - b);
    
    // Check if 3+ articles published within coordination window
    for (let i = 0; i <= times.length - 3; i++) {
      if (times[i + 2] - times[i] < TIME_WINDOWS.coordinated) {
        return true;
      }
    }
    
    return false;
  }
}

// =============================================================================
// CLUSTERING SERVICE
// =============================================================================

const ClusteringService = {
  /**
   * Cluster a set of articles
   */
  clusterArticles(articles) {
    console.log(`📊 Clustering ${articles.length} articles...`);
    
    const clusters = [];
    const processedIds = new Set();
    
    // Sort articles by time (oldest first)
    const sortedArticles = [...articles].sort((a, b) => {
      const timeA = new Date(a.first_seen || a.pub_date);
      const timeB = new Date(b.first_seen || b.pub_date);
      return timeA - timeB;
    });
    
    for (const article of sortedArticles) {
      if (processedIds.has(article.id)) continue;
      
      // Try to match with existing clusters
      let matched = false;
      for (const cluster of clusters) {
        if (cluster.matches(article)) {
          cluster.addArticle(article);
          processedIds.add(article.id);
          matched = true;
          break;
        }
      }
      
      // Create new cluster if no match
      if (!matched) {
        const newCluster = new StoryCluster(article);
        clusters.push(newCluster);
        processedIds.add(article.id);
      }
    }
    
    console.log(`✅ Created ${clusters.length} clusters from ${articles.length} articles`);
    
    return {
      clusters: clusters.map(c => c.toJSON()),
      stats: {
        total_articles: articles.length,
        total_clusters: clusters.length,
        avg_cluster_size: articles.length / clusters.length,
        mega_stories: clusters.filter(c => c.getStorySize() === 'mega').length,
        large_stories: clusters.filter(c => c.getStorySize() === 'large').length,
        coordinated_count: clusters.filter(c => c.isCoordinated()).length
      }
    };
  },

  /**
   * Find similar articles to a given article
   */
  findSimilar(targetArticle, articles, threshold = 0.4) {
    const results = [];
    
    for (const article of articles) {
      if (article.id === targetArticle.id) continue;
      
      const sim = calculateSimilarity(targetArticle, article);
      if (sim.score >= threshold) {
        results.push({
          article,
          similarity: sim
        });
      }
    }
    
    return results.sort((a, b) => b.similarity.score - a.similarity.score);
  },

  /**
   * Analyze source coverage patterns
   */
  analyzeSourceCoverage(clusters) {
    const sourceStats = {};
    
    for (const cluster of clusters) {
      const firstMover = cluster.first_mover;
      
      for (const source of cluster.sources) {
        if (!sourceStats[source]) {
          sourceStats[source] = {
            total_stories: 0,
            first_mover_count: 0,
            avg_delay_minutes: 0,
            delays: []
          };
        }
        
        sourceStats[source].total_stories++;
        
        if (source === firstMover.source) {
          sourceStats[source].first_mover_count++;
        } else {
          // Calculate delay from first mover
          const firstTime = new Date(firstMover.first_seen);
          const sourceArticle = cluster.articles.find(a => a.source === source);
          if (sourceArticle) {
            const sourceTime = new Date(sourceArticle.first_seen || sourceArticle.pub_date);
            const delayMinutes = (sourceTime - firstTime) / 60000;
            sourceStats[source].delays.push(delayMinutes);
          }
        }
      }
    }
    
    // Calculate averages
    for (const stats of Object.values(sourceStats)) {
      if (stats.delays.length > 0) {
        stats.avg_delay_minutes = Math.round(
          stats.delays.reduce((a, b) => a + b, 0) / stats.delays.length
        );
      }
      stats.first_mover_rate = stats.total_stories > 0 
        ? (stats.first_mover_count / stats.total_stories * 100).toFixed(1) + '%'
        : '0%';
      delete stats.delays; // Don't include raw data
    }
    
    return sourceStats;
  }
};

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  ClusteringService,
  StoryCluster,
  calculateSimilarity,
  extractKeyTerms,
  tokenize,
  jaccardSimilarity,
  cosineSimilarity,
  TIME_WINDOWS,
  SIMILARITY_THRESHOLDS
};

// CLI execution
if (require.main === module) {
  // Demo with sample articles
  const sampleArticles = [
    {
      id: '1',
      title: 'Bitcoin Surges Past $100,000 for First Time in History',
      description: 'BTC breaks major psychological barrier as institutional adoption accelerates',
      source: 'CoinDesk',
      first_seen: '2026-01-11T10:00:00Z',
      link: 'https://coindesk.com/article1'
    },
    {
      id: '2',
      title: 'BTC Hits $100K Milestone: What Comes Next?',
      description: 'Bitcoin reaches historic $100,000 level, analysts predict continued rally',
      source: 'CoinTelegraph',
      first_seen: '2026-01-11T10:15:00Z',
      link: 'https://cointelegraph.com/article2'
    },
    {
      id: '3',
      title: 'Bitcoin Price Breaks $100,000 Barrier',
      description: 'Cryptocurrency king bitcoin surpasses $100k for first time',
      source: 'The Block',
      first_seen: '2026-01-11T10:05:00Z',
      link: 'https://theblock.co/article3'
    },
    {
      id: '4',
      title: 'Ethereum DeFi TVL Reaches New All-Time High',
      description: 'Total value locked in Ethereum DeFi protocols surpasses $150 billion',
      source: 'DeFi Pulse',
      first_seen: '2026-01-11T11:00:00Z',
      link: 'https://defipulse.com/article4'
    },
    {
      id: '5',
      title: 'SEC Delays Decision on Spot Bitcoin ETF',
      description: 'The Securities and Exchange Commission pushes back deadline again',
      source: 'Reuters',
      first_seen: '2026-01-11T09:00:00Z',
      link: 'https://reuters.com/article5'
    }
  ];

  console.log('🚀 Testing Story Clustering Engine...\n');
  
  const result = ClusteringService.clusterArticles(sampleArticles);
  
  console.log('\n📊 CLUSTERING RESULTS:');
  console.log('─'.repeat(50));
  console.log(`Total Articles: ${result.stats.total_articles}`);
  console.log(`Total Clusters: ${result.stats.total_clusters}`);
  console.log(`Avg Cluster Size: ${result.stats.avg_cluster_size.toFixed(2)}`);
  
  console.log('\n📰 Clusters:');
  result.clusters.forEach((cluster, i) => {
    console.log(`\n${i + 1}. "${cluster.canonical_title.slice(0, 50)}..."`);
    console.log(`   Size: ${cluster.story_size} | Sources: ${cluster.source_count} | Articles: ${cluster.article_count}`);
    console.log(`   First mover: ${cluster.first_mover.source} (${cluster.first_mover.lead_time_minutes}min lead)`);
    console.log(`   Coordinated: ${cluster.is_coordinated ? 'Yes ⚠️' : 'No'}`);
  });
  
  const sourceAnalysis = ClusteringService.analyzeSourceCoverage(result.clusters);
  console.log('\n📊 Source Analysis:');
  Object.entries(sourceAnalysis).forEach(([source, stats]) => {
    console.log(`   ${source}: ${stats.first_mover_rate} first-mover rate, avg ${stats.avg_delay_minutes}min delay`);
  });
}

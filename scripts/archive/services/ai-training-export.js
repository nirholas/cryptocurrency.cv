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
 * AI Training Data Exporter
 * 
 * Generates machine learning and LLM training-ready data from the archive:
 * - Instruction-tuning pairs
 * - Q&A pairs from headlines
 * - Sentiment-labeled data
 * - Entity extraction training data
 * - Embeddings-ready JSONL
 * - Fine-tuning datasets
 */

const fs = require('fs').promises;
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const ARCHIVE_DIR = path.join(__dirname, '../../archive');
const EXPORT_DIR = path.join(__dirname, '../../archive/exports/training');

// =============================================================================
// DATA GENERATORS
// =============================================================================

const TrainingDataGenerator = {
  /**
   * Generate instruction-tuning pairs for LLM fine-tuning
   */
  generateInstructionPairs(articles) {
    const pairs = [];
    
    for (const article of articles) {
      // Summarization task
      if (article.description && article.description.length > 50) {
        pairs.push({
          instruction: 'Summarize this crypto news article in one sentence.',
          input: article.description,
          output: article.title,
          category: 'summarization',
          source: article.source,
          timestamp: article.first_seen
        });
      }
      
      // Title generation task
      if (article.description && article.description.length > 100) {
        pairs.push({
          instruction: 'Generate a headline for this crypto news article.',
          input: article.description.slice(0, 500),
          output: article.title,
          category: 'headline_generation',
          source: article.source,
          timestamp: article.first_seen
        });
      }
      
      // Entity extraction task
      if (article.tickers && article.tickers.length > 0) {
        pairs.push({
          instruction: 'Extract cryptocurrency tickers mentioned in this text. Return as comma-separated list.',
          input: article.title + '. ' + (article.description || ''),
          output: article.tickers.join(', '),
          category: 'entity_extraction',
          source: article.source,
          timestamp: article.first_seen
        });
      }
      
      // Sentiment analysis task
      if (article.sentiment) {
        pairs.push({
          instruction: 'Classify the sentiment of this crypto news as bullish, bearish, or neutral.',
          input: article.title + '. ' + (article.description || '').slice(0, 300),
          output: article.sentiment,
          category: 'sentiment_analysis',
          source: article.source,
          timestamp: article.first_seen
        });
      }
      
      // Category classification task
      if (article.categories && article.categories.length > 0) {
        pairs.push({
          instruction: 'Classify this crypto news article into categories. Options: bitcoin, ethereum, defi, nft, regulation, altcoins, market, technology, security.',
          input: article.title + '. ' + (article.description || '').slice(0, 300),
          output: article.categories.join(', '),
          category: 'classification',
          source: article.source,
          timestamp: article.first_seen
        });
      }
    }
    
    return pairs;
  },

  /**
   * Generate Q&A pairs for conversational fine-tuning
   */
  generateQAPairs(articles, clusters = []) {
    const pairs = [];
    
    for (const article of articles) {
      // What happened question
      pairs.push({
        question: `What happened in crypto news on ${new Date(article.first_seen).toLocaleDateString()}?`,
        answer: article.title,
        context: article.description || '',
        source: article.source,
        timestamp: article.first_seen,
        type: 'factual'
      });
      
      // Source question
      if (article.tickers && article.tickers.length > 0) {
        const ticker = article.tickers[0];
        pairs.push({
          question: `What news was there about ${ticker}?`,
          answer: article.title,
          context: article.description || '',
          source: article.source,
          timestamp: article.first_seen,
          type: 'entity_query'
        });
      }
    }
    
    // Cluster-based Q&A (multi-document)
    for (const cluster of clusters) {
      if (cluster.article_count > 2) {
        pairs.push({
          question: `How many news sources covered the story about "${cluster.canonical_title.slice(0, 50)}"?`,
          answer: `${cluster.source_count} sources covered this story, including ${cluster.sources.slice(0, 3).join(', ')}.`,
          context: cluster.key_terms.join(', '),
          type: 'multi_document',
          timestamp: cluster.first_seen
        });
        
        pairs.push({
          question: `Which news source first reported "${cluster.canonical_title.slice(0, 50)}"?`,
          answer: `${cluster.first_mover.source} was the first to report this story at ${new Date(cluster.first_mover.first_seen).toLocaleTimeString()}.`,
          context: '',
          type: 'first_mover_query',
          timestamp: cluster.first_seen
        });
      }
    }
    
    return pairs;
  },

  /**
   * Generate sentiment-labeled dataset
   */
  generateSentimentDataset(articles) {
    return articles
      .filter(a => a.sentiment)
      .map(a => ({
        text: a.title + '. ' + (a.description || '').slice(0, 300),
        label: a.sentiment,
        confidence: 1.0, // Could be adjusted based on keyword match strength
        source: a.source,
        timestamp: a.first_seen,
        tickers: a.tickers || []
      }));
  },

  /**
   * Generate embeddings-ready data (for vector databases)
   */
  generateEmbeddingsData(articles) {
    return articles.map(a => ({
      id: a.id,
      text: `${a.title}. ${a.description || ''}`.slice(0, 1000),
      metadata: {
        source: a.source,
        timestamp: a.first_seen,
        tickers: a.tickers || [],
        categories: a.categories || [],
        sentiment: a.sentiment,
        link: a.link
      }
    }));
  },

  /**
   * Generate NER (Named Entity Recognition) training data
   */
  generateNERData(articles) {
    const data = [];
    
    for (const article of articles) {
      const text = article.title;
      const entities = [];
      
      // Find ticker mentions
      if (article.tickers) {
        for (const ticker of article.tickers) {
          const pattern = new RegExp(`\\$?${ticker}\\b`, 'gi');
          let match;
          while ((match = pattern.exec(text)) !== null) {
            entities.push({
              start: match.index,
              end: match.index + match[0].length,
              label: 'CRYPTO_TICKER',
              text: match[0]
            });
          }
        }
      }
      
      // Common crypto entities
      const entityPatterns = [
        { pattern: /\b(Bitcoin|BTC)\b/gi, label: 'CRYPTO' },
        { pattern: /\b(Ethereum|ETH)\b/gi, label: 'CRYPTO' },
        { pattern: /\b(SEC|CFTC|Fed|Federal Reserve)\b/gi, label: 'REGULATOR' },
        { pattern: /\b(Coinbase|Binance|Kraken|FTX|Gemini)\b/gi, label: 'EXCHANGE' },
        { pattern: /\$[\d,.]+[BMK]?\b/g, label: 'MONEY' },
        { pattern: /\b\d+%\b/g, label: 'PERCENTAGE' }
      ];
      
      for (const { pattern, label } of entityPatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          // Check for overlap
          const overlaps = entities.some(e => 
            (match.index >= e.start && match.index < e.end) ||
            (match.index + match[0].length > e.start && match.index + match[0].length <= e.end)
          );
          
          if (!overlaps) {
            entities.push({
              start: match.index,
              end: match.index + match[0].length,
              label,
              text: match[0]
            });
          }
        }
      }
      
      if (entities.length > 0) {
        data.push({
          text,
          entities: entities.sort((a, b) => a.start - b.start),
          source: article.source,
          timestamp: article.first_seen
        });
      }
    }
    
    return data;
  },

  /**
   * Generate time-series data for trend analysis
   */
  generateTimeSeriesData(articles, marketData = []) {
    // Group by hour
    const hourlyData = {};
    
    for (const article of articles) {
      const hour = new Date(article.first_seen).toISOString().slice(0, 13);
      
      if (!hourlyData[hour]) {
        hourlyData[hour] = {
          timestamp: hour + ':00:00Z',
          article_count: 0,
          sentiment_sum: 0,
          tickers: {},
          categories: {}
        };
      }
      
      hourlyData[hour].article_count++;
      
      // Sentiment score
      if (article.sentiment === 'bullish') hourlyData[hour].sentiment_sum += 1;
      else if (article.sentiment === 'bearish') hourlyData[hour].sentiment_sum -= 1;
      
      // Ticker mentions
      (article.tickers || []).forEach(t => {
        hourlyData[hour].tickers[t] = (hourlyData[hour].tickers[t] || 0) + 1;
      });
      
      // Categories
      (article.categories || []).forEach(c => {
        hourlyData[hour].categories[c] = (hourlyData[hour].categories[c] || 0) + 1;
      });
    }
    
    // Convert to array and sort
    return Object.values(hourlyData)
      .map(h => ({
        ...h,
        sentiment_score: h.article_count > 0 ? h.sentiment_sum / h.article_count : 0,
        top_tickers: Object.entries(h.tickers)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([t, c]) => ({ ticker: t, count: c })),
        top_categories: Object.entries(h.categories)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([c, count]) => ({ category: c, count }))
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }
};

// =============================================================================
// EXPORT SERVICE
// =============================================================================

const ExportService = {
  /**
   * Read articles from archive
   */
  async readArticles(monthFile) {
    const articles = [];
    const filePath = path.join(ARCHIVE_DIR, 'articles', monthFile);
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.trim().split('\n');
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            articles.push(JSON.parse(line));
          } catch (e) {
            console.error('Failed to parse line:', e.message);
          }
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    
    return articles;
  },

  /**
   * Export dataset to JSONL file
   */
  async exportToJSONL(data, filename) {
    await fs.mkdir(EXPORT_DIR, { recursive: true });
    const filePath = path.join(EXPORT_DIR, filename);
    
    const content = data.map(item => JSON.stringify(item)).join('\n');
    await fs.writeFile(filePath, content);
    
    console.log(`📄 Exported ${data.length} records to ${filename}`);
    return filePath;
  },

  /**
   * Export dataset to CSV
   */
  async exportToCSV(data, filename, columns) {
    await fs.mkdir(EXPORT_DIR, { recursive: true });
    const filePath = path.join(EXPORT_DIR, filename);
    
    const header = columns.join(',');
    const rows = data.map(item => 
      columns.map(col => {
        const val = item[col];
        if (typeof val === 'string') {
          return `"${val.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
        }
        return val ?? '';
      }).join(',')
    );
    
    await fs.writeFile(filePath, [header, ...rows].join('\n'));
    
    console.log(`📄 Exported ${data.length} records to ${filename}`);
    return filePath;
  },

  /**
   * Generate all training datasets
   */
  async generateAllDatasets(monthFile = '2026-01.jsonl') {
    console.log('🤖 Generating AI training datasets...');
    const startTime = Date.now();
    
    const articles = await this.readArticles(monthFile);
    console.log(`📊 Loaded ${articles.length} articles`);
    
    if (articles.length === 0) {
      console.log('⚠️ No articles found to export');
      return null;
    }
    
    const results = {};
    
    // Instruction-tuning pairs
    const instructionPairs = TrainingDataGenerator.generateInstructionPairs(articles);
    results.instruction_pairs = await this.exportToJSONL(
      instructionPairs, 
      'instruction-tuning.jsonl'
    );
    console.log(`   → ${instructionPairs.length} instruction pairs`);
    
    // Q&A pairs
    const qaPairs = TrainingDataGenerator.generateQAPairs(articles);
    results.qa_pairs = await this.exportToJSONL(
      qaPairs,
      'qa-pairs.jsonl'
    );
    console.log(`   → ${qaPairs.length} Q&A pairs`);
    
    // Sentiment dataset
    const sentimentData = TrainingDataGenerator.generateSentimentDataset(articles);
    results.sentiment = await this.exportToJSONL(
      sentimentData,
      'sentiment-dataset.jsonl'
    );
    console.log(`   → ${sentimentData.length} sentiment samples`);
    
    // Embeddings data
    const embeddingsData = TrainingDataGenerator.generateEmbeddingsData(articles);
    results.embeddings = await this.exportToJSONL(
      embeddingsData,
      'embeddings-data.jsonl'
    );
    console.log(`   → ${embeddingsData.length} embedding records`);
    
    // NER data
    const nerData = TrainingDataGenerator.generateNERData(articles);
    results.ner = await this.exportToJSONL(
      nerData,
      'ner-training.jsonl'
    );
    console.log(`   → ${nerData.length} NER samples`);
    
    // Time series data
    const timeSeriesData = TrainingDataGenerator.generateTimeSeriesData(articles);
    results.timeseries = await this.exportToJSONL(
      timeSeriesData,
      'timeseries-data.jsonl'
    );
    console.log(`   → ${timeSeriesData.length} hourly records`);
    
    // Also export sentiment as CSV for easy analysis
    results.sentiment_csv = await this.exportToCSV(
      sentimentData,
      'sentiment-dataset.csv',
      ['text', 'label', 'source', 'timestamp']
    );
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ All datasets generated in ${elapsed}s`);
    
    // Generate manifest
    const manifest = {
      generated_at: new Date().toISOString(),
      source_file: monthFile,
      article_count: articles.length,
      datasets: {
        instruction_tuning: {
          file: 'instruction-tuning.jsonl',
          records: instructionPairs.length,
          description: 'Instruction-response pairs for LLM fine-tuning'
        },
        qa_pairs: {
          file: 'qa-pairs.jsonl',
          records: qaPairs.length,
          description: 'Question-answer pairs for conversational AI'
        },
        sentiment: {
          file: 'sentiment-dataset.jsonl',
          records: sentimentData.length,
          description: 'Sentiment-labeled crypto news for classification'
        },
        embeddings: {
          file: 'embeddings-data.jsonl',
          records: embeddingsData.length,
          description: 'Text with metadata for vector embeddings'
        },
        ner: {
          file: 'ner-training.jsonl',
          records: nerData.length,
          description: 'Named entity recognition training data'
        },
        timeseries: {
          file: 'timeseries-data.jsonl',
          records: timeSeriesData.length,
          description: 'Hourly aggregated data for trend analysis'
        }
      }
    };
    
    await fs.writeFile(
      path.join(EXPORT_DIR, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    return manifest;
  }
};

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  TrainingDataGenerator,
  ExportService,
  EXPORT_DIR
};

// CLI execution
if (require.main === module) {
  (async () => {
    console.log('🚀 AI Training Data Exporter\n');
    
    const manifest = await ExportService.generateAllDatasets();
    
    if (manifest) {
      console.log('\n📋 EXPORT MANIFEST:');
      console.log('─'.repeat(50));
      console.log(`Source Articles: ${manifest.article_count}`);
      console.log('\nDatasets Generated:');
      Object.entries(manifest.datasets).forEach(([name, info]) => {
        console.log(`   ${name}: ${info.records} records`);
      });
      console.log(`\nExport Location: ${EXPORT_DIR}`);
    }
  })();
}

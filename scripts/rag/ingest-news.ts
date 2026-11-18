#!/usr/bin/env npx tsx

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
 * RAG Data Ingestion Script
 * 
 * Reads news articles from the archive and embeds them into the vector store.
 * 
 * Usage:
 *   npm run rag:ingest                    # Ingest all archive data
 *   npm run rag:ingest -- --days 30       # Ingest last 30 days
 *   npm run rag:ingest -- --year 2025     # Ingest specific year
 *   npm run rag:ingest -- --clear         # Clear and re-ingest
 * 
 * Environment variables:
 *   HUGGINGFACE_API_KEY - For embeddings (optional, uses free tier)
 *   OPENAI_API_KEY - Alternative embedding provider
 */

import { promises as fs } from 'fs';
import path from 'path';

// Type definitions for archive data
interface ArchiveArticle {
  title: string;
  link: string;
  description?: string;
  pubDate: string;
  source: string;
  sourceKey: string;
  category: string;
  currencies?: string[];
  votes?: {
    positive: number;
    negative: number;
  };
  sentiment?: string;
}

interface ArchiveEntry {
  date: string;
  fetchedAt: string;
  articleCount: number;
  articles: ArchiveArticle[];
}

interface ArchiveIndex {
  lastUpdated: string;
  totalArticles: number;
  dateRange: {
    earliest: string;
    latest: string;
  };
  availableDates: string[];
}

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string): string | undefined => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : undefined;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const DAYS = getArg('days') ? parseInt(getArg('days')!, 10) : undefined;
const YEAR = getArg('year');
const CLEAR = hasFlag('clear');
const BATCH_SIZE = parseInt(getArg('batch') || '50', 10);
const ARCHIVE_PATH = path.join(process.cwd(), 'archive');

// Import RAG modules after setting up
async function main() {
  console.log('🚀 RAG Data Ingestion Script');
  console.log('============================\n');
  
  // Dynamic import to avoid issues with module loading
  const { vectorStore, computeVoteScore } = await import('../src/lib/rag/vector-store');
  const { generateEmbedding, getEmbeddingConfig } = await import('../src/lib/rag/embedding-service');
  
  const embeddingConfig = getEmbeddingConfig();
  console.log(`📊 Embedding provider: ${embeddingConfig.provider}`);
  console.log(`📊 Embedding model: ${embeddingConfig.model}`);
  console.log(`📊 Dimensions: ${embeddingConfig.dimensions}\n`);
  
  if (CLEAR) {
    console.log('🗑️  Clearing existing vector store...');
    await vectorStore.clear();
  }
  
  // Read archive index
  console.log('📂 Reading archive index...');
  const indexPath = path.join(ARCHIVE_PATH, 'index.json');
  const indexData = await fs.readFile(indexPath, 'utf-8');
  const index: ArchiveIndex = JSON.parse(indexData);
  
  console.log(`   Total articles in archive: ${index.totalArticles}`);
  console.log(`   Date range: ${index.dateRange.earliest} to ${index.dateRange.latest}`);
  console.log(`   Available dates: ${index.availableDates.length}\n`);
  
  // Filter dates based on arguments
  let datesToProcess = index.availableDates;
  
  if (YEAR) {
    datesToProcess = datesToProcess.filter(d => d.startsWith(YEAR));
    console.log(`📅 Filtering to year ${YEAR}: ${datesToProcess.length} dates`);
  }
  
  if (DAYS) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DAYS);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    datesToProcess = datesToProcess.filter(d => d >= cutoffStr);
    console.log(`📅 Filtering to last ${DAYS} days: ${datesToProcess.length} dates`);
  }
  
  console.log(`\n📥 Processing ${datesToProcess.length} archive files...\n`);
  
  // Process each date file
  let totalProcessed = 0;
  let totalEmbedded = 0;
  let errors = 0;
  
  for (const date of datesToProcess) {
    const [year, month] = date.split('-');
    const filePath = path.join(ARCHIVE_PATH, year, month, `${date}.json`);
    
    try {
      const fileData = await fs.readFile(filePath, 'utf-8');
      const entry: ArchiveEntry = JSON.parse(fileData);
      
      console.log(`📄 Processing ${date}: ${entry.articleCount} articles`);
      
      // Process in batches
      const articles = entry.articles;
      
      for (let i = 0; i < articles.length; i += BATCH_SIZE) {
        const batch = articles.slice(i, i + BATCH_SIZE);
        const documents: any[] = [];
        
        for (const article of batch) {
          totalProcessed++;
          
          // Skip articles without description
          if (!article.description || article.description.length < 20) {
            continue;
          }
          
          try {
            // Generate embedding
            const embedding = await generateEmbedding(article.description, embeddingConfig);
            
            // Calculate vote score
            const voteScore = article.votes 
              ? computeVoteScore(article.votes.positive, article.votes.negative)
              : 0;
            
            // Create document
            const doc = {
              id: `${date}-${totalProcessed}`,
              content: article.description,
              embedding,
              metadata: {
                title: article.title,
                pubDate: article.pubDate,
                url: article.link,
                source: article.source,
                sourceKey: article.sourceKey,
                category: article.category,
                currencies: article.currencies || [],
                voteScore,
              },
            };
            
            documents.push(doc);
            totalEmbedded++;
          } catch (err) {
            errors++;
            if (errors < 10) {
              console.error(`   ⚠️  Error embedding article: ${(err as Error).message}`);
            }
          }
        }
        
        // Add batch to vector store
        if (documents.length > 0) {
          await vectorStore.addBatch(documents);
        }
        
        // Progress indicator
        process.stdout.write(`   Embedded: ${totalEmbedded}/${totalProcessed} (${errors} errors)\r`);
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`   ✅ Completed ${date}: ${totalEmbedded} embedded`);
      
    } catch (err) {
      console.error(`   ❌ Error processing ${date}: ${(err as Error).message}`);
      errors++;
    }
  }
  
  // Save vector store
  console.log('\n💾 Saving vector store...');
  await vectorStore.save();
  
  // Print summary
  const stats = await vectorStore.getStats();
  console.log('\n============================');
  console.log('📊 Ingestion Complete!');
  console.log('============================');
  console.log(`   Total processed: ${totalProcessed}`);
  console.log(`   Total embedded: ${totalEmbedded}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Vector store size: ${stats.totalDocuments}`);
  console.log(`   Date range: ${stats.dateRange.earliest} to ${stats.dateRange.latest}`);
  console.log(`   Sources: ${stats.sources.length}`);
  console.log(`   Categories: ${stats.categories.length}`);
  console.log('\n✨ Done!');
}

main().catch(console.error);

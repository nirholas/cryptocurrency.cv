/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * AI Services Module
 * 
 * Enterprise-grade AI service layer providing:
 * - Text summarization with configurable styles
 * - Entity extraction (people, organizations, tokens, events)
 * - Relationship mapping between entities
 * - Sentiment analysis with confidence scores
 * - Topic classification
 * - Key insight extraction
 * 
 * All services use Groq's Llama 3.3 70B model with proper
 * rate limiting, caching, and error handling.
 * 
 * @module ai-services
 */

import { callGroq, type GroqMessage } from './groq';
import { aiCache } from './cache';

// Helper to create a simple prompt call
async function askAI(prompt: string): Promise<string> {
  const messages: GroqMessage[] = [
    { role: 'user', content: prompt }
  ];
  const response = await callGroq(messages);
  return response.content;
}

// =============================================================================
// TYPES
// =============================================================================

export interface SummaryOptions {
  style: 'brief' | 'detailed' | 'bullet_points' | 'eli5' | 'technical';
  maxLength?: number;
  focusAreas?: string[];
  includeKeyTakeaways?: boolean;
  language?: string;
}

export interface Summary {
  text: string;
  style: SummaryOptions['style'];
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
  keyTakeaways?: string[];
  processingTime: number;
}

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  mentions: number;
  sentiment: number;  // -1 to 1
  confidence: number; // 0 to 1
  aliases?: string[];
  metadata?: Record<string, unknown>;
  context?: string[];
}

export type EntityType = 
  | 'person'
  | 'organization'
  | 'cryptocurrency'
  | 'token'
  | 'exchange'
  | 'protocol'
  | 'event'
  | 'regulation'
  | 'technology'
  | 'location'
  | 'financial_metric'
  | 'other';

export interface EntityExtractionResult {
  entities: Entity[];
  totalMentions: number;
  dominantEntities: Entity[];
  entityGraph?: EntityGraph;
  processingTime: number;
}

export interface Relationship {
  id: string;
  source: string;      // Entity ID
  target: string;      // Entity ID
  type: RelationshipType;
  strength: number;    // 0 to 1
  sentiment: number;   // -1 to 1
  evidence: string[];  // Quotes from source
  confidence: number;
}

export type RelationshipType = 
  | 'partnership'
  | 'competition'
  | 'investment'
  | 'acquisition'
  | 'collaboration'
  | 'conflict'
  | 'regulation'
  | 'development'
  | 'market_impact'
  | 'mention'
  | 'association';

export interface RelationshipExtractionResult {
  relationships: Relationship[];
  entityCount: number;
  relationshipCount: number;
  clusters: EntityCluster[];
  processingTime: number;
}

export interface EntityGraph {
  nodes: EntityNode[];
  edges: EntityEdge[];
}

export interface EntityNode {
  id: string;
  label: string;
  type: EntityType;
  weight: number;
  sentiment: number;
}

export interface EntityEdge {
  source: string;
  target: string;
  type: RelationshipType;
  weight: number;
}

export interface EntityCluster {
  id: string;
  name: string;
  entities: string[];
  centralEntity: string;
  theme?: string;
}

export interface SentimentResult {
  overall: number;           // -1 to 1
  confidence: number;        // 0 to 1
  label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  aspects: AspectSentiment[];
  emotionalTone: string[];
  processingTime: number;
}

export interface AspectSentiment {
  aspect: string;
  sentiment: number;
  confidence: number;
}

export interface TopicClassification {
  topics: Topic[];
  primaryTopic: Topic;
  processingTime: number;
}

export interface Topic {
  name: string;
  confidence: number;
  keywords: string[];
}

export interface KeyInsight {
  insight: string;
  importance: 'high' | 'medium' | 'low';
  category: string;
  entities?: string[];
  actionable: boolean;
}

export interface InsightsResult {
  insights: KeyInsight[];
  summary: string;
  marketImpact?: 'bullish' | 'bearish' | 'neutral' | 'mixed';
  urgency: 'high' | 'medium' | 'low';
  processingTime: number;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function getCacheKey(prefix: string, content: string, options?: unknown): string {
  const hash = Buffer.from(content.slice(0, 500)).toString('base64').slice(0, 20);
  const optHash = options ? Buffer.from(JSON.stringify(options)).toString('base64').slice(0, 10) : '';
  return `${prefix}:${hash}:${optHash}`;
}

async function parseJsonResponse<T>(response: string, fallback: T): Promise<T> {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

// =============================================================================
// SUMMARIZATION
// =============================================================================

/**
 * Generate a summary of the provided text
 */
export async function summarize(
  text: string,
  options: Partial<SummaryOptions> = {}
): Promise<Summary> {
  const startTime = Date.now();
  const opts: SummaryOptions = {
    style: options.style || 'brief',
    maxLength: options.maxLength || 300,
    includeKeyTakeaways: options.includeKeyTakeaways ?? true,
    language: options.language || 'en',
    focusAreas: options.focusAreas,
  };

  // Check cache
  const cacheKey = getCacheKey('summary', text, opts);
  const cached = aiCache.get<Summary>(cacheKey);
  if (cached) {
    return { ...cached, processingTime: 0 };
  }

  const styleInstructions = {
    brief: 'Create a concise 2-3 sentence summary capturing the main points.',
    detailed: 'Create a comprehensive summary covering all important aspects.',
    bullet_points: 'Create a summary as a bulleted list of key points.',
    eli5: 'Explain this like I\'m 5 years old, using simple language.',
    technical: 'Create a technical summary focusing on specifics, data, and implications.',
  };

  const prompt = `Analyze the following crypto/blockchain news article and provide a summary.

INSTRUCTIONS:
- Style: ${styleInstructions[opts.style]}
- Maximum length: ${opts.maxLength} words
${opts.focusAreas?.length ? `- Focus areas: ${opts.focusAreas.join(', ')}` : ''}
${opts.language !== 'en' ? `- Respond in language code: ${opts.language}` : ''}

ARTICLE:
${text}

Respond with a JSON object:
{
  "summary": "The summary text here",
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3"]
}`;

  const response = await askAI(prompt);
  
  const parsed = await parseJsonResponse<{ summary: string; keyTakeaways: string[] }>(
    response,
    { summary: response, keyTakeaways: [] }
  );

  const result: Summary = {
    text: parsed.summary,
    style: opts.style,
    originalLength: text.length,
    summaryLength: parsed.summary.length,
    compressionRatio: text.length > 0 ? parsed.summary.length / text.length : 0,
    keyTakeaways: opts.includeKeyTakeaways ? parsed.keyTakeaways : undefined,
    processingTime: Date.now() - startTime,
  };

  // Cache for 1 hour
  aiCache.set(cacheKey, result, 3600);

  return result;
}

// =============================================================================
// ENTITY EXTRACTION
// =============================================================================

/**
 * Extract entities from text
 */
export async function extractEntities(
  text: string,
  options: { includeGraph?: boolean } = {}
): Promise<EntityExtractionResult> {
  const startTime = Date.now();

  // Check cache
  const cacheKey = getCacheKey('entities', text, options);
  const cached = aiCache.get<EntityExtractionResult>(cacheKey);
  if (cached) {
    return { ...cached, processingTime: 0 };
  }

  const prompt = `Extract all named entities from the following crypto/blockchain news article.

ENTITY TYPES TO IDENTIFY:
- person: Individual people (CEOs, founders, analysts, etc.)
- organization: Companies, DAOs, foundations
- cryptocurrency: Bitcoin, Ethereum, etc.
- token: Specific tokens mentioned
- exchange: Trading platforms (Binance, Coinbase, etc.)
- protocol: DeFi protocols, Layer 2s
- event: Conferences, launches, incidents
- regulation: Laws, regulatory actions
- technology: Blockchain tech, features
- location: Countries, cities relevant to crypto
- financial_metric: Prices, market caps, percentages

ARTICLE:
${text}

Respond with a JSON object:
{
  "entities": [
    {
      "name": "Entity Name",
      "type": "entity_type",
      "mentions": 3,
      "sentiment": 0.5,
      "confidence": 0.9,
      "aliases": ["Alternative Name"],
      "context": ["Quote where entity appears"]
    }
  ]
}`;

  const response = await askAI(prompt);
  
  const parsed = await parseJsonResponse<{ entities: Partial<Entity>[] }>(
    response,
    { entities: [] }
  );

  // Process and validate entities
  const entities: Entity[] = parsed.entities
    .filter(e => e.name && e.type)
    .map((e, _idx) => ({
      id: `ent_${generateId()}`,
      name: e.name!,
      type: (e.type as EntityType) || 'other',
      mentions: e.mentions || 1,
      sentiment: Math.max(-1, Math.min(1, e.sentiment || 0)),
      confidence: Math.max(0, Math.min(1, e.confidence || 0.5)),
      aliases: e.aliases,
      context: e.context,
      metadata: e.metadata,
    }));

  // Sort by mentions to find dominant entities
  const sortedByMentions = [...entities].sort((a, b) => b.mentions - a.mentions);
  const dominantEntities = sortedByMentions.slice(0, 5);

  // Build graph if requested
  let entityGraph: EntityGraph | undefined;
  if (options.includeGraph && entities.length > 1) {
    entityGraph = {
      nodes: entities.map(e => ({
        id: e.id,
        label: e.name,
        type: e.type,
        weight: e.mentions,
        sentiment: e.sentiment,
      })),
      edges: [], // Edges would come from relationship extraction
    };
  }

  const result: EntityExtractionResult = {
    entities,
    totalMentions: entities.reduce((sum, e) => sum + e.mentions, 0),
    dominantEntities,
    entityGraph,
    processingTime: Date.now() - startTime,
  };

  // Cache for 1 hour
  aiCache.set(cacheKey, result, 3600);

  return result;
}

// =============================================================================
// RELATIONSHIP EXTRACTION
// =============================================================================

/**
 * Extract relationships between entities
 */
export async function extractRelationships(
  text: string,
  existingEntities?: Entity[]
): Promise<RelationshipExtractionResult> {
  const startTime = Date.now();

  // Check cache
  const cacheKey = getCacheKey('relationships', text);
  const cached = aiCache.get<RelationshipExtractionResult>(cacheKey);
  if (cached) {
    return { ...cached, processingTime: 0 };
  }

  // First extract entities if not provided
  let entities = existingEntities;
  if (!entities) {
    const entityResult = await extractEntities(text);
    entities = entityResult.entities;
  }

  if (entities.length < 2) {
    return {
      relationships: [],
      entityCount: entities.length,
      relationshipCount: 0,
      clusters: [],
      processingTime: Date.now() - startTime,
    };
  }

  const entityList = entities.map(e => `- ${e.name} (${e.type})`).join('\n');

  const prompt = `Analyze the relationships between entities in this crypto/blockchain article.

ENTITIES FOUND:
${entityList}

RELATIONSHIP TYPES:
- partnership: Business partnership or collaboration
- competition: Competitive relationship
- investment: Investment/funding relationship
- acquisition: M&A activity
- collaboration: Technical or project collaboration
- conflict: Legal, competitive, or other conflict
- regulation: Regulatory relationship
- development: Development/building relationship
- market_impact: Price/market influence
- mention: General association
- association: Other relationship

ARTICLE:
${text}

Respond with a JSON object:
{
  "relationships": [
    {
      "source": "Entity Name 1",
      "target": "Entity Name 2",
      "type": "relationship_type",
      "strength": 0.8,
      "sentiment": 0.5,
      "evidence": ["Quote from article showing relationship"],
      "confidence": 0.9
    }
  ],
  "clusters": [
    {
      "name": "Cluster theme",
      "entities": ["Entity1", "Entity2"],
      "theme": "Description of what connects these entities"
    }
  ]
}`;

  const response = await askAI(prompt);
  
  const parsed = await parseJsonResponse<{
    relationships: Partial<Relationship>[];
    clusters: Partial<EntityCluster>[];
  }>(response, { relationships: [], clusters: [] });

  // Create entity name to ID map
  const entityMap = new Map(entities.map(e => [e.name.toLowerCase(), e.id]));

  // Process relationships
  const relationships: Relationship[] = parsed.relationships
    .filter(r => r.source && r.target && r.type)
    .map(r => ({
      id: `rel_${generateId()}`,
      source: entityMap.get(r.source!.toLowerCase()) || r.source!,
      target: entityMap.get(r.target!.toLowerCase()) || r.target!,
      type: (r.type as RelationshipType) || 'association',
      strength: Math.max(0, Math.min(1, r.strength || 0.5)),
      sentiment: Math.max(-1, Math.min(1, r.sentiment || 0)),
      evidence: r.evidence || [],
      confidence: Math.max(0, Math.min(1, r.confidence || 0.5)),
    }));

  // Process clusters
  const clusters: EntityCluster[] = parsed.clusters
    .filter(c => c.entities && c.entities.length > 0)
    .map(c => ({
      id: `cluster_${generateId()}`,
      name: c.name || 'Unnamed Cluster',
      entities: c.entities!,
      centralEntity: c.entities![0],
      theme: c.theme,
    }));

  const result: RelationshipExtractionResult = {
    relationships,
    entityCount: entities.length,
    relationshipCount: relationships.length,
    clusters,
    processingTime: Date.now() - startTime,
  };

  // Cache for 1 hour
  aiCache.set(cacheKey, result, 3600);

  return result;
}

// =============================================================================
// SENTIMENT ANALYSIS
// =============================================================================

/**
 * Analyze sentiment of text
 */
export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const startTime = Date.now();

  // Check cache
  const cacheKey = getCacheKey('sentiment', text);
  const cached = aiCache.get<SentimentResult>(cacheKey);
  if (cached) {
    return { ...cached, processingTime: 0 };
  }

  const prompt = `Analyze the sentiment of this crypto/blockchain news article.

ARTICLE:
${text}

Provide sentiment analysis considering:
1. Overall sentiment toward the crypto market
2. Sentiment toward specific projects/entities mentioned
3. The emotional tone of the writing
4. Confidence in the sentiment assessment

Respond with a JSON object:
{
  "overall": 0.5,
  "confidence": 0.9,
  "aspects": [
    {
      "aspect": "Bitcoin",
      "sentiment": 0.7,
      "confidence": 0.85
    }
  ],
  "emotionalTone": ["optimistic", "cautious"]
}

Sentiment scale: -1 (very negative) to 1 (very positive)`;

  const response = await askAI(prompt);
  
  const parsed = await parseJsonResponse<{
    overall: number;
    confidence: number;
    aspects: AspectSentiment[];
    emotionalTone: string[];
  }>(response, {
    overall: 0,
    confidence: 0.5,
    aspects: [],
    emotionalTone: [],
  });

  // Determine label
  const overall = Math.max(-1, Math.min(1, parsed.overall));
  let label: SentimentResult['label'];
  if (overall <= -0.6) label = 'very_negative';
  else if (overall <= -0.2) label = 'negative';
  else if (overall <= 0.2) label = 'neutral';
  else if (overall <= 0.6) label = 'positive';
  else label = 'very_positive';

  const result: SentimentResult = {
    overall,
    confidence: Math.max(0, Math.min(1, parsed.confidence)),
    label,
    aspects: parsed.aspects.map(a => ({
      aspect: a.aspect,
      sentiment: Math.max(-1, Math.min(1, a.sentiment)),
      confidence: Math.max(0, Math.min(1, a.confidence)),
    })),
    emotionalTone: parsed.emotionalTone,
    processingTime: Date.now() - startTime,
  };

  // Cache for 1 hour
  aiCache.set(cacheKey, result, 3600);

  return result;
}

// =============================================================================
// TOPIC CLASSIFICATION
// =============================================================================

/**
 * Classify the topics of text
 */
export async function classifyTopics(text: string): Promise<TopicClassification> {
  const startTime = Date.now();

  // Check cache
  const cacheKey = getCacheKey('topics', text);
  const cached = aiCache.get<TopicClassification>(cacheKey);
  if (cached) {
    return { ...cached, processingTime: 0 };
  }

  const prompt = `Classify the topics of this crypto/blockchain news article.

POSSIBLE TOPICS (but not limited to):
- Market Analysis
- DeFi
- NFTs
- Regulation
- Technology/Development
- Security/Hacks
- Adoption
- Trading
- Mining
- Layer 2
- Stablecoins
- Institutional Investment
- Metaverse/Gaming
- DAOs
- Privacy
- Environmental Impact

ARTICLE:
${text}

Respond with a JSON object:
{
  "topics": [
    {
      "name": "Topic Name",
      "confidence": 0.9,
      "keywords": ["keyword1", "keyword2"]
    }
  ]
}

Order topics by relevance (most relevant first).`;

  const response = await askAI(prompt);
  
  const parsed = await parseJsonResponse<{ topics: Topic[] }>(
    response,
    { topics: [{ name: 'General', confidence: 0.5, keywords: [] }] }
  );

  const topics = parsed.topics.map(t => ({
    name: t.name,
    confidence: Math.max(0, Math.min(1, t.confidence)),
    keywords: t.keywords || [],
  }));

  const result: TopicClassification = {
    topics,
    primaryTopic: topics[0] || { name: 'General', confidence: 0.5, keywords: [] },
    processingTime: Date.now() - startTime,
  };

  // Cache for 1 hour
  aiCache.set(cacheKey, result, 3600);

  return result;
}

// =============================================================================
// KEY INSIGHTS
// =============================================================================

/**
 * Extract key insights from text
 */
export async function extractInsights(text: string): Promise<InsightsResult> {
  const startTime = Date.now();

  // Check cache
  const cacheKey = getCacheKey('insights', text);
  const cached = aiCache.get<InsightsResult>(cacheKey);
  if (cached) {
    return { ...cached, processingTime: 0 };
  }

  const prompt = `Extract key insights from this crypto/blockchain news article.

Focus on:
1. Market-moving information
2. Investment implications
3. Regulatory developments
4. Technology breakthroughs
5. Actionable information

ARTICLE:
${text}

Respond with a JSON object:
{
  "insights": [
    {
      "insight": "Clear statement of the insight",
      "importance": "high|medium|low",
      "category": "Category name",
      "entities": ["Related entities"],
      "actionable": true
    }
  ],
  "summary": "One-paragraph executive summary",
  "marketImpact": "bullish|bearish|neutral|mixed",
  "urgency": "high|medium|low"
}`;

  const response = await askAI(prompt);
  
  const parsed = await parseJsonResponse<{
    insights: KeyInsight[];
    summary: string;
    marketImpact: 'bullish' | 'bearish' | 'neutral' | 'mixed';
    urgency: 'high' | 'medium' | 'low';
  }>(response, {
    insights: [],
    summary: '',
    marketImpact: 'neutral',
    urgency: 'low',
  });

  const result: InsightsResult = {
    insights: parsed.insights,
    summary: parsed.summary,
    marketImpact: parsed.marketImpact,
    urgency: parsed.urgency,
    processingTime: Date.now() - startTime,
  };

  // Cache for 1 hour
  aiCache.set(cacheKey, result, 3600);

  return result;
}

// =============================================================================
// COMPREHENSIVE ANALYSIS
// =============================================================================

export interface ComprehensiveAnalysis {
  summary: Summary;
  entities: EntityExtractionResult;
  relationships: RelationshipExtractionResult;
  sentiment: SentimentResult;
  topics: TopicClassification;
  insights: InsightsResult;
  totalProcessingTime: number;
}

/**
 * Perform comprehensive analysis on text
 */
export async function analyzeComprehensively(
  text: string,
  options: {
    summaryStyle?: SummaryOptions['style'];
    includeGraph?: boolean;
  } = {}
): Promise<ComprehensiveAnalysis> {
  const startTime = Date.now();

  // Run all analyses in parallel where possible
  const [summary, entities, sentiment, topics, insights] = await Promise.all([
    summarize(text, { style: options.summaryStyle }),
    extractEntities(text, { includeGraph: options.includeGraph }),
    analyzeSentiment(text),
    classifyTopics(text),
    extractInsights(text),
  ]);

  // Relationships depend on entities
  const relationships = await extractRelationships(text, entities.entities);

  return {
    summary,
    entities,
    relationships,
    sentiment,
    topics,
    insights,
    totalProcessingTime: Date.now() - startTime,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  summarize,
  extractEntities,
  extractRelationships,
  analyzeSentiment,
  classifyTopics,
  extractInsights,
  analyzeComprehensively,
};

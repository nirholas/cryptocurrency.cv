import { NextRequest } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { promptGroqJsonCached, isGroqConfigured } from '@/lib/groq';
import { jsonResponse, errorResponse, withTiming } from '@/lib/api-utils';

export const runtime = 'edge';
export const revalidate = 300; // 5 minute cache

/**
 * Relationship Extraction API
 * 
 * Extracts "who did what to whom" relationships from crypto news articles.
 * Uses AI to identify actors, actions, and targets in news events.
 */

interface Actor {
  name: string;
  type: 'person' | 'company' | 'protocol' | 'exchange' | 'regulator' | 'country' | 'dao';
}

interface Relationship {
  subject: Actor;
  action: string;
  object: Actor | string;
  context: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  articleTitle: string;
  articleLink: string;
}

interface RelationshipResponse {
  relationships: Relationship[];
}

const SYSTEM_PROMPT = `You are a relationship extraction system specialized in cryptocurrency news.

Extract "who did what to whom" relationships from news articles. For each relationship, identify:

1. Subject (Actor): The entity performing the action
   - Types: person, company, protocol, exchange, regulator, country, dao
   
2. Action: What they did (use active verbs)
   - Examples: invested in, sued, partnered with, acquired, listed, delisted, banned, approved, launched, hacked, exploited, staked, burned, minted
   
3. Object: The target of the action (can be another actor or a thing like "regulations" or "new token")

4. Context: Brief explanation of the relationship

5. Sentiment: The market impact (positive/negative/neutral)

Respond with JSON: { "relationships": [...] }

Example:
{
  "relationships": [
    {
      "subject": { "name": "BlackRock", "type": "company" },
      "action": "filed application for",
      "object": { "name": "Ethereum ETF", "type": "protocol" },
      "context": "BlackRock filed SEC application for spot Ethereum ETF",
      "sentiment": "positive"
    }
  ]
}`;

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const actorType = searchParams.get('actor_type') || undefined;
  const actionFilter = searchParams.get('action') || undefined;
  const sentiment = searchParams.get('sentiment') || undefined;

  if (!isGroqConfigured()) {
    return errorResponse(
      'AI features not configured',
      'Set GROQ_API_KEY environment variable. Get a free key at https://console.groq.com/keys',
      503
    );
  }

  try {
    const data = await getLatestNews(limit);

    if (data.articles.length === 0) {
      return jsonResponse({ relationships: [], message: 'No articles to analyze' });
    }

    // Prepare articles for analysis
    const articlesText = data.articles
      .map((a, i) => `[${i + 1}] "${a.title}" (${a.source})\n${a.description || ''}`)
      .join('\n\n');

    const userPrompt = `Extract all relationships from these ${data.articles.length} crypto news articles:

${articlesText}

For each relationship found, include the article title and number it came from.`;

    const result = await promptGroqJsonCached<RelationshipResponse>(
      'relationships',
      SYSTEM_PROMPT,
      userPrompt,
      { maxTokens: 4000 }
    );

    // Merge article metadata with relationships
    let relationships = (result.relationships || []).map((rel, index) => {
      // Try to find matching article
      const articleIndex = data.articles.findIndex(a => 
        rel.articleTitle?.toLowerCase().includes(a.title.toLowerCase().slice(0, 30)) ||
        a.title.toLowerCase().includes(rel.articleTitle?.toLowerCase()?.slice(0, 30) || '')
      );
      
      const article = articleIndex >= 0 ? data.articles[articleIndex] : data.articles[index % data.articles.length];
      
      return {
        ...rel,
        articleTitle: article.title,
        articleLink: article.link,
      };
    });

    // Apply filters
    if (actorType) {
      relationships = relationships.filter(r => 
        r.subject.type === actorType || 
        (typeof r.object === 'object' && r.object.type === actorType)
      );
    }

    if (actionFilter) {
      const actionLower = actionFilter.toLowerCase();
      relationships = relationships.filter(r => 
        r.action.toLowerCase().includes(actionLower)
      );
    }

    if (sentiment) {
      relationships = relationships.filter(r => r.sentiment === sentiment);
    }

    // Generate statistics
    const stats = {
      totalRelationships: relationships.length,
      bySubjectType: relationships.reduce((acc, r) => {
        acc[r.subject.type] = (acc[r.subject.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySentiment: relationships.reduce((acc, r) => {
        acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      topActors: getTopActors(relationships),
      topActions: getTopActions(relationships),
    };

    const responseData = withTiming({
      relationships,
      stats,
      filters: {
        actor_type: actorType,
        action: actionFilter,
        sentiment,
        limit,
      },
      generatedAt: new Date().toISOString(),
    }, startTime);

    return jsonResponse(responseData, {
      cacheControl: 'ai',
      etag: true,
      request,
    });
  } catch (error) {
    console.error('Relationship extraction error:', error);
    return errorResponse('Failed to extract relationships', String(error));
  }
}

function getTopActors(relationships: Relationship[]): { name: string; type: string; count: number }[] {
  const actorCounts = new Map<string, { type: string; count: number }>();
  
  for (const rel of relationships) {
    const key = rel.subject.name.toLowerCase();
    const existing = actorCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      actorCounts.set(key, { type: rel.subject.type, count: 1 });
    }
    
    if (typeof rel.object === 'object') {
      const objKey = rel.object.name.toLowerCase();
      const existingObj = actorCounts.get(objKey);
      if (existingObj) {
        existingObj.count++;
      } else {
        actorCounts.set(objKey, { type: rel.object.type, count: 1 });
      }
    }
  }
  
  return Array.from(actorCounts.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function getTopActions(relationships: Relationship[]): { action: string; count: number }[] {
  const actionCounts = new Map<string, number>();
  
  for (const rel of relationships) {
    const action = rel.action.toLowerCase();
    actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
  }
  
  return Array.from(actionCounts.entries())
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

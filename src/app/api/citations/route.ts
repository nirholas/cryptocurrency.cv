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
 * Citation Network API
 *
 * Endpoints for managing and analyzing academic citations.
 */

import { type NextRequest, NextResponse } from 'next/server';
import {
  getCitationGraph,
  getOurDatasetId,
  calculatePaperMetrics,
  calculateAuthorMetrics,
  calculateNetworkMetrics,
  findCoCitationClusters,
  detectResearchFronts,
  detectCitationBursts,
  exportCitations,
  type CitationNode,
  type ExportFormat,
} from '@/lib/citation-network';

export const runtime = 'edge';

// Add sample citation data
function initializeSampleCitations() {
  const graph = getCitationGraph();
  const ourId = getOurDatasetId();

  // Check if already initialized
  if (graph.getAllNodes().length > 1) return;

  // Sample papers that cite our dataset
  const samplePapers: Omit<CitationNode, 'citedBy' | 'addedAt' | 'updatedAt'>[] = [
    {
      nodeId: 'paper:chen2025',
      nodeType: 'paper',
      title: 'Sentiment Analysis of Cryptocurrency News Using Deep Learning',
      authors: [
        { name: 'Wei Chen', affiliations: ['MIT'], orcid: '0000-0001-2345-6789' },
        { name: 'Sarah Johnson', affiliations: ['Stanford'] },
      ],
      year: 2025,
      venue: 'Journal of Financial Data Science',
      doi: '10.1234/jfds.2025.001',
      abstract: 'We present a deep learning approach for cryptocurrency news sentiment analysis...',
      keywords: ['sentiment analysis', 'cryptocurrency', 'deep learning', 'NLP'],
      citationCount: 15,
      references: [ourId],
      metadata: {
        source: 'manual',
        openAccess: true,
        peerReviewed: true,
        language: 'en',
        fieldsOfStudy: ['Computer Science', 'Finance'],
        volume: '12',
        issue: '3',
        pages: '45-67',
      },
    },
    {
      nodeId: 'paper:smith2025',
      nodeType: 'paper',
      title: 'Market Manipulation Detection in Cryptocurrency Markets',
      authors: [
        { name: 'John Smith', affiliations: ['Oxford'], orcid: '0000-0002-3456-7890' },
        { name: 'Emma Williams', affiliations: ['Cambridge'] },
      ],
      year: 2025,
      venue: 'Conference on Financial Cryptography',
      doi: '10.1234/fc.2025.042',
      abstract: 'This paper presents methods for detecting market manipulation using news data...',
      keywords: ['market manipulation', 'cryptocurrency', 'detection', 'anomaly'],
      citationCount: 8,
      references: [ourId, 'paper:chen2025'],
      metadata: {
        source: 'manual',
        openAccess: false,
        peerReviewed: true,
        language: 'en',
        fieldsOfStudy: ['Computer Science', 'Finance', 'Security'],
      },
    },
    {
      nodeId: 'paper:kumar2024',
      nodeType: 'paper',
      title: 'Predicting Bitcoin Price Movements from News Headlines',
      authors: [
        { name: 'Raj Kumar', affiliations: ['IIT Delhi'] },
        { name: 'Priya Sharma', affiliations: ['IIT Delhi'] },
      ],
      year: 2024,
      venue: 'ACM Conference on Economics and Computation',
      arxivId: '2401.12345',
      abstract: 'We develop a model to predict Bitcoin price movements using news headlines...',
      keywords: ['bitcoin', 'price prediction', 'news', 'machine learning'],
      citationCount: 22,
      references: [ourId],
      metadata: {
        source: 'arxiv',
        openAccess: true,
        peerReviewed: true,
        language: 'en',
        fieldsOfStudy: ['Computer Science', 'Economics'],
      },
    },
    {
      nodeId: 'paper:garcia2025',
      nodeType: 'paper',
      title: 'The Impact of Regulatory News on Cryptocurrency Volatility',
      authors: [
        { name: 'Maria Garcia', affiliations: ['LSE'] },
        { name: 'David Brown', affiliations: ['NYU'] },
      ],
      year: 2025,
      venue: 'Review of Financial Studies',
      doi: '10.1234/rfs.2025.789',
      abstract: 'This study examines how regulatory announcements affect crypto market volatility...',
      keywords: ['regulation', 'cryptocurrency', 'volatility', 'news impact'],
      citationCount: 35,
      references: ['paper:kumar2024', ourId],
      metadata: {
        source: 'manual',
        openAccess: false,
        peerReviewed: true,
        language: 'en',
        fieldsOfStudy: ['Finance', 'Economics'],
        volume: '38',
        issue: '1',
        pages: '112-156',
      },
    },
    {
      nodeId: 'paper:lee2025',
      nodeType: 'paper',
      title: 'Cross-Market Contagion in Cryptocurrency News Coverage',
      authors: [
        { name: 'Hyun-Joo Lee', affiliations: ['KAIST'] },
        { name: 'Seung-Min Park', affiliations: ['Seoul National University'] },
      ],
      year: 2025,
      venue: 'Journal of Financial Markets',
      doi: '10.1234/jfm.2025.033',
      abstract: 'We analyze how news coverage spreads across different cryptocurrency markets...',
      keywords: ['contagion', 'cryptocurrency', 'news coverage', 'cross-market'],
      citationCount: 12,
      references: ['paper:chen2025', 'paper:garcia2025'],
      metadata: {
        source: 'manual',
        openAccess: true,
        peerReviewed: true,
        language: 'en',
        fieldsOfStudy: ['Finance', 'Data Science'],
      },
    },
  ];

  for (const paper of samplePapers) {
    graph.addNode({
      ...paper,
      citedBy: [],
      addedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Add citation edges
  for (const paper of samplePapers) {
    for (const refId of paper.references) {
      graph.addEdge({
        fromNodeId: paper.nodeId,
        toNodeId: refId,
        strength: 1,
        createdAt: new Date(),
      });
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    initializeSampleCitations();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'stats';
    const graph = getCitationGraph();

    switch (action) {
      case 'stats': {
        // Network statistics
        const metrics = calculateNetworkMetrics();
        const ourId = getOurDatasetId();
        const papersCitingUs = graph.getPapersCitingUs();

        return NextResponse.json({
          success: true,
          data: {
            network: metrics,
            ourDataset: {
              id: ourId,
              citations: papersCitingUs.length,
              papers: papersCitingUs.map((p) => ({
                id: p.nodeId,
                title: p.title,
                year: p.year,
                venue: p.venue,
              })),
            },
          },
        });
      }

      case 'papers': {
        // List all papers
        const year = searchParams.get('year');
        const keyword = searchParams.get('keyword');
        const author = searchParams.get('author');
        const limit = parseInt(searchParams.get('limit') || '50');

        let papers = graph.getAllNodes();

        if (year) {
          papers = papers.filter((p) => p.year === parseInt(year));
        }
        if (keyword) {
          papers = graph.findByKeyword(keyword);
        }
        if (author) {
          papers = graph.findByAuthor(author);
        }

        papers = papers.slice(0, limit);

        return NextResponse.json({
          success: true,
          data: papers,
          count: papers.length,
        });
      }

      case 'paper': {
        // Get specific paper
        const paperId = searchParams.get('id');
        if (!paperId) {
          return NextResponse.json(
            { success: false, error: 'Paper ID required' },
            { status: 400 }
          );
        }
        const paper = graph.getNode(paperId);
        if (!paper) {
          return NextResponse.json(
            { success: false, error: 'Paper not found' },
            { status: 404 }
          );
        }
        const metrics = calculatePaperMetrics(paperId);
        return NextResponse.json({
          success: true,
          data: {
            paper,
            metrics,
          },
        });
      }

      case 'author': {
        // Author metrics
        const authorName = searchParams.get('name');
        if (!authorName) {
          return NextResponse.json(
            { success: false, error: 'Author name required' },
            { status: 400 }
          );
        }
        const metrics = calculateAuthorMetrics(authorName);
        if (!metrics) {
          return NextResponse.json(
            { success: false, error: 'Author not found' },
            { status: 404 }
          );
        }
        const papers = graph.findByAuthor(authorName);
        return NextResponse.json({
          success: true,
          data: {
            metrics,
            papers: papers.map((p) => ({
              id: p.nodeId,
              title: p.title,
              year: p.year,
              citations: p.citationCount,
            })),
          },
        });
      }

      case 'citing-us': {
        // Papers that cite our dataset
        const papers = graph.getPapersCitingUs();
        return NextResponse.json({
          success: true,
          data: papers,
          count: papers.length,
        });
      }

      case 'co-citations': {
        // Co-citation clusters
        const minStrength = parseInt(searchParams.get('min') || '2');
        const clusters = findCoCitationClusters(minStrength);
        return NextResponse.json({
          success: true,
          data: clusters,
        });
      }

      case 'research-fronts': {
        // Research fronts
        const windowYears = parseInt(searchParams.get('window') || '3');
        const fronts = detectResearchFronts(windowYears);
        return NextResponse.json({
          success: true,
          data: fronts,
        });
      }

      case 'bursts': {
        // Citation bursts
        const bursts = detectCitationBursts();
        return NextResponse.json({
          success: true,
          data: bursts,
        });
      }

      case 'path': {
        // Citation path between papers
        const fromId = searchParams.get('from');
        const toId = searchParams.get('to');
        if (!fromId || !toId) {
          return NextResponse.json(
            { success: false, error: 'From and to IDs required' },
            { status: 400 }
          );
        }
        const path = graph.getCitationPath(fromId, toId);
        return NextResponse.json({
          success: true,
          data: {
            path,
            found: path !== null,
            length: path?.length || 0,
          },
        });
      }

      case 'export': {
        // Export citations
        const format = (searchParams.get('format') || 'bibtex') as ExportFormat['format'];
        const ids = searchParams.get('ids')?.split(',') || [];

        if (ids.length === 0) {
          // Export all
          ids.push(...graph.getAllNodes().map((n) => n.nodeId));
        }

        const content = exportCitations(ids, format);
        const contentType = format === 'csl-json' ? 'application/json' : 'text/plain';

        return new NextResponse(content, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="citations.${format === 'csl-json' ? 'json' : format}"`,
          },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Citation API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeSampleCitations();

    const body = await request.json();
    const { action } = body;
    const graph = getCitationGraph();

    switch (action) {
      case 'add-paper': {
        // Add a new citation
        const {
          nodeId,
          nodeType,
          title,
          authors,
          year,
          venue,
          doi,
          arxivId,
          url,
          abstract,
          keywords,
          references,
          metadata,
        } = body;

        if (!nodeId || !title || !authors || !year) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields (nodeId, title, authors, year)' },
            { status: 400 }
          );
        }

        const node: CitationNode = {
          nodeId,
          nodeType: nodeType || 'paper',
          title,
          authors: authors.map((a: { name: string; affiliations?: string[]; orcid?: string }) => ({
            name: a.name,
            affiliations: a.affiliations || [],
            orcid: a.orcid,
          })),
          year,
          venue,
          doi,
          arxivId,
          url,
          abstract,
          keywords: keywords || [],
          citationCount: 0,
          references: references || [],
          citedBy: [],
          metadata: {
            source: 'manual',
            openAccess: metadata?.openAccess ?? true,
            peerReviewed: metadata?.peerReviewed ?? false,
            language: metadata?.language || 'en',
            fieldsOfStudy: metadata?.fieldsOfStudy || [],
            ...metadata,
          },
          addedAt: new Date(),
          updatedAt: new Date(),
        };

        graph.addNode(node);

        // Add edges for references
        for (const refId of node.references) {
          graph.addEdge({
            fromNodeId: node.nodeId,
            toNodeId: refId,
            strength: 1,
            createdAt: new Date(),
          });
        }

        return NextResponse.json({
          success: true,
          data: node,
        });
      }

      case 'add-citation': {
        // Add a citation relationship
        const { fromId, toId, context } = body;
        if (!fromId || !toId) {
          return NextResponse.json(
            { success: false, error: 'From and to IDs required' },
            { status: 400 }
          );
        }

        graph.addEdge({
          fromNodeId: fromId,
          toNodeId: toId,
          context,
          strength: 1,
          createdAt: new Date(),
        });

        return NextResponse.json({
          success: true,
          data: { added: true, from: fromId, to: toId },
        });
      }

      case 'calculate-metrics': {
        // Calculate metrics for a paper
        const { paperId } = body;
        if (!paperId) {
          return NextResponse.json(
            { success: false, error: 'Paper ID required' },
            { status: 400 }
          );
        }

        const metrics = calculatePaperMetrics(paperId);
        if (!metrics) {
          return NextResponse.json(
            { success: false, error: 'Paper not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: metrics,
        });
      }

      case 'bulk-export': {
        // Export multiple papers
        const { paperIds, format } = body;
        if (!paperIds || !Array.isArray(paperIds)) {
          return NextResponse.json(
            { success: false, error: 'Paper IDs array required' },
            { status: 400 }
          );
        }

        const content = exportCitations(paperIds, format || 'bibtex');

        return NextResponse.json({
          success: true,
          data: {
            format: format || 'bibtex',
            content,
            count: paperIds.length,
          },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Citation API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

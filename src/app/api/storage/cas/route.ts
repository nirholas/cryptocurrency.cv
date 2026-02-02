/**
 * Content-Addressable Storage API
 * 
 * IPFS-style content-addressed storage for news articles and market data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimitFromRequest, getRateLimitErrorResponse } from '@/lib/ratelimit';
import { 
  cas,
  type ContentIdentifier,
} from '@/lib/content-addressable';

// Use Node.js runtime since content-addressable.ts uses database.ts which requires fs/path modules
export const runtime = 'nodejs';
export const revalidate = 0; // No caching for CAS

/**
 * GET /api/storage/cas
 * 
 * Retrieve content by CID or list pinned content
 */
export async function GET(request: NextRequest) {
  const rateLimitResult = await checkRateLimitFromRequest(request);
  if (!rateLimitResult.allowed) {
    return getRateLimitErrorResponse(rateLimitResult);
  }

  try {
    const { searchParams } = new URL(request.url);
    const cid = searchParams.get('cid');
    const action = searchParams.get('action');

    if (action === 'stats') {
      const stats = await cas.getStats();
      return NextResponse.json({ stats });
    }

    if (action === 'pins') {
      const limit = parseInt(searchParams.get('limit') || '100');
      const pins = await cas.listPins({ limit });
      return NextResponse.json({ 
        pins,
        count: pins.length,
      });
    }

    if (cid) {
      // Get content by CID
      const content = await cas.get(cid);
      
      if (content === null) {
        return NextResponse.json(
          { error: 'Content not found' },
          { status: 404 }
        );
      }

      // Get block info
      const block = await cas.getBlock(cid);

      return NextResponse.json({
        cid,
        content,
        metadata: block ? {
          size: block.size,
          codec: block.codec,
          created: block.created,
          links: block.links,
        } : null,
      });
    }

    return NextResponse.json(
      { error: 'Provide cid parameter or action (stats, pins)' },
      { status: 400 }
    );
  } catch (error) {
    console.error('CAS GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve content' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/storage/cas
 * 
 * Store content, verify, or perform other CAS operations
 */
export async function POST(request: NextRequest) {
  const rateLimitResult = await checkRateLimitFromRequest(request);
  if (!rateLimitResult.allowed) {
    return getRateLimitErrorResponse(rateLimitResult);
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'put' || !action) {
      // Store content
      const { content, pin, name, codec } = body as {
        content: string | object | null;
        pin?: boolean;
        name?: string;
        codec?: 'raw' | 'json' | 'dag-json';
      };

      if (content === undefined || content === null) {
        return NextResponse.json(
          { error: 'Content is required' },
          { status: 400 }
        );
      }

      const cid = await cas.put(content as string | object, { pin, name, codec });
      const block = await cas.getBlock(cid);

      return NextResponse.json({
        success: true,
        cid,
        size: block?.size || 0,
        pinned: pin || false,
      });
    }

    if (action === 'put-dag') {
      // Store DAG node with links
      const { data, links, pin, name } = body as {
        data: unknown;
        links: Array<{ name: string; cid: ContentIdentifier }>;
        pin?: boolean;
        name?: string;
      };

      const cid = await cas.putDAG(data, links || [], { pin, name });
      return NextResponse.json({
        success: true,
        cid,
      });
    }

    if (action === 'pin') {
      const { cid, name, recursive } = body as {
        cid: ContentIdentifier;
        name?: string;
        recursive?: boolean;
      };

      if (!cid) {
        return NextResponse.json(
          { error: 'CID is required' },
          { status: 400 }
        );
      }

      const pinData = await cas.pin(cid, { name, recursive });
      return NextResponse.json({
        success: true,
        pin: pinData,
      });
    }

    if (action === 'unpin') {
      const { cid, recursive } = body as {
        cid: ContentIdentifier;
        recursive?: boolean;
      };

      if (!cid) {
        return NextResponse.json(
          { error: 'CID is required' },
          { status: 400 }
        );
      }

      await cas.unpin(cid, recursive);
      return NextResponse.json({
        success: true,
        message: `Unpinned ${cid}`,
      });
    }

    if (action === 'verify') {
      const { cid, recursive } = body as {
        cid: ContentIdentifier;
        recursive?: boolean;
      };

      if (!cid) {
        return NextResponse.json(
          { error: 'CID is required' },
          { status: 400 }
        );
      }

      const result = recursive 
        ? await cas.verifyDAG(cid)
        : await cas.verify(cid);

      return NextResponse.json({
        success: true,
        verification: result,
      });
    }

    if (action === 'resolve') {
      const { cid, path } = body as {
        cid: ContentIdentifier;
        path?: string[];
      };

      if (!cid) {
        return NextResponse.json(
          { error: 'CID is required' },
          { status: 400 }
        );
      }

      const result = await cas.resolve(cid, path);
      return NextResponse.json({
        success: true,
        resolution: result,
      });
    }

    if (action === 'gc') {
      const { dryRun, olderThan } = body as {
        dryRun?: boolean;
        olderThan?: number;
      };

      const result = await cas.gc({ dryRun, olderThan });
      return NextResponse.json({
        success: true,
        gc: result,
      });
    }

    if (action === 'store-article') {
      const { article } = body as {
        article: {
          title: string;
          content: string;
          source: string;
          pubDate: string;
          url: string;
        };
      };

      if (!article) {
        return NextResponse.json(
          { error: 'Article is required' },
          { status: 400 }
        );
      }

      const cid = await cas.storeNewsArticle(article);
      return NextResponse.json({
        success: true,
        cid,
        articleUrl: article.url,
      });
    }

    if (action === 'store-snapshot') {
      const { snapshot } = body as {
        snapshot: {
          timestamp: string;
          prices: Array<{ symbol: string; price: number; volume: number }>;
        };
      };

      if (!snapshot) {
        return NextResponse.json(
          { error: 'Snapshot is required' },
          { status: 400 }
        );
      }

      const cid = await cas.storeMarketSnapshot(snapshot);
      return NextResponse.json({
        success: true,
        cid,
        timestamp: snapshot.timestamp,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('CAS POST error:', error);
    return NextResponse.json(
      { error: 'CAS operation failed' },
      { status: 500 }
    );
  }
}

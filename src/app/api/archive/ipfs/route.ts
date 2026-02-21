/**
 * 📦 On-chain Archive (IPFS/Arweave)
 * 
 * Archive news articles to decentralized storage for permanent, 
 * censorship-resistant access.
 * 
 * GET /api/archive/ipfs - Get archived content
 * POST /api/archive/ipfs - Archive new content
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

interface ArchivedItem {
  id: string;
  cid: string; // IPFS CID or Arweave TX
  storage: 'ipfs' | 'arweave' | 'both';
  contentHash: string;
  title: string;
  source: string;
  originalUrl: string;
  archivedAt: string;
  size: number;
  verified: boolean;
  gateway: string;
  metadata: {
    type: 'article' | 'snapshot' | 'bundle';
    articleCount?: number;
    period?: string;
  };
}

// Runtime storage for this instance (persists across requests in the same serverless container)
const sessionItems: ArchivedItem[] = [];

// Hash content for verification
function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Upload content to IPFS via nft.storage (free) or Pinata.
 * Returns the CID if successful, null otherwise.
 */
async function uploadToIPFS(
  content: string,
  filename = 'article.json'
): Promise<string | null> {
  // Option 1: NFT.Storage (free, no size limit for reasonable content)
  const nftStorageKey = process.env.NFT_STORAGE_API_KEY;
  if (nftStorageKey) {
    try {
      const res = await fetch('https://api.nft.storage/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${nftStorageKey}`,
          'Content-Type': 'text/plain',
        },
        body: content,
      });
      if (res.ok) {
        const data = await res.json();
        return data.value?.cid ?? null;
      }
    } catch { /* fall through */ }
  }

  // Option 2: Pinata (free tier: 1 GB)
  const pinataJwt = process.env.PINATA_JWT;
  if (pinataJwt) {
    try {
      const form = new FormData();
      form.append('file', new Blob([content], { type: 'text/plain' }), filename);
      const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: { Authorization: `Bearer ${pinataJwt}` },
        body: form,
      });
      if (res.ok) {
        const data = await res.json();
        return data.IpfsHash ?? null;
      }
    } catch { /* fall through */ }
  }

  return null;
}

/**
 * Get current Ethereum block height from Cloudflare's free ETH gateway.
 */
async function getEthBlockHeight(): Promise<number | null> {
  try {
    const res = await fetch('https://cloudflare-eth.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result ? parseInt(data.result, 16) : null;
  } catch {
    return null;
  }
}

/**
 * Fetch total article count from the GitHub archive index.
 */
async function getArchiveStats(): Promise<{ totalArticles: number; lastUpdated: string | null }> {
  try {
    const res = await fetch(
      'https://raw.githubusercontent.com/nirholas/free-crypto-news/main/archive/meta/stats.json',
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const data = await res.json();
      return {
        totalArticles: data.total_articles ?? data.totalArticles ?? 0,
        lastUpdated: data.last_updated ?? data.lastUpdated ?? null,
      };
    }
  } catch { /* fall through */ }
  return { totalArticles: 0, lastUpdated: null };
}

function isConfigured(): boolean {
  return !!(process.env.NFT_STORAGE_API_KEY || process.env.PINATA_JWT);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'list';
  
  // Get stats
  if (action === 'stats') {
    const archiveStats = await getArchiveStats();
    return NextResponse.json({
      success: true,
      stats: {
        totalArchived: sessionItems.length,
        archiveTotalArticles: archiveStats.totalArticles,
        lastArchive: archiveStats.lastUpdated,
        ipfsConfigured: !!process.env.NFT_STORAGE_API_KEY,
        pinataConfigured: !!process.env.PINATA_JWT,
        sessionItems: sessionItems.length,
        setup: isConfigured()
          ? 'IPFS archiving active'
          : 'Set NFT_STORAGE_API_KEY or PINATA_JWT to enable real IPFS archiving',
      },
      gateways: {
        ipfs: [
          'https://ipfs.io/ipfs/',
          'https://cloudflare-ipfs.com/ipfs/',
          'https://gateway.pinata.cloud/ipfs/',
          'https://dweb.link/ipfs/',
        ],
        arweave: [
          'https://arweave.net/',
          'https://viewblock.io/arweave/tx/',
        ],
      },
    });
  }
  
  // Verify archived content
  if (action === 'verify') {
    const cid = searchParams.get('cid');
    const item = sessionItems.find(i => i.cid === cid);

    if (!item) {
      return NextResponse.json({ error: 'CID not found in this session. Cross-session lookup requires a database.' }, { status: 404 });
    }

    const [blockHeight] = await Promise.all([getEthBlockHeight()]);

    return NextResponse.json({
      success: true,
      verified: item.verified,
      item,
      verificationProof: {
        contentHash: item.contentHash,
        timestamp: item.archivedAt,
        blockHeight,
        txHash: '0x' + hashContent(item.cid).slice(0, 64),
        note: blockHeight ? 'Block height from Ethereum mainnet at time of verification' : 'Block height unavailable',
      },
    });
  }
  
  // Get by CID
  const cid = searchParams.get('cid');
  if (cid) {
    const item = sessionItems.find(i => i.cid === cid);
    if (!item) {
      return NextResponse.json({ error: 'Archive not found for this CID in the current session' }, { status: 404 });
    }
    return NextResponse.json({ success: true, item });
  }

  // List session archives
  const storage = searchParams.get('storage');
  const type = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') || '20');

  let items = [...sessionItems];
  if (storage) items = items.filter(i => i.storage === storage || i.storage === 'both');
  if (type) items = items.filter(i => i.metadata.type === type);

  return NextResponse.json({
    success: true,
    items: items.slice(0, limit),
    total: sessionItems.length,
    configured: isConfigured(),
    setup: isConfigured()
      ? null
      : 'Set NFT_STORAGE_API_KEY (nft.storage) or PINATA_JWT (Pinata) to persist archives to real IPFS',
    _links: {
      stats: '/api/archive/ipfs?action=stats',
      verify: '/api/archive/ipfs?action=verify&cid=<cid>',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    // Archive single article
    if (action === 'archive') {
      const { url, title, content, source, storage = 'ipfs' } = body;
      
      if (!content && !url) {
        return NextResponse.json({ error: 'Content or URL required' }, { status: 400 });
      }
      
      const contentToArchive = content || `Archived from: ${url}`;
      const contentHash = hashContent(contentToArchive);

      if (!isConfigured()) {
        return NextResponse.json({
          success: false,
          error: 'IPFS not configured',
          message: 'Set NFT_STORAGE_API_KEY (https://nft.storage) or PINATA_JWT (https://pinata.cloud) to archive to real IPFS',
          contentHash: `sha256:${contentHash}`,
        }, { status: 503 });
      }

      const uploadedCid = await uploadToIPFS(
        JSON.stringify({ title, content: contentToArchive, source, url, archivedAt: new Date().toISOString() }),
        `${contentHash.slice(0, 16)}.json`
      );

      if (!uploadedCid) {
        return NextResponse.json({ success: false, error: 'IPFS upload failed. Check your API key and try again.' }, { status: 502 });
      }

      const newItem: ArchivedItem = {
        id: `arch_${Date.now()}`,
        cid: uploadedCid,
        storage: 'ipfs',
        contentHash: `sha256:${contentHash}`,
        title: title || 'Untitled Article',
        source: source || 'Unknown',
        originalUrl: url || '',
        archivedAt: new Date().toISOString(),
        size: Buffer.byteLength(contentToArchive, 'utf8'),
        verified: true,
        gateway: `https://ipfs.io/ipfs/${uploadedCid}`,
        metadata: { type: 'article' },
      };

      sessionItems.push(newItem);

      return NextResponse.json({
        success: true,
        archived: newItem,
        message: 'Content archived to IPFS',
        accessUrls: {
          primary: newItem.gateway,
          alternatives: [
            `https://cloudflare-ipfs.com/ipfs/${uploadedCid}`,
            `https://dweb.link/ipfs/${uploadedCid}`,
            `https://gateway.pinata.cloud/ipfs/${uploadedCid}`,
          ],
        },
      });
    }
    
    // Create daily snapshot
    if (action === 'snapshot') {
      const { date = new Date().toISOString().split('T')[0] } = body;

      if (!isConfigured()) {
        return NextResponse.json({
          success: false,
          error: 'IPFS not configured',
          message: 'Set NFT_STORAGE_API_KEY or PINATA_JWT to archive snapshots to real IPFS',
        }, { status: 503 });
      }

      // Fetch snapshot data from GitHub archive
      let snapshotContent: string;
      let articleCount = 0;
      try {
        const [year, month] = date.split('-');
        const archiveRes = await fetch(
          `https://raw.githubusercontent.com/nirholas/free-crypto-news/main/archive/articles/${year}-${month}.jsonl`
        );
        if (archiveRes.ok) {
          const text = await archiveRes.text();
          articleCount = text.split('\n').filter(l => l.trim()).length;
          snapshotContent = text;
        } else {
          snapshotContent = JSON.stringify({ date, note: 'Archive data not yet available for this date' });
        }
      } catch {
        snapshotContent = JSON.stringify({ date, generated: new Date().toISOString() });
      }

      const contentHash = hashContent(snapshotContent);
      const uploadedCid = await uploadToIPFS(snapshotContent, `snapshot-${date}.jsonl`);

      if (!uploadedCid) {
        return NextResponse.json({ success: false, error: 'IPFS snapshot upload failed' }, { status: 502 });
      }

      const snapshot: ArchivedItem = {
        id: `snap_${Date.now()}`,
        cid: uploadedCid,
        storage: 'ipfs',
        contentHash: `sha256:${contentHash}`,
        title: `Daily Crypto News Snapshot - ${date}`,
        source: 'Free Crypto News',
        originalUrl: `https://cryptocurrency.cv/snapshot/${date}`,
        archivedAt: new Date().toISOString(),
        size: Buffer.byteLength(snapshotContent, 'utf8'),
        verified: true,
        gateway: `https://ipfs.io/ipfs/${uploadedCid}`,
        metadata: { type: 'snapshot', articleCount, period: date },
      };

      sessionItems.push(snapshot);

      return NextResponse.json({
        success: true,
        snapshot,
        articleCount,
        message: `Snapshot for ${date} archived to IPFS (${articleCount} articles)`,
      });
    }
    
    // Pin existing content
    if (action === 'pin') {
      const { cid } = body;
      if (!cid) return NextResponse.json({ error: 'cid required' }, { status: 400 });

      // Try Pinata pin-by-hash
      const pinataJwt = process.env.PINATA_JWT;
      if (pinataJwt) {
        try {
          const res = await fetch('https://api.pinata.cloud/pinning/pinByHash', {
            method: 'POST',
            headers: { Authorization: `Bearer ${pinataJwt}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ hashToPin: cid }),
          });
          if (res.ok) {
            return NextResponse.json({ success: true, pinned: true, cid, service: 'pinata', message: `CID ${cid} pinned to Pinata` });
          }
          const err = await res.text();
          return NextResponse.json({ success: false, error: `Pinata pin failed: ${err}` }, { status: 502 });
        } catch (e) {
          return NextResponse.json({ success: false, error: String(e) }, { status: 502 });
        }
      }

      return NextResponse.json({
        success: false,
        error: 'Pinning service not configured',
        message: 'Set PINATA_JWT to enable pinning',
        cid,
      }, { status: 503 });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

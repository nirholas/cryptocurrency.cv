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
 * Protocol Health & DeFi Risk API
 * 
 * Comprehensive DeFi protocol safety intelligence with real-time risk scoring,
 * audit tracking, incident monitoring, and governance analysis.
 * 
 * GET /api/defi/protocol-health?protocol=aave-v3 - Get full protocol health
 * GET /api/defi/protocol-health?action=ranking&category=lending - Protocol rankings
 * GET /api/defi/protocol-health?action=incidents - Recent security incidents
 * GET /api/defi/protocol-health?action=search&q=uni - Search protocols
 * 
 * @module api/defi/protocol-health
 */

import { type NextRequest, NextResponse } from 'next/server';
import {
  fetchProtocolHealth,
  getTopProtocols,
  getProtocolRanking,
  getRecentIncidents,
  searchProtocols,
  type ProtocolCategory,
} from '@/lib/protocol-health';

export const runtime = 'edge';
export const revalidate = 300; // 5 minutes cache

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'health';
    const protocol = searchParams.get('protocol');
    const category = searchParams.get('category') as ProtocolCategory | null;
    const chain = searchParams.get('chain');
    const query = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    let responseData: unknown;

    switch (action) {
      case 'health': {
        if (!protocol) {
          return NextResponse.json({
            success: false,
            error: 'Protocol ID required',
            example: '/api/defi/protocol-health?protocol=aave-v3',
          }, { status: 400 });
        }

        const health = await fetchProtocolHealth(protocol);
        
        if (!health) {
          return NextResponse.json({
            success: false,
            error: `Protocol "${protocol}" not found`,
          }, { status: 404 });
        }

        responseData = {
          protocol: health.protocol,
          riskScore: {
            overall: health.riskScore.overallScore,
            grade: health.riskScore.grade,
            factors: Object.entries(health.riskScore.factors).map(([_key, factor]) => ({
              name: factor.name,
              score: factor.score,
              severity: factor.severity,
              details: factor.details,
            })),
            recommendations: health.riskScore.recommendations,
            warnings: health.riskScore.warnings,
          },
          tvl: {
            current: health.tvl.tvlUsd,
            change24h: health.tvl.change24h,
            change7d: health.tvl.change7d,
            change30d: health.tvl.change30d,
            rank: health.tvl.rank,
            chains: health.tvl.chainBreakdown,
          },
          audits: health.audits.map(a => ({
            auditor: a.auditor,
            date: a.date,
            rating: a.overallRating,
            tier: a.auditorReputation,
            findingsCount: a.findings.length,
            openIssues: a.findings.filter(f => f.status !== 'resolved').length,
          })),
          incidents: health.incidents.map(i => ({
            date: i.date,
            type: i.type,
            severity: i.severity,
            lossUsd: i.lossUsd,
            recoveredUsd: i.recoveredUsd,
            status: i.status,
          })),
          insurance: health.insurance ? {
            totalCoverage: health.insurance.totalCoverageUsd,
            coverageRatio: health.insurance.coverageRatio,
            providers: health.insurance.providers.map(p => p.name),
          } : null,
          governance: health.governance ? {
            tokenSymbol: health.governance.tokenSymbol,
            holderCount: health.governance.holderCount,
            concentration: health.governance.topHolderConcentration,
            voterParticipation: health.governance.averageVoterParticipation,
            timelockHours: health.governance.timelockDuration,
            multisig: health.governance.multisigDetails,
          } : null,
          team: health.team ? {
            isDoxxed: health.team.isDoxxed,
            teamSize: health.team.teamSize,
            backers: health.team.backers,
            githubActivity: health.team.githubActivity?.commits30d,
          } : null,
          alerts: health.alerts,
        };
        break;
      }

      case 'ranking': {
        const rankings = await getProtocolRanking(
          category || undefined,
          chain || undefined,
          limit
        );

        responseData = {
          count: rankings.length,
          category: category || 'all',
          chain: chain || 'all',
          protocols: rankings.map((r, index) => ({
            rank: index + 1,
            id: r.protocol.id,
            name: r.protocol.name,
            category: r.protocol.category,
            chains: r.protocol.chains,
            tvlUsd: r.tvl.tvlUsd,
            riskScore: r.score.overallScore,
            riskGrade: r.score.grade,
            tvlChange24h: r.tvl.change24h,
          })),
        };
        break;
      }

      case 'incidents': {
        const incidents = await getRecentIncidents(limit);

        responseData = {
          count: incidents.length,
          incidents: incidents.map(i => ({
            id: i.id,
            protocol: i.protocolId,
            date: i.date,
            type: i.type,
            severity: i.severity,
            lossUsd: i.lossUsd,
            recoveredUsd: i.recoveredUsd,
            netLoss: i.lossUsd - i.recoveredUsd,
            attackVector: i.attackVector,
            description: i.description,
            status: i.status,
            isConfirmed: i.isConfirmed,
          })),
          summary: {
            totalLoss: incidents.reduce((sum, i) => sum + i.lossUsd, 0),
            totalRecovered: incidents.reduce((sum, i) => sum + i.recoveredUsd, 0),
            criticalCount: incidents.filter(i => i.severity === 'critical').length,
            activeCount: incidents.filter(i => i.status === 'ongoing' || i.status === 'investigating').length,
          },
        };
        break;
      }

      case 'search': {
        if (!query) {
          return NextResponse.json({
            success: false,
            error: 'Search query required',
            example: '/api/defi/protocol-health?action=search&q=uniswap',
          }, { status: 400 });
        }

        const results = await searchProtocols(query);

        responseData = {
          query,
          count: results.length,
          protocols: results.slice(0, limit).map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            chains: p.chains,
            website: p.website,
            isVerified: p.isVerified,
          })),
        };
        break;
      }

      case 'list': {
        const protocols = await getTopProtocols(limit);

        responseData = {
          count: protocols.length,
          protocols: protocols.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            chains: p.chains,
            isVerified: p.isVerified,
          })),
        };
        break;
      }

      case 'categories': {
        const categories: ProtocolCategory[] = [
          'lending', 'dex', 'derivatives', 'yield', 'bridge', 'cdp',
          'liquid-staking', 'options', 'insurance', 'nft-marketplace',
          'gaming', 'launchpad', 'oracle', 'privacy', 'payments', 'other',
        ];

        responseData = {
          categories: categories.map(c => ({
            id: c,
            name: c.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          })),
        };
        break;
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          validActions: ['health', 'ranking', 'incidents', 'search', 'list', 'categories'],
        }, { status: 400 });
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        action,
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString(),
        cache: 'public, max-age=300',
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Processing-Time': `${processingTime}ms`,
      },
    });
  } catch (error) {
    console.error('[Protocol Health API] Error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch protocol health data',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * HEAD - API capability discovery
 */
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-API-Version': '1.0',
      'X-Supported-Actions': 'health,ranking,incidents,search,list,categories',
      'X-Risk-Grades': 'A+,A,A-,B+,B,B-,C+,C,C-,D,F',
      'X-Cache-TTL': '300s',
      'X-Rate-Limit': '60/min',
    },
  });
}

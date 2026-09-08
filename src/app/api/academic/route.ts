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
 * Academic Access API
 *
 * Endpoints for academic researchers to register, manage projects,
 * and access enhanced data.
 */

import { type NextRequest, NextResponse } from 'next/server';
import {
  registerInstitution,
  getInstitution,
  listInstitutions,
  registerResearcher,
  getResearcherByApiKey,
  recordUsage,
  createProject,
  getProject,
  addCoInvestigator,
  submitIRBApproval,
  listResearcherProjects,
  generateCitation,
  registerPublication,
  updatePublicationStatus,
  listPublications,
  requestBulkExport,
  getBulkExport,
  listBulkExports,
  canAccessEndpoint,
  checkRateLimits,
  getAPIConfig,
  getProgramStats,
  initializeSampleData,
  type InstitutionType,
  type DataType,
  type CitationStyle,
  type AgreementTerms,
  type DataRequirements,
} from '@/lib/academic-access';

export const runtime = 'edge';

// Initialize sample data on first load
let initialized = false;

function ensureInitialized() {
  if (!initialized) {
    initializeSampleData();
    initialized = true;
  }
}

export async function GET(request: NextRequest) {
  try {
    ensureInitialized();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'stats';
    const apiKey = request.headers.get('x-academic-key');

    switch (action) {
      case 'stats': {
        // Program-wide statistics
        const stats = getProgramStats();
        return NextResponse.json({
          success: true,
          data: stats,
        });
      }

      case 'institutions': {
        // List institutions
        const type = searchParams.get('type') as InstitutionType | null;
        const country = searchParams.get('country');
        const verified = searchParams.get('verified');

        const institutions = listInstitutions({
          type: type || undefined,
          country: country || undefined,
          verified: verified ? verified === 'true' : undefined,
        });

        return NextResponse.json({
          success: true,
          data: institutions,
          count: institutions.length,
        });
      }

      case 'institution': {
        // Get specific institution
        const institutionId = searchParams.get('id');
        if (!institutionId) {
          return NextResponse.json(
            { success: false, error: 'Institution ID required' },
            { status: 400 }
          );
        }
        const institution = getInstitution(institutionId);
        if (!institution) {
          return NextResponse.json(
            { success: false, error: 'Institution not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          data: institution,
        });
      }

      case 'researcher': {
        // Get researcher by API key
        if (!apiKey) {
          return NextResponse.json(
            { success: false, error: 'API key required' },
            { status: 401 }
          );
        }
        const researcher = getResearcherByApiKey(apiKey);
        if (!researcher) {
          return NextResponse.json(
            { success: false, error: 'Invalid API key' },
            { status: 401 }
          );
        }
        return NextResponse.json({
          success: true,
          data: {
            ...researcher,
            apiKey: undefined, // Don't return API key in response
          },
        });
      }

      case 'projects': {
        // List researcher's projects
        if (!apiKey) {
          return NextResponse.json(
            { success: false, error: 'API key required' },
            { status: 401 }
          );
        }
        const researcher = getResearcherByApiKey(apiKey);
        if (!researcher) {
          return NextResponse.json(
            { success: false, error: 'Invalid API key' },
            { status: 401 }
          );
        }
        const projects = listResearcherProjects(researcher.researcherId);
        return NextResponse.json({
          success: true,
          data: projects,
          count: projects.length,
        });
      }

      case 'project': {
        // Get specific project
        const projectId = searchParams.get('id');
        if (!projectId) {
          return NextResponse.json(
            { success: false, error: 'Project ID required' },
            { status: 400 }
          );
        }
        const project = getProject(projectId);
        if (!project) {
          return NextResponse.json(
            { success: false, error: 'Project not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          data: project,
        });
      }

      case 'citation': {
        // Generate citation
        const projectId = searchParams.get('project');
        const style = (searchParams.get('style') || 'apa') as CitationStyle;

        if (!projectId) {
          return NextResponse.json(
            { success: false, error: 'Project ID required' },
            { status: 400 }
          );
        }

        try {
          const citation = generateCitation(projectId, style);
          return NextResponse.json({
            success: true,
            data: citation,
          });
        } catch (error) {
          return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to generate citation' },
            { status: 400 }
          );
        }
      }

      case 'publications': {
        // List publications
        const status = searchParams.get('status') as 'draft' | 'submitted' | 'accepted' | 'published' | null;
        const limit = parseInt(searchParams.get('limit') || '50');

        const pubs = listPublications({
          status: status || undefined,
          limit,
        });

        return NextResponse.json({
          success: true,
          data: pubs,
          count: pubs.length,
        });
      }

      case 'exports': {
        // List bulk exports
        if (!apiKey) {
          return NextResponse.json(
            { success: false, error: 'API key required' },
            { status: 401 }
          );
        }
        const researcher = getResearcherByApiKey(apiKey);
        if (!researcher) {
          return NextResponse.json(
            { success: false, error: 'Invalid API key' },
            { status: 401 }
          );
        }
        const exports = listBulkExports(researcher.researcherId);
        return NextResponse.json({
          success: true,
          data: exports,
          count: exports.length,
        });
      }

      case 'export': {
        // Get specific export
        const requestId = searchParams.get('id');
        if (!requestId) {
          return NextResponse.json(
            { success: false, error: 'Export ID required' },
            { status: 400 }
          );
        }
        const exportReq = getBulkExport(requestId);
        if (!exportReq) {
          return NextResponse.json(
            { success: false, error: 'Export not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          data: exportReq,
        });
      }

      case 'config': {
        // Get API configuration for researcher
        if (!apiKey) {
          return NextResponse.json(
            { success: false, error: 'API key required' },
            { status: 401 }
          );
        }
        const researcher = getResearcherByApiKey(apiKey);
        if (!researcher) {
          return NextResponse.json(
            { success: false, error: 'Invalid API key' },
            { status: 401 }
          );
        }
        const config = getAPIConfig(researcher.researcherId);
        const rateLimits = checkRateLimits(researcher.researcherId);
        return NextResponse.json({
          success: true,
          data: {
            config,
            rateLimits,
            accessLevel: researcher.accessLevel,
          },
        });
      }

      case 'check-access': {
        // Check endpoint access
        if (!apiKey) {
          return NextResponse.json(
            { success: false, error: 'API key required' },
            { status: 401 }
          );
        }
        const researcher = getResearcherByApiKey(apiKey);
        if (!researcher) {
          return NextResponse.json(
            { success: false, error: 'Invalid API key' },
            { status: 401 }
          );
        }
        const endpoint = searchParams.get('endpoint');
        if (!endpoint) {
          return NextResponse.json(
            { success: false, error: 'Endpoint required' },
            { status: 400 }
          );
        }
        const access = canAccessEndpoint(researcher.researcherId, endpoint);
        return NextResponse.json({
          success: true,
          data: access,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Academic API error:', error);
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
    ensureInitialized();

    const body = await request.json();
    const { action } = body;
    const apiKey = request.headers.get('x-academic-key');

    switch (action) {
      case 'register-institution': {
        // Register new institution
        const { name, type, country, domains, metadata } = body;
        if (!name || !type || !country || !domains) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields' },
            { status: 400 }
          );
        }
        const institution = registerInstitution(
          name,
          type as InstitutionType,
          country,
          domains,
          metadata || {}
        );
        return NextResponse.json({
          success: true,
          data: institution,
        });
      }

      case 'register-researcher': {
        // Register new researcher
        const { email, name, title, institutionId, orcidId } = body;
        if (!email || !name || !title || !institutionId) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields' },
            { status: 400 }
          );
        }
        try {
          const researcher = await registerResearcher(
            email,
            name,
            title,
            institutionId,
            orcidId
          );
          return NextResponse.json({
            success: true,
            data: {
              researcherId: researcher.researcherId,
              apiKey: researcher.apiKey,
              accessLevel: researcher.accessLevel,
              verified: researcher.verified,
            },
          });
        } catch (error) {
          return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Registration failed' },
            { status: 400 }
          );
        }
      }

      case 'create-project': {
        // Create research project
        if (!apiKey) {
          return NextResponse.json(
            { success: false, error: 'API key required' },
            { status: 401 }
          );
        }
        const researcher = getResearcherByApiKey(apiKey);
        if (!researcher) {
          return NextResponse.json(
            { success: false, error: 'Invalid API key' },
            { status: 401 }
          );
        }

        const { title, description, dataRequirements, agreementTerms } = body;
        if (!title || !description || !dataRequirements || !agreementTerms) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields' },
            { status: 400 }
          );
        }

        const parsedDataReq: DataRequirements = {
          dataTypes: dataRequirements.dataTypes || ['news-articles'],
          timeRange: {
            start: new Date(dataRequirements.timeRange?.start || Date.now() - 86400000 * 30),
            end: dataRequirements.timeRange?.end ? new Date(dataRequirements.timeRange.end) : undefined,
          },
          refreshFrequency: dataRequirements.refreshFrequency || 'one-time',
          volumeEstimate: dataRequirements.volumeEstimate || 'medium',
          processingNeeds: dataRequirements.processingNeeds || [],
        };

        const parsedTerms: AgreementTerms = {
          allowsPublicRelease: agreementTerms.allowsPublicRelease ?? false,
          allowsDerivativeWorks: agreementTerms.allowsDerivativeWorks ?? true,
          allowsCommercialUse: agreementTerms.allowsCommercialUse ?? false,
          requiresCitation: true, // Always required
          requiresDataSharing: agreementTerms.requiresDataSharing ?? false,
        };

        const project = createProject(
          title,
          description,
          researcher.researcherId,
          researcher.institutionId,
          parsedDataReq,
          parsedTerms
        );

        return NextResponse.json({
          success: true,
          data: project,
        });
      }

      case 'submit-irb': {
        // Submit IRB approval
        if (!apiKey) {
          return NextResponse.json(
            { success: false, error: 'API key required' },
            { status: 401 }
          );
        }
        const { projectId, irbNumber } = body;
        if (!projectId || !irbNumber) {
          return NextResponse.json(
            { success: false, error: 'Project ID and IRB number required' },
            { status: 400 }
          );
        }
        const project = submitIRBApproval(projectId, irbNumber);
        if (!project) {
          return NextResponse.json(
            { success: false, error: 'Project not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          data: project,
        });
      }

      case 'add-collaborator': {
        // Add co-investigator to project
        if (!apiKey) {
          return NextResponse.json(
            { success: false, error: 'API key required' },
            { status: 401 }
          );
        }
        const { projectId, researcherId } = body;
        if (!projectId || !researcherId) {
          return NextResponse.json(
            { success: false, error: 'Project ID and researcher ID required' },
            { status: 400 }
          );
        }
        const project = addCoInvestigator(projectId, researcherId);
        if (!project) {
          return NextResponse.json(
            { success: false, error: 'Project or researcher not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          data: project,
        });
      }

      case 'register-publication': {
        // Register a publication
        if (!apiKey) {
          return NextResponse.json(
            { success: false, error: 'API key required' },
            { status: 401 }
          );
        }
        const { projectId, title, authors, venue, venueType, citationText } = body;
        if (!projectId || !title || !authors || !venue || !venueType) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields' },
            { status: 400 }
          );
        }
        try {
          const publication = registerPublication(
            projectId,
            title,
            authors,
            venue,
            venueType,
            citationText
          );
          return NextResponse.json({
            success: true,
            data: publication,
          });
        } catch (error) {
          return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to register publication' },
            { status: 400 }
          );
        }
      }

      case 'update-publication': {
        // Update publication status
        const { publicationId, status, doi, arxivId, url, publishedAt } = body;
        if (!publicationId || !status) {
          return NextResponse.json(
            { success: false, error: 'Publication ID and status required' },
            { status: 400 }
          );
        }
        const publication = updatePublicationStatus(publicationId, status, {
          doi,
          arxivId,
          url,
          publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        });
        if (!publication) {
          return NextResponse.json(
            { success: false, error: 'Publication not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          data: publication,
        });
      }

      case 'request-export': {
        // Request bulk data export
        if (!apiKey) {
          return NextResponse.json(
            { success: false, error: 'API key required' },
            { status: 401 }
          );
        }
        const researcher = getResearcherByApiKey(apiKey);
        if (!researcher) {
          return NextResponse.json(
            { success: false, error: 'Invalid API key' },
            { status: 401 }
          );
        }

        const { projectId, dataTypes, timeRange, format, filters } = body;
        if (!projectId || !dataTypes || !timeRange || !format) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields' },
            { status: 400 }
          );
        }

        try {
          const exportReq = requestBulkExport(
            projectId,
            researcher.researcherId,
            dataTypes as DataType[],
            {
              start: new Date(timeRange.start),
              end: new Date(timeRange.end),
            },
            format,
            filters
          );
          return NextResponse.json({
            success: true,
            data: exportReq,
          });
        } catch (error) {
          return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to request export' },
            { status: 400 }
          );
        }
      }

      case 'record-usage': {
        // Record API usage (internal use)
        if (!apiKey) {
          return NextResponse.json(
            { success: false, error: 'API key required' },
            { status: 401 }
          );
        }
        const researcher = getResearcherByApiKey(apiKey);
        if (!researcher) {
          return NextResponse.json(
            { success: false, error: 'Invalid API key' },
            { status: 401 }
          );
        }

        const { endpoint, bytesDownloaded } = body;
        recordUsage(researcher.researcherId, endpoint || '/api/academic', bytesDownloaded || 0);

        return NextResponse.json({
          success: true,
          data: { recorded: true },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Academic API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

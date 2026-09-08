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
 * Interactive API reference.
 *
 * The document is generated in process by `generateOpenAPISpec()`, the same
 * builder `/api/openapi.json` serves, so the page never fetches itself over the
 * network and cannot render a stale or half-fetched spec. It is normalized on
 * the server into a flat operation list and handed to the client explorer.
 */

import { generateOpenAPISpec } from '@/lib/openapi/generator';
import { ApiExplorer } from '@/components/api-explorer/ApiExplorer';
import { normalizeSpec } from '@/components/api-explorer/normalize';
import { SpecError } from '@/components/api-explorer/SpecError';
import type { ApiSpecModel } from '@/components/api-explorer/types';

/** Rebuild the document at most hourly; it only changes when routes ship. */
export const revalidate = 3600;

export default function ApiReferencePage() {
  let spec: ApiSpecModel;

  try {
    spec = normalizeSpec(generateOpenAPISpec());
  } catch (error) {
    return <SpecError reason={error instanceof Error ? error.message : String(error)} />;
  }

  if (spec.operations.length === 0) {
    return <SpecError reason="The OpenAPI document built successfully but declares no operations." />;
  }

  return <ApiExplorer spec={spec} />;
}

/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

/**
 * Where the historical news archive is read from.
 *
 * The archive (monthly article JSONL, indexes, market snapshots and stats) was
 * served from raw.githubusercontent.com until the files were removed from the
 * repository, after which every archive endpoint answered empty or 404. It now
 * lives in a public Google Cloud Storage bucket with the same layout, which a
 * scheduled job keeps appending to. Set ARCHIVE_BASE_URL to serve a mirror.
 *
 * @module lib/archive-source
 */

export const ARCHIVE_BASE_URL = (
  process.env.ARCHIVE_BASE_URL || 'https://storage.googleapis.com/three-ws-news-archive'
).replace(/\/+$/, '');

/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { NextResponse } from 'next/server';

const GITHUB_API = 'https://api.github.com/repos/nirholas/free-crypto-news/contributors';

export const revalidate = 86400; // Cache for 24 hours

export async function GET() {
  const res = await fetch(GITHUB_API, {
    headers: { Accept: 'application/vnd.github+json' },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch contributors' }, { status: 502 });
  }

  const contributors: Array<{
    avatar_url: string;
    login: string;
    contributions: number;
    html_url: string;
  }> = await res.json();

  const mapped = contributors.map((c) => ({
    avatarUrl: c.avatar_url,
    username: c.login,
    contributions: c.contributions,
    profileUrl: c.html_url,
  }));

  return NextResponse.json(mapped);
}

/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

export interface TeamMember {
  name: string;
  slug: string;
  role: string;
  bio: string;
  avatarUrl?: string;
  githubUsername?: string;
  twitterHandle?: string;
  linkedinUrl?: string;
  type: 'leadership' | 'core' | 'contributor';
}

export const TEAM: TeamMember[] = [
  {
    name: 'nirholas',
    slug: 'nirholas',
    role: 'Founder & Lead Developer',
    bio: 'Building the free and open crypto news infrastructure the industry needs.',
    githubUsername: 'nirholas',
    type: 'leadership',
  },
  // ... additional team members
];

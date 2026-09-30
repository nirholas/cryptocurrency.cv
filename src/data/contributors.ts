/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

/**
 * Typed access to the community credits in contributors.json, for the /team
 * page. The rendering rules (order, labels, links for deleted accounts) live
 * in scripts/lib/contributors.mjs so the site, README, CONTRIBUTORS.md and
 * humans.txt can never disagree.
 */

import data from './contributors.json';
import {
  KIND_LABELS,
  avatarFor as avatarForJs,
  linkFor as linkForJs,
  ordered as orderedJs,
} from '../../scripts/lib/contributors.mjs';

export type ContributionKind = keyof typeof KIND_LABELS;

export interface Contribution {
  summary: string;
  url: string;
}

export interface Contributor {
  login: string;
  name?: string;
  githubProfile?: boolean;
  kinds: ContributionKind[];
  contributions: Contribution[];
}

export const CONTRIBUTORS: Contributor[] = orderedJs(data) as Contributor[];

export const kindLabel = (kind: ContributionKind): string => KIND_LABELS[kind];
export const linkFor = (c: Contributor): string => linkForJs(c);
export const avatarFor = (c: Contributor, size = 96): string => avatarForJs(c, size);

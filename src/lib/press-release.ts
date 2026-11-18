/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

export interface PressReleaseSubmission {
  id: string;
  projectName: string;
  projectUrl: string;
  contactEmail: string;
  contactName: string;
  title: string;
  category: string;
  body: string;
  imageUrl?: string;
  tier: 'free' | 'priority' | 'featured';
  status: 'pending' | 'approved' | 'rejected';
  reviewNote?: string;
  createdAt: string;
  updatedAt?: string;
}

export const PRESS_RELEASE_CATEGORIES = [
  'Product Launch',
  'Partnership',
  'Funding',
  'Exchange Listing',
  'Protocol Update',
  'Report',
  'Event',
  'Other',
];

export function validatePressRelease(submission: Partial<PressReleaseSubmission>): string[] {
  const errors: string[] = [];
  if (!submission.projectName) errors.push('Project name is required.');
  if (!submission.projectUrl || !/^https?:\/\/.+/.test(submission.projectUrl))
    errors.push('Valid project website URL is required.');
  if (!submission.contactEmail || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(submission.contactEmail))
    errors.push('Valid contact email is required.');
  if (!submission.contactName) errors.push('Contact name is required.');
  if (!submission.title) errors.push('Press release title is required.');
  if (!submission.category || !PRESS_RELEASE_CATEGORIES.includes(submission.category))
    errors.push('Valid category is required.');
  if (
    !submission.body ||
    submission.body.split(/\s+/).length < 200 ||
    submission.body.split(/\s+/).length > 3000
  )
    errors.push('Press release body must be 200-3000 words.');
  if (submission.imageUrl && !/^https?:\/\/.+/.test(submission.imageUrl))
    errors.push('Featured image URL must be valid.');
  if (submission.tier && !['free', 'priority', 'featured'].includes(submission.tier))
    errors.push('Invalid tier.');
  return errors;
}

export function sanitizeInput(input: string): string {
  // Strip dangerous tags (opening and closing, any attributes or whitespace)
  // and inline event-handler attributes. Repeat until nothing changes so that
  // removals cannot splice together a new match (e.g. "<scr<script>ipt>").
  // `[^<>]*` keeps each tag match from scanning past the next '<', which
  // keeps the pass linear.
  let result = input;
  let previous: string;
  do {
    previous = result;
    result = result
      .replace(/<\/?(?:script|iframe|object|embed|form|link|meta)\b[^<>]*>/gi, ' ')
      .replace(/on\w+\s*=/gi, ' ');
  } while (result !== previous);
  return result;
}

// In-memory store (shared across routes)
export const pressReleaseStore: PressReleaseSubmission[] = [];

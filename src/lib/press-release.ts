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
  if (!submission.contactEmail || !/^\S+@\S+\.\S+$/.test(submission.contactEmail))
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
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<\/?(?:iframe|object|embed|form|link|meta)[^>]*>/gi, '');
}

// In-memory store (shared across routes)
export const pressReleaseStore: PressReleaseSubmission[] = [];

export function sanitizeInput(input: string): string {
  // Basic sanitization to prevent XSS
  return input.replace(/<script.*?>.*?<\/script>/gi, '').replace(/on\w+=/gi, '');
}

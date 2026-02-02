/**
 * Input Sanitization Middleware
 * 
 * Protects against XSS, SQL injection, and other security threats by
 * sanitizing user input before processing.
 */

import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

// =============================================================================
// SANITIZATION CONFIGURATION
// =============================================================================

/**
 * HTML sanitization options - very restrictive
 */
const HTML_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [], // No HTML tags allowed
  allowedAttributes: {},
  disallowedTagsMode: 'escape',
};

/**
 * Markdown-safe HTML sanitization (for blog posts, comments)
 */
const MARKDOWN_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'code', 'pre'],
  allowedAttributes: {
    'a': ['href', 'title'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  disallowedTagsMode: 'escape',
};

// =============================================================================
// SANITIZATION FUNCTIONS
// =============================================================================

/**
 * Sanitize a string to prevent XSS attacks
 * Strips all HTML tags and encodes special characters
 */
export function sanitizeString(input: string, maxLength = 10000): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Limit length to prevent DOS
  const truncated = input.slice(0, maxLength);
  
  // Remove all HTML tags
  const sanitized = sanitizeHtml(truncated, HTML_SANITIZE_OPTIONS);
  
  // Additional protection: remove null bytes
  return sanitized.replace(/\0/g, '');
}

/**
 * Sanitize HTML content while preserving safe markdown-style formatting
 */
export function sanitizeMarkdown(input: string, maxLength = 50000): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  const truncated = input.slice(0, maxLength);
  const sanitized = sanitizeHtml(truncated, MARKDOWN_SANITIZE_OPTIONS);
  
  return sanitized.replace(/\0/g, '');
}

/**
 * Sanitize URL to prevent javascript: and data: schemes
 */
export function sanitizeUrl(url: string): string | null {
  if (typeof url !== 'string') {
    return null;
  }
  
  const trimmed = url.trim();
  
  // Block dangerous schemes
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return null;
  }
  
  // Validate URL format
  try {
    const parsed = new URL(trimmed);
    
    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    // If not absolute URL, check if it's a relative path
    if (trimmed.startsWith('/')) {
      return trimmed;
    }
    
    return null;
  }
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') {
    return null;
  }
  
  const trimmed = email.trim().toLowerCase();
  
  // Basic email regex
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  
  if (!emailRegex.test(trimmed)) {
    return null;
  }
  
  return trimmed;
}

/**
 * Sanitize search query
 * Removes potentially dangerous characters while preserving search functionality
 */
export function sanitizeSearchQuery(query: string, maxLength = 500): string {
  if (typeof query !== 'string') {
    return '';
  }
  
  const truncated = query.slice(0, maxLength).trim();
  
  // Remove null bytes and control characters
  let sanitized = truncated.replace(/[\0\x00-\x1F\x7F]/g, '');
  
  // Remove SQL injection attempts
  sanitized = sanitized.replace(/['";\\]/g, '');
  
  // Remove script tags
  sanitized = sanitizeHtml(sanitized, HTML_SANITIZE_OPTIONS);
  
  return sanitized;
}

/**
 * Sanitize coin ID (alphanumeric + hyphens only)
 */
export function sanitizeCoinId(coinId: string): string | null {
  if (typeof coinId !== 'string') {
    return null;
  }
  
  const trimmed = coinId.trim().toLowerCase();
  
  // Only allow lowercase letters, numbers, and hyphens
  if (!/^[a-z0-9-]+$/.test(trimmed)) {
    return null;
  }
  
  // Length limits
  if (trimmed.length < 1 || trimmed.length > 50) {
    return null;
  }
  
  return trimmed;
}

/**
 * Sanitize wallet address (Ethereum format)
 */
export function sanitizeWalletAddress(address: string): string | null {
  if (typeof address !== 'string') {
    return null;
  }
  
  const trimmed = address.trim();
  
  // Ethereum address format: 0x followed by 40 hex characters
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return null;
  }
  
  return trimmed.toLowerCase();
}

/**
 * Sanitize API key
 */
export function sanitizeApiKey(key: string): string | null {
  if (typeof key !== 'string') {
    return null;
  }
  
  const trimmed = key.trim();
  
  // API keys should be alphanumeric with possible hyphens/underscores
  if (!/^[a-zA-Z0-9_-]{20,100}$/.test(trimmed)) {
    return null;
  }
  
  return trimmed;
}

// =============================================================================
// SANITIZATION SCHEMAS (for use with Zod)
// =============================================================================

/**
 * Create a sanitized string schema
 */
export const sanitizedString = (maxLength = 10000) =>
  z.string().transform(val => sanitizeString(val, maxLength));

/**
 * Create a sanitized markdown schema
 */
export const sanitizedMarkdown = (maxLength = 50000) =>
  z.string().transform(val => sanitizeMarkdown(val, maxLength));

/**
 * Create a sanitized URL schema
 */
export const sanitizedUrl = z.string().transform(val => {
  const sanitized = sanitizeUrl(val);
  if (!sanitized) {
    throw new Error('Invalid URL');
  }
  return sanitized;
});

/**
 * Create a sanitized email schema
 */
export const sanitizedEmail = z.string().transform(val => {
  const sanitized = sanitizeEmail(val);
  if (!sanitized) {
    throw new Error('Invalid email address');
  }
  return sanitized;
});

/**
 * Create a sanitized search query schema
 */
export const sanitizedSearchQuery = (maxLength = 500) =>
  z.string().transform(val => sanitizeSearchQuery(val, maxLength));

/**
 * Create a sanitized coin ID schema
 */
export const sanitizedCoinId = z.string().transform(val => {
  const sanitized = sanitizeCoinId(val);
  if (!sanitized) {
    throw new Error('Invalid coin ID');
  }
  return sanitized;
});

/**
 * Create a sanitized wallet address schema
 */
export const sanitizedWalletAddress = z.string().transform(val => {
  const sanitized = sanitizeWalletAddress(val);
  if (!sanitized) {
    throw new Error('Invalid wallet address');
  }
  return sanitized;
});

// =============================================================================
// OBJECT SANITIZATION
// =============================================================================

/**
 * Recursively sanitize an object
 * Sanitizes all string values in an object
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: { maxStringLength?: number; allowMarkdown?: boolean } = {}
): T {
  const { maxStringLength = 10000, allowMarkdown = false } = options;
  
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = allowMarkdown
        ? sanitizeMarkdown(value, maxStringLength)
        : sanitizeString(value, maxStringLength);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'object' && item !== null
          ? sanitizeObject(item as Record<string, unknown>, options)
          : typeof item === 'string'
          ? sanitizeString(item, maxStringLength)
          : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>, options);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

// =============================================================================
// REQUEST SANITIZATION HELPERS
// =============================================================================

/**
 * Sanitize request body (use in POST/PUT/PATCH handlers)
 */
export async function sanitizeRequestBody<T extends Record<string, unknown>>(
  request: Request,
  options?: { maxStringLength?: number; allowMarkdown?: boolean }
): Promise<T> {
  const body = await request.json();
  return sanitizeObject(body, options);
}

/**
 * Sanitize query parameters
 */
export function sanitizeQueryParams(
  params: URLSearchParams,
  options?: { maxStringLength?: number }
): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const { maxStringLength = 1000 } = options || {};
  
  params.forEach((value, key) => {
    sanitized[sanitizeString(key, 100)] = sanitizeString(value, maxStringLength);
  });
  
  return sanitized;
}

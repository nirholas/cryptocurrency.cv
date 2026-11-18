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
 * Date Range Extractor
 * 
 * Adapted from crypto-news-rag ModelDateRangeExtractor.java
 * Extracts date ranges from natural language queries using LLM.
 */

import { callGroq } from '../groq';
import type { DateRange } from './types';

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parse date string to Date object
 */
function parseDate(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  
  return date;
}

/**
 * Extract date range from user query using LLM
 */
export async function extractDateRange(
  query: string,
  currentDate: Date = new Date()
): Promise<DateRange | null> {
  const today = formatDate(currentDate);
  const currentYear = currentDate.getFullYear();
  
  // Calculate example dates for the prompt
  const tenDaysAgo = formatDate(new Date(currentDate.getTime() - 10 * 24 * 60 * 60 * 1000));
  const lastWeek = formatDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
  
  const prompt = `You are given a natural language query and the current date.
Your task is to extract the \`start\` and \`end\` dates implied in the query. If no specific date is implied, just return UNKNOWN

Today is: ${today}
Current Year is: ${currentYear}

Input:
A query

Output:
Return exactly 2 lines:

1. First line → start date in format \`YYYY-MM-DD\`
2. Second line → end date in format \`YYYY-MM-DD\`

Always return full date values, not expressions or placeholders.
Do not Return anything else, no explanation, no extra info, just 2 lines.

Examples:

What happened in the last 10 days?
${tenDaysAgo}
${today}

What has happened since last week?
${lastWeek}
${today}

What happened in March 2024?
2024-03-01
2024-03-31

Tell me about x since February
${currentYear}-02-01
${today}

What is the effect of x on y?
UNKNOWN

Now extract the date range:
${query}`;

  try {
    const response = await callGroq([{ role: 'user', content: prompt }], {
      temperature: 0.1,
      maxTokens: 64,
    });

    const content = response.content.trim();
    
    if (!content || content.includes('UNKNOWN')) {
      return null;
    }

    // Parse the two-line response
    const lines = content.split(/\r\n|\r|\n/).map(line => line.trim()).filter(Boolean);
    
    if (lines.length < 2) {
      console.warn('Invalid date range response format:', content);
      return null;
    }

    // Get the last two lines (in case there's extra output)
    const startDateStr = lines[lines.length - 2];
    const endDateStr = lines[lines.length - 1];
    
    const startDate = parseDate(startDateStr);
    const endDate = parseDate(endDateStr);
    
    if (!startDate || !endDate) {
      console.warn('Failed to parse dates:', { startDateStr, endDateStr });
      // Return default range of last month
      const oneMonthAgo = formatDate(new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000));
      return { startDate: oneMonthAgo, endDate: today };
    }

    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    };
  } catch (error) {
    console.warn('Date range extraction failed:', error);
    return null;
  }
}

/**
 * Extract date range with fallback defaults
 */
export async function extractDateRangeWithDefaults(
  query: string,
  defaultDays: number = 30
): Promise<DateRange> {
  const result = await extractDateRange(query);
  
  if (result) {
    return result;
  }
  
  // Return default range
  const now = new Date();
  return {
    startDate: formatDate(new Date(now.getTime() - defaultDays * 24 * 60 * 60 * 1000)),
    endDate: formatDate(now),
  };
}

/**
 * Parse common date expressions without LLM (for simple cases)
 */
export function parseSimpleDateExpression(query: string): DateRange | null {
  const lowerQuery = query.toLowerCase();
  const now = new Date();
  const today = formatDate(now);
  
  // "last X days"
  const lastDaysMatch = lowerQuery.match(/last\s+(\d+)\s+days?/);
  if (lastDaysMatch) {
    const days = parseInt(lastDaysMatch[1], 10);
    return {
      startDate: formatDate(new Date(now.getTime() - days * 24 * 60 * 60 * 1000)),
      endDate: today,
    };
  }
  
  // "last week"
  if (lowerQuery.includes('last week')) {
    return {
      startDate: formatDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
      endDate: today,
    };
  }
  
  // "last month"
  if (lowerQuery.includes('last month')) {
    return {
      startDate: formatDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)),
      endDate: today,
    };
  }
  
  // "since yesterday"
  if (lowerQuery.includes('yesterday') || lowerQuery.includes('since yesterday')) {
    return {
      startDate: formatDate(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
      endDate: today,
    };
  }
  
  // "today"
  if (lowerQuery.includes('today')) {
    return {
      startDate: today,
      endDate: today,
    };
  }
  
  // "this week"
  if (lowerQuery.includes('this week')) {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    return {
      startDate: formatDate(startOfWeek),
      endDate: today,
    };
  }
  
  // "this month"
  if (lowerQuery.includes('this month')) {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      startDate: formatDate(startOfMonth),
      endDate: today,
    };
  }
  
  // "in [Month] [Year]" or "[Month] [Year]"
  const monthYearMatch = lowerQuery.match(/(?:in\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i);
  if (monthYearMatch) {
    const months: Record<string, number> = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
    };
    const month = months[monthYearMatch[1].toLowerCase()];
    const year = parseInt(monthYearMatch[2], 10);
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    return {
      startDate: formatDate(startOfMonth),
      endDate: formatDate(endOfMonth),
    };
  }
  
  return null;
}

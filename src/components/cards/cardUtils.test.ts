/**
 * @fileoverview Unit tests for cardUtils
 * 
 * NOTE: Requires vitest to be installed:
 * npm install -D vitest @vitest/ui
 * 
 * Run with: npx vitest run src/components/cards/cardUtils.test.ts
 */

// @ts-nocheck - vitest types not installed
import { describe, it, expect } from 'vitest';
import {
  getSourceGradient,
  getSourceColors,
  estimateReadTime,
  sourceGradients,
  sourceColors,
  sentimentColors,
} from './cardUtils';

describe('cardUtils', () => {
  describe('sourceGradients', () => {
    it('should have gradients for all major sources', () => {
      const expectedSources = [
        'CoinDesk',
        'CoinTelegraph',
        'Decrypt',
        'The Block',
        'Bitcoin Magazine',
      ];
      expectedSources.forEach((source) => {
        expect(sourceGradients[source]).toBeDefined();
        expect(sourceGradients[source]).toContain('linear-gradient');
      });
    });

    it('should have valid CSS gradient format', () => {
      Object.values(sourceGradients).forEach((gradient) => {
        expect(gradient).toMatch(/^linear-gradient\(/);
        expect(gradient).toMatch(/deg/);
      });
    });
  });

  describe('sourceColors', () => {
    it('should have color config for all major sources', () => {
      const expectedSources = [
        'CoinDesk',
        'CoinTelegraph',
        'Decrypt',
        'The Block',
        'Bitcoin Magazine',
      ];
      expectedSources.forEach((source) => {
        expect(sourceColors[source]).toBeDefined();
        expect(sourceColors[source]).toHaveProperty('bg');
        expect(sourceColors[source]).toHaveProperty('text');
        expect(sourceColors[source]).toHaveProperty('solid');
      });
    });

    it('should have valid Tailwind classes', () => {
      Object.values(sourceColors).forEach((colors) => {
        expect(colors.bg).toMatch(/^bg-/);
        expect(colors.text).toMatch(/^text-/);
        expect(colors.solid).toMatch(/^bg-/);
      });
    });
  });

  describe('sentimentColors', () => {
    it('should have colors for all sentiment types', () => {
      expect(sentimentColors).toHaveProperty('bullish');
      expect(sentimentColors).toHaveProperty('bearish');
      expect(sentimentColors).toHaveProperty('neutral');
    });

    it('should have all required color properties', () => {
      Object.values(sentimentColors).forEach((colors) => {
        expect(colors).toHaveProperty('bg');
        expect(colors).toHaveProperty('text');
        expect(colors).toHaveProperty('icon');
      });
    });
  });

  describe('getSourceGradient', () => {
    it('should return correct gradient for known source', () => {
      const gradient = getSourceGradient('CoinDesk');
      expect(gradient).toBe(sourceGradients['CoinDesk']);
      expect(gradient).toContain('linear-gradient');
    });

    it('should return default gradient for unknown source', () => {
      const gradient = getSourceGradient('Unknown Source');
      expect(gradient).toBeDefined();
      expect(gradient).toContain('linear-gradient');
    });

    it('should handle empty string', () => {
      const gradient = getSourceGradient('');
      expect(gradient).toBeDefined();
      expect(gradient).toContain('linear-gradient');
    });

    it('should be case-sensitive', () => {
      const lowerCase = getSourceGradient('coindesk');
      const properCase = getSourceGradient('CoinDesk');
      // These should be different (lower case should return default)
      expect(lowerCase).not.toBe(properCase);
    });
  });

  describe('getSourceColors', () => {
    it('should return correct colors for known source', () => {
      const colors = getSourceColors('CoinDesk');
      expect(colors).toBe(sourceColors['CoinDesk']);
      expect(colors.bg).toBeDefined();
      expect(colors.text).toBeDefined();
    });

    it('should return default colors for unknown source', () => {
      const colors = getSourceColors('Unknown Source');
      expect(colors).toBeDefined();
      expect(colors).toHaveProperty('bg');
      expect(colors).toHaveProperty('text');
      expect(colors).toHaveProperty('solid');
    });

    it('should handle special characters in source name', () => {
      const colors = getSourceColors('Some/Weird:Source@Name');
      expect(colors).toBeDefined();
    });
  });

  describe('estimateReadTime', () => {
    it('should return default time for undefined text', () => {
      const result = estimateReadTime(undefined);
      expect(result).toBe('2 min read');
    });

    it('should return default time for empty string', () => {
      const result = estimateReadTime('');
      expect(result).toBe('2 min read');
    });

    it('should calculate 1 min for short text', () => {
      const shortText = 'This is a short article about Bitcoin.';
      const result = estimateReadTime(shortText);
      expect(result).toBe('1 min read');
    });

    it('should calculate correctly for medium text (~400 words)', () => {
      const words = Array(400).fill('word').join(' ');
      const result = estimateReadTime(words);
      expect(result).toBe('2 min read');
    });

    it('should calculate correctly for long text (~1000 words)', () => {
      const words = Array(1000).fill('word').join(' ');
      const result = estimateReadTime(words);
      expect(result).toBe('5 min read');
    });

    it('should never return less than 1 min', () => {
      const veryShort = 'Hi';
      const result = estimateReadTime(veryShort);
      expect(result).toBe('1 min read');
    });

    it('should handle text with various whitespace', () => {
      const textWithWhitespace = 'word1  word2\tword3\nword4   word5';
      const result = estimateReadTime(textWithWhitespace);
      expect(result).toBe('1 min read');
    });
  });
});

describe('Type validation', () => {
  it('should have consistent structure across all source colors', () => {
    const keys = Object.keys(sourceColors);
    const firstSourceKeys = Object.keys(sourceColors[keys[0]]);

    keys.forEach((source) => {
      const currentKeys = Object.keys(sourceColors[source]);
      expect(currentKeys).toEqual(firstSourceKeys);
    });
  });

  it('should have consistent structure across all sentiment colors', () => {
    const keys = Object.keys(sentimentColors) as Array<keyof typeof sentimentColors>;
    const firstKeys = Object.keys(sentimentColors[keys[0]]);

    keys.forEach((sentiment) => {
      const currentKeys = Object.keys(sentimentColors[sentiment]);
      expect(currentKeys).toEqual(firstKeys);
    });
  });
});


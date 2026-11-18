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
 * AI Content Detection Service
 * 
 * Enterprise-grade detection of AI-generated content using statistical
 * and linguistic analysis. Works entirely offline - no external APIs required.
 * 
 * Detection Methods:
 * - Perplexity estimation via n-gram frequency analysis
 * - Burstiness measurement (sentence length variance)
 * - Vocabulary diversity (Type-Token Ratio)
 * - Stylometric fingerprinting
 * - Common AI phrase detection
 * - Structural pattern analysis
 * 
 * @module lib/ai-content-detection
 */

// =============================================================================
// Types
// =============================================================================

export interface DetectionResult {
  isLikelyAI: boolean;
  confidence: number; // 0-100
  humanScore: number; // 0-100 (inverse of AI score)
  verdict: 'human' | 'likely_human' | 'uncertain' | 'likely_ai' | 'ai';
  analysis: {
    perplexity: PerplexityAnalysis;
    burstiness: BurstinessAnalysis;
    vocabulary: VocabularyAnalysis;
    stylometry: StylometryAnalysis;
    patterns: PatternAnalysis;
    phrases: PhraseAnalysis;
  };
  signals: DetectionSignal[];
  explanation: string;
  recommendations: string[];
}

export interface PerplexityAnalysis {
  score: number; // Lower = more predictable = more likely AI
  ngramFrequency: number;
  unusualWordRatio: number;
  description: string;
}

export interface BurstinessAnalysis {
  score: number; // Higher = more natural variation = more likely human
  sentenceLengthVariance: number;
  paragraphLengthVariance: number;
  rhythmScore: number;
  description: string;
}

export interface VocabularyAnalysis {
  typeTokenRatio: number;
  hapaxLegomena: number; // Words appearing only once
  richness: number;
  sophistication: number;
  description: string;
}

export interface StylometryAnalysis {
  avgSentenceLength: number;
  avgWordLength: number;
  punctuationDensity: number;
  functionWordRatio: number;
  passiveVoiceRatio: number;
  description: string;
}

export interface PatternAnalysis {
  repetitiveStructures: number;
  formulaicOpenings: number;
  listPatterns: number;
  transitionOveruse: number;
  description: string;
}

export interface PhraseAnalysis {
  aiPhrasesFound: string[];
  aiPhraseCount: number;
  hedgingLanguage: number;
  overlyFormalTone: number;
  description: string;
}

export interface DetectionSignal {
  type: string;
  indicator: string;
  weight: number; // -1 to 1 (negative = human, positive = AI)
  confidence: number;
}

// =============================================================================
// Configuration
// =============================================================================

// Common AI-generated phrases and patterns
const AI_PHRASES = {
  high_confidence: [
    'in today\'s digital age',
    'in today\'s fast-paced world',
    'it\'s important to note that',
    'it\'s worth noting that',
    'it\'s crucial to understand',
    'let\'s dive in',
    'let\'s explore',
    'let\'s delve into',
    'without further ado',
    'in this article, we will',
    'in this comprehensive guide',
    'buckle up',
    'game-changer',
    'at the end of the day',
    'in conclusion',
    'to sum up',
    'in summary',
    'as we navigate',
    'in an era of',
    'in the realm of',
    'it goes without saying',
    'needless to say',
    'the fact of the matter is',
    'it\'s no secret that',
    'there\'s no denying that',
  ],
  medium_confidence: [
    'furthermore',
    'moreover',
    'additionally',
    'consequently',
    'nevertheless',
    'nonetheless',
    'in other words',
    'that being said',
    'having said that',
    'on the other hand',
    'by the same token',
    'in light of',
    'with that in mind',
    'it\'s essential to',
    'it\'s imperative to',
    'plays a crucial role',
    'plays a vital role',
    'is of paramount importance',
    'serves as a testament to',
    'stands as a beacon of',
  ],
  low_confidence: [
    'however',
    'therefore',
    'thus',
    'hence',
    'indeed',
    'certainly',
    'undoubtedly',
    'unquestionably',
    'arguably',
    'presumably',
    'apparently',
    'interestingly',
    'surprisingly',
    'remarkably',
    'significantly',
  ],
};

// Formulaic sentence openings
const FORMULAIC_OPENINGS = [
  /^(this|these|that|those) (is|are|was|were|has|have|had)/i,
  /^(it|there) (is|are|was|were) (important|crucial|essential|vital|clear|evident)/i,
  /^(as|when|while|although|because|since|if) (we|you|one|they)/i,
  /^(the|a|an) (key|main|primary|major|significant|important) (point|factor|aspect|element)/i,
  /^(one of the|some of the|many of the|most of the) (most|key|main)/i,
  /^(in order to|so as to|with the aim of|for the purpose of)/i,
  /^(first|second|third|finally|lastly|additionally|furthermore|moreover)/i,
];

// Function words for stylometry
const FUNCTION_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else', 'when',
  'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from',
  'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
  'further', 'once', 'here', 'there', 'all', 'each', 'every', 'both',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will',
  'just', 'should', 'now', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'what', 'which', 'who', 'this', 'that', 'these', 'those', 'am', 'is',
  'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'would', 'could', 'might', 'must', 'shall',
]);

// Common n-gram patterns in AI text
const COMMON_NGRAMS = new Set([
  'it is important',
  'it is essential',
  'it is crucial',
  'we can see',
  'we can observe',
  'this means that',
  'this suggests that',
  'this indicates that',
  'in order to',
  'as well as',
  'such as',
  'for example',
  'for instance',
  'in fact',
  'as a result',
  'on the other hand',
  'in addition to',
  'due to the',
  'based on the',
  'according to the',
]);

// =============================================================================
// Text Preprocessing
// =============================================================================

function preprocessText(text: string): {
  original: string;
  cleaned: string;
  sentences: string[];
  paragraphs: string[];
  words: string[];
  tokens: string[];
} {
  const cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .trim();

  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.length > 0);

  const paragraphs = text
    .split(/\n\s*\n/)
    .filter(p => p.trim().length > 0);

  const words = cleaned
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0);

  const tokens = cleaned
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 0);

  return { original: text, cleaned, sentences, paragraphs, words, tokens };
}

// =============================================================================
// Analysis Functions
// =============================================================================

function analyzePerplexity(words: string[]): PerplexityAnalysis {
  if (words.length < 10) {
    return {
      score: 50,
      ngramFrequency: 0,
      unusualWordRatio: 0,
      description: 'Text too short for perplexity analysis',
    };
  }

  // Build trigram frequency
  let commonNgramCount = 0;
  for (let i = 0; i < words.length - 2; i++) {
    const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    if (COMMON_NGRAMS.has(trigram)) {
      commonNgramCount++;
    }
  }

  const ngramFrequency = commonNgramCount / (words.length - 2);

  // Check for unusual/unique words (words not in common vocabulary)
  // This is a simplified approach - real perplexity would need a language model
  const commonWords = new Set([
    ...FUNCTION_WORDS,
    'make', 'time', 'good', 'people', 'year', 'way', 'day', 'thing',
    'man', 'world', 'life', 'hand', 'part', 'place', 'case', 'week',
    'company', 'system', 'program', 'question', 'work', 'government',
    'number', 'night', 'point', 'home', 'water', 'room', 'mother',
    'area', 'money', 'story', 'fact', 'month', 'lot', 'right', 'study',
    'book', 'eye', 'job', 'word', 'business', 'issue', 'side', 'kind',
    'head', 'house', 'service', 'friend', 'father', 'power', 'hour',
  ]);

  const unusualWords = words.filter(w => !commonWords.has(w) && w.length > 4);
  const unusualWordRatio = unusualWords.length / words.length;

  // Lower score = more predictable = more likely AI
  // High ngram frequency + low unusual word ratio = likely AI
  const score = Math.max(0, Math.min(100,
    50 - (ngramFrequency * 200) + (unusualWordRatio * 100)
  ));

  let description: string;
  if (score < 30) {
    description = 'Highly predictable text patterns - strong AI indicator';
  } else if (score < 45) {
    description = 'Somewhat predictable patterns - possible AI generation';
  } else if (score < 55) {
    description = 'Average predictability - inconclusive';
  } else {
    description = 'Natural variation in word choice - human-like';
  }

  return { score, ngramFrequency, unusualWordRatio, description };
}

function analyzeBurstiness(sentences: string[], paragraphs: string[]): BurstinessAnalysis {
  if (sentences.length < 3) {
    return {
      score: 50,
      sentenceLengthVariance: 0,
      paragraphLengthVariance: 0,
      rhythmScore: 50,
      description: 'Text too short for burstiness analysis',
    };
  }

  // Calculate sentence length variance
  const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
  const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
  const sentenceVariance = sentenceLengths.reduce(
    (sum, len) => sum + Math.pow(len - avgSentenceLength, 2), 0
  ) / sentenceLengths.length;
  const sentenceStdDev = Math.sqrt(sentenceVariance);
  const normalizedSentenceVariance = sentenceStdDev / avgSentenceLength;

  // Calculate paragraph length variance
  const paragraphLengths = paragraphs.map(p => p.split(/\s+/).length);
  const avgParagraphLength = paragraphLengths.reduce((a, b) => a + b, 0) / paragraphLengths.length;
  const paragraphVariance = paragraphLengths.length > 1
    ? paragraphLengths.reduce((sum, len) => sum + Math.pow(len - avgParagraphLength, 2), 0) / paragraphLengths.length
    : 0;
  const normalizedParagraphVariance = avgParagraphLength > 0 
    ? Math.sqrt(paragraphVariance) / avgParagraphLength 
    : 0;

  // Rhythm score: check for varied sentence patterns
  const lengthChanges = [];
  for (let i = 1; i < sentenceLengths.length; i++) {
    lengthChanges.push(Math.abs(sentenceLengths[i] - sentenceLengths[i - 1]));
  }
  const avgChange = lengthChanges.reduce((a, b) => a + b, 0) / lengthChanges.length;
  const rhythmScore = Math.min(100, avgChange * 5);

  // Higher variance = more human-like
  const score = Math.max(0, Math.min(100,
    (normalizedSentenceVariance * 100) + (normalizedParagraphVariance * 50) + (rhythmScore * 0.3)
  ));

  let description: string;
  if (score < 25) {
    description = 'Very uniform sentence structure - strong AI indicator';
  } else if (score < 40) {
    description = 'Low variation in sentence patterns - possible AI generation';
  } else if (score < 60) {
    description = 'Moderate variation - inconclusive';
  } else {
    description = 'Natural variation in sentence rhythm - human-like';
  }

  return {
    score,
    sentenceLengthVariance: normalizedSentenceVariance,
    paragraphLengthVariance: normalizedParagraphVariance,
    rhythmScore,
    description,
  };
}

function analyzeVocabulary(words: string[]): VocabularyAnalysis {
  if (words.length < 20) {
    return {
      typeTokenRatio: 0,
      hapaxLegomena: 0,
      richness: 50,
      sophistication: 50,
      description: 'Text too short for vocabulary analysis',
    };
  }

  // Type-Token Ratio (unique words / total words)
  const wordFrequency = new Map<string, number>();
  for (const word of words) {
    wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
  }
  
  const uniqueWords = wordFrequency.size;
  const typeTokenRatio = uniqueWords / words.length;

  // Hapax legomena (words appearing only once)
  const hapaxWords = Array.from(wordFrequency.entries()).filter(([_, count]) => count === 1);
  const hapaxLegomena = hapaxWords.length / uniqueWords;

  // Vocabulary sophistication (avg word length as proxy)
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  const sophistication = Math.min(100, (avgWordLength - 3) * 20);

  // Overall richness score
  const richness = (typeTokenRatio * 50) + (hapaxLegomena * 30) + (sophistication * 0.2);

  let description: string;
  if (richness < 30) {
    description = 'Limited vocabulary variety - possible AI generation';
  } else if (richness < 45) {
    description = 'Moderate vocabulary - inconclusive';
  } else {
    description = 'Rich vocabulary with unique word choices - human-like';
  }

  return { typeTokenRatio, hapaxLegomena, richness, sophistication, description };
}

function analyzeStylometry(text: string, sentences: string[], words: string[]): StylometryAnalysis {
  // Average sentence length
  const avgSentenceLength = sentences.length > 0
    ? words.length / sentences.length
    : 0;

  // Average word length
  const avgWordLength = words.length > 0
    ? words.reduce((sum, w) => sum + w.length, 0) / words.length
    : 0;

  // Punctuation density
  const punctuationCount = (text.match(/[.,!?;:'"()-]/g) || []).length;
  const punctuationDensity = punctuationCount / words.length;

  // Function word ratio
  const functionWordCount = words.filter(w => FUNCTION_WORDS.has(w)).length;
  const functionWordRatio = functionWordCount / words.length;

  // Passive voice detection (simplified)
  const passivePatterns = /\b(was|were|been|being|is|are|am)\s+\w+ed\b/gi;
  const passiveMatches = text.match(passivePatterns) || [];
  const passiveVoiceRatio = passiveMatches.length / sentences.length;

  let description: string;
  // AI tends to have: longer sentences, higher function word ratio, more passive voice
  if (avgSentenceLength > 25 && functionWordRatio > 0.5 && passiveVoiceRatio > 0.3) {
    description = 'Formal, structured style typical of AI generation';
  } else if (avgSentenceLength < 15 && punctuationDensity > 0.15) {
    description = 'Informal, varied style typical of human writing';
  } else {
    description = 'Mixed stylistic signals - inconclusive';
  }

  return {
    avgSentenceLength,
    avgWordLength,
    punctuationDensity,
    functionWordRatio,
    passiveVoiceRatio,
    description,
  };
}

function analyzePatterns(sentences: string[]): PatternAnalysis {
  let repetitiveStructures = 0;
  let formulaicOpenings = 0;
  let listPatterns = 0;
  let transitionOveruse = 0;

  // Check for formulaic openings
  for (const sentence of sentences) {
    for (const pattern of FORMULAIC_OPENINGS) {
      if (pattern.test(sentence.trim())) {
        formulaicOpenings++;
        break;
      }
    }
  }

  // Check for repetitive structures (similar sentence starts)
  const sentenceStarts = sentences.map(s => {
    const words = s.trim().split(/\s+/);
    return words.slice(0, 3).join(' ').toLowerCase();
  });
  
  const startFrequency = new Map<string, number>();
  for (const start of sentenceStarts) {
    startFrequency.set(start, (startFrequency.get(start) || 0) + 1);
  }
  
  for (const [_, count] of startFrequency) {
    if (count > 2) repetitiveStructures += count - 2;
  }

  // Check for list patterns (sentences starting with numbers or bullets)
  const listPattern = /^(\d+[.)]|\*|•|-)\s/;
  listPatterns = sentences.filter(s => listPattern.test(s.trim())).length;

  // Check for transition word overuse
  const transitionWords = ['however', 'therefore', 'furthermore', 'moreover', 'additionally', 'consequently'];
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    for (const word of transitionWords) {
      if (lower.startsWith(word)) {
        transitionOveruse++;
        break;
      }
    }
  }

  const normalizedFormulaic = sentences.length > 0 ? formulaicOpenings / sentences.length : 0;
  const normalizedTransitions = sentences.length > 0 ? transitionOveruse / sentences.length : 0;

  let description: string;
  if (normalizedFormulaic > 0.3 || normalizedTransitions > 0.2) {
    description = 'Heavy use of formulaic patterns - AI indicator';
  } else if (repetitiveStructures > 3) {
    description = 'Repetitive sentence structures detected';
  } else {
    description = 'Natural structural variation';
  }

  return {
    repetitiveStructures,
    formulaicOpenings,
    listPatterns,
    transitionOveruse,
    description,
  };
}

function analyzePhrases(text: string): PhraseAnalysis {
  const lowerText = text.toLowerCase();
  const aiPhrasesFound: string[] = [];

  // Check for AI phrases
  for (const phrase of AI_PHRASES.high_confidence) {
    if (lowerText.includes(phrase.toLowerCase())) {
      aiPhrasesFound.push(phrase);
    }
  }

  for (const phrase of AI_PHRASES.medium_confidence) {
    if (lowerText.includes(phrase.toLowerCase())) {
      aiPhrasesFound.push(phrase);
    }
  }

  // Hedging language detection
  const hedgingWords = ['might', 'could', 'possibly', 'perhaps', 'may', 'seemingly', 'apparently'];
  const hedgingCount = hedgingWords.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    return count + (lowerText.match(regex) || []).length;
  }, 0);

  // Overly formal tone indicators
  const formalIndicators = ['aforementioned', 'henceforth', 'whereby', 'thereof', 'herein', 'thereupon'];
  const formalCount = formalIndicators.reduce((count, word) => {
    return count + (lowerText.includes(word) ? 1 : 0);
  }, 0);

  const words = text.split(/\s+/).length;
  const hedgingLanguage = (hedgingCount / words) * 100;
  const overlyFormalTone = formalCount;

  let description: string;
  if (aiPhrasesFound.length >= 3) {
    description = 'Multiple AI-typical phrases detected - strong indicator';
  } else if (aiPhrasesFound.length >= 1) {
    description = 'Some AI-typical phrases present';
  } else {
    description = 'No obvious AI phrase patterns';
  }

  return {
    aiPhrasesFound,
    aiPhraseCount: aiPhrasesFound.length,
    hedgingLanguage,
    overlyFormalTone,
    description,
  };
}

// =============================================================================
// Main Detection Function
// =============================================================================

export function detectAIContent(text: string): DetectionResult {
  if (!text || text.trim().length < 50) {
    return {
      isLikelyAI: false,
      confidence: 0,
      humanScore: 100,
      verdict: 'human',
      analysis: {
        perplexity: { score: 50, ngramFrequency: 0, unusualWordRatio: 0, description: 'Text too short' },
        burstiness: { score: 50, sentenceLengthVariance: 0, paragraphLengthVariance: 0, rhythmScore: 50, description: 'Text too short' },
        vocabulary: { typeTokenRatio: 0, hapaxLegomena: 0, richness: 50, sophistication: 50, description: 'Text too short' },
        stylometry: { avgSentenceLength: 0, avgWordLength: 0, punctuationDensity: 0, functionWordRatio: 0, passiveVoiceRatio: 0, description: 'Text too short' },
        patterns: { repetitiveStructures: 0, formulaicOpenings: 0, listPatterns: 0, transitionOveruse: 0, description: 'Text too short' },
        phrases: { aiPhrasesFound: [], aiPhraseCount: 0, hedgingLanguage: 0, overlyFormalTone: 0, description: 'Text too short' },
      },
      signals: [],
      explanation: 'Text is too short for reliable analysis. Minimum 50 characters required.',
      recommendations: ['Provide more text for accurate detection'],
    };
  }

  const { sentences, paragraphs, words } = preprocessText(text);

  // Run all analyses
  const perplexity = analyzePerplexity(words);
  const burstiness = analyzeBurstiness(sentences, paragraphs);
  const vocabulary = analyzeVocabulary(words);
  const stylometry = analyzeStylometry(text, sentences, words);
  const patterns = analyzePatterns(sentences);
  const phrases = analyzePhrases(text);

  // Collect signals
  const signals: DetectionSignal[] = [];

  // Perplexity signals
  if (perplexity.score < 30) {
    signals.push({ type: 'perplexity', indicator: 'Very predictable text', weight: 0.8, confidence: 0.9 });
  } else if (perplexity.score < 45) {
    signals.push({ type: 'perplexity', indicator: 'Somewhat predictable', weight: 0.4, confidence: 0.7 });
  } else if (perplexity.score > 60) {
    signals.push({ type: 'perplexity', indicator: 'Natural word variation', weight: -0.5, confidence: 0.8 });
  }

  // Burstiness signals
  if (burstiness.score < 25) {
    signals.push({ type: 'burstiness', indicator: 'Uniform sentence length', weight: 0.7, confidence: 0.85 });
  } else if (burstiness.score > 55) {
    signals.push({ type: 'burstiness', indicator: 'Varied sentence rhythm', weight: -0.4, confidence: 0.75 });
  }

  // Vocabulary signals
  if (vocabulary.richness < 30) {
    signals.push({ type: 'vocabulary', indicator: 'Limited vocabulary', weight: 0.5, confidence: 0.7 });
  } else if (vocabulary.richness > 50) {
    signals.push({ type: 'vocabulary', indicator: 'Rich vocabulary', weight: -0.3, confidence: 0.7 });
  }

  // Pattern signals
  if (patterns.formulaicOpenings > sentences.length * 0.3) {
    signals.push({ type: 'patterns', indicator: 'Formulaic openings', weight: 0.6, confidence: 0.8 });
  }
  if (patterns.transitionOveruse > sentences.length * 0.2) {
    signals.push({ type: 'patterns', indicator: 'Transition word overuse', weight: 0.4, confidence: 0.7 });
  }

  // Phrase signals
  if (phrases.aiPhraseCount >= 3) {
    signals.push({ type: 'phrases', indicator: `${phrases.aiPhraseCount} AI phrases found`, weight: 0.8, confidence: 0.9 });
  } else if (phrases.aiPhraseCount >= 1) {
    signals.push({ type: 'phrases', indicator: 'AI phrases detected', weight: 0.4, confidence: 0.7 });
  }

  // Stylometry signals
  if (stylometry.passiveVoiceRatio > 0.3) {
    signals.push({ type: 'stylometry', indicator: 'High passive voice usage', weight: 0.3, confidence: 0.6 });
  }
  if (stylometry.avgSentenceLength > 25) {
    signals.push({ type: 'stylometry', indicator: 'Long average sentences', weight: 0.3, confidence: 0.5 });
  }

  // Calculate weighted score
  let totalWeight = 0;
  let weightedSum = 0;

  for (const signal of signals) {
    const adjustedWeight = signal.weight * signal.confidence;
    totalWeight += Math.abs(adjustedWeight);
    weightedSum += adjustedWeight;
  }

  // Normalize to 0-100 scale
  const rawScore = totalWeight > 0 ? (weightedSum / totalWeight + 1) / 2 * 100 : 50;
  
  // Combine with analysis scores
  const perplexityContribution = (100 - perplexity.score) * 0.25;
  const burstinessContribution = (100 - burstiness.score) * 0.2;
  const phraseContribution = Math.min(30, phrases.aiPhraseCount * 10);
  
  const confidence = Math.min(100, Math.max(0,
    rawScore * 0.4 + perplexityContribution + burstinessContribution + phraseContribution
  ));

  const humanScore = 100 - confidence;

  // Determine verdict
  let verdict: DetectionResult['verdict'];
  if (confidence >= 80) {
    verdict = 'ai';
  } else if (confidence >= 60) {
    verdict = 'likely_ai';
  } else if (confidence >= 40) {
    verdict = 'uncertain';
  } else if (confidence >= 20) {
    verdict = 'likely_human';
  } else {
    verdict = 'human';
  }

  // Generate explanation
  const topSignals = signals
    .filter(s => s.weight > 0)
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    .slice(0, 3);

  let explanation: string;
  if (confidence >= 60) {
    explanation = `This text shows ${topSignals.length > 0 ? topSignals.map(s => s.indicator.toLowerCase()).join(', ') : 'patterns typical of AI generation'}. ` +
      `The analysis detected ${phrases.aiPhraseCount} AI-typical phrases and ${perplexity.score < 50 ? 'predictable' : 'varied'} word patterns.`;
  } else if (confidence >= 40) {
    explanation = 'The analysis shows mixed signals. Some patterns suggest AI generation while others appear human-like. ' +
      'Additional context or longer text samples would improve accuracy.';
  } else {
    explanation = 'This text exhibits natural writing patterns including varied sentence structures, ' +
      'diverse vocabulary, and absence of common AI-generated phrases.';
  }

  // Generate recommendations
  const recommendations: string[] = [];
  if (confidence >= 60) {
    recommendations.push('Verify the source and author of this content');
    recommendations.push('Cross-reference key claims with trusted sources');
    if (phrases.aiPhraseCount > 0) {
      recommendations.push('Note the AI-typical phrases: ' + phrases.aiPhrasesFound.slice(0, 3).join(', '));
    }
  } else if (confidence >= 40) {
    recommendations.push('Consider additional verification for important claims');
    recommendations.push('Look for author attribution and original sources');
  } else {
    recommendations.push('Content appears authentic but verify important claims');
  }

  return {
    isLikelyAI: confidence >= 50,
    confidence: Math.round(confidence),
    humanScore: Math.round(humanScore),
    verdict,
    analysis: {
      perplexity,
      burstiness,
      vocabulary,
      stylometry,
      patterns,
      phrases,
    },
    signals,
    explanation,
    recommendations,
  };
}

// =============================================================================
// Batch Processing
// =============================================================================

export function detectAIContentBatch(texts: string[]): DetectionResult[] {
  return texts.map(text => detectAIContent(text));
}

// =============================================================================
// Quick Check Function
// =============================================================================

export function quickAICheck(text: string): {
  isLikelyAI: boolean;
  confidence: number;
  verdict: string;
} {
  const result = detectAIContent(text);
  return {
    isLikelyAI: result.isLikelyAI,
    confidence: result.confidence,
    verdict: result.verdict,
  };
}

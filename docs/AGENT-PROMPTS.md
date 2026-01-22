

## Agent 5: Intelligence Layer (Analytics & Tracking)

### Mission
Build analytics features: headline evolution tracking, source credibility scoring, and anomaly detection.

### Files to CREATE
- `src/lib/headline-tracker.ts` - Track headline changes
- `src/lib/source-credibility.ts` - Score source reliability
- `src/lib/anomaly-detector.ts` - Detect unusual patterns
- `src/app/api/analytics/headlines/route.ts` - Headline tracking
- `src/app/api/analytics/credibility/route.ts` - Source scores
- `src/app/api/analytics/anomalies/route.ts` - Anomaly alerts
- `src/lib/analytics.test.ts` - Unit tests

### Headline Evolution Tracker

Track how article headlines change over time.

```typescript
interface HeadlineEvolution {
  articleId: string;
  originalTitle: string;
  currentTitle: string;
  changes: {
    title: string;
    detectedAt: string;
    changeType: 'minor' | 'moderate' | 'major';
    sentiment_shift?: 'more_positive' | 'more_negative' | 'neutral';
  }[];
  totalChanges: number;
  firstSeen: string;
  lastChecked: string;
}

interface HeadlineTrackingResult {
  tracked: HeadlineEvolution[];
  recentChanges: {
    articleId: string;
    from: string;
    to: string;
    changedAt: string;
  }[];
}
```

**GET /api/analytics/headlines**
```typescript
?hours=24                 // How far back to look
&changesOnly=true         // Only show changed headlines
```

### Source Credibility Scoring

Score sources based on accuracy, consistency, and bias.

```typescript
interface SourceCredibility {
  source: string;
  sourceKey: string;
  overallScore: number;       // 0-100
  metrics: {
    accuracy: number;         // Factual accuracy
    timeliness: number;       // How fast they report
    consistency: number;      // Consistency of reporting
    bias: {
      score: number;          // -1 to 1 (bearish to bullish)
      confidence: number;
    };
    clickbait: number;        // 0-1, higher = more clickbait
  };
  articleCount: number;
  lastUpdated: string;
  trend: 'improving' | 'declining' | 'stable';
}
```

**GET /api/analytics/credibility**
```typescript
?source=decrypt           // Specific source (optional)
&sortBy=score|accuracy|timeliness
```

### Anomaly Detection

Detect unusual patterns in news flow.

```typescript
interface AnomalyEvent {
  id: string;
  type: 'volume_spike' | 'coordinated_publishing' | 'sentiment_shift' | 
        'ticker_surge' | 'source_outage' | 'unusual_timing';
  severity: 'high' | 'medium' | 'low';
  detectedAt: string;
  description: string;
  data: {
    expected: number;
    actual: number;
    deviation: number;        // Standard deviations
    affectedEntities: string[];
  };
  possibleCauses: string[];
}

interface AnomalyReport {
  anomalies: AnomalyEvent[];
  systemHealth: {
    normalArticleRate: number;
    currentRate: number;
    activeSources: number;
    totalSources: number;
  };
  generatedAt: string;
}
```

**GET /api/analytics/anomalies**
```typescript
?hours=24                 // Time window
&severity=high|medium|low // Filter by severity
```

### Anomaly Detection Rules

```typescript
const ANOMALY_RULES = {
  // Article volume spike (>3 std dev from mean)
  volumeSpike: {
    windowHours: 1,
    threshold: 3,  // standard deviations
  },
  
  // Multiple sources publish similar headline within 5 min
  coordinatedPublishing: {
    windowMinutes: 5,
    minSources: 3,
    similarityThreshold: 0.8,
  },
  
  // Sentiment shifts dramatically
  sentimentShift: {
    windowHours: 6,
    threshold: 0.4,  // shift in average sentiment
  },
  
  // Ticker mentions spike
  tickerSurge: {
    windowHours: 2,
    threshold: 5,  // multiplier vs baseline
  },
  
  // Source goes silent
  sourceOutage: {
    expectedIntervalHours: 4,
    silenceThresholdHours: 12,
  },
};
```

### Implementation Notes
- Use archive data for historical analysis
- Store tracking data in `data/analytics/` directory
- Run anomaly detection every 15 minutes
- Cache credibility scores for 1 hour
- Use simple statistical methods (no ML required)

### Test Requirements
- Test headline change detection
- Test credibility score calculation
- Test each anomaly type detection
- Test with edge cases (no data, single source)

---

## Coordination Notes

### File Ownership (Avoid Conflicts)

| Agent | Owns These Files |
|-------|------------------|
| Agent 1 | `event-classifier.ts`, `claim-extractor.ts`, `/api/classify/`, `/api/claims/` |
| Agent 2 | `international-sources.ts`, `source-translator.ts`, `/api/news/international/` |
| Agent 3 | `alerts.ts`, `alert-rules.ts`, `/api/alerts/`, `ws-server.js` modifications |
| Agent 4 | `ai-brief.ts`, `ai-debate.ts`, `ai-counter.ts`, `/api/ai/brief|debate|counter/` |
| Agent 5 | `headline-tracker.ts`, `source-credibility.ts`, `anomaly-detector.ts`, `/api/analytics/` |

### Shared Dependencies (Read-Only)
All agents can READ but not MODIFY:
- `src/lib/cache.ts`
- `src/lib/rate-limit.ts`
- `src/lib/ai-enhanced.ts` (use `aiComplete`)
- `src/lib/crypto-news.ts` (use existing functions)
- `src/lib/market-data.ts` (use existing functions)
- `src/lib/translate.ts` (use `translateWithGroq`)

### Testing Strategy
Each agent runs their own test file:
```bash
# Agent 1
npm run test -- --run src/lib/event-classifier.test.ts

# Agent 2
npm run test -- --run src/lib/international-sources.test.ts

# Agent 3
npm run test -- --run src/lib/alerts.test.ts

# Agent 4
npm run test -- --run src/lib/ai-products.test.ts

# Agent 5
npm run test -- --run src/lib/analytics.test.ts
```

### Integration Test (After All Agents Complete)
```bash
npm run test
npm run type-check
npm run lint
```

---

## Deliverable Summary

| Agent | New Files | API Routes | Estimated Time |
|-------|-----------|------------|----------------|
| 1 | 4 | 2 | 2-3 hours |
| 2 | 4 | 1 | 2-3 hours |
| 3 | 5 | 3 | 3-4 hours |
| 4 | 6 | 3 | 3-4 hours |
| 5 | 6 | 3 | 3-4 hours |

**Total: 25 new files, 12 API routes**
**Parallel time: ~4 hours**
**Sequential time: ~15 hours**

---

## Quick Start for Each Agent

Copy the relevant section above and use this prompt structure:

```
You are implementing [AGENT NAME] for the free-crypto-news project.

## Your Mission
[Copy mission section]

## Files to Create
[Copy file list]

## Technical Requirements
[Copy specs]

## Implementation Notes
- Use existing infrastructure in src/lib/
- Follow TypeScript strict mode
- Add JSDoc comments
- Include comprehensive tests
- Use Edge Runtime for API routes

## Constraints
- Do NOT modify files owned by other agents
- Do NOT modify shared dependencies (read-only)
- Create all specified files
- Run tests before completing

Begin implementation.
```

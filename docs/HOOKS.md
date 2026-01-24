# 🪝 React Hooks Documentation

Custom React hooks for the Free Crypto News application.

---

## Table of Contents

- [useAlphaSignals](#usealphasignals)
- [useApiKey](#useapikey)
- [Usage Examples](#usage-examples)
- [TypeScript Types](#typescript-types)

---

## useAlphaSignals

Advanced hook for alpha signal intelligence, narrative tracking, and prediction leaderboards.

**File:** `src/hooks/useAlphaSignals.ts`

### Import

```tsx
import { useAlphaSignals } from '@/hooks/useAlphaSignals';
```

### Basic Usage

```tsx
function AlphaDashboard() {
  const {
    signals,
    narratives,
    leaderboard,
    loading,
    error,
    refresh,
  } = useAlphaSignals();

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <SignalsList signals={signals} />
      <NarrativeTracker narratives={narratives} />
      <Leaderboard data={leaderboard} />
    </div>
  );
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `options.assets` | string[] | ['BTC', 'ETH'] | Assets to track |
| `options.timeframe` | string | '24h' | Time window: 1h, 4h, 24h, 7d |
| `options.minConfidence` | number | 0.7 | Minimum signal confidence |
| `options.autoRefresh` | boolean | true | Auto-refresh data |
| `options.refreshInterval` | number | 60000 | Refresh interval (ms) |

### Return Value

```typescript
interface UseAlphaSignalsReturn {
  // Signal data
  signals: AlphaSignal[];
  narratives: Narrative[];
  leaderboard: LeaderboardEntry[];
  
  // Loading states
  loading: boolean;
  signalsLoading: boolean;
  narrativesLoading: boolean;
  
  // Error handling
  error: Error | null;
  
  // Actions
  refresh: () => Promise<void>;
  subscribe: (asset: string) => void;
  unsubscribe: (asset: string) => void;
  
  // Metadata
  lastUpdated: Date | null;
  dataQuality: number;
}
```

### Advanced Usage

```tsx
function TradingSignals() {
  const {
    signals,
    narratives,
    leaderboard,
    refresh,
    subscribe,
    lastUpdated,
  } = useAlphaSignals({
    assets: ['BTC', 'ETH', 'SOL'],
    timeframe: '4h',
    minConfidence: 0.8,
    autoRefresh: true,
    refreshInterval: 30000,
  });

  // Filter high-confidence signals
  const strongSignals = signals.filter(s => s.confidence > 0.85);

  // Get emerging narratives
  const emergingNarratives = narratives.filter(n => n.trend === 'rising');

  return (
    <div className="space-y-6">
      {/* Strong Signals */}
      <section>
        <h2>High-Confidence Signals</h2>
        {strongSignals.map(signal => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
      </section>

      {/* Emerging Narratives */}
      <section>
        <h2>Emerging Narratives</h2>
        {emergingNarratives.map(narrative => (
          <NarrativeCard key={narrative.id} narrative={narrative} />
        ))}
      </section>

      {/* Prediction Leaderboard */}
      <section>
        <h2>Top Predictors</h2>
        <LeaderboardTable entries={leaderboard} />
      </section>

      <footer className="text-sm text-gray-500">
        Last updated: {lastUpdated?.toLocaleTimeString()}
        <button onClick={refresh}>Refresh</button>
      </footer>
    </div>
  );
}
```

### Signal Types

```typescript
interface AlphaSignal {
  id: string;
  asset: string;
  type: 'buy' | 'sell' | 'hold';
  confidence: number;
  source: 'sentiment' | 'technical' | 'onchain' | 'social';
  reasoning: string;
  priceTarget?: number;
  stopLoss?: number;
  timeHorizon: '1h' | '4h' | '1d' | '1w';
  createdAt: Date;
  expiresAt: Date;
}

interface Narrative {
  id: string;
  title: string;
  description: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  strength: number;
  trend: 'rising' | 'stable' | 'fading';
  relatedAssets: string[];
  articleCount: number;
  keywords: string[];
}

interface LeaderboardEntry {
  rank: number;
  predictor: string;
  accuracy: number;
  totalPredictions: number;
  successfulPredictions: number;
  averageReturn: number;
  streak: number;
}
```

---

## useApiKey

Hook for managing API keys with persistent storage and context provider.

**File:** `src/hooks/useApiKey.tsx`

### Import

```tsx
import { useApiKey, ApiKeyProvider } from '@/hooks/useApiKey';
```

### Setup Provider

Wrap your application with the provider:

```tsx
// app/layout.tsx or _app.tsx
import { ApiKeyProvider } from '@/hooks/useApiKey';

export default function RootLayout({ children }) {
  return (
    <ApiKeyProvider>
      {children}
    </ApiKeyProvider>
  );
}
```

### Basic Usage

```tsx
function ApiSettings() {
  const {
    apiKey,
    isValid,
    tier,
    setApiKey,
    clearApiKey,
    validateKey,
  } = useApiKey();

  const handleSave = async (newKey: string) => {
    const valid = await validateKey(newKey);
    if (valid) {
      setApiKey(newKey);
    }
  };

  return (
    <div>
      {apiKey ? (
        <div>
          <p>API Key: {apiKey.slice(0, 8)}...</p>
          <p>Tier: {tier}</p>
          <p>Status: {isValid ? '✅ Valid' : '❌ Invalid'}</p>
          <button onClick={clearApiKey}>Remove Key</button>
        </div>
      ) : (
        <ApiKeyForm onSubmit={handleSave} />
      )}
    </div>
  );
}
```

### Parameters

The hook accepts no parameters but uses the context from `ApiKeyProvider`.

### Return Value

```typescript
interface UseApiKeyReturn {
  // Current state
  apiKey: string | null;
  isValid: boolean;
  tier: 'free' | 'pro' | 'enterprise' | null;
  usage: UsageStats | null;
  
  // Loading states
  loading: boolean;
  validating: boolean;
  
  // Actions
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  validateKey: (key: string) => Promise<boolean>;
  refreshUsage: () => Promise<void>;
  
  // Error handling
  error: Error | null;
}

interface UsageStats {
  requestsToday: number;
  requestsThisMonth: number;
  dailyLimit: number;
  monthlyLimit: number;
  resetAt: Date;
}
```

### Advanced Usage

```tsx
function PremiumFeature() {
  const { apiKey, tier, usage, refreshUsage } = useApiKey();

  // Check access
  const hasAccess = tier === 'pro' || tier === 'enterprise';
  
  // Check rate limits
  const nearLimit = usage && (usage.requestsToday / usage.dailyLimit) > 0.8;

  if (!hasAccess) {
    return <UpgradePrompt />;
  }

  return (
    <div>
      {nearLimit && (
        <Alert variant="warning">
          You've used {usage.requestsToday} of {usage.dailyLimit} daily requests
        </Alert>
      )}
      
      <PremiumContent />
      
      <button onClick={refreshUsage}>Refresh Usage</button>
    </div>
  );
}
```

### Protected Routes

```tsx
function ProtectedRoute({ children, requiredTier = 'pro' }) {
  const { tier, loading } = useApiKey();
  
  if (loading) return <LoadingSpinner />;
  
  if (!tier) {
    return <Navigate to="/login" />;
  }
  
  const tierOrder = ['free', 'pro', 'enterprise'];
  if (tierOrder.indexOf(tier) < tierOrder.indexOf(requiredTier)) {
    return <UpgradeRequired requiredTier={requiredTier} />;
  }
  
  return children;
}

// Usage
<ProtectedRoute requiredTier="enterprise">
  <EnterpriseDashboard />
</ProtectedRoute>
```

### Storage Behavior

- API keys are stored in `localStorage` under `fcn_api_key`
- Keys are validated on initial load
- Invalid keys are automatically cleared
- Usage stats are cached for 5 minutes

---

## Usage Examples

### Combined Hook Usage

```tsx
function TradingDashboard() {
  const { apiKey, tier } = useApiKey();
  const { signals, narratives, loading } = useAlphaSignals({
    assets: ['BTC', 'ETH'],
    minConfidence: tier === 'pro' ? 0.6 : 0.8, // Pro users see more signals
  });

  // Free tier limitations
  const displayLimit = tier === 'free' ? 5 : signals.length;
  const visibleSignals = signals.slice(0, displayLimit);

  return (
    <div>
      <SignalGrid signals={visibleSignals} />
      {tier === 'free' && signals.length > 5 && (
        <UpgradeCard message={`Unlock ${signals.length - 5} more signals`} />
      )}
    </div>
  );
}
```

### With SWR/React Query

```tsx
import { useQuery } from '@tanstack/react-query';
import { useApiKey } from '@/hooks/useApiKey';

function useEnhancedSignals() {
  const { apiKey, tier } = useApiKey();
  
  return useQuery({
    queryKey: ['signals', tier],
    queryFn: async () => {
      const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
      const res = await fetch('/api/signals', { headers });
      return res.json();
    },
    staleTime: tier === 'pro' ? 30000 : 60000, // Pro gets faster updates
  });
}
```

---

## TypeScript Types

Full type definitions are available:

```typescript
// src/types/hooks.ts

export interface AlphaSignalsOptions {
  assets?: string[];
  timeframe?: '1h' | '4h' | '24h' | '7d';
  minConfidence?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface AlphaSignal {
  id: string;
  asset: string;
  type: 'buy' | 'sell' | 'hold';
  confidence: number;
  source: 'sentiment' | 'technical' | 'onchain' | 'social';
  reasoning: string;
  priceTarget?: number;
  stopLoss?: number;
  timeHorizon: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface Narrative {
  id: string;
  title: string;
  description: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  strength: number;
  trend: 'rising' | 'stable' | 'fading';
  relatedAssets: string[];
  articleCount: number;
  keywords: string[];
}

export interface ApiKeyState {
  apiKey: string | null;
  isValid: boolean;
  tier: 'free' | 'pro' | 'enterprise' | null;
  usage: UsageStats | null;
  loading: boolean;
  error: Error | null;
}

export interface UsageStats {
  requestsToday: number;
  requestsThisMonth: number;
  dailyLimit: number;
  monthlyLimit: number;
  resetAt: Date;
}
```

---

## Best Practices

### Error Boundaries

```tsx
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <ApiKeyProvider>
        <Dashboard />
      </ApiKeyProvider>
    </ErrorBoundary>
  );
}
```

### Suspense Support

```tsx
function SignalsWithSuspense() {
  return (
    <Suspense fallback={<SignalsSkeleton />}>
      <SignalsList />
    </Suspense>
  );
}
```

### Testing

```tsx
// __tests__/useApiKey.test.tsx
import { renderHook, act } from '@testing-library/react';
import { ApiKeyProvider, useApiKey } from '@/hooks/useApiKey';

const wrapper = ({ children }) => (
  <ApiKeyProvider>{children}</ApiKeyProvider>
);

test('should set and validate API key', async () => {
  const { result } = renderHook(() => useApiKey(), { wrapper });
  
  await act(async () => {
    await result.current.setApiKey('test-key-123');
  });
  
  expect(result.current.apiKey).toBe('test-key-123');
});
```

---

## Related Documentation

- [Components](./COMPONENTS.md) - React components
- [API Reference](./API.md) - API endpoints
- [Premium Features](./PREMIUM.md) - Premium tier details
- [TypeScript](./sdks/typescript.md) - TypeScript SDK

'use client';

/**
 * API Key Management Hook
 * 
 * Provides client-side API key state management with localStorage persistence.
 * Used by billing, usage, and other authenticated components.
 * 
 * @module hooks/useApiKey
 */

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface ApiKeyInfo {
  id: string;
  key: string;  // Full key for API calls
  keyPrefix: string;  // First 8 chars for display
  tier: 'free' | 'pro' | 'enterprise';
  tierName: string;
  rateLimit: number;
  usageToday: number;
  usageMonth: number;
  email?: string;
  createdAt?: string;
  expiresAt?: string;
  stripeCustomerId?: string;
}

interface UseApiKeyReturn {
  apiKey: string | null;
  keyInfo: ApiKeyInfo | null;
  isLoading: boolean;
  error: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  refreshKeyInfo: () => Promise<void>;
  isAuthenticated: boolean;
}

interface ApiKeyProviderProps {
  children: ReactNode;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'cda_api_key';
const KEY_INFO_CACHE_KEY = 'cda_key_info';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// Context
// ============================================================================

const ApiKeyContext = createContext<UseApiKeyReturn | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

export function ApiKeyProvider({ children }: ApiKeyProviderProps) {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [keyInfo, setKeyInfo] = useState<ApiKeyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Load API key from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem(STORAGE_KEY);
      const cachedInfo = localStorage.getItem(KEY_INFO_CACHE_KEY);
      
      if (storedKey) {
        setApiKeyState(storedKey);
        
        // Try to use cached info if valid
        if (cachedInfo) {
          try {
            const cached = JSON.parse(cachedInfo);
            if (cached.timestamp && Date.now() - cached.timestamp < CACHE_DURATION) {
              setKeyInfo(cached.data);
              setLastFetch(cached.timestamp);
            }
          } catch {
            // Invalid cache, will refresh
          }
        }
      }
      setIsLoading(false);
    }
  }, []);

  // Fetch key info from API
  const refreshKeyInfo = useCallback(async () => {
    if (!apiKey) {
      setKeyInfo(null);
      setError(null);
      return;
    }

    // Skip if recently fetched
    if (Date.now() - lastFetch < CACHE_DURATION && keyInfo) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/upgrade', {
        headers: {
          'X-API-Key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to validate API key');
      }

      const data = await response.json();
      
      if (data.currentKey) {
        const info: ApiKeyInfo = {
          id: data.currentKey.id,
          key: apiKey,
          keyPrefix: apiKey.substring(0, 12) + '...',
          tier: data.currentKey.tier,
          tierName: data.currentKey.tier.charAt(0).toUpperCase() + data.currentKey.tier.slice(1),
          rateLimit: data.currentKey.rateLimit,
          usageToday: data.currentKey.usageToday || 0,
          usageMonth: data.currentKey.usageMonth || 0,
          expiresAt: data.currentKey.expiresAt,
          stripeCustomerId: data.stripeCustomerId,
        };
        
        setKeyInfo(info);
        setLastFetch(Date.now());
        
        // Cache the info
        localStorage.setItem(KEY_INFO_CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          data: info,
        }));
      } else {
        setError('Invalid API key');
        setKeyInfo(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch key info');
      setKeyInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, keyInfo, lastFetch]);

  // Refresh key info when API key changes
  useEffect(() => {
    if (apiKey) {
      refreshKeyInfo();
    }
  }, [apiKey, refreshKeyInfo]);

  // Set API key and persist to localStorage
  const setApiKey = useCallback((key: string) => {
    if (!key || !key.startsWith('cda_')) {
      setError('Invalid API key format (must start with cda_)');
      return;
    }
    
    localStorage.setItem(STORAGE_KEY, key);
    setApiKeyState(key);
    setError(null);
    setLastFetch(0); // Force refresh
  }, []);

  // Clear API key from state and localStorage
  const clearApiKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(KEY_INFO_CACHE_KEY);
    setApiKeyState(null);
    setKeyInfo(null);
    setError(null);
    setLastFetch(0);
  }, []);

  const value: UseApiKeyReturn = {
    apiKey,
    keyInfo,
    isLoading,
    error,
    setApiKey,
    clearApiKey,
    refreshKeyInfo,
    isAuthenticated: !!apiKey && !!keyInfo,
  };

  return (
    <ApiKeyContext.Provider value={value}>
      {children}
    </ApiKeyContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access API key state and management functions
 * Must be used within an ApiKeyProvider
 */
export function useApiKey(): UseApiKeyReturn {
  const context = useContext(ApiKeyContext);
  
  if (!context) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  
  return context;
}

/**
 * Standalone hook for components that don't need the full context
 * Uses localStorage directly without provider dependency
 */
export function useApiKeyStandalone(): {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
} {
  const [apiKey, setApiKeyState] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setApiKeyState(stored);
      }
    }
  }, []);

  const setApiKey = useCallback((key: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, key);
      setApiKeyState(key);
      // Dispatch event for other components to sync
      window.dispatchEvent(new CustomEvent('fcn:api-key-changed', { detail: key }));
    }
  }, []);

  const clearApiKey = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      setApiKeyState(null);
      window.dispatchEvent(new CustomEvent('fcn:api-key-changed', { detail: null }));
    }
  }, []);

  // Listen for changes from other components
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setApiKeyState(e.detail);
    };
    
    window.addEventListener('fcn:api-key-changed', handler as EventListener);
    return () => window.removeEventListener('fcn:api-key-changed', handler as EventListener);
  }, []);

  return { apiKey, setApiKey, clearApiKey };
}

export default useApiKey;

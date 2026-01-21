'use client';

import { useEffect, useState, createContext, useContext, useCallback, ReactNode } from 'react';

// Types
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAContextType {
  // Installation
  isInstallable: boolean;
  isInstalled: boolean;
  installPrompt: (() => Promise<boolean>) | null;
  
  // Service Worker
  isServiceWorkerReady: boolean;
  isUpdateAvailable: boolean;
  updateServiceWorker: () => void;
  
  // Network Status
  isOnline: boolean;
  
  // Push Notifications
  isPushSupported: boolean;
  isPushEnabled: boolean;
  requestPushPermission: () => Promise<boolean>;
  
  // Background Sync
  isBackgroundSyncSupported: boolean;
  requestBackgroundSync: (tag: string) => Promise<boolean>;
  
  // Cache Management
  clearCache: () => Promise<void>;
  getCacheStatus: () => Promise<{ caches: Record<string, number>; version: string } | null>;
}

const PWAContext = createContext<PWAContextType | null>(null);

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}

// Safe hook that returns null when not in provider
export function usePWASafe() {
  return useContext(PWAContext);
}

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  // Installation state
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  
  // Service Worker state
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  
  // Network state
  const [isOnline, setIsOnline] = useState(true);
  
  // Push notification state
  const [isPushEnabled, setIsPushEnabled] = useState(false);

  // Register Service Worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });
        
        setRegistration(reg);
        console.log('[PWA] Service Worker registered:', reg.scope);

        // Check if service worker is ready
        const ready = await navigator.serviceWorker.ready;
        setIsServiceWorkerReady(true);
        console.log('[PWA] Service Worker ready:', ready.scope);

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New service worker available');
                setIsUpdateAvailable(true);
                setWaitingWorker(newWorker);
              }
            });
          }
        });

        // Check if there's already a waiting worker
        if (reg.waiting) {
          setIsUpdateAvailable(true);
          setWaitingWorker(reg.waiting);
        }

        // Check push permission
        if ('PushManager' in window) {
          const subscription = await reg.pushManager.getSubscription();
          setIsPushEnabled(!!subscription);
        }

        // Periodic update check
        setInterval(() => {
          reg.update().catch(console.error);
        }, 60 * 60 * 1000); // Check every hour
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    };

    registerServiceWorker();

    // Handle controller change (when new SW takes over)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Controller changed, reloading...');
      window.location.reload();
    });
  }, []);

  // Handle install prompt
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
      // @ts-expect-error - navigator.standalone is iOS specific
      const isIOSStandalone = window.navigator.standalone === true;
      
      setIsInstalled(isStandalone || isFullscreen || isMinimalUI || isIOSStandalone);
    };
    
    checkInstalled();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkInstalled);

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('[PWA] Install prompt captured');
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      console.log('[PWA] App installed');
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener('change', checkInstalled);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      console.log('[PWA] Back online');
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      console.log('[PWA] Gone offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Install prompt handler
  const installPrompt = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.log('[PWA] No install prompt available');
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] Install prompt outcome:', outcome);
      
      setDeferredPrompt(null);
      return outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      return false;
    }
  }, [deferredPrompt]);

  // Update service worker
  const updateServiceWorker = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [waitingWorker]);

  // Request push notification permission
  const requestPushPermission = useCallback(async (): Promise<boolean> => {
    if (!registration || !('PushManager' in window)) {
      console.log('[PWA] Push not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.log('[PWA] Push permission denied');
        return false;
      }

      // Get VAPID public key from server
      const response = await fetch('/api/push/vapid-public-key');
      const { publicKey } = await response.json();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      console.log('[PWA] Push subscription successful');
      setIsPushEnabled(true);
      return true;
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error);
      return false;
    }
  }, [registration]);

  // Request background sync
  const requestBackgroundSync = useCallback(async (tag: string): Promise<boolean> => {
    if (!registration || !('sync' in registration)) {
      console.log('[PWA] Background sync not supported');
      return false;
    }

    try {
      // @ts-expect-error - sync API types
      await registration.sync.register(tag);
      console.log('[PWA] Background sync registered:', tag);
      return true;
    } catch (error) {
      console.error('[PWA] Background sync registration failed:', error);
      return false;
    }
  }, [registration]);

  // Clear cache
  const clearCache = useCallback(async (): Promise<void> => {
    if (!navigator.serviceWorker.controller) {
      console.log('[PWA] No active service worker');
      return;
    }

    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    console.log('[PWA] Cache clear requested');
  }, []);

  // Get cache status
  const getCacheStatus = useCallback(async (): Promise<{ caches: Record<string, number>; version: string } | null> => {
    if (!navigator.serviceWorker.controller) {
      return null;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      navigator.serviceWorker.controller?.postMessage(
        { type: 'GET_CACHE_STATUS' },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => resolve(null), 5000);
    });
  }, []);

  const contextValue: PWAContextType = {
    // Installation
    isInstallable: !!deferredPrompt && !isInstalled,
    isInstalled,
    installPrompt: deferredPrompt ? installPrompt : null,
    
    // Service Worker
    isServiceWorkerReady,
    isUpdateAvailable,
    updateServiceWorker,
    
    // Network Status
    isOnline,
    
    // Push Notifications
    isPushSupported: typeof window !== 'undefined' && 'PushManager' in window,
    isPushEnabled,
    requestPushPermission,
    
    // Background Sync
    isBackgroundSyncSupported: typeof window !== 'undefined' && 'serviceWorker' in navigator && 'SyncManager' in window,
    requestBackgroundSync,
    
    // Cache Management
    clearCache,
    getCacheStatus,
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
    </PWAContext.Provider>
  );
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray.buffer as ArrayBuffer;
}

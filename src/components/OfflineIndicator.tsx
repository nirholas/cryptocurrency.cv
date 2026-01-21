'use client';

import { useEffect, useState } from 'react';
import { usePWASafe } from './PWAProvider';

export function OfflineIndicator() {
  const pwa = usePWASafe();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!pwa) return;

    if (!pwa.isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [pwa?.isOnline, wasOffline, pwa]);

  if (!pwa) return null;

  // Show offline indicator
  if (!pwa.isOnline) {
    return (
      <div className="fixed bottom-20 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto z-50 animate-slide-up">
        <div className="bg-red-900/95 backdrop-blur-sm border border-red-700/50 rounded-full px-4 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-red-100 text-sm font-medium">
              You&apos;re offline — Some features may be limited
            </span>
          </div>
        </div>

        <style jsx>{`
          @keyframes slide-up {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .animate-slide-up { animation: slide-up 0.3s ease-out; }
        `}</style>
      </div>
    );
  }

  // Show reconnected message
  if (showReconnected) {
    return (
      <div className="fixed bottom-20 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto z-50 animate-slide-up">
        <div className="bg-green-900/95 backdrop-blur-sm border border-green-700/50 rounded-full px-4 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-100 text-sm font-medium">
              Back online
            </span>
          </div>
        </div>

        <style jsx>{`
          @keyframes slide-up {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .animate-slide-up { animation: slide-up 0.3s ease-out; }
        `}</style>
      </div>
    );
  }

  return null;
}

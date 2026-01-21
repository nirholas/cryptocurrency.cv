'use client';

import { useState, useEffect } from 'react';
import { usePWASafe } from './PWAProvider';

export function InstallPrompt() {
  const pwa = usePWASafe();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(iOS);
    
    // Check if dismissed recently
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < sevenDays) {
        setIsDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (pwa?.installPrompt) {
      const installed = await pwa.installPrompt();
      if (installed) {
        handleDismiss();
      }
    }
  };

  // Don't show if not installable or already dismissed
  if (!pwa || pwa.isInstalled || isDismissed) {
    return null;
  }

  // Show for iOS or when install prompt is available
  if (!pwa.isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-700/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Top accent */}
          <div className="h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500" />
          
          <div className="p-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              {/* App icon */}
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <span className="text-2xl font-bold text-white">₿</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-lg">Install Free Crypto News</h3>
                <p className="text-gray-400 text-sm mt-0.5">
                  Get instant access to crypto news on your home screen
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-300 transition-colors"
                aria-label="Dismiss"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Features */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 rounded-full text-xs text-gray-300">
                <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Lightning fast
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 rounded-full text-xs text-gray-300">
                <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 11-12.728 0M12 4v4" />
                </svg>
                Works offline
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 rounded-full text-xs text-gray-300">
                <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Push alerts
              </span>
            </div>

            {/* Install button */}
            <button
              onClick={handleInstall}
              className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-500/25"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Install App
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-sm w-full overflow-hidden border border-gray-700">
            <div className="h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500" />
            
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30 mb-4">
                  <span className="text-3xl font-bold text-white">₿</span>
                </div>
                <h2 className="text-xl font-bold text-white">Install on iOS</h2>
                <p className="text-gray-400 text-sm mt-1">Follow these steps to add to your home screen</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-semibold text-sm">
                    1
                  </div>
                  <div>
                    <p className="text-white font-medium">Tap the Share button</p>
                    <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                      Look for
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      in Safari
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-semibold text-sm">
                    2
                  </div>
                  <div>
                    <p className="text-white font-medium">Scroll and tap &quot;Add to Home Screen&quot;</p>
                    <p className="text-gray-400 text-sm mt-1">It might be in the second row of options</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-semibold text-sm">
                    3
                  </div>
                  <div>
                    <p className="text-white font-medium">Tap &quot;Add&quot; in the top right</p>
                    <p className="text-gray-400 text-sm mt-1">The app will appear on your home screen</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSInstructions(false)}
                className="w-full mt-6 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

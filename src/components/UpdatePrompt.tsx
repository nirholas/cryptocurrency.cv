'use client';

import { usePWASafe } from './PWAProvider';

export function UpdatePrompt() {
  const pwa = usePWASafe();

  if (!pwa?.isUpdateAvailable) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-down">
      <div className="bg-gradient-to-br from-blue-900 to-blue-950 border border-blue-700/50 rounded-xl shadow-xl shadow-black/50 p-4">
        <div className="flex items-start gap-3">
          {/* Update icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          
          <div className="flex-1">
            <h3 className="text-white font-semibold">Update Available</h3>
            <p className="text-blue-200/70 text-sm mt-0.5">
              A new version is ready to install
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => pwa.updateServiceWorker()}
            className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors text-sm"
          >
            Update Now
          </button>
          <button
            onClick={() => window.location.reload()}
            className="py-2 px-4 bg-blue-800 hover:bg-blue-700 text-blue-200 font-medium rounded-lg transition-colors text-sm"
          >
            Later
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

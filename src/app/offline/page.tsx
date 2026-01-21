import Link from 'next/link';
import type { Metadata } from 'next';
import RefreshButton from '@/components/RefreshButton';

export const metadata: Metadata = {
  title: 'Offline',
  description: 'You are currently offline. Please check your internet connection.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Animated offline icon */}
        <div className="relative">
          <div className="w-32 h-32 mx-auto relative">
            {/* Pulsing circles */}
            <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-orange-500/30 animate-pulse" />
            
            {/* Main icon */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white">You&apos;re Offline</h1>
          <p className="text-gray-400 text-lg">
            It looks like you&apos;ve lost your internet connection. 
            Don&apos;t worry, some content may still be available from cache.
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-4">
          <RefreshButton />

          <Link
            href="/"
            className="block w-full py-4 px-6 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all duration-200 border border-gray-700"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go to Home (Cached)
            </span>
          </Link>
        </div>

        {/* Tips */}
        <div className="bg-gray-800/50 rounded-xl p-6 text-left border border-gray-700/50">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            What you can do:
          </h2>
          <ul className="text-gray-400 space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">•</span>
              <span>Check your Wi-Fi or mobile data connection</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">•</span>
              <span>Try moving to an area with better signal</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">•</span>
              <span>Previously viewed articles may be available offline</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">•</span>
              <span>The app will automatically reconnect when online</span>
            </li>
          </ul>
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>Currently offline</span>
        </div>
      </div>
    </div>
  );
}

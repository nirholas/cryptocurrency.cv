'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI to avoid SSR issues
// Type declarations are in src/types/swagger-ui-react.d.ts
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">
            API Documentation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete reference for Free Crypto News API with interactive examples
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <SwaggerUI url="/api/openapi.json" />
        </div>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-100">
              🆓 Free Tier
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Access news endpoints without API keys. Perfect for testing and small projects.
            </p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-purple-900 dark:text-purple-100">
              🔑 API Keys
            </h3>
            <p className="text-sm text-purple-800 dark:text-purple-200">
              Get higher rate limits and access to market data endpoints. Sign up for free!
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-green-900 dark:text-green-100">
              💎 x402 Premium
            </h3>
            <p className="text-sm text-green-800 dark:text-green-200">
              Pay-per-use AI features with micropayments. No subscriptions needed.
            </p>
          </div>
        </div>
        
        <div className="mt-8 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Quick Start
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                1. Get Latest News
              </h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-sm">
{`curl https://cryptocurrency.cv/api/news?limit=10`}
              </pre>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                2. Filter by Category
              </h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-sm">
{`curl https://cryptocurrency.cv/api/news?category=bitcoin&limit=5`}
              </pre>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                3. Get Market Data (with API key)
              </h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-sm">
{`curl -H "X-API-Key: your-api-key" \\
  https://cryptocurrency.cv/api/v1/coins`}
              </pre>
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border-l-4 border-yellow-500">
          <h3 className="text-lg font-semibold mb-2 text-yellow-900 dark:text-yellow-100">
            📚 Additional Resources
          </h3>
          <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
            <li>• <a href="/docs" className="underline hover:text-yellow-600">Full Documentation</a></li>
            <li>• <a href="https://github.com/nirholas/free-crypto-news" className="underline hover:text-yellow-600">GitHub Repository</a></li>
            <li>• <a href="/docs/x402" className="underline hover:text-yellow-600">x402 Payment Guide</a></li>
            <li>• <a href="/examples" className="underline hover:text-yellow-600">Code Examples</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

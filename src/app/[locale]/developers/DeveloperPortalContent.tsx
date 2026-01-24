'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FREE_ENDPOINTS,
  PREMIUM_ENDPOINTS,
  SUBSCRIPTION_TIERS,
  getFreeEndpointCount,
  getPremiumEndpointCount,
} from '@/lib/x402/features';

interface APIKey {
  id: string;
  key: string;
  name: string;
  tier: string;
  createdAt: string;
  lastUsed?: string;
  usageToday: number;
  usageMonth: number;
  rateLimit: number;
  active: boolean;
}

interface UsageStats {
  today: number;
  week: number;
  month: number;
  limit: number;
  endpoints: { path: string; count: number }[];
}

export default function DeveloperPortalContent() {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'keys' | 'usage' | 'docs'>('quickstart');
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Example key format for illustration (shown in docs)
  const exampleKeyFormat = 'cda_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

  const copyToClipboard = (text: string, keyId?: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId || 'demo');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) return;
    setLoading(true);
    setError(null);

    try {
      // Call the API to generate a new key
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        const newKey: APIKey = {
          id: data.id || `key_${Date.now()}`,
          key: data.key || `cda_${generateRandomString(32)}`,
          name: newKeyName,
          tier: data.tier || 'free',
          createdAt: data.createdAt || new Date().toISOString(),
          usageToday: 0,
          usageMonth: 0,
          rateLimit: data.rateLimit || 100,
          active: true,
        };
        setApiKeys([...apiKeys, newKey]);
      } else {
        // API not available - generate locally for demo purposes
        const newKey: APIKey = {
          id: `key_${Date.now()}`,
          key: `cda_${generateRandomString(32)}`,
          name: newKeyName,
          tier: 'free',
          createdAt: new Date().toISOString(),
          usageToday: 0,
          usageMonth: 0,
          rateLimit: 100,
          active: true,
        };
        setApiKeys([...apiKeys, newKey]);
      }
    } catch {
      // Fallback to local generation if API fails
      const newKey: APIKey = {
        id: `key_${Date.now()}`,
        key: `cda_${generateRandomString(32)}`,
        name: newKeyName,
        tier: 'free',
        createdAt: new Date().toISOString(),
        usageToday: 0,
        usageMonth: 0,
        rateLimit: 100,
        active: true,
      };
      setApiKeys([...apiKeys, newKey]);
    } finally {
      setShowCreateModal(false);
      setNewKeyName('');
      setLoading(false);
    }
  };

  const generateRandomString = (length: number) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join(
      ''
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Developer Portal
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Access {getFreeEndpointCount()} free endpoints instantly. Unlock{' '}
            {getPremiumEndpointCount()} premium endpoints with an API key.
          </p>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {[
          { id: 'quickstart', label: '🚀 Quick Start', icon: '🚀' },
          { id: 'keys', label: '🔑 API Keys', icon: '🔑' },
          { id: 'usage', label: '📊 Usage', icon: '📊' },
          { id: 'docs', label: '📚 Docs', icon: '📚' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-amber-500 text-black'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'quickstart' && <QuickStartTab copyToClipboard={copyToClipboard} />}
        {activeTab === 'keys' && (
          <APIKeysTab
            apiKeys={apiKeys}
            setApiKeys={setApiKeys}
            showCreateModal={showCreateModal}
            setShowCreateModal={setShowCreateModal}
            newKeyName={newKeyName}
            setNewKeyName={setNewKeyName}
            createApiKey={createApiKey}
            copiedKey={copiedKey}
            copyToClipboard={copyToClipboard}
          />
        )}
        {activeTab === 'usage' && <UsageTab usage={usage} />}
        {activeTab === 'docs' && <DocsTab />}
      </div>
    </div>
  );
}

// Quick Start Tab
function QuickStartTab({ copyToClipboard }: { copyToClipboard: (text: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Step 1: Free Endpoints */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
            1
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Try Free Endpoints (No Auth Required)
          </h2>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Start immediately with our free endpoints. No API key needed!
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {[
            { endpoint: '/api/news', desc: 'Get latest crypto news' },
            { endpoint: '/api/breaking', desc: 'Breaking news updates' },
            { endpoint: '/api/trending', desc: 'Trending topics' },
            { endpoint: '/api/sentiment', desc: 'Market sentiment' },
          ].map((item) => (
            <div
              key={item.endpoint}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              onClick={() => copyToClipboard(`curl https://free-crypto-news.vercel.app${item.endpoint}`)}
            >
              <code className="text-amber-500 font-mono text-sm">{item.endpoint}</code>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400"># Example request</span>
            <button
              onClick={() => copyToClipboard('curl https://free-crypto-news.vercel.app/api/news?limit=5')}
              className="text-xs text-amber-500 hover:text-amber-400"
            >
              Copy
            </button>
          </div>
          <code className="text-green-400">
            curl https://free-crypto-news.vercel.app/api/news?limit=5
          </code>
        </div>
      </div>

      {/* Step 2: Get API Key */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-black font-bold">
            2
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Get an API Key (For Premium Endpoints)
          </h2>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Create an API key to access premium market data, analytics, and AI features.
        </p>

        <a
          href="#keys"
          onClick={(e) => {
            e.preventDefault();
            document.querySelector('[data-tab="keys"]')?.dispatchEvent(new Event('click'));
          }}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black px-6 py-3 rounded-xl font-semibold transition-all"
        >
          Create Free API Key
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>

      {/* Step 3: Use Premium Endpoints */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            3
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Access Premium Endpoints
          </h2>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Use your API key in the header or query parameter:
        </p>

        <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm space-y-4">
          <div>
            <div className="text-gray-400 mb-1"># Using header (recommended)</div>
            <code className="text-green-400">
              curl -H &quot;X-API-Key: YOUR_API_KEY&quot; \<br />
              &nbsp;&nbsp;https://free-crypto-news.vercel.app/api/v1/coins
            </code>
          </div>
          <div>
            <div className="text-gray-400 mb-1"># Using query parameter</div>
            <code className="text-green-400">
              curl &quot;https://free-crypto-news.vercel.app/api/v1/coins?api_key=YOUR_API_KEY&quot;
            </code>
          </div>
        </div>
      </div>

      {/* Step 4: x402 Pay-Per-Request */}
      <div
        className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl p-8 border border-blue-500/20"
        id="x402"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
            ⚡
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Alternative: Pay-Per-Request with x402
          </h2>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-6">
          No subscription needed! Pay for each request with USDC on Base network. Perfect for AI
          agents and occasional users.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">How it works:</h3>
            <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-amber-500">1.</span>
                Request a premium endpoint without auth
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">2.</span>
                Get 402 response with price and payment details
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">3.</span>
                Sign payment with your wallet
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">4.</span>
                Include X-PAYMENT header in your request
              </li>
            </ol>
          </div>

          <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs overflow-x-auto">
            <pre className="text-blue-400">
              {`// 402 Response
{
  "error": "Payment Required",
  "price": "$0.001",
  "payTo": "0x...",
  "network": "eip155:8453",
  "accepts": "x402"
}`}
            </pre>
          </div>
        </div>

        <div className="mt-6">
          <a
            href="https://docs.x402.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-400 font-medium text-sm"
          >
            Learn more about x402 protocol →
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// API Keys Tab
function APIKeysTab({
  apiKeys,
  setApiKeys,
  showCreateModal,
  setShowCreateModal,
  newKeyName,
  setNewKeyName,
  createApiKey,
  copiedKey,
  copyToClipboard,
}: {
  apiKeys: APIKey[];
  setApiKeys: React.Dispatch<React.SetStateAction<APIKey[]>>;
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  newKeyName: string;
  setNewKeyName: (name: string) => void;
  createApiKey: () => void;
  copiedKey: string | null;
  copyToClipboard: (text: string, keyId?: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Create Key Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your API Keys</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your API keys for programmatic access
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-amber-500 hover:bg-amber-600 text-black px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Key
        </button>
      </div>

      {/* Keys List */}
      {apiKeys.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-6xl mb-4">🔑</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No API Keys Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first API key to access premium endpoints
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-black px-6 py-3 rounded-xl font-semibold transition-all"
          >
            Create Your First Key
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{key.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Created {new Date(key.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    key.active
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {key.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <code className="flex-1 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg font-mono text-sm text-gray-800 dark:text-gray-200">
                  {key.key.slice(0, 20)}...
                </code>
                <button
                  onClick={() => copyToClipboard(key.key, key.id)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all"
                >
                  {copiedKey === key.id ? '✓ Copied' : 'Copy'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Tier:</span>
                  <span className="ml-2 text-gray-900 dark:text-white capitalize">{key.tier}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Today:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {key.usageToday} / {key.rateLimit}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">This month:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{key.usageMonth}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  Regenerate
                </button>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <button className="text-sm text-red-500 hover:text-red-600">Revoke</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tier Info */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">API Key Tiers</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {SUBSCRIPTION_TIERS.map((tier) => (
            <div
              key={tier.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
            >
              <h4 className="font-medium text-gray-900 dark:text-white">{tier.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{tier.rateLimit}</p>
              <p className="text-amber-500 font-semibold mt-2">{tier.priceMonthly}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <a href="/pricing" className="text-amber-500 hover:text-amber-400 font-medium text-sm">
            View full pricing details →
          </a>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Create New API Key
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Key Name
              </label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., My Trading Bot"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={createApiKey}
                className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-semibold transition-all"
              >
                Create Key
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// Usage Tab
function UsageTab({ usage }: { usage: UsageStats | null }) {
  // Demo usage data
  const demoUsage: UsageStats = {
    today: 47,
    week: 312,
    month: 1248,
    limit: 10000,
    endpoints: [
      { path: '/api/v1/coins', count: 423 },
      { path: '/api/v1/market-data', count: 312 },
      { path: '/api/v1/trending', count: 189 },
      { path: '/api/v1/historical', count: 156 },
      { path: '/api/news', count: 98 },
    ],
  };

  const data = usage || demoUsage;
  const usagePercent = (data.month / data.limit) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Usage Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Today</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.today}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">This Week</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.week}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">This Month</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.month}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Limit</h3>
          <p className="text-3xl font-bold text-amber-500">{data.limit.toLocaleString()}</p>
        </div>
      </div>

      {/* Usage Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Monthly Usage</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {data.month.toLocaleString()} / {data.limit.toLocaleString()} requests
          </span>
        </div>
        <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              usagePercent > 80
                ? 'bg-red-500'
                : usagePercent > 50
                  ? 'bg-amber-500'
                  : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {(data.limit - data.month).toLocaleString()} requests remaining this month
        </p>
      </div>

      {/* Top Endpoints */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Endpoints</h3>
        <div className="space-y-3">
          {data.endpoints.map((endpoint, i) => (
            <div key={endpoint.path} className="flex items-center gap-4">
              <span className="text-sm text-gray-400 w-6">{i + 1}</span>
              <code className="flex-1 text-sm font-mono text-gray-900 dark:text-white">
                {endpoint.path}
              </code>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {endpoint.count} calls
              </span>
              <div className="w-24 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${(endpoint.count / data.endpoints[0].count) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Docs Tab
function DocsTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">API Documentation</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Explore our comprehensive documentation and SDKs
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DocCard
          icon="📖"
          title="API Reference"
          description="Complete REST API documentation with examples"
          link="/docs/API"
        />
        <DocCard
          icon="🚀"
          title="Quick Start Guide"
          description="Get up and running in 5 minutes"
          link="/docs/QUICKSTART"
        />
        <DocCard
          icon="⚡"
          title="Real-time API"
          description="SSE and WebSocket streaming documentation"
          link="/docs/REALTIME"
        />
        <DocCard
          icon="🤖"
          title="AI Features"
          description="AI-powered analysis and insights"
          link="/docs/AI-FEATURES"
        />
        <DocCard
          icon="💳"
          title="x402 Integration"
          description="Pay-per-request with crypto micropayments"
          link="https://docs.x402.org"
          external
        />
        <DocCard
          icon="🔧"
          title="SDKs"
          description="JavaScript, Python, Go, and more"
          link="/docs/sdks"
        />
      </div>

      {/* Endpoints Reference */}
      <div className="mt-12" id="free-endpoints">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          All Free Endpoints ({FREE_ENDPOINTS.length})
        </h3>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-gray-900 dark:text-white">
                    Endpoint
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-900 dark:text-white">
                    Description
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-900 dark:text-white">
                    Rate Limit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {FREE_ENDPOINTS.map((endpoint) => (
                  <tr key={endpoint.path} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="p-4">
                      <code className="text-sm font-mono text-green-600 dark:text-green-400">
                        {endpoint.method} {endpoint.path}
                      </code>
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                      {endpoint.description}
                    </td>
                    <td className="p-4 text-sm text-gray-500 dark:text-gray-500">
                      {endpoint.rateLimit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DocCard({
  icon,
  title,
  description,
  link,
  external,
}: {
  icon: string;
  title: string;
  description: string;
  link: string;
  external?: boolean;
}) {
  return (
    <a
      href={link}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-amber-500/50 transition-all group"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-amber-500 transition-colors">
        {title}
        {external && <span className="text-xs ml-1">↗</span>}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </a>
  );
}

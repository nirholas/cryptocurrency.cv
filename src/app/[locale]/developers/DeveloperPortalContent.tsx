'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// =============================================================================
// TYPES
// =============================================================================

interface APIKey {
  id: string;
  key: string;
  name: string;
  tier: string;
  createdAt: string;
  usageToday: number;
  usageMonth: number;
  rateLimit: number;
  active: boolean;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ENDPOINTS = {
  free: [
    { method: 'GET', path: '/api/news', desc: 'Latest crypto news from 200+ sources', example: '?limit=10&category=bitcoin' },
    { method: 'GET', path: '/api/breaking', desc: 'Breaking news updates', example: '' },
    { method: 'GET', path: '/api/trending', desc: 'Trending topics & narratives', example: '' },
    { method: 'GET', path: '/api/search', desc: 'Full-text article search', example: '?q=ethereum+ETF' },
    { method: 'GET', path: '/api/bitcoin', desc: 'Bitcoin-specific news feed', example: '' },
    { method: 'GET', path: '/api/defi', desc: 'DeFi news and updates', example: '' },
    { method: 'GET', path: '/api/sentiment', desc: 'Market sentiment analysis', example: '' },
    { method: 'GET', path: '/api/fear-greed', desc: 'Fear & Greed Index', example: '' },
    { method: 'GET', path: '/api/sources', desc: 'List all news sources', example: '' },
    { method: 'GET', path: '/api/health', desc: 'API health status', example: '' },
    { method: 'GET', path: '/api/stats', desc: 'Usage statistics', example: '' },
    { method: 'GET', path: '/api/rss', desc: 'RSS feed output', example: '' },
  ],
  ai: [
    { method: 'POST', path: '/api/ai', desc: 'Unified AI endpoint (7 actions)', example: '' },
    { method: 'GET', path: '/api/digest', desc: 'AI-generated news digest', example: '?period=24h' },
    { method: 'GET', path: '/api/summarize', desc: 'Article summarization', example: '?url=...' },
    { method: 'GET', path: '/api/ask', desc: 'Ask questions about crypto', example: '?q=What+is+ETH+staking' },
    { method: 'GET', path: '/api/entities', desc: 'Entity extraction', example: '' },
    { method: 'GET', path: '/api/narratives', desc: 'Market narrative detection', example: '' },
    { method: 'GET', path: '/api/factcheck', desc: 'Claim verification', example: '' },
    { method: 'POST', path: '/api/detect/ai-content', desc: 'AI content detection', example: '' },
  ],
  market: [
    { method: 'GET', path: '/api/market/coins', desc: 'Top coins by market cap', example: '?limit=100' },
    { method: 'GET', path: '/api/fear-greed', desc: 'Fear & Greed Index', example: '' },
    { method: 'GET', path: '/api/whale-alerts', desc: 'Large transaction alerts', example: '' },
    { method: 'GET', path: '/api/liquidations', desc: 'Liquidation data', example: '' },
    { method: 'GET', path: '/api/funding', desc: 'Funding rates', example: '' },
    { method: 'GET', path: '/api/arbitrage', desc: 'Arbitrage opportunities', example: '' },
  ],
};

const CODE_EXAMPLES = {
  curl: `# Get latest news
curl "https://cryptocurrency.cv/api/news?limit=5"

# Search for Bitcoin ETF news
curl "https://cryptocurrency.cv/api/search?q=bitcoin+ETF"

# Get AI digest
curl "https://cryptocurrency.cv/api/digest?period=24h"`,

  javascript: `// Using fetch
const response = await fetch('https://cryptocurrency.cv/api/news?limit=5');
const { articles } = await response.json();

articles.forEach(article => {
  console.log(\`[\${article.source}] \${article.title}\`);
});

// Using the SDK
import { CryptoNews } from '@cryptonews/sdk';

const client = new CryptoNews();
const news = await client.getLatest({ limit: 5, category: 'bitcoin' });`,

  python: `import requests

# Get latest news
response = requests.get('https://cryptocurrency.cv/api/news', 
    params={'limit': 5, 'category': 'bitcoin'})
data = response.json()

for article in data['articles']:
    print(f"[{article['source']}] {article['title']}")

# Using the SDK
from cryptonews import CryptoNews

client = CryptoNews()
news = client.get_latest(limit=5, category='bitcoin')`,

  go: `package main

import (
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    resp, _ := http.Get("https://cryptocurrency.cv/api/news?limit=5")
    defer resp.Body.Close()
    
    var data map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&data)
    
    articles := data["articles"].([]interface{})
    for _, a := range articles {
        article := a.(map[string]interface{})
        fmt.Printf("[%s] %s\\n", article["source"], article["title"])
    }
}`,
};

const SDK_INSTALL = {
  npm: 'npm install @cryptonews/sdk',
  yarn: 'yarn add @cryptonews/sdk',
  pnpm: 'pnpm add @cryptonews/sdk',
  pip: 'pip install cryptonews',
  go: 'go get github.com/nirholas/cryptonews-go',
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function DeveloperPortalContent() {
  const [activeSection, setActiveSection] = useState<'start' | 'endpoints' | 'sdks' | 'keys'>('start');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<'curl' | 'javascript' | 'python' | 'go'>('curl');
  const [health, setHealth] = useState<HealthStatus>({ status: 'healthy', latency: 45 });
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [tryItEndpoint, setTryItEndpoint] = useState('/api/news?limit=3');
  const [tryItResponse, setTryItResponse] = useState<string | null>(null);
  const [tryItLoading, setTryItLoading] = useState(false);

  // Fetch health on mount
  useEffect(() => {
    const checkHealth = async () => {
      const start = Date.now();
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setHealth({
          status: data.status || 'healthy',
          latency: Date.now() - start,
        });
      } catch {
        setHealth({ status: 'degraded', latency: 0 });
      }
    };
    checkHealth();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) return;

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });
      const data = await res.json();

      if (!res.ok) {
        console.error('Failed to create API key:', data);
        return;
      }

      const newKey: APIKey = {
        id: data.id ?? `key_${Date.now()}`,
        key: data.key,
        name: newKeyName,
        tier: data.tier ?? 'free',
        createdAt: data.createdAt ?? new Date().toISOString(),
        usageToday: 0,
        usageMonth: 0,
        rateLimit: data.rateLimit ?? 1000,
        active: true,
      };

      setApiKeys([...apiKeys, newKey]);
    } catch (err) {
      console.error('Failed to create API key:', err);
    } finally {
      setShowKeyModal(false);
      setNewKeyName('');
    }
  };

  const tryEndpoint = async () => {
    setTryItLoading(true);
    setTryItResponse(null);
    
    try {
      const res = await fetch(tryItEndpoint);
      const data = await res.json();
      setTryItResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setTryItResponse(`Error: ${err}`);
    } finally {
      setTryItLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-full mb-8">
              <span className={`w-2 h-2 rounded-full animate-pulse ${
                health.status === 'healthy' ? 'bg-green-500' : 
                health.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-sm text-gray-300">
                API {health.status === 'healthy' ? 'Operational' : 'Degraded'}
              </span>
              {health.latency && (
                <span className="text-xs text-gray-500">• {health.latency}ms</span>
              )}
              <Link href="/status" className="text-xs text-gray-300 hover:text-white ml-2">
                View Status →
              </Link>
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
              Build with <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-white">Crypto News</span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
              Free API with <strong className="text-white">200+ sources</strong>, 
              <strong className="text-white"> AI analysis</strong>, and 
              <strong className="text-white"> real-time updates</strong>. 
              No API key required. Start in seconds.
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 mb-12">
              {[
                { value: '200+', label: 'News Sources' },
                { value: '50+', label: 'Free Endpoints' },
                { value: '18', label: 'Languages' },
                { value: '∞', label: 'Free Requests' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Quick Try */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border-b border-gray-700">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs text-gray-500 ml-2">Terminal</span>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 font-mono text-sm">
                    <span className="text-green-400">$</span>
                    <span className="text-gray-300">curl</span>
                    <span className="text-gray-300">&quot;https://cryptocurrency.cv/api/news?limit=3&quot;</span>
                    <button
                      onClick={() => copyToClipboard('curl "https://cryptocurrency.cv/api/news?limit=3"', 'hero-curl')}
                      className="ml-auto px-2 py-1 text-xs text-gray-500 hover:text-white transition-colors"
                    >
                      {copiedText === 'hero-curl' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation */}
      <div className="sticky top-16 z-40 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 py-2 overflow-x-auto">
            {[
              { id: 'start', label: '🚀 Quick Start' },
              { id: 'endpoints', label: '📡 Endpoints' },
              { id: 'sdks', label: '📦 SDKs' },
              { id: 'keys', label: '🔑 API Keys' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as typeof activeSection)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeSection === item.id
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="flex-1" />
            <Link 
              href="/docs/API" 
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white flex items-center gap-1"
            >
              Full Docs <span className="text-xs">↗</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          {activeSection === 'start' && (
            <QuickStartSection 
              key="start"
              selectedLang={selectedLang}
              setSelectedLang={setSelectedLang}
              copiedText={copiedText}
              copyToClipboard={copyToClipboard}
              tryItEndpoint={tryItEndpoint}
              setTryItEndpoint={setTryItEndpoint}
              tryItResponse={tryItResponse}
              tryItLoading={tryItLoading}
              tryEndpoint={tryEndpoint}
            />
          )}
          {activeSection === 'endpoints' && (
            <EndpointsSection 
              key="endpoints"
              copiedText={copiedText}
              copyToClipboard={copyToClipboard}
            />
          )}
          {activeSection === 'sdks' && (
            <SDKsSection 
              key="sdks"
              copiedText={copiedText}
              copyToClipboard={copyToClipboard}
            />
          )}
          {activeSection === 'keys' && (
            <APIKeysSection 
              key="keys"
              apiKeys={apiKeys}
              setApiKeys={setApiKeys}
              copiedText={copiedText}
              copyToClipboard={copyToClipboard}
              showKeyModal={showKeyModal}
              setShowKeyModal={setShowKeyModal}
              newKeyName={newKeyName}
              setNewKeyName={setNewKeyName}
              createApiKey={createApiKey}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// =============================================================================
// QUICK START SECTION
// =============================================================================

function QuickStartSection({ 
  selectedLang, 
  setSelectedLang, 
  copiedText, 
  copyToClipboard,
  tryItEndpoint,
  setTryItEndpoint,
  tryItResponse,
  tryItLoading,
  tryEndpoint,
}: {
  selectedLang: 'curl' | 'javascript' | 'python' | 'go';
  setSelectedLang: (lang: 'curl' | 'javascript' | 'python' | 'go') => void;
  copiedText: string | null;
  copyToClipboard: (text: string, id: string) => void;
  tryItEndpoint: string;
  setTryItEndpoint: (endpoint: string) => void;
  tryItResponse: string | null;
  tryItLoading: boolean;
  tryEndpoint: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12"
    >
      {/* Step 1: No Setup Required */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-black font-bold text-sm">1</div>
            <h2 className="text-2xl font-bold text-white">No Setup Required</h2>
          </div>
          <p className="text-gray-400 mb-6">
            Our API is completely free and requires no authentication for most endpoints. 
            Just make a request and get data instantly.
          </p>
          
          <div className="space-y-3">
            {[
              { icon: '✓', text: 'No API key needed for 50+ endpoints' },
              { icon: '✓', text: 'No rate limits for reasonable usage' },
              { icon: '✓', text: 'CORS enabled - works from any domain' },
              { icon: '✓', text: 'JSON responses with consistent format' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-gray-300">
                <span className="text-green-500">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Try It */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
            <span className="text-sm font-medium text-white">🧪 Try it live</span>
            <span className="text-xs text-gray-500">Results appear below</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={tryItEndpoint}
                onChange={(e) => setTryItEndpoint(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-gray-400"
                placeholder="/api/news?limit=5"
              />
              <button
                onClick={tryEndpoint}
                disabled={tryItLoading}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {tryItLoading ? 'Loading...' : 'Send'}
              </button>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-3 h-48 overflow-auto font-mono text-xs">
              {tryItResponse ? (
                <pre className="text-green-400 whitespace-pre-wrap">{tryItResponse.slice(0, 2000)}{tryItResponse.length > 2000 ? '...' : ''}</pre>
              ) : (
                <span className="text-gray-500">Response will appear here...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Code Examples */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black font-bold text-sm">2</div>
          <h2 className="text-2xl font-bold text-white">Copy & Paste Code</h2>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          {/* Language Tabs */}
          <div className="flex border-b border-gray-700">
            {(['curl', 'javascript', 'python', 'go'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  selectedLang === lang
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {lang === 'curl' ? 'cURL' : lang.charAt(0).toUpperCase() + lang.slice(1)}
              </button>
            ))}
            <div className="flex-1" />
            <button
              onClick={() => copyToClipboard(CODE_EXAMPLES[selectedLang], `code-${selectedLang}`)}
              className="px-4 py-3 text-sm text-gray-400 hover:text-white transition-colors"
            >
              {copiedText === `code-${selectedLang}` ? '✓ Copied!' : 'Copy'}
            </button>
          </div>

          {/* Code Block */}
          <div className="p-6 font-mono text-sm overflow-x-auto">
            <pre className="text-gray-300">
              {CODE_EXAMPLES[selectedLang].split('\n').map((line, i) => (
                <div key={i} className={line.startsWith('#') || line.startsWith('//') ? 'text-gray-500' : ''}>
                  {line}
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { icon: '📖', title: 'Full API Reference', desc: 'Complete endpoint documentation', href: '/docs/API' },
          { icon: '⚡', title: 'Real-time Streaming', desc: 'SSE and WebSocket docs', href: '/docs/REALTIME' },
          { icon: '🤖', title: 'AI Features', desc: 'Sentiment, summaries, entities', href: '/docs/AI-FEATURES' },
        ].map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-400/50 transition-all group"
          >
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className="font-semibold text-white group-hover:text-white transition-colors">{card.title}</div>
            <div className="text-sm text-gray-500">{card.desc}</div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

// =============================================================================
// ENDPOINTS SECTION
// =============================================================================

function EndpointsSection({ copiedText, copyToClipboard }: { copiedText: string | null; copyToClipboard: (text: string, id: string) => void }) {
  const [filter, setFilter] = useState<'all' | 'free' | 'ai' | 'market'>('all');

  const filteredEndpoints = filter === 'all' 
    ? [...ENDPOINTS.free, ...ENDPOINTS.ai, ...ENDPOINTS.market]
    : ENDPOINTS[filter];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">API Endpoints</h2>
          <p className="text-gray-400">Browse all available endpoints</p>
        </div>
        
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'free', label: '🆓 Free' },
            { id: 'ai', label: '🤖 AI' },
            { id: 'market', label: '📊 Market' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as typeof filter)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f.id
                  ? 'bg-white text-black'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800/50">
                <th className="text-left p-4 text-sm font-semibold text-white">Method</th>
                <th className="text-left p-4 text-sm font-semibold text-white">Endpoint</th>
                <th className="text-left p-4 text-sm font-semibold text-white">Description</th>
                <th className="text-right p-4 text-sm font-semibold text-white">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredEndpoints.map((endpoint) => (
                <tr key={endpoint.path} className="hover:bg-gray-800/30 transition-colors">
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      endpoint.method === 'GET' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {endpoint.method}
                    </span>
                  </td>
                  <td className="p-4">
                    <code className="text-gray-300 font-mono text-sm">{endpoint.path}</code>
                    {endpoint.example && (
                      <code className="text-gray-500 font-mono text-xs ml-1">{endpoint.example}</code>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-400">{endpoint.desc}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => copyToClipboard(
                        `curl "https://cryptocurrency.cv${endpoint.path}${endpoint.example}"`,
                        endpoint.path
                      )}
                      className="text-xs text-gray-500 hover:text-white transition-colors"
                    >
                      {copiedText === endpoint.path ? '✓ Copied' : 'Copy cURL'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center">
        <Link href="/docs/API" className="text-gray-300 hover:text-white font-medium">
          View all 100+ endpoints in full documentation →
        </Link>
      </div>
    </motion.div>
  );
}

// =============================================================================
// SDKS SECTION  
// =============================================================================

function SDKsSection({ copiedText, copyToClipboard }: { copiedText: string | null; copyToClipboard: (text: string, id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Official SDKs</h2>
        <p className="text-gray-400">Use our SDKs for type-safe, ergonomic API access</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { 
            lang: 'JavaScript / TypeScript', 
            icon: '🟨', 
            install: SDK_INSTALL.npm,
            package: '@cryptonews/sdk',
            docs: '/docs/sdks/javascript',
            features: ['Full TypeScript support', 'Browser & Node.js', 'Auto-retry & caching'],
          },
          { 
            lang: 'Python', 
            icon: '🐍', 
            install: SDK_INSTALL.pip,
            package: 'cryptonews',
            docs: '/docs/sdks/python',
            features: ['Type hints', 'Async support', 'Pandas integration'],
          },
          { 
            lang: 'Go', 
            icon: '🐹', 
            install: SDK_INSTALL.go,
            package: 'cryptonews-go',
            docs: '/docs/sdks/go',
            features: ['Idiomatic Go', 'Context support', 'Concurrent-safe'],
          },
        ].map((sdk) => (
          <div key={sdk.lang} className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{sdk.icon}</span>
                <h3 className="text-lg font-bold text-white">{sdk.lang}</h3>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-3 mb-4 font-mono text-sm flex items-center justify-between">
                <code className="text-green-400">{sdk.install}</code>
                <button
                  onClick={() => copyToClipboard(sdk.install, sdk.package)}
                  className="text-xs text-gray-500 hover:text-white"
                >
                  {copiedText === sdk.package ? '✓' : 'Copy'}
                </button>
              </div>

              <ul className="space-y-2">
                {sdk.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="text-green-500">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="border-t border-gray-700 p-4">
              <Link href={sdk.docs} className="text-sm text-gray-300 hover:text-white">
                View documentation →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Community SDKs */}
      <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Community & Integrations</h3>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { name: 'MCP Server', desc: 'Claude & ChatGPT', href: '/mcp' },
            { name: 'Discord Bot', desc: 'Example bot', href: '/examples' },
            { name: 'Telegram Bot', desc: 'Python example', href: '/examples' },
            { name: 'Chrome Extension', desc: 'Browser news', href: '/extension' },
          ].map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div className="font-medium text-white">{item.name}</div>
              <div className="text-xs text-gray-500">{item.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// API KEYS SECTION
// =============================================================================

function APIKeysSection({ 
  apiKeys, 
  setApiKeys,
  copiedText, 
  copyToClipboard,
  showKeyModal,
  setShowKeyModal,
  newKeyName,
  setNewKeyName,
  createApiKey,
}: { 
  apiKeys: APIKey[];
  setApiKeys: React.Dispatch<React.SetStateAction<APIKey[]>>;
  copiedText: string | null;
  copyToClipboard: (text: string, id: string) => void;
  showKeyModal: boolean;
  setShowKeyModal: (show: boolean) => void;
  newKeyName: string;
  setNewKeyName: (name: string) => void;
  createApiKey: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Info Banner */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-semibold text-green-400 mb-1">API keys are optional!</h3>
            <p className="text-gray-400 text-sm">
              Most endpoints work without authentication. API keys are only needed for 
              higher rate limits, premium features, or usage tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Create/List Keys */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Your API Keys</h2>
          <p className="text-gray-400 text-sm">Manage keys for premium access</p>
        </div>
        <button
          onClick={() => setShowKeyModal(true)}
          className="px-4 py-2 bg-white hover:bg-gray-100 text-black font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          <span>+</span> Create Key
        </button>
      </div>

      {apiKeys.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
          <div className="text-5xl mb-4">🔑</div>
          <h3 className="text-xl font-semibold text-white mb-2">No API Keys Yet</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Create an API key to unlock higher rate limits and premium features.
          </p>
          <button
            onClick={() => setShowKeyModal(true)}
            className="px-6 py-3 bg-white hover:bg-gray-100 text-black font-semibold rounded-lg transition-colors"
          >
            Create Your First Key
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((key) => (
            <div key={key.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white">{key.name}</h3>
                  <p className="text-sm text-gray-500">
                    Created {new Date(key.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded">
                  Active
                </span>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <code className="flex-1 px-3 py-2 bg-gray-900 rounded-lg font-mono text-sm text-gray-300">
                  {key.key.slice(0, 24)}•••••••••
                </code>
                <button
                  onClick={() => copyToClipboard(key.key, key.id)}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                >
                  {copiedText === key.id ? '✓ Copied' : 'Copy'}
                </button>
              </div>

              <div className="flex gap-4 text-sm text-gray-400">
                <span>Tier: <strong className="text-white">{key.tier}</strong></span>
                <span>Today: <strong className="text-white">{key.usageToday}</strong></span>
                <span>Limit: <strong className="text-white">{key.rateLimit}/day</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tier Comparison */}
      <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">API Key Tiers</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { name: 'Free', price: '$0', limit: '1,000/day', features: ['Free news endpoints', 'Standard rate limit', 'No credit card required'] },
            { name: 'Pay-Per-Request', price: 'x402', limit: 'Unlimited', features: ['All premium endpoints', 'Pay in USDC on Base', 'No subscription needed'] },
          ].map((tier) => (
            <div key={tier.name} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="font-semibold text-white">{tier.name}</div>
              <div className="text-2xl font-bold text-gray-300 mb-2">{tier.price}</div>
              <div className="text-sm text-gray-500 mb-3">{tier.limit} requests</div>
              <ul className="space-y-1">
                {tier.features.map((f) => (
                  <li key={f} className="text-xs text-gray-400 flex items-center gap-1">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link href="/pricing" className="text-gray-300 hover:text-white text-sm">
            View full pricing →
          </Link>
        </div>
      </div>

      {/* Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-4">Create API Key</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Key Name</label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., My Trading Bot"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-400"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowKeyModal(false)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createApiKey}
                className="flex-1 px-4 py-3 bg-white hover:bg-gray-100 text-black rounded-lg font-semibold transition-colors"
              >
                Create
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// =============================================================================
// UTILITIES
// =============================================================================



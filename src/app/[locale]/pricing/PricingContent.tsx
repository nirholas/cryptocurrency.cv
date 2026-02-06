'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FEATURE_COMPARISON,
  PAY_PER_REQUEST,
  PREMIUM_ENDPOINTS,
  FREE_ENDPOINTS,
  ENDPOINT_CATEGORIES,
  getFreeEndpointCount,
  getPremiumEndpointCount,
  getCheapestPrice,
} from '@/lib/x402/features';

export default function PricingContent() {
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const freeCount = getFreeEndpointCount();
  const premiumCount = getPremiumEndpointCount();
  const cheapestPrice = getCheapestPrice();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 rounded-full text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            x402 Protocol Enabled
          </span>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Simple, Transparent Pricing
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            <strong>{freeCount} free endpoints</strong> for everyone. Unlock{' '}
            <strong>{premiumCount} premium endpoints</strong> with x402 pay-per-request
            starting at <strong>{cheapestPrice}</strong>. No subscriptions &mdash; pay only for what you use.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-500">{freeCount}+</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Free Endpoints</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">{premiumCount}+</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Premium Endpoints</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500">7+</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">News Sources</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500">18</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Languages</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Two-Model Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
        {/* Free Tier */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700"
        >
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Free</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Perfect for exploring the API and personal projects
            </p>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">$0</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No API key required</p>
          </div>

          <ul className="space-y-3 mb-8">
            {[
              'All free news endpoints',
              'RSS/Atom feeds',
              'Basic sentiment analysis',
              'Top 100 cryptocurrencies',
              '7 days historical data',
              'Community support',
              'No sign-up needed',
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600 dark:text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>

          <a
            href="/developers"
            className="block w-full text-center py-3 px-6 rounded-xl font-semibold transition-all bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
          >
            Get Started
          </a>
        </motion.div>

        {/* x402 Pay-Per-Request */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 ring-2 ring-amber-500 shadow-xl"
        >
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="bg-amber-500 text-black text-xs font-bold px-4 py-1 rounded-full">
              PAY AS YOU GO
            </span>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">x402 Pay-Per-Request</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No subscription needed. Pay only for what you use with USDC micropayments.
            </p>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">{cheapestPrice}</span>
              <span className="text-gray-500 dark:text-gray-400">/request</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">USDC on Base network</p>
          </div>

          <ul className="space-y-3 mb-8">
            {[
              'All premium endpoints',
              'No monthly commitment',
              'AI-powered analysis',
              'Full historical data',
              'CSV/JSON bulk exports',
              'Webhooks & price alerts',
              'Perfect for AI agents',
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600 dark:text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>

          <a
            href="/developers"
            className="block w-full text-center py-3 px-6 rounded-xl font-semibold transition-all bg-amber-500 hover:bg-amber-600 text-black"
          >
            Get Your API Key
          </a>
        </motion.div>
      </div>

      {/* Pay-Per-Request Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl p-8 md:p-12 mb-20 border border-blue-500/20"
        id="x402"
      >
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">💳</span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {PAY_PER_REQUEST.title}
              </h2>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-6">{PAY_PER_REQUEST.description}</p>

            <ul className="space-y-3 mb-8">
              {PAY_PER_REQUEST.benefits.map((benefit, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-blue-500">✓</span>
                  <span className="text-gray-600 dark:text-gray-300">{benefit}</span>
                </li>
              ))}
            </ul>

            <a
              href="/developers#x402"
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all"
            >
              Learn How It Works
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 font-mono text-sm overflow-x-auto">
            <div className="text-gray-400 mb-2"># Request premium endpoint without auth</div>
            <div className="text-green-400 mb-4">
              curl https://cryptocurrency.cv/api/v1/coins
            </div>

            <div className="text-gray-400 mb-2"># Response: 402 Payment Required</div>
            <pre className="text-blue-400 mb-4">
              {`{
  "error": "Payment Required",
  "price": "$0.001",
  "accepts": "x402",
  "payTo": "0x...",
  "network": "eip155:8453"
}`}
            </pre>

            <div className="text-gray-400 mb-2"># Pay with x402 header</div>
            <div className="text-yellow-400">
              curl -H &quot;X-PAYMENT: ...&quot; /api/v1/coins
            </div>
          </div>
        </div>
      </motion.div>

      {/* Premium Endpoints by Category */}
      <div className="mb-20">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
          Premium API Endpoints
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-8 max-w-2xl mx-auto">
          Access powerful market data, analytics, and AI features. Pay per request with x402 &mdash;
          no subscription needed.
        </p>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === null
                ? 'bg-amber-500 text-black'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            All ({premiumCount})
          </button>
          {Object.entries(ENDPOINT_CATEGORIES).map(([key, cat]) => {
            const count = PREMIUM_ENDPOINTS.filter((e) => e.category === key).length;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === key
                    ? 'bg-amber-500 text-black'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {cat.icon} {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Endpoints Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PREMIUM_ENDPOINTS.filter((e) => !selectedCategory || e.category === selectedCategory).map(
            (endpoint, i) => (
              <motion.div
                key={endpoint.path}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.02 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-amber-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <code className="text-sm font-mono text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
                    {endpoint.method}
                  </code>
                  <span className="text-green-500 font-semibold">{endpoint.price}</span>
                </div>
                <div className="font-mono text-sm text-gray-900 dark:text-white mb-2 break-all">
                  {endpoint.path}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{endpoint.description}</p>
              </motion.div>
            )
          )}
        </div>
      </div>

      {/* Free Endpoints Section */}
      <div className="mb-20">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
          🆓 Free API Endpoints
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-8 max-w-2xl mx-auto">
          These endpoints are completely free. No API key required. Just call and go!
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FREE_ENDPOINTS.slice(0, 12).map((endpoint, i) => (
            <motion.div
              key={endpoint.path}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.02 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-green-500/30 hover:border-green-500/60 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <code className="text-sm font-mono text-green-500 bg-green-500/10 px-2 py-1 rounded">
                  {endpoint.method}
                </code>
                <span className="text-green-500 font-semibold text-sm">FREE</span>
              </div>
              <div className="font-mono text-sm text-gray-900 dark:text-white mb-2">
                {endpoint.path}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{endpoint.description}</p>
              <div className="mt-2 text-xs text-gray-400">{endpoint.rateLimit}</div>
            </motion.div>
          ))}
        </div>

        {FREE_ENDPOINTS.length > 12 && (
          <div className="text-center mt-6">
            <a
              href="/developers#free-endpoints"
              className="text-amber-500 hover:text-amber-400 font-medium"
            >
              View all {FREE_ENDPOINTS.length} free endpoints →
            </a>
          </div>
        )}
      </div>

      {/* Feature Comparison Table */}
      <div className="mb-20">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
          Feature Comparison
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
          Compare what&apos;s included for free vs. premium pay-per-request access
        </p>

        <div className="overflow-x-auto">
          <table className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-4 text-gray-900 dark:text-white font-semibold">
                  Feature
                </th>
                <th className="text-center p-4 text-gray-900 dark:text-white font-semibold">Free</th>
                <th className="text-center p-4 text-amber-500 font-semibold bg-amber-500/5">Pro</th>
                <th className="text-center p-4 text-gray-900 dark:text-white font-semibold">
                  Enterprise
                </th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_COMPARISON.slice(0, showAllFeatures ? undefined : 8).map((item, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                >
                  <td className="p-4">
                    <div className="font-medium text-gray-900 dark:text-white">{item.feature}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {item.description}
                    </div>
                  </td>
                  <td className="text-center p-4">
                    <FeatureValue value={item.free} />
                  </td>
                  <td className="text-center p-4 bg-amber-500/5">
                    <FeatureValue value={item.pro} />
                  </td>
                  <td className="text-center p-4">
                    <FeatureValue value={item.enterprise} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {FEATURE_COMPARISON.length > 8 && (
          <div className="text-center mt-6">
            <button
              onClick={() => setShowAllFeatures(!showAllFeatures)}
              className="text-amber-500 hover:text-amber-400 font-medium"
            >
              {showAllFeatures
                ? 'Show less'
                : `Show all ${FEATURE_COMPARISON.length} features`}{' '}
              →
            </button>
          </div>
        )}
      </div>

      {/* FAQ Section */}
      <div className="mb-20">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
          Frequently Asked Questions
        </h2>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <FAQItem
            question="What is x402?"
            answer="x402 is an open protocol for web micropayments using cryptocurrency. It enables pay-per-request API access without subscriptions, using the HTTP 402 status code. Our API uses USDC on the Base network."
          />
          <FAQItem
            question="Do I need an API key for free endpoints?"
            answer="No! Free endpoints are completely open. Just make HTTP requests directly - no authentication required."
          />
          <FAQItem
            question="How do I pay with x402?"
            answer="When you hit a premium endpoint without auth, you get a 402 response with payment details. Use an x402-compatible wallet or SDK to sign the payment and include it in your request header."
          />
          <FAQItem
            question="Do I need a subscription?"
            answer="No! There are no subscriptions. Free endpoints are open to everyone. For premium endpoints, just pay per request with USDC via the x402 protocol."
          />
          <FAQItem
            question="What cryptocurrencies do you accept?"
            answer="We accept USDC on the Base network for x402 payments. Connect any Web3 wallet like MetaMask or Coinbase Wallet."
          />
          <FAQItem
            question="Is there an API for AI agents?"
            answer="Absolutely! x402 is perfect for AI agents. They can autonomously pay for API access without pre-configured credentials."
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 rounded-3xl p-12 border border-amber-500/20">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-xl mx-auto">
          Start with our free tier or dive into premium features. No credit card required.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="/developers"
            className="bg-amber-500 hover:bg-amber-600 text-black px-8 py-3 rounded-xl font-semibold transition-all"
          >
            Get Your API Key
          </a>
          <a
            href="/developers"
            className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-8 py-3 rounded-xl font-semibold transition-all"
          >
            Read the Docs
          </a>
        </div>
      </div>
    </div>
  );
}

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <svg
        className="w-5 h-5 text-green-500 mx-auto"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (value === false) {
    return (
      <svg
        className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }
  return <span className="text-sm text-gray-600 dark:text-gray-300">{value}</span>;
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{question}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{answer}</p>
    </div>
  );
}

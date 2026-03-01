import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Zap, ExternalLink, Code2, ShieldCheck } from 'lucide-react';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'Premium API Access — x402 Micropayments',
  description: 'Access premium crypto data endpoints by paying per request in USDC on Base. No subscription. No account. No API key required.',
  path: '/billing',
  noindex: true,
});

type Props = {
  params: Promise<{ locale: string }>;
};

const RECEIVE_ADDRESS =
  process.env.X402_RECEIVE_ADDRESS ?? '0x40252CFDF8B20Ed757D61ff157719F33Ec332402';

export default async function BillingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      <main className="pt-16 max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-7 h-7 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Premium Access
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Pay per API call in USDC on Base. No subscription. No account. No lock-in.
          </p>
        </div>

        {/* How it works */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-500" />
            How x402 works
          </h2>
          <ol className="space-y-3 text-gray-600 dark:text-gray-400">
            <li className="flex gap-3">
              <span className="font-mono text-sm bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-gray-800 dark:text-white shrink-0">1</span>
              <span>Make a request to any <code className="text-sm font-mono bg-gray-100 dark:bg-slate-700 px-1 rounded">/api/premium/*</code> endpoint without payment — get a <code className="text-sm font-mono bg-gray-100 dark:bg-slate-700 px-1 rounded">402 Payment Required</code> response.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-sm bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-gray-800 dark:text-white shrink-0">2</span>
              <span>The 402 response includes a payment payload describing the amount ($0.001 USDC), network (Base), and receive address.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-sm bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-gray-800 dark:text-white shrink-0">3</span>
              <span>Sign and broadcast the on-chain payment, then retry the request with the <code className="text-sm font-mono bg-gray-100 dark:bg-slate-700 px-1 rounded">X-Payment</code> header containing the payment proof.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-sm bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-gray-800 dark:text-white shrink-0">4</span>
              <span>The server verifies the payment on-chain and returns the data. No accounts. No tokens.</span>
            </li>
          </ol>
        </div>

        {/* Pricing */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Pricing
          </h2>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">$0.001</span>
            <span className="text-gray-500">USDC per request</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Network: Base (Ethereum L2) · Asset: USDC
          </p>
          <div className="font-mono text-xs bg-gray-50 dark:bg-slate-700 rounded-lg p-3 break-all text-gray-700 dark:text-gray-300">
            Receive address: {RECEIVE_ADDRESS}
          </div>
        </div>

        {/* Code sample */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-500" />
            Quick start (TypeScript)
          </h2>
          <pre className="text-xs bg-gray-50 dark:bg-slate-900 rounded-lg p-4 overflow-x-auto text-gray-800 dark:text-gray-200">
{`import { createClient } from '@x402/sdk';

const client = createClient({ network: 'base' });

const data = await client.fetch(
  'https://free-crypto-news.vercel.app/api/premium/ai/sentiment?coin=bitcoin',
  { wallet: yourWallet }
);`}
          </pre>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-3">
          <a
            href="https://x402.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            x402.org docs
          </a>
          <Link
            href={`/${locale}/pricing`}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            View all endpoints
          </Link>
          <Link
            href={`/${locale}/developers`}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            Developer portal
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

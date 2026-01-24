import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { WhaleAlertsDashboard } from '@/components/WhaleAlertsDashboard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Whale Alerts | Large Crypto Transactions Tracker',
  description:
    'Real-time whale transaction monitoring across Bitcoin, Ethereum, and major blockchains. Track exchange deposits, withdrawals, and whale movements.',
  openGraph: {
    title: 'Whale Alerts | Large Crypto Transactions Tracker',
    description:
      'Real-time whale transaction monitoring. See what the big players are doing.',
  },
  keywords: [
    'whale alerts',
    'crypto whales',
    'large transactions',
    'bitcoin whale',
    'ethereum whale',
    'exchange deposits',
    'whale watching',
    'blockchain transactions',
  ],
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function WhalesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      <main id="main-content" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🐋 Whale Alerts
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Real-time large cryptocurrency transactions across Bitcoin, Ethereum, and other major
            blockchains. Follow the smart money.
          </p>
        </div>

        {/* Educational Banner */}
        <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800/50 rounded-xl p-4 mb-6">
          <h2 className="font-semibold text-cyan-900 dark:text-cyan-200 mb-2 flex items-center gap-2">
            <span className="text-lg">🔍</span> What Whale Movements Tell Us
          </h2>
          <div className="grid md:grid-cols-4 gap-4 text-sm text-cyan-800 dark:text-cyan-300">
            <div>
              <strong>Exchange Deposit:</strong> Potential selling pressure - whales moving to sell
            </div>
            <div>
              <strong>Exchange Withdrawal:</strong> Bullish signal - whales taking custody
            </div>
            <div>
              <strong>Whale Transfer:</strong> Large OTC deal or wallet reorganization
            </div>
            <div>
              <strong>Smart Money:</strong> Track wallets of known successful traders
            </div>
          </div>
        </div>

        <WhaleAlertsDashboard />
      </main>
      <Footer />
    </div>
  );
}

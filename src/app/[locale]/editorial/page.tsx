import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link } from '@/i18n/navigation';
import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export function generateMetadata(): Metadata {
  return generateSEOMetadata({
    title: 'Editorial Policy',
    description: 'Our editorial standards, corrections policy, and commitment to accuracy in cryptocurrency news reporting.',
    path: '/editorial',
    tags: ['editorial policy', 'corrections', 'ethics', 'journalism standards', 'crypto news'],
  });
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function EditorialPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <Header />

        <main className="px-4 py-12 max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Editorial Policy</h1>
          <p className="text-lg text-gray-600 dark:text-slate-400 mb-10 max-w-2xl">
            Our commitment to accuracy, transparency, and editorial integrity in cryptocurrency news aggregation.
          </p>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            {/* Mission */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Our Mission</h2>
              <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
                Free Crypto News exists to make cryptocurrency news accessible to everyone — free, open, and
                without barriers. We aggregate news from 200+ trusted sources to give readers a comprehensive
                view of the crypto ecosystem without editorial bias.
              </p>
            </section>

            {/* How We Aggregate */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">How We Aggregate Content</h2>
              <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
                We are a <strong>news aggregator</strong>, not a primary news publisher. Our process:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-slate-300 space-y-2">
                <li><strong>Automated collection:</strong> We monitor RSS/Atom feeds and public APIs from 200+ sources every 5 minutes.</li>
                <li><strong>Source diversity:</strong> We include crypto-native outlets, mainstream financial media, DeFi protocols, research firms, and regulatory bodies.</li>
                <li><strong>No editorial filtering:</strong> We do not selectively suppress or promote stories based on editorial opinion. Our algorithms prioritize recency, relevance, and source credibility.</li>
                <li><strong>Attribution:</strong> Every article links back to its original source with full attribution.</li>
              </ul>
            </section>

            {/* Source Selection */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Source Selection Criteria</h2>
              <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
                We evaluate sources based on:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-slate-300 space-y-2">
                <li><strong>Reputation:</strong> Established track record in journalism or industry expertise</li>
                <li><strong>Accuracy:</strong> History of factual reporting and timely corrections</li>
                <li><strong>Transparency:</strong> Clear editorial standards and disclosure of conflicts of interest</li>
                <li><strong>Relevance:</strong> Consistent coverage of cryptocurrency and blockchain topics</li>
                <li><strong>Availability:</strong> Public RSS/Atom feeds or open APIs for automated access</li>
              </ul>
              <p className="text-gray-700 dark:text-slate-300 leading-relaxed mt-4">
                We regularly review our source list and may add or remove sources based on these criteria. If you think we should add or remove a source, please{' '}
                <Link href="/contact" className="text-amber-600 dark:text-amber-400 hover:underline">contact us</Link>.
              </p>
            </section>

            {/* AI Content */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">AI-Generated Content</h2>
              <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
                We use artificial intelligence for several features:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-slate-300 space-y-2">
                <li><strong>Article summaries:</strong> AI-generated summaries help readers quickly understand key points</li>
                <li><strong>Sentiment analysis:</strong> Automated analysis of market sentiment from news coverage</li>
                <li><strong>Categorization:</strong> Automatic tagging and categorization of articles</li>
                <li><strong>Clickbait detection:</strong> AI-powered scoring to flag potentially misleading headlines</li>
                <li><strong>Fact-checking signals:</strong> Automated cross-referencing for claim verification</li>
              </ul>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5 mt-4">
                <p className="text-blue-800 dark:text-blue-300 text-sm">
                  <strong>🤖 Transparency note:</strong> AI-generated content is labeled as such. AI can make errors — 
                  always verify important claims with the original source. We continuously improve our AI systems 
                  and appreciate reports of inaccuracies.
                </p>
              </div>
            </section>

            {/* Corrections Policy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Corrections Policy</h2>
              <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
                Accuracy matters. When errors occur:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-slate-300 space-y-2">
                <li><strong>AI-generated errors:</strong> If our AI summaries, analysis, or labels contain inaccuracies, we will update them promptly upon notification.</li>
                <li><strong>Source errors:</strong> If a source publishes a correction, our aggregate will reflect the updated content on the next fetch cycle.</li>
                <li><strong>Reporting errors:</strong> Anyone can report an error via our <Link href="/contact" className="text-amber-600 dark:text-amber-400 hover:underline">contact form</Link>, email, or by <a href="https://github.com/nirholas/free-crypto-news/issues" target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 hover:underline">opening a GitHub issue</a>.</li>
              </ul>
            </section>

            {/* Conflicts of Interest */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Conflicts of Interest</h2>
              <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
                As an automated aggregator, we have minimal editorial conflicts. However, we disclose the following:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-slate-300 space-y-2">
                <li>We do <strong>not</strong> accept payment for priority placement or promotion of stories</li>
                <li>We do <strong>not</strong> hold positions in cryptocurrencies that influence our aggregation</li>
                <li>Our ranking algorithms are based on recency, relevance, and source credibility — not sponsorship</li>
                <li>If we introduce any sponsored content in the future, it will be clearly labeled as such</li>
              </ul>
            </section>

            {/* Not Financial Advice */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Financial Disclaimer</h2>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
                <p className="text-gray-800 dark:text-slate-200 leading-relaxed">
                  ⚠️ Nothing on Free Crypto News constitutes financial advice. Cryptocurrency markets are volatile and risky.
                  Always conduct your own research (DYOR) before making investment decisions. See our{' '}
                  <Link href="/terms" className="text-amber-600 dark:text-amber-400 hover:underline">Terms of Service</Link>{' '}
                  for full details.
                </p>
              </div>
            </section>

            {/* DMCA */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">DMCA &amp; Copyright</h2>
              <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
                We respect intellectual property rights. We display headlines, excerpts, and links in accordance
                with fair use principles and the terms of public RSS/Atom feeds.
              </p>
              <p className="text-gray-700 dark:text-slate-300 leading-relaxed mt-4">
                If you believe your copyrighted material is being used improperly, please contact us at{' '}
                <a href="mailto:legal@freecryptonews.io" className="text-amber-600 dark:text-amber-400 hover:underline">legal@freecryptonews.io</a>{' '}
                with:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-slate-300 space-y-2">
                <li>Identification of the copyrighted work</li>
                <li>URL of the infringing content on our Service</li>
                <li>Your contact information</li>
                <li>A statement of good faith belief that the use is not authorized</li>
              </ul>
            </section>

            {/* Open Source */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Open Source Commitment</h2>
              <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
                Free Crypto News is fully open source under the{' '}
                <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 hover:underline">MIT License</a>.
                Our aggregation algorithms, AI prompts, source lists, and infrastructure code are all publicly accessible on{' '}
                <a href="https://github.com/nirholas/free-crypto-news" target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 hover:underline">GitHub</a>.
                This transparency means anyone can audit how information is collected, processed, and presented.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Questions?</h2>
              <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
                If you have questions about our editorial standards, want to suggest a source, or need to report an issue, please{' '}
                <Link href="/contact" className="text-amber-600 dark:text-amber-400 hover:underline">contact us</Link>.
              </p>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}

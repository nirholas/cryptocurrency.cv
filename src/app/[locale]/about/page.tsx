/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { OrganizationStructuredData } from '@/components/StructuredData';
import { generateSEOMetadata } from '@/lib/seo';
import {
  Zap,
  Brain,
  Code,
  Globe,
  Shield,
  Rss,
  Search,
  BarChart3,
  GitBranch,
  Users,
  ArrowRight,
  Star,
  Newspaper,
  Server,
  Cpu,
  CheckCircle,
  Clock,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'About Crypto Vision News',
    description:
      'Free crypto news API aggregating real-time headlines from 300+ trusted sources. No API key required. Open source and community-driven.',
    path: '/about',
    locale,
    tags: ['about', 'crypto news API', 'free API', 'cryptocurrency news aggregator', 'open source'],
  });
}

const stats = [
  { value: '300+', label: 'Sources', icon: Newspaper },
  { value: '10K+', label: 'Articles/Day', icon: TrendingUp },
  { value: '100+', label: 'Languages', icon: Globe },
  { value: '0', label: 'API Keys Required', icon: Shield },
  { value: '99.9%', label: 'Uptime', icon: Server },
  { value: '<5min', label: 'Update Frequency', icon: Clock },
];

const features = [
  {
    icon: Zap,
    title: 'Real-Time Aggregation',
    description:
      'Headlines from 300+ trusted sources updated every 5 minutes. CoinDesk, The Block, Bloomberg, Reuters, CoinTelegraph, and more.',
    color: 'text-amber-500',
  },
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description:
      'Sentiment analysis, topic classification, smart summaries, and trend detection powered by machine learning. ChatGPT plugin and Claude MCP server included.',
    color: 'text-purple-500',
  },
  {
    icon: Code,
    title: 'Developer-First API',
    description:
      'RESTful JSON API, RSS/Atom feeds, WebSocket streams, and SDKs for Python, TypeScript, Go, React, and PHP. No API key needed.',
    color: 'text-blue-500',
  },
  {
    icon: Search,
    title: 'Smart Search & Filtering',
    description:
      'Full-text search across all sources with keyword matching, category filters, date ranges, and source-level filtering.',
    color: 'text-green-500',
  },
  {
    icon: BarChart3,
    title: 'Market Context',
    description:
      'Live cryptocurrency prices, fear & greed index, market cap data, and on-chain metrics alongside every news article.',
    color: 'text-cyan-500',
  },
  {
    icon: Rss,
    title: 'Multi-Format Feeds',
    description:
      'RSS, Atom, JSON Feed, and custom webhook delivery. Embed news in any platform, app, or dashboard with zero effort.',
    color: 'text-orange-500',
  },
];

const howItWorks = [
  {
    step: 1,
    title: 'Aggregate',
    description:
      'We crawl and ingest news from 300+ crypto media outlets, wire services, and social channels every 5 minutes.',
    icon: Newspaper,
  },
  {
    step: 2,
    title: 'Analyze',
    description:
      'AI models classify topics, detect sentiment, identify breaking events, and generate concise summaries automatically.',
    icon: Brain,
  },
  {
    step: 3,
    title: 'Deliver',
    description:
      'Structured data is served via REST API, RSS feeds, WebSockets, and SDKs — ready for your app in seconds.',
    icon: Zap,
  },
];

const useCases = [
  {
    title: 'Trading Bots & Algorithms',
    description:
      'Feed real-time news signals into your trading strategy. Sentiment scores help gauge market impact instantly.',
    icon: Cpu,
  },
  {
    title: 'Portfolio Dashboards',
    description:
      'Show relevant news alongside holdings. Users stay informed without leaving your app.',
    icon: BarChart3,
  },
  {
    title: 'Research & Analytics',
    description:
      'Access historical archives for backtesting, trend analysis, and academic research on crypto markets.',
    icon: TrendingUp,
  },
  {
    title: 'AI & LLM Applications',
    description:
      'Power ChatGPT plugins, Claude MCP servers, or custom AI agents with structured crypto news data.',
    icon: Brain,
  },
];

const trustedSources = [
  'CoinDesk',
  'The Block',
  'Bloomberg',
  'Reuters',
  'CoinTelegraph',
  'Decrypt',
  'CryptoSlate',
  'The Defiant',
  'Blockworks',
  'DL News',
  'Unchained',
  'Bitcoin Magazine',
];

const techStack = [
  { name: 'Next.js', description: 'React framework' },
  { name: 'React 19', description: 'UI library' },
  { name: 'TypeScript', description: 'Type safety' },
  { name: 'Tailwind CSS', description: 'Styling' },
  { name: 'Drizzle ORM', description: 'Database' },
  { name: 'Vercel', description: 'Hosting' },
  { name: 'PostgreSQL', description: 'Data store' },
  { name: 'Redis', description: 'Caching' },
];

const roadmap = [
  { label: 'Launched', title: 'Core API & RSS Feeds', done: true },
  { label: 'Launched', title: 'SDKs (Python, TS, Go, PHP, React)', done: true },
  { label: 'Launched', title: 'ChatGPT Plugin & Claude MCP', done: true },
  { label: 'Launched', title: '100+ Language Support', done: true },
  { label: 'In Progress', title: 'AI Sentiment & Summary Engine', done: false },
  { label: 'Coming Soon', title: 'Webhooks & Real-Time Alerts', done: false },
  { label: 'Coming Soon', title: 'Pro Tier with Advanced Analytics', done: false },
  { label: 'Planned', title: 'On-Chain Data Integration', done: false },
];

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <OrganizationStructuredData />
      <main className="container-main py-10">
        {/* Hero */}
        <section className="mb-20 pt-8 text-center">
          <Badge className="mb-4">Open Source &middot; MIT License</Badge>
          <h1 className="mb-6 font-serif text-4xl leading-tight font-bold text-text-primary md:text-5xl lg:text-6xl">
            Real-time crypto news for everyone.
            <br />
            <span className="text-accent">Free. Forever.</span>
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-lg leading-relaxed text-text-secondary md:text-xl">
            The only 100% free crypto news aggregator API. No API keys, no rate limits, no hidden
            costs. Aggregating headlines from 300+ trusted sources — open source and
            community-driven.
          </p>
          <div className="mb-6 flex flex-wrap justify-center gap-4">
            <Button variant="primary" size="lg" asChild>
              <Link href="/developers">
                Get Started <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a
                href="https://github.com/nirholas/free-crypto-news"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Star className="mr-1 h-4 w-4" /> Star on GitHub
              </a>
            </Button>
          </div>
          <p className="text-xs text-text-tertiary">
            No credit card &middot; No sign-up &middot; Start in 30 seconds
          </p>
        </section>

        {/* Stats */}
        <section className="mb-20">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="group rounded-xl border border-border bg-surface-secondary p-5 text-center transition-colors hover:border-accent/50"
                >
                  <Icon className="mx-auto mb-2 h-5 w-5 text-accent opacity-70 transition-opacity group-hover:opacity-100" />
                  <div className="mb-0.5 text-2xl font-bold text-text-primary md:text-3xl">
                    {stat.value}
                  </div>
                  <div className="text-xs font-medium tracking-wider text-text-secondary uppercase">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-20">
          <h2 className="mb-3 text-center font-serif text-2xl font-bold text-text-primary md:text-3xl">
            How It Works
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-text-secondary">
            From source to your app in three simple steps.
          </p>
          <div className="relative mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {/* Connecting line (desktop) */}
            <div className="absolute top-12 right-[20%] left-[20%] hidden h-px bg-border md:block" />
            {howItWorks.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative text-center">
                  <div className="relative z-10 mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="mb-1 text-xs font-bold tracking-wider text-accent uppercase">
                    Step {step.step}
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-text-primary">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Features */}
        <section className="mb-20">
          <h2 className="mb-3 text-center font-serif text-2xl font-bold text-text-primary md:text-3xl">
            Everything You Need
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-text-secondary">
            A complete toolkit for crypto news — built for developers, researchers, traders, and AI
            applications.
          </p>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.title} className="group">
                  <CardContent className="p-6">
                    <div
                      className={cn(
                        'mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-surface-secondary transition-transform group-hover:scale-110',
                        f.color,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-2 text-base font-bold text-text-primary">
                      {f.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-text-secondary">
                      {f.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Use Cases */}
        <section className="mb-20">
          <h2 className="mb-3 text-center font-serif text-2xl font-bold text-text-primary md:text-3xl">
            Built For Every Use Case
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-text-secondary">
            From algorithmic trading to academic research — our API powers thousands of
            applications.
          </p>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            {useCases.map((uc) => {
              const Icon = uc.icon;
              return (
                <div
                  key={uc.title}
                  className="flex gap-4 rounded-xl border border-border bg-surface-secondary p-6 transition-colors hover:border-accent/40"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-bold text-text-primary">
                      {uc.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-text-secondary">
                      {uc.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Trusted Sources */}
        <section className="mb-20">
          <h2 className="mb-3 text-center font-serif text-2xl font-bold text-text-primary md:text-3xl">
            Trusted Sources
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-center text-text-secondary">
            We aggregate from the most reputable crypto and financial news outlets worldwide. Learn
            more about our sourcing methodology in our{' '}
            <a
              href="/editorial-policy"
              className="text-accent underline hover:opacity-80"
            >
              Editorial Policy
            </a>
            .
          </p>
          <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-3">
            {trustedSources.map((source) => (
              <span
                key={source}
                className="inline-flex items-center rounded-full border border-border bg-surface-secondary px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary"
              >
                {source}
              </span>
            ))}
            <span className="inline-flex items-center rounded-full border border-dashed border-border px-4 py-2 text-sm text-text-tertiary">
              +288 more
            </span>
          </div>
        </section>

        {/* Open Source */}
        <section className="mb-20">
          <div className="overflow-hidden rounded-xl border border-border bg-surface-secondary">
            <div className="grid md:grid-cols-2">
              <div className="flex flex-col justify-center p-8 md:p-12">
                <div className="mb-4 flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-accent" />
                  <Badge>MIT License</Badge>
                </div>
                <h2 className="mb-4 font-serif text-2xl font-bold text-text-primary md:text-3xl">
                  Open Source &amp; Community-Driven
                </h2>
                <p className="mb-6 leading-relaxed text-text-secondary">
                  Every line of code is public. Inspect it, self-host it, fork it, or contribute
                  back. We believe crypto infrastructure should be transparent and owned by the
                  community.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" asChild>
                    <a
                      href="https://github.com/nirholas/free-crypto-news"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-1 h-4 w-4" /> View on GitHub
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a
                      href="https://github.com/nirholas/free-crypto-news/issues"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Report an Issue
                    </a>
                  </Button>
                </div>
              </div>
              <div className="border-t border-border bg-(--color-surface) p-8 md:border-t-0 md:border-l md:p-12">
                <h3 className="mb-5 text-sm font-bold tracking-wider text-text-tertiary uppercase">
                  Ways to Contribute
                </h3>
                <ul className="space-y-4">
                  {[
                    {
                      label: 'Add a new news source',
                      desc: 'Expand our coverage to new outlets and regions',
                    },
                    {
                      label: 'Submit a pull request',
                      desc: 'Fix bugs, improve performance, add features',
                    },
                    {
                      label: 'Translate the interface',
                      desc: 'Help us reach users in 100+ languages',
                    },
                    { label: 'Report issues', desc: 'Found a bug? Let us know on GitHub Issues' },
                    {
                      label: 'Improve documentation',
                      desc: 'Better docs help everyone build faster',
                    },
                  ].map((item) => (
                    <li key={item.label} className="flex gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                      <div>
                        <div className="text-sm font-medium text-text-primary">
                          {item.label}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {item.desc}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Community */}
        <section className="mx-auto mb-20 max-w-3xl text-center">
          <Users className="mx-auto mb-4 h-8 w-8 text-accent" />
          <h2 className="mb-4 font-serif text-2xl font-bold text-text-primary md:text-3xl">
            Built by the Community
          </h2>
          <p className="mb-6 leading-relaxed text-text-secondary">
            Crypto Vision News is maintained by a global community of open source contributors.
            Whether you&apos;re fixing a bug, adding a new source, translating the interface, or
            improving documentation — every contribution matters.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="primary" asChild>
              <Link href="/team">
                <Users className="mr-1 h-4 w-4" /> Meet the Team
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a
                href="https://github.com/nirholas/free-crypto-news/graphs/contributors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Users className="mr-1 h-4 w-4" /> View Contributors on GitHub
              </a>
            </Button>
          </div>
        </section>

        {/* Roadmap */}
        <section className="mx-auto mb-20 max-w-3xl">
          <h2 className="mb-3 text-center font-serif text-2xl font-bold text-text-primary md:text-3xl">
            Roadmap
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-text-secondary">
            Where we&apos;ve been and where we&apos;re headed.
          </p>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute top-0 bottom-0 left-5 w-px bg-border" />
            <div className="space-y-6">
              {roadmap.map((item, i) => (
                <div key={i} className="relative flex gap-4">
                  <div
                    className={cn(
                      'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2',
                      item.done
                        ? 'border-green-500 bg-green-500/10 text-green-500'
                        : item.label === 'In Progress'
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border bg-surface-secondary text-text-tertiary',
                    )}
                  >
                    {item.done ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : item.label === 'In Progress' ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-current" />
                    )}
                  </div>
                  <div className="pt-2">
                    <div className="mb-0.5 flex items-center gap-2">
                      <span className="text-sm font-bold text-text-primary">
                        {item.title}
                      </span>
                      <Badge
                        className={cn(
                          'px-1.5 py-0 text-[10px]',
                          item.done
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                            : item.label === 'In Progress'
                              ? 'bg-accent/10 text-accent'
                              : '',
                        )}
                      >
                        {item.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="mb-20">
          <h2 className="mb-8 text-center font-serif text-2xl font-bold text-text-primary">
            Tech Stack
          </h2>
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {techStack.map((tech) => (
              <div
                key={tech.name}
                className="rounded-lg border border-border bg-surface-secondary p-4 text-center transition-colors hover:border-accent/40"
              >
                <div className="text-sm font-bold text-text-primary">
                  {tech.name}
                </div>
                <div className="mt-0.5 text-xs text-text-tertiary">
                  {tech.description}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mb-10">
          <div className="rounded-xl bg-accent p-8 text-center text-white md:p-12">
            <h2 className="mb-3 font-serif text-2xl font-bold md:text-3xl">
              Ready to Get Started?
            </h2>
            <p className="mx-auto mb-6 max-w-xl text-white/80">
              Start building with the world&apos;s only truly free crypto news API. No sign-up
              required — just send your first request.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                asChild
                className="border-white bg-white text-accent hover:bg-white/90"
              >
                <Link href="/developers">
                  Read the Docs <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="border-white/40 text-white hover:bg-white/10"
              >
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

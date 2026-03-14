import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { OrganizationStructuredData } from "@/components/StructuredData";
import { generateSEOMetadata } from "@/lib/seo";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "About Crypto Vision News",
    description:
      "Free crypto news API aggregating real-time headlines from 300+ trusted sources. No API key required. Open source and community-driven.",
    path: "/about",
    locale,
    tags: ["about", "crypto news API", "free API", "cryptocurrency news aggregator", "open source"],
  });
}

const stats = [
  { value: "300+", label: "Sources", icon: Newspaper },
  { value: "10K+", label: "Articles/Day", icon: TrendingUp },
  { value: "100+", label: "Languages", icon: Globe },
  { value: "0", label: "API Keys Required", icon: Shield },
  { value: "99.9%", label: "Uptime", icon: Server },
  { value: "<5min", label: "Update Frequency", icon: Clock },
];

const features = [
  {
    icon: Zap,
    title: "Real-Time Aggregation",
    description:
      "Headlines from 300+ trusted sources updated every 5 minutes. CoinDesk, The Block, Bloomberg, Reuters, CoinTelegraph, and more.",
    color: "text-amber-500",
  },
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description:
      "Sentiment analysis, topic classification, smart summaries, and trend detection powered by machine learning. ChatGPT plugin and Claude MCP server included.",
    color: "text-purple-500",
  },
  {
    icon: Code,
    title: "Developer-First API",
    description:
      "RESTful JSON API, RSS/Atom feeds, WebSocket streams, and SDKs for Python, TypeScript, Go, React, and PHP. No API key needed.",
    color: "text-blue-500",
  },
  {
    icon: Search,
    title: "Smart Search & Filtering",
    description:
      "Full-text search across all sources with keyword matching, category filters, date ranges, and source-level filtering.",
    color: "text-green-500",
  },
  {
    icon: BarChart3,
    title: "Market Context",
    description:
      "Live cryptocurrency prices, fear & greed index, market cap data, and on-chain metrics alongside every news article.",
    color: "text-cyan-500",
  },
  {
    icon: Rss,
    title: "Multi-Format Feeds",
    description:
      "RSS, Atom, JSON Feed, and custom webhook delivery. Embed news in any platform, app, or dashboard with zero effort.",
    color: "text-orange-500",
  },
];

const howItWorks = [
  {
    step: 1,
    title: "Aggregate",
    description: "We crawl and ingest news from 300+ crypto media outlets, wire services, and social channels every 5 minutes.",
    icon: Newspaper,
  },
  {
    step: 2,
    title: "Analyze",
    description: "AI models classify topics, detect sentiment, identify breaking events, and generate concise summaries automatically.",
    icon: Brain,
  },
  {
    step: 3,
    title: "Deliver",
    description: "Structured data is served via REST API, RSS feeds, WebSockets, and SDKs — ready for your app in seconds.",
    icon: Zap,
  },
];

const useCases = [
  {
    title: "Trading Bots & Algorithms",
    description: "Feed real-time news signals into your trading strategy. Sentiment scores help gauge market impact instantly.",
    icon: Cpu,
  },
  {
    title: "Portfolio Dashboards",
    description: "Show relevant news alongside holdings. Users stay informed without leaving your app.",
    icon: BarChart3,
  },
  {
    title: "Research & Analytics",
    description: "Access historical archives for backtesting, trend analysis, and academic research on crypto markets.",
    icon: TrendingUp,
  },
  {
    title: "AI & LLM Applications",
    description: "Power ChatGPT plugins, Claude MCP servers, or custom AI agents with structured crypto news data.",
    icon: Brain,
  },
];

const trustedSources = [
  "CoinDesk", "The Block", "Bloomberg", "Reuters", "CoinTelegraph",
  "Decrypt", "CryptoSlate", "The Defiant", "Blockworks", "DL News",
  "Unchained", "Bitcoin Magazine",
];

const techStack = [
  { name: "Next.js", description: "React framework" },
  { name: "React 19", description: "UI library" },
  { name: "TypeScript", description: "Type safety" },
  { name: "Tailwind CSS", description: "Styling" },
  { name: "Drizzle ORM", description: "Database" },
  { name: "Vercel", description: "Hosting" },
  { name: "PostgreSQL", description: "Data store" },
  { name: "Redis", description: "Caching" },
];

const roadmap = [
  { label: "Launched", title: "Core API & RSS Feeds", done: true },
  { label: "Launched", title: "SDKs (Python, TS, Go, PHP, React)", done: true },
  { label: "Launched", title: "ChatGPT Plugin & Claude MCP", done: true },
  { label: "Launched", title: "100+ Language Support", done: true },
  { label: "In Progress", title: "AI Sentiment & Summary Engine", done: false },
  { label: "Coming Soon", title: "Webhooks & Real-Time Alerts", done: false },
  { label: "Coming Soon", title: "Pro Tier with Advanced Analytics", done: false },
  { label: "Planned", title: "On-Chain Data Integration", done: false },
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
        <section className="text-center mb-20 pt-8">
          <Badge className="mb-4">Open Source &middot; MIT License</Badge>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-[var(--color-text-primary)] leading-tight">
            Real-time crypto news for everyone.
            <br />
            <span className="text-[var(--color-accent)]">Free. Forever.</span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto mb-8 leading-relaxed">
            The only 100% free crypto news aggregator API. No API keys, no rate
            limits, no hidden costs. Aggregating headlines from 300+ trusted
            sources — open source and community-driven.
          </p>
          <div className="flex gap-4 justify-center flex-wrap mb-6">
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
          <p className="text-xs text-[var(--color-text-tertiary)]">
            No credit card &middot; No sign-up &middot; Start in 30 seconds
          </p>
        </section>

        {/* Stats */}
        <section className="mb-20">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-5 text-center group hover:border-[var(--color-accent)]/50 transition-colors"
                >
                  <Icon className="h-5 w-5 text-[var(--color-accent)] mx-auto mb-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                  <div className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-0.5">
                    {stat.value}
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] font-medium uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-20">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-center mb-3 text-[var(--color-text-primary)]">
            How It Works
          </h2>
          <p className="text-[var(--color-text-secondary)] text-center max-w-2xl mx-auto mb-12">
            From source to your app in three simple steps.
          </p>
          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-[var(--color-border)]" />
            {howItWorks.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="text-center relative">
                  <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-[var(--color-accent)] text-white mb-4 relative z-10">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-xs font-bold text-[var(--color-accent)] uppercase tracking-wider mb-1">
                    Step {step.step}
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-[var(--color-text-primary)]">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Features */}
        <section className="mb-20">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-center mb-3 text-[var(--color-text-primary)]">
            Everything You Need
          </h2>
          <p className="text-[var(--color-text-secondary)] text-center max-w-2xl mx-auto mb-10">
            A complete toolkit for crypto news — built for developers, researchers, traders, and AI applications.
          </p>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.title} className="group">
                  <CardContent className="p-6">
                    <div className={cn("inline-flex items-center justify-center h-10 w-10 rounded-lg bg-[var(--color-surface-secondary)] mb-4 group-hover:scale-110 transition-transform", f.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-base mb-2 text-[var(--color-text-primary)]">
                      {f.title}
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
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
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-center mb-3 text-[var(--color-text-primary)]">
            Built For Every Use Case
          </h2>
          <p className="text-[var(--color-text-secondary)] text-center max-w-2xl mx-auto mb-10">
            From algorithmic trading to academic research — our API powers thousands of applications.
          </p>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {useCases.map((uc) => {
              const Icon = uc.icon;
              return (
                <div
                  key={uc.title}
                  className="flex gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-6 hover:border-[var(--color-accent)]/40 transition-colors"
                >
                  <div className="shrink-0 h-11 w-11 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm mb-1 text-[var(--color-text-primary)]">
                      {uc.title}
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
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
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-center mb-3 text-[var(--color-text-primary)]">
            Trusted Sources
          </h2>
          <p className="text-[var(--color-text-secondary)] text-center max-w-2xl mx-auto mb-8">
            We aggregate from the most reputable crypto and financial news outlets worldwide.
            Learn more about our sourcing methodology in our{" "}
            <a href="/editorial-policy" className="text-[var(--color-accent)] underline hover:opacity-80">Editorial Policy</a>.
          </p>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {trustedSources.map((source) => (
              <span
                key={source}
                className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-text-primary)] transition-colors"
              >
                {source}
              </span>
            ))}
            <span className="inline-flex items-center rounded-full border border-dashed border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-tertiary)]">
              +288 more
            </span>
          </div>
        </section>

        {/* Open Source */}
        <section className="mb-20">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-4">
                  <GitBranch className="h-5 w-5 text-[var(--color-accent)]" />
                  <Badge>MIT License</Badge>
                </div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4 text-[var(--color-text-primary)]">
                  Open Source &amp; Community-Driven
                </h2>
                <p className="text-[var(--color-text-secondary)] mb-6 leading-relaxed">
                  Every line of code is public. Inspect it, self-host it, fork it, or contribute back.
                  We believe crypto infrastructure should be transparent and owned by the community.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Button variant="primary" asChild>
                    <a href="https://github.com/nirholas/free-crypto-news" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-4 w-4" /> View on GitHub
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="https://github.com/nirholas/free-crypto-news/issues" target="_blank" rel="noopener noreferrer">
                      Report an Issue
                    </a>
                  </Button>
                </div>
              </div>
              <div className="p-8 md:p-12 bg-[var(--color-surface)] border-t md:border-t-0 md:border-l border-[var(--color-border)]">
                <h3 className="font-bold text-sm uppercase tracking-wider text-[var(--color-text-tertiary)] mb-5">
                  Ways to Contribute
                </h3>
                <ul className="space-y-4">
                  {[
                    { label: "Add a new news source", desc: "Expand our coverage to new outlets and regions" },
                    { label: "Submit a pull request", desc: "Fix bugs, improve performance, add features" },
                    { label: "Translate the interface", desc: "Help us reach users in 100+ languages" },
                    { label: "Report issues", desc: "Found a bug? Let us know on GitHub Issues" },
                    { label: "Improve documentation", desc: "Better docs help everyone build faster" },
                  ].map((item) => (
                    <li key={item.label} className="flex gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-[var(--color-text-primary)]">{item.label}</div>
                        <div className="text-xs text-[var(--color-text-secondary)]">{item.desc}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Community */}
        <section className="mb-20 max-w-3xl mx-auto text-center">
          <Users className="h-8 w-8 text-[var(--color-accent)] mx-auto mb-4" />
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4 text-[var(--color-text-primary)]">
            Built by the Community
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-6 leading-relaxed">
            Crypto Vision News is maintained by a global community of open source
            contributors. Whether you&apos;re fixing a bug, adding a new source,
            translating the interface, or improving documentation — every
            contribution matters.
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <Button variant="primary" asChild>
              <Link href="/team">
                <Users className="mr-1 h-4 w-4" /> Meet the Team
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://github.com/nirholas/free-crypto-news/graphs/contributors" target="_blank" rel="noopener noreferrer">
                <Users className="mr-1 h-4 w-4" /> View Contributors on GitHub
              </a>
            </Button>
          </div>
        </section>

        {/* Roadmap */}
        <section className="mb-20 max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-center mb-3 text-[var(--color-text-primary)]">
            Roadmap
          </h2>
          <p className="text-[var(--color-text-secondary)] text-center max-w-2xl mx-auto mb-10">
            Where we&apos;ve been and where we&apos;re headed.
          </p>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-[var(--color-border)]" />
            <div className="space-y-6">
              {roadmap.map((item, i) => (
                <div key={i} className="flex gap-4 relative">
                  <div className={cn(
                    "relative z-10 h-10 w-10 rounded-full flex items-center justify-center shrink-0 border-2",
                    item.done
                      ? "bg-green-500/10 border-green-500 text-green-500"
                      : item.label === "In Progress"
                        ? "bg-[var(--color-accent)]/10 border-[var(--color-accent)] text-[var(--color-accent)]"
                        : "bg-[var(--color-surface-secondary)] border-[var(--color-border)] text-[var(--color-text-tertiary)]"
                  )}>
                    {item.done ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : item.label === "In Progress" ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-current" />
                    )}
                  </div>
                  <div className="pt-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-sm text-[var(--color-text-primary)]">{item.title}</span>
                      <Badge className={cn(
                        "text-[10px] px-1.5 py-0",
                        item.done
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : item.label === "In Progress"
                            ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                            : ""
                      )}>
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
          <h2 className="font-serif text-2xl font-bold text-center mb-8 text-[var(--color-text-primary)]">
            Tech Stack
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {techStack.map((tech) => (
              <div
                key={tech.name}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-4 text-center hover:border-[var(--color-accent)]/40 transition-colors"
              >
                <div className="font-bold text-sm text-[var(--color-text-primary)]">{tech.name}</div>
                <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{tech.description}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mb-10">
          <div className="rounded-xl bg-[var(--color-accent)] p-8 md:p-12 text-center text-white">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-3">
              Ready to Get Started?
            </h2>
            <p className="text-white/80 max-w-xl mx-auto mb-6">
              Start building with the world&apos;s only truly free crypto news API.
              No sign-up required — just send your first request.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button variant="outline" size="lg" asChild className="bg-white text-[var(--color-accent)] border-white hover:bg-white/90">
                <Link href="/developers">
                  Read the Docs <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="border-white/40 text-white hover:bg-white/10">
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

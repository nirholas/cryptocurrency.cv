import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { generateSEOMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import {
  Check,
  X,
  Minus,
  Zap,
  Shield,
  Crown,
  Headphones,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Globe,
  Rss,
  Search,
  BarChart3,
  Brain,
  Clock,
  Code,
  Server,
  Users,
  HelpCircle,
  Star,
  Heart,
  GitBranch,
} from "lucide-react";
import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Pricing — Free Crypto News",
    description:
      "Free Crypto News is 100% free. No API keys, no rate limits, no hidden costs. Unlimited access to real-time crypto news.",
    path: "/pricing",
    locale,
    tags: ["pricing", "free API", "crypto news API", "no rate limits"],
  });
}

type Feature = {
  text: string;
  icon: LucideIcon;
  included: boolean;
};

type Tier = {
  name: string;
  icon: LucideIcon;
  price: string;
  period: string;
  description: string;
  highlight: boolean;
  badge?: string;
  color: string;
  features: Feature[];
  cta: { text: string; href: string; variant: "primary" | "outline"; external?: boolean; disabled?: boolean };
};

const tiers: Tier[] = [
  {
    name: "Free",
    icon: Zap,
    price: "$0",
    period: "forever",
    description: "Everything you need to get started — no strings attached.",
    highlight: true,
    color: "text-[var(--color-accent)]",
    features: [
      { text: "No API key required", icon: Shield, included: true },
      { text: "300+ news sources", icon: Globe, included: true },
      { text: "RSS & Atom feeds", icon: Rss, included: true },
      { text: "Full REST API access", icon: Code, included: true },
      { text: "Search & filtering", icon: Search, included: true },
      { text: "Category endpoints", icon: BarChart3, included: true },
      { text: "Breaking & trending news", icon: Zap, included: true },
      { text: "Community support", icon: Users, included: true },
    ],
    cta: { text: "Get Started Free", href: "/developers", variant: "primary" },
  },
  {
    name: "Pro",
    icon: Sparkles,
    price: "$29",
    period: "mo",
    description: "Advanced features for power users and teams.",
    highlight: false,
    badge: "Coming Soon",
    color: "text-violet-500",
    features: [
      { text: "Everything in Free", icon: Check, included: true },
      { text: "AI-powered analysis", icon: Brain, included: true },
      { text: "Historical archive (90 days)", icon: Clock, included: true },
      { text: "Webhook notifications", icon: Server, included: true },
      { text: "Priority support", icon: Headphones, included: true },
      { text: "Custom feed builder", icon: Code, included: true },
      { text: "Higher rate limits", icon: Zap, included: true },
      { text: "Advanced analytics dashboard", icon: BarChart3, included: true },
    ],
    cta: { text: "Join Waitlist", href: "#", variant: "outline", disabled: true },
  },
  {
    name: "Enterprise",
    icon: Crown,
    price: "Custom",
    period: "",
    description: "Tailored solutions for organizations at scale.",
    highlight: false,
    color: "text-amber-500",
    features: [
      { text: "Everything in Pro", icon: Check, included: true },
      { text: "Custom integrations", icon: Code, included: true },
      { text: "SLA guarantee (99.9%)", icon: Shield, included: true },
      { text: "Dedicated support engineer", icon: Headphones, included: true },
      { text: "On-premise deployment", icon: Server, included: true },
      { text: "Unlimited data retention", icon: Clock, included: true },
      { text: "White-label option", icon: Star, included: true },
      { text: "Volume discounts", icon: Users, included: true },
    ],
    cta: { text: "Contact Sales", href: "/contact", variant: "outline" },
  },
];

type ComparisonCell = {
  value: string;
  type: "check" | "cross" | "dash" | "text";
};

type ComparisonRow = {
  name: string;
  icon: LucideIcon;
  free: ComparisonCell;
  pro: ComparisonCell;
  enterprise: ComparisonCell;
};

const comparisonFeatures: ComparisonRow[] = [
  { name: "News sources", icon: Globe, free: { value: "300+", type: "text" }, pro: { value: "300+", type: "text" }, enterprise: { value: "Custom", type: "text" } },
  { name: "API access", icon: Code, free: { value: "✓", type: "check" }, pro: { value: "✓", type: "check" }, enterprise: { value: "✓", type: "check" } },
  { name: "RSS/Atom feeds", icon: Rss, free: { value: "✓", type: "check" }, pro: { value: "✓", type: "check" }, enterprise: { value: "✓", type: "check" } },
  { name: "API key required", icon: Shield, free: { value: "No", type: "text" }, pro: { value: "Yes", type: "text" }, enterprise: { value: "Yes", type: "text" } },
  { name: "Search & filtering", icon: Search, free: { value: "✓", type: "check" }, pro: { value: "✓", type: "check" }, enterprise: { value: "✓", type: "check" } },
  { name: "AI analysis", icon: Brain, free: { value: "—", type: "dash" }, pro: { value: "✓", type: "check" }, enterprise: { value: "✓", type: "check" } },
  { name: "Historical archive", icon: Clock, free: { value: "—", type: "dash" }, pro: { value: "90 days", type: "text" }, enterprise: { value: "Unlimited", type: "text" } },
  { name: "Webhooks", icon: Server, free: { value: "—", type: "dash" }, pro: { value: "✓", type: "check" }, enterprise: { value: "✓", type: "check" } },
  { name: "Analytics dashboard", icon: BarChart3, free: { value: "—", type: "dash" }, pro: { value: "✓", type: "check" }, enterprise: { value: "✓", type: "check" } },
  { name: "Custom integrations", icon: Code, free: { value: "—", type: "dash" }, pro: { value: "—", type: "dash" }, enterprise: { value: "✓", type: "check" } },
  { name: "SLA guarantee", icon: Shield, free: { value: "—", type: "dash" }, pro: { value: "—", type: "dash" }, enterprise: { value: "99.9%", type: "text" } },
  { name: "Support", icon: Headphones, free: { value: "Community", type: "text" }, pro: { value: "Priority", type: "text" }, enterprise: { value: "Dedicated", type: "text" } },
];

function ComparisonCellValue({ cell }: { cell: ComparisonCell }) {
  if (cell.type === "check") {
    return <Check className="h-4 w-4 text-green-500 mx-auto" />;
  }
  if (cell.type === "cross") {
    return <X className="h-4 w-4 text-red-400 mx-auto" />;
  }
  if (cell.type === "dash") {
    return <Minus className="h-4 w-4 text-[var(--color-text-tertiary)] mx-auto" />;
  }
  return <span>{cell.value}</span>;
}

const faqs = [
  {
    question: "Is the Free tier really free with no catch?",
    answer:
      "Yes! Our Free tier is and always will be 100% free. No credit card required, no API key, no trial period, no hidden costs. We're funded by optional premium tiers and we believe in keeping crypto news open and accessible for everyone.",
  },
  {
    question: "Do I need to register or get an API key?",
    answer:
      "Not for the Free tier. You can access all free endpoints immediately without any sign-up. Just point your HTTP client at our API and start fetching data. Pro and Enterprise tiers will require authentication for tracking usage and providing personalized features.",
  },
  {
    question: "What happens to my Free tier access when Pro launches?",
    answer:
      "Nothing changes. The Free tier will remain exactly as it is — same features, same access, same zero cost. Pro adds premium features on top. We will never degrade or restrict the Free tier.",
  },
  {
    question: "Can I switch between plans at any time?",
    answer:
      "Yes, you'll be able to upgrade or downgrade at any time once paid tiers are available. Changes take effect at the start of your next billing cycle, and we'll prorate any differences.",
  },
  {
    question: "Are there rate limits on the Free tier?",
    answer:
      "The Free tier has generous rate limits designed to support most use cases including production applications. If you need significantly higher throughput or guaranteed SLAs, Pro or Enterprise plans will be the better fit.",
  },
  {
    question: "Can I self-host instead of paying for a plan?",
    answer:
      "Absolutely! The entire project is open source under the MIT license. You can deploy your own instance using Docker, Vercel, or Railway.",
  },
  {
    question: "What payment methods will be accepted for Pro?",
    answer:
      "We plan to accept all major credit cards and potentially cryptocurrency payments. Details will be announced when Pro launches.",
  },
];

const trustPoints = [
  { icon: Heart, label: "Open Source", description: "MIT licensed, fully transparent" },
  { icon: Shield, label: "No Lock-in", description: "Fork it if we ever change" },
  { icon: GitBranch, label: "13K+ Stars", description: "Trusted by developers" },
  { icon: Globe, label: "99.9% Uptime", description: "Reliable infrastructure" },
];

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Hero */}
        <section className="text-center mb-14 pt-6">
          <Badge className="mb-4">
            <Zap className="h-3 w-3 mr-1" /> Simple Pricing
          </Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-[var(--color-text-primary)]">
            Start free. Scale when you&apos;re ready.
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            No tricks, no paywalls. Our core API is free forever — upgrade only
            when you need advanced features.
          </p>

          {/* Trust Points */}
          <div className="flex flex-wrap gap-4 sm:gap-6 justify-center mt-8">
            {trustPoints.map((point) => {
              const Icon = point.icon;
              return (
                <div key={point.label} className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                  <Icon className="h-4 w-4 text-[var(--color-accent)]" />
                  <div className="text-left">
                    <div className="font-semibold text-[var(--color-text-primary)]">{point.label}</div>
                    <div className="text-[10px]">{point.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="mb-16">
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto items-stretch">
            {tiers.map((tier) => {
              const TierIcon = tier.icon;
              return (
                <Card
                  key={tier.name}
                  className={cn(
                    "flex flex-col relative overflow-hidden",
                    tier.highlight
                      ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]"
                      : ""
                  )}
                >
                  {tier.highlight && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-[var(--color-accent)] to-blue-400" />
                  )}
                  <CardContent className="p-8 flex flex-col flex-1">
                    {tier.badge && (
                      <Badge className="absolute -top-0 right-4 top-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                        {tier.badge}
                      </Badge>
                    )}
                    {tier.highlight && (
                      <Badge className="absolute top-3 left-4 bg-[var(--color-accent)] text-white">
                        Most Popular
                      </Badge>
                    )}

                    <div className={cn("h-10 w-10 rounded-lg bg-[var(--color-surface-secondary)] flex items-center justify-center mb-4 mt-4", tier.color)}>
                      <TierIcon className="h-5 w-5" />
                    </div>

                    <h2 className="font-serif text-2xl font-bold mb-1 text-[var(--color-text-primary)]">
                      {tier.name}
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-5">
                      {tier.description}
                    </p>

                    <div className="mb-6">
                      <span className="text-4xl font-bold text-[var(--color-text-primary)]">
                        {tier.price}
                      </span>
                      {tier.period && (
                        <span className="text-sm text-[var(--color-text-tertiary)] ml-1">
                          / {tier.period}
                        </span>
                      )}
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {tier.features.map((f) => {
                        const FeatIcon = f.icon;
                        return (
                          <li
                            key={f.text}
                            className="flex items-start gap-2.5 text-sm text-[var(--color-text-secondary)]"
                          >
                            <FeatIcon className={cn("h-4 w-4 mt-0.5 shrink-0", f.included ? "text-green-500" : "text-[var(--color-text-tertiary)]")} />
                            {f.text}
                          </li>
                        );
                      })}
                    </ul>

                    {tier.cta.disabled ? (
                      <Button variant={tier.cta.variant} size="lg" disabled className="w-full">
                        {tier.cta.text}
                      </Button>
                    ) : tier.cta.external ? (
                      <Button variant={tier.cta.variant} size="lg" asChild className="w-full">
                        <a href={tier.cta.href} target="_blank" rel="noopener noreferrer">
                          {tier.cta.text} <ArrowRight className="ml-1 h-4 w-4" />
                        </a>
                      </Button>
                    ) : (
                      <Button variant={tier.cta.variant} size="lg" asChild className="w-full">
                        <Link href={tier.cta.href}>
                          {tier.cta.text} <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Free Forever Guarantee */}
        <section className="mb-16">
          <div className="rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 p-8 md:p-10 max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="h-14 w-14 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                <Shield className="h-7 w-7 text-[var(--color-accent)]" />
              </div>
              <div className="text-center sm:text-left">
                <h2 className="font-serif text-xl font-bold mb-2 text-[var(--color-text-primary)]">
                  Free Forever Guarantee
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Our Free tier will never be taken away, degraded, or restricted.
                  We&apos;re committed to keeping crypto news accessible to everyone.
                  The project is open source — if anything changes, fork it and run your own instance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="mb-16 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <BarChart3 className="h-6 w-6 text-[var(--color-accent)] mx-auto mb-3" />
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
              Feature Comparison
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">
              See exactly what&apos;s included in each plan.
            </p>
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[var(--color-border)]">
                    <th className="py-4 px-5 text-left font-medium text-[var(--color-text-secondary)]">
                      Feature
                    </th>
                    <th className="py-4 px-5 text-center">
                      <div className="font-bold text-[var(--color-accent)]">Free</div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)] font-normal">$0/forever</div>
                    </th>
                    <th className="py-4 px-5 text-center">
                      <div className="font-bold text-violet-500">Pro</div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)] font-normal">$29/mo</div>
                    </th>
                    <th className="py-4 px-5 text-center">
                      <div className="font-bold text-amber-500">Enterprise</div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)] font-normal">Custom</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((row, i) => {
                    const RowIcon = row.icon;
                    return (
                      <tr
                        key={row.name}
                        className={cn(
                          "border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-tertiary)]",
                          i % 2 === 0 && "bg-[var(--color-surface-secondary)]"
                        )}
                      >
                        <td className="py-3 px-5 text-[var(--color-text-primary)] font-medium">
                          <div className="flex items-center gap-2">
                            <RowIcon className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                            {row.name}
                          </div>
                        </td>
                        <td className="py-3 px-5 text-center text-[var(--color-text-secondary)]">
                          <ComparisonCellValue cell={row.free} />
                        </td>
                        <td className="py-3 px-5 text-center text-[var(--color-text-secondary)]">
                          <ComparisonCellValue cell={row.pro} />
                        </td>
                        <td className="py-3 px-5 text-center text-[var(--color-text-secondary)]">
                          <ComparisonCellValue cell={row.enterprise} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>

        {/* What You Get for Free */}
        <section className="mb-16 max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <Sparkles className="h-6 w-6 text-[var(--color-accent)] mx-auto mb-3" />
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
              All This, Completely Free
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">
              No sign-up, no API key, no credit card. Start building in seconds.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Globe, title: "300+ Sources", desc: "CoinDesk, The Block, Bloomberg, Reuters, and hundreds more" },
              { icon: Rss, title: "RSS & Atom", desc: "Subscribe to feeds in your favorite reader or app" },
              { icon: Code, title: "REST API", desc: "JSON endpoints for news, search, categories, and more" },
              { icon: Search, title: "Full-text Search", desc: "Search across millions of articles by keyword or topic" },
              { icon: Zap, title: "Real-time Updates", desc: "New articles every 5 minutes, breaking news in seconds" },
              { icon: BarChart3, title: "Market Context", desc: "Price data alongside news for informed analysis" },
              { icon: Brain, title: "AI/LLM Ready", desc: "Structured data perfect for ChatGPT, Claude, and more" },
              { icon: Server, title: "Self-hostable", desc: "Docker, Vercel, Railway — deploy your own in minutes" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-4 hover:border-[var(--color-accent)]/40 transition-colors">
                  <Icon className="h-5 w-5 text-[var(--color-accent)] mb-2" />
                  <h3 className="font-bold text-sm text-[var(--color-text-primary)] mb-1">{item.title}</h3>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto mb-14">
          <div className="text-center mb-8">
            <HelpCircle className="h-6 w-6 text-[var(--color-accent)] mx-auto mb-3" />
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">
              Everything you need to know about our pricing.
            </p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)]"
              >
                <summary className="flex cursor-pointer items-center justify-between p-5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] rounded-lg transition select-none">
                  {faq.question}
                  <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-text-tertiary)] transition-transform group-open:rotate-180 ml-4" />
                </summary>
                <div className="px-5 pb-5 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mb-10">
          <div className="rounded-xl bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/20 p-8 md:p-10 text-center max-w-3xl mx-auto">
            <h2 className="font-serif text-xl md:text-2xl font-bold mb-3 text-[var(--color-text-primary)]">
              Ready to get started?
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              No sign-up required. Start making API requests in under 30 seconds.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button variant="primary" asChild>
                <Link href="/developers">
                  API Documentation <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contact">Talk to Us</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

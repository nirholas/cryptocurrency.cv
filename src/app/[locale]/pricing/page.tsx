import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { generateSEOMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Pricing — Crypto Vision News",
    description:
      "Crypto Vision News is 100% free. No API keys, no rate limits, no hidden costs. Unlimited access to real-time crypto news.",
    path: "/pricing",
    locale,
    tags: ["pricing", "free API", "crypto news API", "no rate limits"],
  });
}

type Tier = {
  name: string;
  price: string;
  period: string;
  description: string;
  highlight: boolean;
  badge?: string;
  features: string[];
  cta: { text: string; href: string; variant: "primary" | "outline"; external?: boolean; disabled?: boolean };
};

const tiers: Tier[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Everything you need to get started — no strings attached.",
    highlight: true,
    features: [
      "No API key required",
      "300+ news sources",
      "RSS & Atom feeds",
      "Basic REST API endpoints",
      "Search & filtering",
      "Category endpoints",
      "Breaking & trending news",
      "Community support",
    ],
    cta: { text: "Get Started", href: "/developers", variant: "primary" },
  },
  {
    name: "Pro",
    price: "$29",
    period: "mo",
    description: "Advanced features for power users and teams.",
    highlight: false,
    badge: "Coming Soon",
    features: [
      "Everything in Free",
      "AI-powered analysis",
      "Historical archive access",
      "Webhook notifications",
      "Priority support",
      "Custom feed builder",
      "Higher rate limits",
      "Advanced analytics",
    ],
    cta: { text: "Coming Soon", href: "#", variant: "outline", disabled: true },
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Tailored solutions for organizations at scale.",
    highlight: false,
    features: [
      "Everything in Pro",
      "Custom integrations",
      "SLA guarantee",
      "Dedicated support engineer",
      "On-premise deployment",
      "Custom data retention",
      "White-label option",
      "Volume discounts",
    ],
    cta: { text: "Contact Us", href: "/contact", variant: "outline" },
  },
];

const comparisonFeatures = [
  { name: "News sources", free: "300+", pro: "300+", enterprise: "Custom" },
  { name: "API access", free: "✓", pro: "✓", enterprise: "✓" },
  { name: "RSS/Atom feeds", free: "✓", pro: "✓", enterprise: "✓" },
  { name: "API key required", free: "No", pro: "Yes", enterprise: "Yes" },
  { name: "AI analysis", free: "—", pro: "✓", enterprise: "✓" },
  { name: "Historical archive", free: "—", pro: "90 days", enterprise: "Unlimited" },
  { name: "Webhooks", free: "—", pro: "✓", enterprise: "✓" },
  { name: "Custom integrations", free: "—", pro: "—", enterprise: "✓" },
  { name: "SLA", free: "—", pro: "—", enterprise: "✓" },
  { name: "Support", free: "Community", pro: "Priority", enterprise: "Dedicated" },
];

const faqs = [
  {
    question: "Is it really free?",
    answer:
      "Yes! Our Free tier is and always will be 100% free. No credit card, no API key, no trial period. Just start using it.",
  },
  {
    question: "Do I need an API key?",
    answer:
      "Not for the Free tier. You can access all free endpoints without any registration or API key. Pro and Enterprise tiers will require authentication.",
  },
  {
    question: "What happens when Pro launches?",
    answer:
      "The Free tier will remain unchanged. Pro will add premium features on top — existing free users won't lose any functionality.",
  },
  {
    question: "Can I switch plans?",
    answer:
      "Yes, you'll be able to upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle.",
  },
  {
    question: "Is there a rate limit on the Free tier?",
    answer:
      "The Free tier has generous rate limits suitable for most use cases. If you need higher throughput, Pro or Enterprise plans will accommodate that.",
  },
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
          <Badge className="mb-4">Simple Pricing</Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-[var(--color-text-primary)]">
            Start free. Scale when you&apos;re ready.
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            No tricks, no paywalls. Our core API is free forever — upgrade only
            when you need advanced features.
          </p>
        </section>

        {/* Pricing Cards */}
        <section className="mb-16">
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={cn(
                  "rounded-xl border p-8 flex flex-col relative",
                  tier.highlight
                    ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)] bg-[var(--color-surface)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)]"
                )}
              >
                {tier.badge && (
                  <Badge className="absolute -top-3 right-4 bg-amber-500 text-white px-2.5 py-0.5">
                    {tier.badge}
                  </Badge>
                )}
                {tier.highlight && (
                  <Badge className="absolute -top-3 left-4 bg-[var(--color-accent)] text-white px-2.5 py-0.5">
                    Most Popular
                  </Badge>
                )}

                <h2 className="font-serif text-2xl font-bold mb-1 text-[var(--color-text-primary)]">
                  {tier.name}
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
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
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]"
                    >
                      <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {tier.cta.disabled ? (
                  <Button variant={tier.cta.variant} size="lg" disabled className="w-full">
                    {tier.cta.text}
                  </Button>
                ) : tier.cta.external ? (
                  <Button variant={tier.cta.variant} size="lg" asChild className="w-full">
                    <a href={tier.cta.href} target="_blank" rel="noopener noreferrer">
                      {tier.cta.text}
                    </a>
                  </Button>
                ) : (
                  <Button variant={tier.cta.variant} size="lg" asChild className="w-full">
                    <Link href={tier.cta.href}>{tier.cta.text}</Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Free Forever Banner */}
        <section className="mb-16">
          <div className="rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 p-8 md:p-10 text-center max-w-3xl mx-auto">
            <h2 className="font-serif text-2xl font-bold mb-3 text-[var(--color-text-primary)]">
              🛡️ Free Forever Guarantee
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Our Free tier will never be taken away, degraded, or restricted.
              We&apos;re committed to keeping crypto news accessible to everyone.
              If we ever change this, the project is open source — fork it and
              run your own.
            </p>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="mb-16 max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-center mb-8 text-[var(--color-text-primary)]">
            Feature Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="py-3 px-4 text-left font-medium text-[var(--color-text-secondary)]">
                    Feature
                  </th>
                  <th className="py-3 px-4 text-center font-bold text-[var(--color-accent)]">
                    Free
                  </th>
                  <th className="py-3 px-4 text-center font-bold text-[var(--color-text-primary)]">
                    Pro
                  </th>
                  <th className="py-3 px-4 text-center font-bold text-[var(--color-text-primary)]">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row, i) => (
                  <tr
                    key={row.name}
                    className={cn(
                      "border-b border-[var(--color-border)]",
                      i % 2 === 0 && "bg-[var(--color-surface-secondary)]"
                    )}
                  >
                    <td className="py-3 px-4 text-[var(--color-text-primary)] font-medium">
                      {row.name}
                    </td>
                    <td className="py-3 px-4 text-center text-[var(--color-text-secondary)]">
                      {row.free}
                    </td>
                    <td className="py-3 px-4 text-center text-[var(--color-text-secondary)]">
                      {row.pro}
                    </td>
                    <td className="py-3 px-4 text-center text-[var(--color-text-secondary)]">
                      {row.enterprise}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto mb-10">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-center mb-8 text-[var(--color-text-primary)]">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)]"
              >
                <summary className="flex cursor-pointer items-center justify-between p-5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] rounded-lg transition select-none">
                  {faq.question}
                  <span className="ml-4 shrink-0 text-[var(--color-text-tertiary)] transition-transform group-open:rotate-180">
                    ▼
                  </span>
                </summary>
                <div className="px-5 pb-5 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

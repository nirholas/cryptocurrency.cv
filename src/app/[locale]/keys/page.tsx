/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { generateSEOMetadata } from "@/lib/seo";
import {
  Key,
  Zap,
  Shield,
  Crown,
  Sparkles,
  Code,
  ArrowRight,
  Check,
  Globe,
  CreditCard,
  Terminal,
  Copy,
  ExternalLink,
} from "lucide-react";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "API Keys — Crypto Vision News",
    description:
      "Get your API key for Crypto Vision News. Free preview, pay-per-request via x402 micropayments, or subscribe to Pro and Enterprise plans for full access.",
    path: "/keys",
    locale,
    tags: [
      "API key",
      "crypto news API",
      "x402",
      "micropayments",
      "developer",
      "REST API",
    ],
  });
}

const accessTiers = [
  {
    name: "Free Preview",
    icon: Zap,
    price: "$0",
    period: "forever",
    description: "Try the API instantly — no key, no signup.",
    color: "text-accent",
    borderColor: "border-accent",
    highlight: true,
    features: [
      "2 headline snippets per request",
      "2 coin price quotes per request",
      "No API key required",
      "No rate limit authentication",
    ],
    cta: { text: "Try /api/sample", href: "/api/sample", external: true },
    code: "curl https://cryptocurrency.cv/api/sample",
  },
  {
    name: "Pay-per-Request",
    icon: CreditCard,
    price: "$0.001",
    period: "per request",
    description: "No signup needed — pay with USDC on Base via x402.",
    color: "text-violet-500",
    borderColor: "border-violet-500",
    highlight: false,
    features: [
      "All API endpoints",
      "No API key needed",
      "USDC on Base (EIP-155:8453)",
      "x402 payment protocol",
    ],
    cta: { text: "Learn about x402", href: "https://x402.org", external: true },
    code: 'curl -H "X-Payment: ..." https://cryptocurrency.cv/api/news',
  },
  {
    name: "Pro",
    icon: Sparkles,
    price: "$29",
    period: "mo",
    description: "50,000 requests/day with full API access and AI features.",
    color: "text-violet-500",
    borderColor: "border-violet-500",
    highlight: false,
    features: [
      "50,000 requests/day",
      "All endpoints + AI analysis",
      "Historical archive (90 days)",
      "Priority support",
    ],
    cta: { text: "Upgrade to Pro", href: "/api/keys/upgrade", external: true },
    code: 'curl -H "X-API-Key: cda_..." https://cryptocurrency.cv/api/news',
  },
  {
    name: "Enterprise",
    icon: Crown,
    price: "$99",
    period: "mo",
    description: "500,000 requests/day with SLA and priority routing.",
    color: "text-amber-500",
    borderColor: "border-amber-500",
    highlight: false,
    features: [
      "500,000 requests/day",
      "Priority routing & SLA (99.9%)",
      "Dedicated support engineer",
      "Unlimited data retention",
    ],
    cta: { text: "Contact Sales", href: "/contact", external: false },
    code: 'curl -H "X-API-Key: cda_..." https://cryptocurrency.cv/api/news',
  },
];

const quickLinks = [
  {
    icon: Terminal,
    title: "API Documentation",
    description: "Full REST API reference with examples",
    href: "/developers",
  },
  {
    icon: Key,
    title: "Manage Keys",
    description: "View, rotate, or revoke your API keys",
    href: "/dashboard/keys",
  },
  {
    icon: Globe,
    title: "Free Endpoints",
    description: "RSS feeds, news, and more — no key required",
    href: "/developers",
  },
  {
    icon: Code,
    title: "SDKs & Libraries",
    description: "Python, TypeScript, Go, React, PHP",
    href: "/developers",
  },
];

export default async function KeysPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Hero */}
        <section className="text-center mb-14 pt-6">
          <Badge className="mb-4">
            <Key className="h-3 w-3 mr-1" /> API Keys
          </Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-text-primary">
            Access the Crypto News API
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Start free with no signup. Scale with pay-per-request micropayments
            or subscribe for a dedicated API key.
          </p>
        </section>

        {/* Access Tiers */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {accessTiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <Card
                key={tier.name}
                className={`relative overflow-hidden ${
                  tier.highlight ? `border-2 ${tier.borderColor}` : ""
                }`}
              >
                {tier.highlight && (
                  <div className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-bl">
                    START HERE
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-lg bg-(--color-bg-tertiary) ${tier.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-text-primary">
                        {tier.name}
                      </h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-text-primary">
                          {tier.price}
                        </span>
                        {tier.period && (
                          <span className="text-sm text-text-tertiary">
                            /{tier.period}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-text-secondary mb-4">
                    {tier.description}
                  </p>

                  <ul className="space-y-2 mb-5">
                    {tier.features.map((feat) => (
                      <li
                        key={feat}
                        className="flex items-center gap-2 text-sm text-text-secondary"
                      >
                        <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  {/* Code example */}
                  <div className="relative bg-(--color-bg-tertiary) rounded-lg p-3 mb-4 font-mono text-xs text-text-secondary overflow-x-auto">
                    <Copy className="absolute top-2 right-2 h-3 w-3 text-text-tertiary" />
                    <code>{tier.code}</code>
                  </div>

                  {tier.cta.external ? (
                    <a
                      href={tier.cta.href}
                      target={
                        tier.cta.href.startsWith("http") ? "_blank" : undefined
                      }
                      rel={
                        tier.cta.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                    >
                      <Button
                        variant={tier.highlight ? "default" : "outline"}
                        className="w-full"
                      >
                        {tier.cta.text}
                        {tier.cta.href.startsWith("http") ? (
                          <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                        ) : (
                          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                        )}
                      </Button>
                    </a>
                  ) : (
                    <Link href={tier.cta.href}>
                      <Button
                        variant={tier.highlight ? "default" : "outline"}
                        className="w-full"
                      >
                        {tier.cta.text}
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </section>

        {/* Quick Links */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl font-bold mb-6 text-text-primary text-center">
            Developer Resources
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.title} href={link.href}>
                  <Card className="h-full transition-colors hover:border-accent">
                    <CardContent className="p-5 flex flex-col gap-2">
                      <Icon className="h-5 w-5 text-accent" />
                      <h3 className="font-semibold text-sm text-text-primary">
                        {link.title}
                      </h3>
                      <p className="text-xs text-text-secondary">
                        {link.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Info Banner */}
        <section className="mb-10">
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
              <Shield className="h-8 w-8 text-accent shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary mb-1">
                  Most endpoints are free — no key required
                </h3>
                <p className="text-sm text-text-secondary">
                  The core news API, RSS/Atom feeds, search, and category
                  endpoints are all free and open. API keys are only needed for
                  premium features like AI analysis, historical archives, and
                  higher rate limits.
                </p>
              </div>
              <Link href="/developers">
                <Button variant="outline" size="sm">
                  View Free Endpoints
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </>
  );
}

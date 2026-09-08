/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link } from '@/i18n/navigation';
import ContactForm from '@/components/ContactForm';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { generateSEOMetadata } from '@/lib/seo';
import { cn } from '@/lib/utils';
import {
  Mail,
  MessageSquare,
  Clock,
  Shield,
  BookOpen,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Zap,
  Globe,
  Code,
  HelpCircle,
} from 'lucide-react';
import type { Metadata } from 'next';
import type { LucideIcon } from 'lucide-react';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'Contact — Crypto Vision',
    description:
      'Get in touch with Crypto Vision. Report issues, request features, or ask questions via GitHub, Twitter, or our contact form.',
    path: '/contact',
    locale,
    tags: ['contact', 'support', 'feedback', 'github', 'crypto news'],
  });
}

type ContactMethod = {
  icon: LucideIcon;
  title: string;
  description: string;
  link: string;
  linkText: string;
  color: string;
  responseTime: string;
};

const contactMethods: ContactMethod[] = [
  {
    icon: Code,
    title: 'GitHub Issues',
    description: 'Report bugs, request features, or browse existing discussions',
    link: 'https://github.com/nirholas/free-crypto-news/issues',
    linkText: 'Open an Issue',
    color: 'text-gray-700 dark:text-gray-300',
    responseTime: '24-48 hrs',
  },
  {
    icon: MessageSquare,
    title: 'Twitter / X',
    description: 'Follow us for updates, announcements, and quick questions',
    link: 'https://twitter.com/freecryptonews',
    linkText: '@freecryptonews',
    color: 'text-sky-500',
    responseTime: 'Same day',
  },
  {
    icon: Mail,
    title: 'Email',
    description: 'For partnerships, security disclosures, and private inquiries',
    link: 'mailto:nirholas@users.noreply.github.com',
    linkText: 'nirholas@users.noreply.github.com',
    color: 'text-violet-500',
    responseTime: '2-3 days',
  },
  {
    icon: BookOpen,
    title: 'Documentation',
    description: 'Find answers in our comprehensive API docs and guides',
    link: '/developers',
    linkText: 'Read the Docs',
    color: 'text-emerald-500',
    responseTime: 'Instant',
  },
];

const faqs = [
  {
    question: 'Is Crypto Vision really free?',
    answer:
      'Yes, 100% free. No API keys, no rate limits, no hidden costs. Our core API will always be free and open source under the MIT license.',
  },
  {
    question: 'Do I need an API key to get started?',
    answer:
      "No. You can start using our API immediately without any registration or API key. Just send a request and get data back. It's that simple.",
  },
  {
    question: 'How often is the news updated?',
    answer:
      'News is aggregated every 5 minutes from 300+ trusted sources. Breaking news is processed in near real-time, typically appearing within 2-3 minutes of publication.',
  },
  {
    question: 'Can I self-host Crypto Vision?',
    answer:
      'Yes! The project is fully open source. You can deploy your own instance using Docker, Vercel, or Railway in minutes. Full deployment guides are in our documentation.',
  },
  {
    question: 'How can I contribute to the project?',
    answer:
      'We welcome contributions of all kinds! Submit pull requests, add new news sources, translate the interface into your language, improve documentation, or report bugs. Check our CONTRIBUTING.md guide on GitHub.',
  },
  {
    question: 'What news sources do you aggregate from?',
    answer:
      'We aggregate from 300+ trusted sources including CoinDesk, The Block, Bloomberg Crypto, Reuters, CoinTelegraph, Decrypt, Blockworks, DL News, Bitcoin Magazine, and many more covering all aspects of the crypto ecosystem.',
  },
  {
    question: 'Do you offer an SLA or premium support?',
    answer:
      "Yes. The Pro plan on our pricing page includes priority support, and the Enterprise plan adds custom SLAs and a dedicated contact. For enterprise needs, reach out via the contact form and we'll work with you directly.",
  },
  {
    question: 'Is my data private when using the contact form?',
    answer:
      "Yes. We don't share your personal information with third parties. Contact form submissions are used solely to respond to your inquiry. See our Privacy Policy for details.",
  },
];

const quickLinks = [
  {
    icon: Code,
    label: 'API Documentation',
    href: '/developers',
    description: 'Full REST API reference',
  },
  {
    icon: Shield,
    label: 'Security Policy',
    href: 'https://github.com/nirholas/free-crypto-news/blob/main/SECURITY.md',
    description: 'Report vulnerabilities',
    external: true,
  },
  { icon: Globe, label: 'Status Page', href: '/status', description: 'System health & uptime' },
  {
    icon: Zap,
    label: 'Changelog',
    href: 'https://github.com/nirholas/free-crypto-news/blob/main/CHANGELOG.md',
    description: "What's new",
    external: true,
  },
];

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Hero */}
        <section className="mb-14 pt-6 text-center">
          <Badge className="mb-4">
            <MessageSquare className="mr-1 h-3 w-3" /> Support
          </Badge>
          <h1 className="text-text-primary mb-4 font-serif text-3xl font-bold md:text-4xl lg:text-5xl">
            How Can We Help?
          </h1>
          <p className="text-text-secondary mx-auto max-w-2xl text-lg">
            Have a question, found a bug, or want to collaborate? Reach out through any channel
            below — we&apos;d love to hear from you.
          </p>
        </section>

        {/* Contact Methods Cards */}
        <section className="mb-14">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {contactMethods.map((method) => {
              const Icon = method.icon;
              const isInternal = method.link.startsWith('/');
              const LinkComp = isInternal ? Link : 'a';
              const linkProps = isInternal
                ? { href: method.link as '/' }
                : { href: method.link, target: '_blank' as const, rel: 'noopener noreferrer' };
              return (
                <Card key={method.title} className="group hover:border-accent/50 transition-colors">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <div
                        className={cn(
                          'bg-surface-secondary flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110',
                          method.color,
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-text-primary text-sm font-bold">{method.title}</h3>
                        <div className="text-text-tertiary flex items-center gap-1 text-[10px]">
                          <Clock className="h-2.5 w-2.5" /> {method.responseTime}
                        </div>
                      </div>
                    </div>
                    <p className="text-text-secondary mb-3 text-xs leading-relaxed">
                      {method.description}
                    </p>
                    <LinkComp
                      {...linkProps}
                      className="text-accent inline-flex items-center gap-1 text-sm font-medium hover:underline"
                    >
                      {method.linkText}
                      {!isInternal && <ExternalLink className="h-3 w-3" />}
                    </LinkComp>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Main Content: Form + Sidebar */}
        <div className="mb-16 grid gap-12 lg:grid-cols-3">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6 md:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-text-primary font-serif text-xl font-bold">
                    Send us a Message
                  </h2>
                  <div className="text-text-tertiary flex items-center gap-1.5 text-xs">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                    Online
                  </div>
                </div>
                <ContactForm />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Links */}
            <div>
              <h3 className="text-text-tertiary mb-3 text-sm font-bold tracking-wider uppercase">
                Quick Links
              </h3>
              <div className="space-y-2">
                {quickLinks.map((link) => {
                  const Icon = link.icon;
                  const Comp = link.external ? 'a' : Link;
                  const props = link.external
                    ? { href: link.href, target: '_blank' as const, rel: 'noopener noreferrer' }
                    : { href: link.href as '/' };
                  return (
                    <Comp
                      key={link.label}
                      {...props}
                      className="border-border bg-surface-secondary hover:border-accent/40 group flex items-center gap-3 rounded-lg border p-3 transition-colors"
                    >
                      <Icon className="text-text-tertiary group-hover:text-accent h-4 w-4 shrink-0 transition-colors" />
                      <div className="min-w-0">
                        <div className="text-text-primary truncate text-sm font-medium">
                          {link.label}
                        </div>
                        <div className="text-text-tertiary text-[10px]">{link.description}</div>
                      </div>
                      <ArrowRight className="text-text-tertiary ml-auto h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Comp>
                  );
                })}
              </div>
            </div>

            {/* Response expectations */}
            <div className="border-border bg-surface-secondary rounded-xl border p-5">
              <h3 className="text-text-primary mb-3 flex items-center gap-2 text-sm font-bold">
                <Clock className="text-accent h-4 w-4" />
                Response Times
              </h3>
              <div className="space-y-3">
                {[
                  { channel: 'Contact Form', time: '24-48 hours', priority: 'high' },
                  { channel: 'GitHub Issues', time: '1-3 days', priority: 'medium' },
                  { channel: 'Twitter DMs', time: 'Same day', priority: 'high' },
                  { channel: 'Security Issues', time: '< 24 hours', priority: 'critical' },
                ].map((item) => (
                  <div key={item.channel} className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">{item.channel}</span>
                    <Badge
                      className={cn(
                        'text-[10px]',
                        item.priority === 'critical'
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                          : item.priority === 'high'
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                            : '',
                      )}
                    >
                      {item.time}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Community CTA */}
            <div className="border-accent/20 bg-accent/5 rounded-xl border p-5 text-center">
              <h3 className="text-text-primary mb-2 text-sm font-bold">Join the Community</h3>
              <p className="text-text-secondary mb-4 text-xs">
                Contribute to the project, discuss features, and connect with other developers.
              </p>
              <Button variant="primary" size="sm" asChild className="w-full">
                <a
                  href="https://github.com/nirholas/free-crypto-news"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Code className="mr-1 h-3.5 w-3.5" /> View on GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <section className="mx-auto mb-14 max-w-3xl">
          <div className="mb-8 text-center">
            <HelpCircle className="text-accent mx-auto mb-3 h-6 w-6" />
            <h2 className="text-text-primary font-serif text-2xl font-bold md:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="text-text-secondary mt-2 text-sm">
              Can&apos;t find what you need? Send us a message above.
            </p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group border-border bg-surface-secondary rounded-lg border"
              >
                <summary className="text-text-primary hover:bg-surface-tertiary flex cursor-pointer items-center justify-between rounded-lg p-5 text-sm font-medium transition select-none">
                  {faq.question}
                  <ChevronDown className="text-text-tertiary ml-4 h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="text-text-secondary px-5 pb-5 text-sm leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mb-10">
          <div className="bg-surface-secondary border-border mx-auto max-w-3xl rounded-xl border p-8 text-center md:p-10">
            <h2 className="text-text-primary mb-3 font-serif text-xl font-bold md:text-2xl">
              Prefer to dive straight in?
            </h2>
            <p className="text-text-secondary mb-6 text-sm">
              No sign-up required. Start making API requests in under 30 seconds.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="primary" asChild>
                <Link href="/developers">
                  API Documentation <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
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

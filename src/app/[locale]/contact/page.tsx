import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "@/i18n/navigation";
import ContactForm from "@/components/ContactForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { generateSEOMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import {
  Github,
  Twitter,
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
} from "lucide-react";
import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Contact — Crypto Vision News",
    description:
      "Get in touch with Crypto Vision News. Report issues, request features, or ask questions via GitHub, Twitter, or our contact form.",
    path: "/contact",
    locale,
    tags: ["contact", "support", "feedback", "github", "crypto news"],
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
    icon: Github,
    title: "GitHub Issues",
    description: "Report bugs, request features, or browse existing discussions",
    link: "https://github.com/nirholas/free-crypto-news/issues",
    linkText: "Open an Issue",
    color: "text-gray-700 dark:text-gray-300",
    responseTime: "24-48 hrs",
  },
  {
    icon: Twitter,
    title: "Twitter / X",
    description: "Follow us for updates, announcements, and quick questions",
    link: "https://twitter.com/freecryptonews",
    linkText: "@freecryptonews",
    color: "text-sky-500",
    responseTime: "Same day",
  },
  {
    icon: Mail,
    title: "Email",
    description: "For partnerships, security disclosures, and private inquiries",
    link: "mailto:nirholas@users.noreply.github.com",
    linkText: "nirholas@users.noreply.github.com",
    color: "text-violet-500",
    responseTime: "2-3 days",
  },
  {
    icon: BookOpen,
    title: "Documentation",
    description: "Find answers in our comprehensive API docs and guides",
    link: "/developers",
    linkText: "Read the Docs",
    color: "text-emerald-500",
    responseTime: "Instant",
  },
];

const faqs = [
  {
    question: "Is Crypto Vision News really free?",
    answer:
      "Yes, 100% free. No API keys, no rate limits, no hidden costs. Our core API will always be free and open source under the MIT license.",
  },
  {
    question: "Do I need an API key to get started?",
    answer:
      "No. You can start using our API immediately without any registration or API key. Just send a request and get data back. It's that simple.",
  },
  {
    question: "How often is the news updated?",
    answer:
      "News is aggregated every 5 minutes from 300+ trusted sources. Breaking news is processed in near real-time, typically appearing within 2-3 minutes of publication.",
  },
  {
    question: "Can I self-host Crypto Vision News?",
    answer:
      "Yes! The project is fully open source. You can deploy your own instance using Docker, Vercel, or Railway in minutes. Full deployment guides are in our documentation.",
  },
  {
    question: "How can I contribute to the project?",
    answer:
      "We welcome contributions of all kinds! Submit pull requests, add new news sources, translate the interface into your language, improve documentation, or report bugs. Check our CONTRIBUTING.md guide on GitHub.",
  },
  {
    question: "What news sources do you aggregate from?",
    answer:
      "We aggregate from 300+ trusted sources including CoinDesk, The Block, Bloomberg Crypto, Reuters, CoinTelegraph, Decrypt, Blockworks, DL News, Bitcoin Magazine, and many more covering all aspects of the crypto ecosystem.",
  },
  {
    question: "Do you offer an SLA or premium support?",
    answer:
      "Our Pro tier (coming soon) will include priority support and SLA guarantees. For enterprise needs with custom SLAs, please reach out via the contact form and we'll work with you directly.",
  },
  {
    question: "Is my data private when using the contact form?",
    answer:
      "Yes. We don't share your personal information with third parties. Contact form submissions are used solely to respond to your inquiry. See our Privacy Policy for details.",
  },
];

const quickLinks = [
  { icon: Code, label: "API Documentation", href: "/developers", description: "Full REST API reference" },
  { icon: Shield, label: "Security Policy", href: "https://github.com/nirholas/free-crypto-news/blob/main/SECURITY.md", description: "Report vulnerabilities", external: true },
  { icon: Globe, label: "Status Page", href: "/status", description: "System health & uptime" },
  { icon: Zap, label: "Changelog", href: "https://github.com/nirholas/free-crypto-news/blob/main/CHANGELOG.md", description: "What's new", external: true },
];

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Hero */}
        <section className="text-center mb-14 pt-6">
          <Badge className="mb-4">
            <MessageSquare className="h-3 w-3 mr-1" /> Support
          </Badge>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-text-primary">
            How Can We Help?
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Have a question, found a bug, or want to collaborate?
            Reach out through any channel below — we&apos;d love to hear from you.
          </p>
        </section>

        {/* Contact Methods Cards */}
        <section className="mb-14">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {contactMethods.map((method) => {
              const Icon = method.icon;
              const isInternal = method.link.startsWith("/");
              const LinkComp = isInternal ? Link : "a";
              const linkProps = isInternal
                ? { href: method.link as "/" }
                : { href: method.link, target: "_blank" as const, rel: "noopener noreferrer" };
              return (
                <Card key={method.title} className="group hover:border-accent/50 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn("h-10 w-10 rounded-lg bg-surface-secondary flex items-center justify-center group-hover:scale-110 transition-transform", method.color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-text-primary">
                          {method.title}
                        </h3>
                        <div className="flex items-center gap-1 text-[10px] text-text-tertiary">
                          <Clock className="h-2.5 w-2.5" /> {method.responseTime}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary mb-3 leading-relaxed">
                      {method.description}
                    </p>
                    <LinkComp
                      {...linkProps}
                      className="inline-flex items-center gap-1 text-sm text-accent hover:underline font-medium"
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
        <div className="grid gap-12 lg:grid-cols-3 mb-16">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-xl font-bold text-text-primary">
                    Send us a Message
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
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
              <h3 className="font-bold text-sm uppercase tracking-wider text-text-tertiary mb-3">
                Quick Links
              </h3>
              <div className="space-y-2">
                {quickLinks.map((link) => {
                  const Icon = link.icon;
                  const Comp = link.external ? "a" : Link;
                  const props = link.external
                    ? { href: link.href, target: "_blank" as const, rel: "noopener noreferrer" }
                    : { href: link.href as "/" };
                  return (
                    <Comp
                      key={link.label}
                      {...props}
                      className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary p-3 hover:border-accent/40 transition-colors group"
                    >
                      <Icon className="h-4 w-4 text-text-tertiary group-hover:text-accent transition-colors shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-text-primary truncate">
                          {link.label}
                        </div>
                        <div className="text-[10px] text-text-tertiary">
                          {link.description}
                        </div>
                      </div>
                      <ArrowRight className="h-3 w-3 text-text-tertiary ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Comp>
                  );
                })}
              </div>
            </div>

            {/* Response expectations */}
            <div className="rounded-xl border border-border bg-surface-secondary p-5">
              <h3 className="font-bold text-sm text-text-primary mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                Response Times
              </h3>
              <div className="space-y-3">
                {[
                  { channel: "Contact Form", time: "24-48 hours", priority: "high" },
                  { channel: "GitHub Issues", time: "1-3 days", priority: "medium" },
                  { channel: "Twitter DMs", time: "Same day", priority: "high" },
                  { channel: "Security Issues", time: "< 24 hours", priority: "critical" },
                ].map((item) => (
                  <div key={item.channel} className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">{item.channel}</span>
                    <Badge className={cn(
                      "text-[10px]",
                      item.priority === "critical"
                        ? "bg-red-500/10 text-red-600 dark:text-red-400"
                        : item.priority === "high"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : ""
                    )}>
                      {item.time}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Community CTA */}
            <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 text-center">
              <h3 className="font-bold text-sm text-text-primary mb-2">
                Join the Community
              </h3>
              <p className="text-xs text-text-secondary mb-4">
                Contribute to the project, discuss features, and connect with other developers.
              </p>
              <Button variant="primary" size="sm" asChild className="w-full">
                <a href="https://github.com/nirholas/free-crypto-news" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-1 h-3.5 w-3.5" /> View on GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto mb-14">
          <div className="text-center mb-8">
            <HelpCircle className="h-6 w-6 text-accent mx-auto mb-3" />
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-text-primary">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-text-secondary mt-2">
              Can&apos;t find what you need? Send us a message above.
            </p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-lg border border-border bg-surface-secondary"
              >
                <summary className="flex cursor-pointer items-center justify-between p-5 text-sm font-medium text-text-primary hover:bg-surface-tertiary rounded-lg transition select-none">
                  {faq.question}
                  <ChevronDown className="h-4 w-4 shrink-0 text-text-tertiary transition-transform group-open:rotate-180 ml-4" />
                </summary>
                <div className="px-5 pb-5 text-sm text-text-secondary leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mb-10">
          <div className="rounded-xl bg-surface-secondary border border-border p-8 md:p-10 text-center max-w-3xl mx-auto">
            <h2 className="font-serif text-xl md:text-2xl font-bold mb-3 text-text-primary">
              Prefer to dive straight in?
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              No sign-up required. Start making API requests in under 30 seconds.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
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

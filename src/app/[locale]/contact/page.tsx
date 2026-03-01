import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import { Card, CardContent } from "@/components/ui/Card";
import { generateSEOMetadata } from "@/lib/seo";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Contact — Crypto Vision News",
    description:
      "Get in touch with Crypto Vision News. Report issues, request features, or ask questions via GitHub.",
    path: "/contact",
    locale,
    tags: ["contact", "support", "feedback", "github"],
  });
}

const contactMethods = [
  {
    icon: "🐙",
    title: "GitHub Issues",
    description: "Report bugs or request features",
    link: "https://github.com/nirholas/free-crypto-news/issues",
    linkText: "Open an Issue",
  },
  {
    icon: "🐦",
    title: "Twitter",
    description: "Follow us for updates",
    link: "https://twitter.com/freecryptonews",
    linkText: "@freecryptonews",
  },
  {
    icon: "✉️",
    title: "Email",
    description: "For partnership inquiries",
    link: "mailto:nirholas@users.noreply.github.com",
    linkText: "nirholas@users.noreply.github.com",
  },
];

const faqs = [
  {
    question: "Is Crypto Vision News really free?",
    answer:
      "Yes, 100% free. No API keys, no rate limits, no hidden costs. Our core API will always be free and open source.",
  },
  {
    question: "Do I need an API key?",
    answer:
      "No. You can start using our API immediately without any registration or API key. Just send a request and get data.",
  },
  {
    question: "How often is the news updated?",
    answer:
      "News is aggregated every 5 minutes from 300+ trusted sources. Breaking news is processed in near real-time.",
  },
  {
    question: "Can I self-host Crypto Vision News?",
    answer:
      "Yes! Crypto Vision News is open source under the MIT license. You can deploy your own instance using Docker or Vercel.",
  },
  {
    question: "How can I contribute?",
    answer:
      "We welcome contributions! Check our GitHub repository for open issues, submit pull requests, add translations, or improve documentation.",
  },
  {
    question: "What sources do you aggregate from?",
    answer:
      "We aggregate from 300+ trusted sources including CoinDesk, The Block, Bloomberg, Reuters, CoinTelegraph, Decrypt, and many more.",
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
        <section className="text-center mb-12">
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3 text-[var(--color-text-primary)]">
            Get in Touch
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Have a question, found a bug, or want to collaborate? We&apos;d love
            to hear from you.
          </p>
        </section>

        <div className="grid gap-12 lg:grid-cols-5 mb-16">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6 md:p-8">
                <h2 className="font-serif text-xl font-bold mb-6 text-[var(--color-text-primary)]">
                  Send us a Message
                </h2>
                <ContactForm />
              </CardContent>
            </Card>
          </div>

          {/* Alternative Contact Methods */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-serif text-xl font-bold mb-4 text-[var(--color-text-primary)]">
              Other Ways to Reach Us
            </h2>
            {contactMethods.map((method) => (
              <div
                key={method.title}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{method.icon}</span>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--color-text-primary)] mb-0.5">
                      {method.title}
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                      {method.description}
                    </p>
                    <a
                      href={method.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--color-accent)] hover:underline font-medium"
                    >
                      {method.linkText}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto">
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

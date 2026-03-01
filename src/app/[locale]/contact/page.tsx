import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Contact — Free Crypto News",
    description:
      "Get in touch with Free Crypto News. Report issues, request features, or ask questions via GitHub.",
    path: "/contact",
    locale,
    tags: ["contact", "support", "feedback", "github"],
  });
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10 max-w-3xl">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-[var(--color-text-primary)]">
          Contact
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-10">
          Free Crypto News is an open-source project. The best way to reach us
          is through GitHub.
        </p>

        <div className="space-y-6">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-6">
            <h2 className="font-serif text-lg font-bold mb-2 text-[var(--color-text-primary)]">
              Report a Bug or Request a Feature
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              Open an issue on our GitHub repository. Please include steps to
              reproduce for bugs, or a clear description for feature requests.
            </p>
            <a
              href="https://github.com/nirholas/free-crypto-news/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Open an Issue
            </a>
          </div>

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-6">
            <h2 className="font-serif text-lg font-bold mb-2 text-[var(--color-text-primary)]">
              Contribute
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              Pull requests are welcome! Check our contributing guide and open
              issues for ideas on where to help.
            </p>
            <a
              href="https://github.com/nirholas/free-crypto-news"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] transition"
            >
              View on GitHub
            </a>
          </div>

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-6">
            <h2 className="font-serif text-lg font-bold mb-2 text-[var(--color-text-primary)]">
              Security
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              For security-related issues, please follow our responsible
              disclosure process outlined in SECURITY.md.
            </p>
            <a
              href="https://github.com/nirholas/free-crypto-news/blob/main/SECURITY.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)] transition"
            >
              Security Policy
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Documentation home.
 *
 * A purpose-built landing rather than the rendered docs/index.md, which was
 * written as an MkDocs hero and loses its meaning outside that theme. Every
 * section below is derived from the same mkdocs.yml nav the sidebar uses, so a
 * page added there shows up here without anyone remembering to edit this file.
 */

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "@/i18n/navigation";
import CodeBlock from "@/components/CodeBlock";
import { DocsSearch } from "@/components/docs/DocsSearch";
import { getDocsNav, getDocsSearchIndex } from "@/lib/docs";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 3600;

const TITLE = "Documentation";
const DESCRIPTION =
  "Everything you need to use the free crypto news API: quick start, the full REST reference, the MCP server, SDKs, integrations and self-hosting.";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: `${SITE_URL}/docs` },
    openGraph: {
      title: `${TITLE} — Free Crypto News`,
      description: DESCRIPTION,
      url: `${SITE_URL}/docs`,
      type: "website",
      siteName: "Free Crypto News",
    },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  };
}

/** The four things most readers arrive wanting. */
const HIGHLIGHTS: { title: string; body: string; href: string; external?: boolean }[] = [
  {
    title: "Quick start",
    body: "One curl command to your first response. No key, no account.",
    href: "/docs/quickstart",
  },
  {
    title: "API reference",
    body: "Every endpoint, with parameters, schemas and a live try-it console.",
    href: "/api-reference",
  },
  {
    title: "MCP server",
    body: "Give Claude, Cursor or ChatGPT live crypto data. Hosted, nothing to install.",
    href: "/docs/integrations/mcp",
  },
  {
    title: "SDKs and examples",
    body: "Copy-paste clients for Python, TypeScript, Go, Rust, PHP and more.",
    href: "/docs/sdks",
  },
];

export default async function DocsHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [sections, searchIndex] = await Promise.all([getDocsNav(), getDocsSearchIndex()]);
  const pageCount = sections.reduce((total, section) => total + section.items.length, 0);

  return (
    <div className="min-h-screen bg-(--color-surface)">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--color-accent)">
            Documentation
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-(--color-text-primary) sm:text-4xl">
            Build with free crypto news
          </h1>
          <p className="mt-3 text-base leading-relaxed text-(--color-text-secondary)">
            {DESCRIPTION}
          </p>

          <div className="mt-6 max-w-md">
            <DocsSearch entries={searchIndex} />
          </div>
        </div>

        {/* First request */}
        <section aria-labelledby="first-request" className="mb-12">
          <h2 id="first-request" className="mb-3 text-sm font-semibold text-(--color-text-primary)">
            Your first request
          </h2>
          <CodeBlock
            language="bash"
            code={`curl "https://cryptocurrency.cv/api/news?limit=5"`}
          />
          <p className="mt-2 text-sm text-(--color-text-tertiary)">
            No API key. Anonymous callers get the free tier; see{" "}
            <Link href="/docs/api" className="text-(--color-accent) hover:underline">
              the API reference
            </Link>{" "}
            for limits and the paid tiers.
          </p>
        </section>

        {/* Highlights */}
        <section aria-labelledby="start-here" className="mb-14">
          <h2 id="start-here" className="mb-4 text-sm font-semibold text-(--color-text-primary)">
            Start here
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {HIGHLIGHTS.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group rounded-xl border border-(--color-border) bg-(--color-surface-secondary) p-5 transition-all hover:-translate-y-0.5 hover:border-(--color-accent) hover:shadow-lg focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:outline-none"
              >
                <h3 className="flex items-center gap-1.5 font-semibold text-(--color-text-primary) group-hover:text-(--color-accent)">
                  {card.title}
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-(--color-text-secondary)">{card.body}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Full index */}
        <section aria-labelledby="all-docs">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 id="all-docs" className="text-sm font-semibold text-(--color-text-primary)">
              All documentation
            </h2>
            <span className="text-xs text-(--color-text-tertiary)">{pageCount} pages</span>
          </div>

          <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="mb-2 border-b border-(--color-border) pb-1.5 text-xs font-semibold uppercase tracking-wide text-(--color-text-tertiary)">
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={`${section.title}/${item.file}`}>
                      <Link
                        href={item.slug ? `/docs/${item.slug}` : "/docs"}
                        className="block rounded px-1 py-0.5 text-sm text-(--color-text-secondary) transition-colors hover:text-(--color-accent) focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:outline-none"
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-12 border-t border-(--color-border) pt-6 text-sm text-(--color-text-tertiary)">
          These pages are generated from the markdown in{" "}
          <a
            href="https://github.com/nirholas/cryptocurrency.cv/tree/main/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-(--color-accent) hover:underline"
          >
            docs/
          </a>
          . Corrections are welcome: every page has an edit link at the bottom.
        </p>
      </main>

      <Footer />
    </div>
  );
}

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
 * The documentation reader.
 *
 * Every page under docs/ is served here. The route is a catch-all so the
 * markdown tree defines the URL space: docs/QUICKSTART.md is /docs/quickstart
 * and docs/integrations/mcp.md is /docs/integrations/mcp.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "@/i18n/navigation";
import { BreadcrumbStructuredData } from "@/components/StructuredData";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsSearch } from "@/components/docs/DocsSearch";
import { DocsToc } from "@/components/docs/DocsToc";
import { DocsContent } from "@/components/docs/DocsContent";
import { getDoc, getDocsNav, getDocsSearchIndex, getAllDocSlugs } from "@/lib/docs";
import { SITE_URL } from "@/lib/constants";

type Props = {
  params: Promise<{ locale: string; slug: string[] }>;
};

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllDocSlugs();
  // `/docs` itself is served by the sibling page.tsx, so the empty slug (the
  // docs/index.md landing) is not routed here.
  return slugs.filter(Boolean).map((slug) => ({ slug: slug.split("/") }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const joined = slug.join("/");
  const doc = await getDoc(joined);
  if (!doc) return { title: "Documentation not found" };

  const path = `/docs${doc.slug ? `/${doc.slug}` : ""}`;
  const title = doc.slug ? `${doc.title} — Docs` : "Documentation";

  return {
    title,
    description: doc.description,
    alternates: { canonical: `${SITE_URL}${path}` },
    openGraph: {
      title,
      description: doc.description,
      url: `${SITE_URL}${path}`,
      type: "article",
      siteName: "Free Crypto News",
    },
    twitter: { card: "summary_large_image", title, description: doc.description },
  };
}

export default async function DocsPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const joined = slug.join("/");
  const [doc, sections, searchIndex] = await Promise.all([
    getDoc(joined),
    getDocsNav(),
    getDocsSearchIndex(),
  ]);

  if (!doc) notFound();

  const breadcrumbs = [
    { name: "Home", url: SITE_URL },
    { name: "Docs", url: `${SITE_URL}/docs` },
    ...(doc.section ? [{ name: doc.section, url: `${SITE_URL}/docs` }] : []),
    ...(doc.slug ? [{ name: doc.title, url: `${SITE_URL}/docs/${doc.slug}` }] : []),
  ];

  return (
    <div className="min-h-screen bg-(--color-surface)">
      <Header />
      <BreadcrumbStructuredData items={breadcrumbs} />

      <div className="mx-auto flex max-w-[1600px] gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:overflow-y-auto max-lg:w-auto">
          <div className="mb-4">
            <DocsSearch entries={searchIndex} />
          </div>
          <DocsSidebar sections={sections} activeSlug={doc.slug} />
        </aside>

        {/* Article */}
        <main className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-(--color-text-tertiary)">
            <Link href="/docs" className="transition-colors hover:text-(--color-text-primary)">
              Docs
            </Link>
            {doc.section && (
              <>
                <span aria-hidden="true">/</span>
                <span>{doc.section}</span>
              </>
            )}
            {doc.slug && (
              <>
                <span aria-hidden="true">/</span>
                <span className="text-(--color-text-secondary)">{doc.title}</span>
              </>
            )}
          </nav>

          <article>
            <DocsContent html={doc.html} />
          </article>

          {/* Pager */}
          {(doc.prev || doc.next) && (
            <nav
              aria-label="Documentation pages"
              className="mt-12 grid gap-4 border-t border-(--color-border) pt-6 sm:grid-cols-2"
            >
              {doc.prev ? (
                <Link
                  href={doc.prev.slug ? `/docs/${doc.prev.slug}` : "/docs"}
                  className="group rounded-lg border border-(--color-border) p-4 transition-colors hover:border-(--color-accent) hover:bg-(--color-surface-secondary)"
                >
                  <span className="text-xs text-(--color-text-tertiary)">Previous</span>
                  <span className="mt-1 block font-medium text-(--color-text-primary) group-hover:text-(--color-accent)">
                    {doc.prev.title}
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {doc.next && (
                <Link
                  href={doc.next.slug ? `/docs/${doc.next.slug}` : "/docs"}
                  className="group rounded-lg border border-(--color-border) p-4 text-right transition-colors hover:border-(--color-accent) hover:bg-(--color-surface-secondary) sm:col-start-2"
                >
                  <span className="text-xs text-(--color-text-tertiary)">Next</span>
                  <span className="mt-1 block font-medium text-(--color-text-primary) group-hover:text-(--color-accent)">
                    {doc.next.title}
                  </span>
                </Link>
              )}
            </nav>
          )}

          <p className="mt-8 text-xs text-(--color-text-tertiary)">
            Found a mistake?{" "}
            <a
              href={doc.editUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-(--color-accent) underline-offset-2 hover:underline"
            >
              Edit this page on GitHub
            </a>
          </p>
        </main>

        {/* Table of contents */}
        <aside className="hidden w-56 shrink-0 xl:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <DocsToc entries={doc.toc} />
          </div>
        </aside>
      </div>

      <Footer />
    </div>
  );
}

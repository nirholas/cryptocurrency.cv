import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "@/i18n/navigation";
import { generateSEOMetadata } from "@/lib/seo";
import { sanitizeMarkdown } from "@/lib/sanitize";
import {
  learnArticles,
  getArticleBySlug,
  getRelatedArticles,
} from "@/data/learn-articles";
import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  return learnArticles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return generateSEOMetadata({
    title: `${article.title} — Learn Crypto`,
    description: article.description,
    path: `/learn/${slug}`,
    locale,
    tags: [article.category, article.difficulty, "learn crypto", "guide"],
  });
}

export default async function LearnArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const related = getRelatedArticles(article);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-text-secondary mb-8">
          <Link
            href="/"
            className="hover:text-accent transition-colors"
          >
            Home
          </Link>
          <span>/</span>
          <Link
            href="/learn"
            className="hover:text-accent transition-colors"
          >
            Learn
          </Link>
          <span>/</span>
          <span className="text-text-primary font-medium truncate">
            {article.title}
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main Content */}
          <article className="flex-1 min-w-0">
            <header className="mb-8">
              <span className="text-4xl mb-3 block">{article.icon}</span>
              <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3 text-text-primary">
                {article.title}
              </h1>
              <p className="text-text-secondary text-lg mb-4">
                {article.description}
              </p>
              <div className="flex items-center gap-3">
                <Badge>{article.difficulty}</Badge>
                <span className="text-sm text-text-secondary">
                  {article.readTime} read
                </span>
                <span className="text-sm text-text-secondary">
                  •
                </span>
                <span className="text-sm text-text-secondary">
                  {article.category}
                </span>
              </div>
            </header>

            {/* Article body rendered as prose */}
            <div
              className="prose dark:prose-invert max-w-none prose-headings:font-serif prose-a:text-accent prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{
                __html: sanitizeMarkdown(markdownToHtml(article.content)),
              }}
            />

            {/* Back link */}
            <div className="mt-10 pt-6 border-t border-border">
              <Link
                href="/learn"
                className="text-sm text-accent hover:underline"
              >
                ← Back to Learn
              </Link>
            </div>
          </article>

          {/* Related Articles Sidebar */}
          {related.length > 0 && (
            <aside className="lg:w-72 shrink-0">
              <h2 className="font-serif text-lg font-bold mb-4 text-text-primary">
                Related Guides
              </h2>
              <div className="space-y-3">
                {related.map((r) => (
                  <Link key={r.slug} href={`/learn/${r.slug}`}>
                    <Card className="hover:border-accent transition-colors">
                      <CardHeader className="p-4">
                        <div className="flex items-start gap-2">
                          <span className="text-xl">{r.icon}</span>
                          <div>
                            <CardTitle className="text-sm">{r.title}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {r.readTime} · {r.difficulty}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </aside>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

/**
 * Minimal markdown-to-HTML converter for the learn article content.
 * Handles headings, bold, italic, links, lists, tables, code, and paragraphs.
 */
function markdownToHtml(md: string): string {
  const lines = md.trim().split("\n");
  const htmlLines: string[] = [];
  let inList = false;
  let listType: "ul" | "ol" = "ul";
  let inTable = false;
  let tableRows: string[] = [];

  const flushTable = () => {
    if (tableRows.length > 0) {
      const [header, _sep, ...body] = tableRows;
      const thCells = header
        .split("|")
        .filter((c) => c.trim())
        .map((c) => `<th>${c.trim()}</th>`)
        .join("");
      const bodyHtml = body
        .map((row) => {
          const cells = row
            .split("|")
            .filter((c) => c.trim())
            .map((c) => `<td>${inlineFormat(c.trim())}</td>`)
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");
      htmlLines.push(
        `<table><thead><tr>${thCells}</tr></thead><tbody>${bodyHtml}</tbody></table>`,
      );
      tableRows = [];
    }
    inTable = false;
  };

  const flushList = () => {
    if (inList) {
      htmlLines.push(listType === "ol" ? "</ol>" : "</ul>");
      inList = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      flushList();
      if (inTable) flushTable();
      continue;
    }

    // Table row
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushList();
      inTable = true;
      tableRows.push(trimmed);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      htmlLines.push(`<h${level}>${inlineFormat(headingMatch[2])}</h${level}>`);
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(trimmed)) {
      if (!inList || listType !== "ul") {
        flushList();
        htmlLines.push("<ul>");
        inList = true;
        listType = "ul";
      }
      htmlLines.push(
        `<li>${inlineFormat(trimmed.replace(/^[-*]\s+/, ""))}</li>`,
      );
      continue;
    }

    // Ordered list
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (olMatch) {
      if (!inList || listType !== "ol") {
        flushList();
        htmlLines.push("<ol>");
        inList = true;
        listType = "ol";
      }
      htmlLines.push(`<li>${inlineFormat(olMatch[2])}</li>`);
      continue;
    }

    // Paragraph
    flushList();
    htmlLines.push(`<p>${inlineFormat(trimmed)}</p>`);
  }

  flushList();
  if (inTable) flushTable();

  return htmlLines.join("\n");
}

function inlineFormat(text: string): string {
  return (
    text
      // Bold
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      // Inline code
      .replace(/`(.+?)`/g, "<code>$1</code>")
      // Links
      .replace(
        /\[(.+?)\]\((.+?)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
      )
  );
}

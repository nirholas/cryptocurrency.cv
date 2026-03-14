import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageShareSection from "@/components/PageShareSection";
import { Link } from "@/i18n/navigation";
import { generateSEOMetadata } from "@/lib/seo";
import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";

type Props = {
  params: Promise<{ locale: string }>;
};

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  featured: boolean;
}

function parseFrontmatter(raw: string): Record<string, unknown> {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const block = match[1];
  const data: Record<string, unknown> = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)/);
    if (!m) continue;
    const [, key, value] = m;
    let v = value.trim();
    // Strip quotes
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    // Parse arrays
    if (v.startsWith("[") && v.endsWith("]")) {
      data[key] = v
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""));
    } else if (v === "true") {
      data[key] = true;
    } else if (v === "false") {
      data[key] = false;
    } else {
      data[key] = v;
    }
  }
  return data;
}

function getBlogPosts(): BlogPost[] {
  const blogDir = path.join(process.cwd(), "content", "blog");
  if (!fs.existsSync(blogDir)) return [];

  const files = fs.readdirSync(blogDir).filter((f) => f.endsWith(".md") && f !== "README.md");
  const posts: BlogPost[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(blogDir, file), "utf-8");
    const fm = parseFrontmatter(raw);
    posts.push({
      slug: file.replace(/\.md$/, ""),
      title: (fm.title as string) || file.replace(/\.md$/, "").replace(/-/g, " "),
      description: (fm.description as string) || "",
      date: (fm.date as string) || "",
      category: (fm.category as string) || "general",
      tags: (fm.tags as string[]) || [],
      featured: (fm.featured as boolean) || false,
    });
  }

  // Sort by date descending
  posts.sort((a, b) => (b.date > a.date ? 1 : -1));
  return posts;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Blog — Crypto Vision News",
    description:
      "In-depth articles, guides, and analysis on Bitcoin, Ethereum, DeFi, trading strategies, and the crypto ecosystem.",
    path: "/blog",
    locale,
    tags: ["crypto blog", "bitcoin articles", "ethereum guides", "defi analysis"],
  });
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const posts = getBlogPosts();
  const featured = posts.filter((p) => p.featured);
  const regular = posts.filter((p) => !p.featured);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        <section className="mb-12">
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3 text-text-primary">
            Blog
          </h1>
          <p className="text-text-secondary max-w-2xl text-lg leading-relaxed">
            In-depth articles, guides, and analysis on cryptocurrency and
            blockchain technology.
          </p>
        </section>

        {/* Featured Posts */}
        {featured.length > 0 && (
          <section className="mb-12">
            <h2 className="font-serif text-2xl font-bold mb-6 text-text-primary">
              Featured
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((post) => (
                <BlogPostCard key={post.slug} post={post} />
              ))}
            </div>
          </section>
        )}

        {/* All Posts */}
        <section>
          <h2 className="font-serif text-2xl font-bold mb-6 text-text-primary">
            All Articles
          </h2>
          {posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-text-secondary text-lg">
                  Blog coming soon. Stay tuned for articles on crypto and
                  blockchain.
                </p>
                <Link
                  href="/"
                  className="mt-4 inline-block text-sm text-accent hover:underline"
                >
                  ← Back to News
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(regular.length > 0 ? regular : posts).map((post) => (
                <BlogPostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex gap-4 flex-wrap">
            <Link
              href="/learn"
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-tertiary transition"
            >
              Learn Crypto
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-tertiary transition"
            >
              Latest News
            </Link>
          </div>
        </div>
      </main>
      <PageShareSection
        title="Crypto Vision News Blog — Insights & Analysis"
        description="In-depth crypto insights, market analysis, and project deep-dives."
        url={`https://cryptocurrency.cv/${locale}/blog`}
      />
      <Footer />
    </>
  );
}

function BlogPostCard({ post }: { post: BlogPost }) {
  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <Card className="flex flex-col h-full hover:border-accent transition-colors">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Badge>{post.category}</Badge>
          {post.featured && (
            <Badge variant="breaking">Featured</Badge>
          )}
        </div>
        <CardTitle className="text-base">{post.title}</CardTitle>
        <CardDescription>{post.description}</CardDescription>
      </CardHeader>
      <CardFooter className="mt-auto">
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-text-secondary">
            {formattedDate}
          </span>
          <span className="text-xs text-accent font-medium">
            Read →
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}

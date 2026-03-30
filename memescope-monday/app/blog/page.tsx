/* eslint-disable @next/next/no-img-element */
import { Metadata } from "next"
import Link from "next/link"

import { db } from "@/drizzle/db"

export const dynamic = 'force-dynamic'
import { blogArticle } from "@/drizzle/db/schema"
import { desc } from "drizzle-orm"
import { Calendar, Clock } from "lucide-react"

export const metadata: Metadata = {
  title: "Blog | Memescope Monday - Insights & Resources",
  description:
    "Discover insights, tutorials, and resources to help you build and launch successful products.",
  keywords: "blog, insights, tutorials, product launch, entrepreneurship, technology, startup",
  authors: [{ name: "Memescope Monday Team" }],
  openGraph: {
    title: "Blog | Memescope Monday - Insights & Resources",
    description:
      "Discover insights, tutorials, and resources to help you build and launch successful products.",
    type: "website",
    url: "/blog",
    siteName: "Memescope Monday",
    images: [
      {
        url: "/og-blog.png",
        width: 1200,
        height: 630,
        alt: "Memescope Monday Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | Memescope Monday - Insights & Resources",
    description:
      "Discover insights, tutorials, and resources to help you build and launch successful products.",
    images: ["/og-blog.png"],
  },
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200
  const words = content.split(/\s+/).length
  const minutes = Math.ceil(words / wordsPerMinute)
  return `${minutes} min read`
}

async function getArticles() {
  const articles = await db.select().from(blogArticle).orderBy(desc(blogArticle.publishedAt))

  return articles.map((article) => ({
    ...article,
    readingTime: calculateReadingTime(article.content),
  }))
}

export default async function BlogPage() {
  const articles = await getArticles()

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-foreground mb-4 text-2xl font-bold md:text-3xl">Blog</h1>
          <p className="text-muted-foreground text-md mx-auto max-w-4xl md:text-lg">
            Discover insights, tutorials, and resources to help you build and launch successful
            products.
          </p>
        </div>

        {/* Categories Section */}
        <div className="mb-12">
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/blog"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 py-2 text-sm font-medium transition-colors"
            >
              All Articles
            </Link>
            <Link
              href="/reviews"
              className="bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-full px-6 py-2 text-sm font-medium transition-colors"
            >
              Product Reviews
            </Link>
          </div>
        </div>

        {/* Articles Grid */}
        {articles.length === 0 ? (
          <div className="py-16 text-center">
            <div className="bg-card mx-auto max-w-md rounded-2xl border p-12">
              <div className="text-muted-foreground mb-4">
                <Calendar className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-card-foreground mb-2 text-lg font-semibold">No articles yet</h3>
              <p className="text-muted-foreground">
                We&apos;re working on some amazing content. Check back soon!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <article key={article.slug} className="group">
                <Link
                  href={`/blog/${article.slug}`}
                  className="bg-card hover:border-muted-foreground/20 block overflow-hidden rounded-2xl border"
                >
                  {/* Article Image */}
                  <div className="bg-muted relative aspect-[16/9] overflow-hidden">
                    {article.image ? (
                      <img
                        src={article.image}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="text-muted-foreground/30 text-4xl font-bold">
                          {article.title.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Article Content */}
                  <div className="px-6 py-4">
                    {/* Meta Information */}
                    <div className="text-muted-foreground mb-3 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <time dateTime={article.publishedAt.toISOString()}>
                          {formatDate(article.publishedAt)}
                        </time>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{article.readingTime}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {article.tags && article.tags.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2 text-xs">
                        {article.tags.slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {article.tags.length > 3 && (
                          <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs">
                            +{article.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Title */}
                    <h2 className="text-card-foreground group-hover:text-primary mb-2 line-clamp-3 text-xl font-bold transition-colors">
                      {article.title}
                    </h2>

                    {/* Description */}
                    <p className="text-muted-foreground line-clamp-3 text-sm">
                      {article.description}
                    </p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

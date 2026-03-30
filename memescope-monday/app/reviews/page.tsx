/* eslint-disable @next/next/no-img-element */
import { Metadata } from "next"
import Link from "next/link"

import { db } from "@/drizzle/db"

export const dynamic = 'force-dynamic'
import { seoArticle } from "@/drizzle/db/schema"
import { Calendar, Clock } from "lucide-react"

export const metadata: Metadata = {
  title: "Product Reviews | Memescope Monday - In-Depth Product Analysis",
  description:
    "Discover comprehensive product reviews and in-depth analysis of the latest tools and platforms to help you make informed decisions.",
  keywords: "product reviews, analysis, evaluation, tools, platforms, technology",
  authors: [{ name: "Memescope Monday Team" }],
  openGraph: {
    title: "Product Reviews | Memescope Monday - In-Depth Product Analysis",
    description:
      "Discover comprehensive product reviews and in-depth analysis of the latest tools and platforms to help you make informed decisions.",
    type: "website",
    url: "/reviews",
    siteName: "Memescope Monday",
  },
  twitter: {
    card: "summary_large_image",
    title: "Product Reviews | Memescope Monday - In-Depth Product Analysis",
    description:
      "Discover comprehensive product reviews and in-depth analysis of the latest tools and platforms to help you make informed decisions.",
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

async function getReviews() {
  const reviews = await db.select().from(seoArticle).orderBy(seoArticle.publishedAt)

  return reviews.map((review) => ({
    ...review,
    readingTime: calculateReadingTime(review.content),
  }))
}

export default async function ReviewsPage() {
  const reviews = await getReviews()

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-foreground mb-4 text-2xl font-bold md:text-3xl">Product Reviews</h1>
          <p className="text-muted-foreground text-md mx-auto max-w-4xl md:text-lg">
            In-depth reviews and analysis of the latest tools and platforms to help you make
            informed decisions.
          </p>
        </div>

        {/* Categories Section */}
        <div className="mb-12">
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/blog"
              className="bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-full px-6 py-2 text-sm font-medium transition-colors"
            >
              All Articles
            </Link>
            <Link
              href="/reviews"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 py-2 text-sm font-medium transition-colors"
            >
              Product Reviews
            </Link>
          </div>
        </div>

        {/* Reviews Grid */}
        {reviews.length === 0 ? (
          <div className="py-16 text-center">
            <div className="bg-card mx-auto max-w-md rounded-2xl border p-12">
              <div className="text-muted-foreground mb-4">
                <Calendar className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-card-foreground mb-2 text-lg font-semibold">No reviews yet</h3>
              <p className="text-muted-foreground">
                We&apos;re working on some amazing product reviews. Check back soon!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <article key={review.slug} className="group">
                <Link
                  href={`/reviews/${review.slug}`}
                  className="bg-card hover:border-muted-foreground/20 block overflow-hidden rounded-2xl border"
                >
                  {/* Review Image */}
                  <div className="bg-muted relative aspect-[16/9] overflow-hidden">
                    {review.image ? (
                      <img
                        src={review.image}
                        alt={review.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="text-muted-foreground/30 text-4xl font-bold">
                          {review.title.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Review Content */}
                  <div className="px-6 py-4">
                    {/* Meta Information */}
                    <div className="text-muted-foreground mb-3 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <time dateTime={review.publishedAt.toISOString()}>
                          {formatDate(review.publishedAt)}
                        </time>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{review.readingTime}</span>
                      </div>
                    </div>

                    {/* Review Badge */}
                    <div className="mb-4">
                      <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                        Product Review
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-card-foreground group-hover:text-primary mb-2 line-clamp-3 text-xl font-bold transition-colors">
                      {review.title}
                    </h2>

                    {/* Description */}
                    <p className="text-muted-foreground line-clamp-3 text-sm">
                      {review.description}
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

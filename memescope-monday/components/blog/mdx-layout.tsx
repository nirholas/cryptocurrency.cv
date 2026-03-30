import Image from "next/image"
import Link from "next/link"

import { format } from "date-fns"
import { ArrowLeft, Calendar, Clock } from "lucide-react"

import { ArticleFooter } from "./article-footer"
import { TableOfContents } from "./table-of-contents"

interface MdxLayoutProps {
  children: React.ReactNode
  frontmatter?: {
    title?: string
    description?: string
    publishedAt?: string
    tags?: string[]
    readingTime?: string
    author?: string
    image?: string
  }
}

export default function MdxLayout({ children, frontmatter }: MdxLayoutProps) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8">
          <Link
            href="/blog"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour aux articles</span>
          </Link>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-12">
          <main className="lg:col-span-9">
            {frontmatter && (
              <header className="mb-8">
                <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  {frontmatter.title}
                </h1>

                {frontmatter.description && (
                  <p className="text-muted-foreground mb-6 text-lg">{frontmatter.description}</p>
                )}

                <div className="text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                  {frontmatter.publishedAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <time dateTime={frontmatter.publishedAt}>
                        {format(new Date(frontmatter.publishedAt), "d MMMM yyyy")}
                      </time>
                    </div>
                  )}
                  {frontmatter.readingTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{frontmatter.readingTime}</span>
                    </div>
                  )}
                </div>

                {frontmatter.tags && frontmatter.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {frontmatter.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </header>
            )}

            {frontmatter?.image && (
              <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-lg border">
                <Image
                  src={frontmatter.image}
                  alt={frontmatter.title || "Image de l'article"}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            <article className="prose prose-lg dark:prose-invert max-w-none">{children}</article>

            <ArticleFooter />
          </main>

          <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-24">
              <TableOfContents />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

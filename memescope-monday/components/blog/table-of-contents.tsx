"use client"

import { useEffect, useState } from "react"

interface TocItem {
  id: string
  text: string
  level: number
}

export function TableOfContents() {
  const [toc, setToc] = useState<TocItem[]>([])

  useEffect(() => {
    // Generate table of contents from headings in the content
    const headings = document.querySelectorAll(".prose h2, .prose h3")
    const tocItems: TocItem[] = []

    headings.forEach((heading) => {
      const element = heading as HTMLElement
      const id =
        element.id ||
        element.textContent
          ?.toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .trim()

      if (id && element.textContent) {
        // Ensure the heading has an ID for navigation
        if (!element.id) {
          element.id = id
        }

        tocItems.push({
          id,
          text: element.textContent.trim(),
          level: parseInt(element.tagName.charAt(1)),
        })
      }
    })

    setToc(tocItems)
  }, [])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  if (toc.length === 0) return null

  return (
    <div className="space-y-2">
      <h2 className="text-foreground text-sm font-semibold">On this page</h2>
      <nav className="space-y-2">
        {toc.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => handleClick(e, item.id)}
            className={`text-muted-foreground hover:text-primary block text-sm transition-colors ${item.level === 3 ? "ml-3 text-xs" : ""} `}
          >
            {item.text}
          </a>
        ))}
      </nav>
    </div>
  )
}

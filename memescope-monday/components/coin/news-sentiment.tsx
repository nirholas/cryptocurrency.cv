"use client"

import { useState } from "react"

import { RiArrowDownSLine, RiNewspaperLine } from "@remixicon/react"

import type { CoinNews } from "@/lib/coin-data"
import { cn } from "@/lib/utils"

interface NewsSentimentProps {
  news: CoinNews[]
}

export function NewsSentiment({ news }: NewsSentimentProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-border overflow-hidden rounded-lg border">
      <button
        onClick={() => setOpen(!open)}
        className="hover:bg-muted/50 flex w-full items-center justify-between px-4 py-3 transition-colors"
      >
        <div className="flex items-center gap-2">
          <RiNewspaperLine className="text-muted-foreground h-4 w-4" />
          <span className="text-sm font-semibold">News & Sentiment</span>
          {news.length > 0 && (
            <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
              {news.length}
            </span>
          )}
        </div>
        <RiArrowDownSLine
          className={cn(
            "text-muted-foreground h-5 w-5 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="border-border border-t px-4 py-3">
          {news.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No news articles found for this coin.
            </p>
          ) : (
            <div className="space-y-3">
              {news.map((item, i) => (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-muted/30 hover:bg-muted/60 block rounded-lg border p-3 transition-colors"
                >
                  <div className="mb-1 flex items-center gap-2">
                    {item.sentiment && (
                      <span
                        className={`h-2 w-2 rounded-full ${
                          item.sentiment === "positive"
                            ? "bg-green-500"
                            : item.sentiment === "negative"
                              ? "bg-red-500"
                              : "bg-gray-400"
                        }`}
                      />
                    )}
                    <span className="text-muted-foreground text-xs">{item.source}</span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(item.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-foreground text-sm font-medium leading-tight">{item.title}</p>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

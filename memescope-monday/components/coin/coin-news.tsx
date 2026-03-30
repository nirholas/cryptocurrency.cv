import type { CoinNews } from "@/lib/coin-data"

interface CoinNewsProps {
  news: CoinNews[]
}

export function CoinNewsPanel({ news }: CoinNewsProps) {
  if (news.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Latest News</h3>
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
            <p className="text-foreground text-sm leading-tight font-medium">{item.title}</p>
          </a>
        ))}
      </div>
    </div>
  )
}

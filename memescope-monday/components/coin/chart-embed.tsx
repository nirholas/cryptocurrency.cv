"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"

interface ChartEmbedProps {
  dexScreenerUrl: string
  geckoTerminalUrl: string
}

const providers = [
  { id: "dexscreener", label: "DexScreener" },
  { id: "gecko", label: "GeckoTerminal" },
] as const

type ProviderId = (typeof providers)[number]["id"]

export function ChartEmbed({ dexScreenerUrl, geckoTerminalUrl }: ChartEmbedProps) {
  const [active, setActive] = useState<ProviderId>("gecko")

  const src = active === "dexscreener" ? dexScreenerUrl : geckoTerminalUrl

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="bg-muted/30 flex items-center gap-1 border-b px-3 py-1.5">
        {providers.map((p) => (
          <button
            key={p.id}
            onClick={() => setActive(p.id)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              active === p.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <iframe src={src} className="h-[600px] w-full border-0" title="Price Chart" />
    </div>
  )
}

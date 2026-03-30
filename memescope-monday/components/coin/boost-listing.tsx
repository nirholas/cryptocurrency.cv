"use client"

import { useState } from "react"

import { CheckoutButton } from "@/components/pricing/checkout-button"

export function BoostListing() {
  const [selected, setSelected] = useState<string | null>(null)

  const tiers = [
    {
      name: "Expedited Review",
      price: "$19",
      description: "Skip the queue. Reviewed within 1 hour.",
      stripeTier: "expedited_review",
    },
    {
      name: "Trending Placement",
      price: "$49",
      description: "24h featured in the Trending section.",
      stripeTier: "trending_placement",
    },
    {
      name: "Bundle (Both)",
      price: "$59",
      description: "Expedited review + 24h trending placement.",
      stripeTier: "bundle",
    },
  ]

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Boost Your Listing</h3>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Get more visibility for your coin. Pay with crypto or card.
        </p>
      </div>

      <div className="space-y-2">
        {tiers.map((tier) => (
          <button
            key={tier.name}
            onClick={() => setSelected(tier.stripeTier)}
            className={`w-full rounded-lg border p-3 text-left transition-colors ${
              selected === tier.stripeTier
                ? "border-primary bg-primary/5"
                : "border-border/60 hover:border-border"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                  selected === tier.stripeTier
                    ? "border-primary"
                    : "border-muted-foreground/40"
                }`}
              >
                {selected === tier.stripeTier && (
                  <div className="bg-primary h-2 w-2 rounded-full" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{tier.name}</span>
                  <span className="text-foreground text-sm font-bold">{tier.price}</span>
                </div>
                <p className="text-muted-foreground mt-0.5 text-xs">{tier.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <CheckoutButton
          tier={selected}
          label={`Pay ${tiers.find((t) => t.stripeTier === selected)?.price}`}
          highlighted
        />
      )}
    </div>
  )
}

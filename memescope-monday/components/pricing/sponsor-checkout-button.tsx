"use client"

import { useState } from "react"

import { RiLoader4Line } from "@remixicon/react"

import { Button } from "@/components/ui/button"

interface SponsorCheckoutButtonProps {
  tier: "sponsor_weekly" | "sponsor_monthly"
  label: string
  highlighted?: boolean
}

export function SponsorCheckoutButton({ tier, label, highlighted }: SponsorCheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [sponsorName, setSponsorName] = useState("")
  const [sponsorWebsite, setSponsorWebsite] = useState("")
  const [sponsorDescription, setSponsorDescription] = useState("")

  const handleCheckout = async () => {
    if (!sponsorName.trim() || !sponsorWebsite.trim()) return

    setLoading(true)
    try {
      const res = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, sponsorName, sponsorWebsite, sponsorDescription }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/sign-in?redirect=/sponsors"
          return
        }
        alert(data.error || "Something went wrong")
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      alert("Failed to start checkout. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!showForm) {
    return (
      <Button
        size="lg"
        className="w-full"
        variant={highlighted ? "default" : "outline"}
        onClick={() => setShowForm(true)}
      >
        {label}
      </Button>
    )
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Your brand / project name *"
        value={sponsorName}
        onChange={(e) => setSponsorName(e.target.value)}
        className="bg-background h-9 w-full rounded-md border px-3 text-sm"
        required
      />
      <input
        type="url"
        placeholder="Website URL *"
        value={sponsorWebsite}
        onChange={(e) => setSponsorWebsite(e.target.value)}
        className="bg-background h-9 w-full rounded-md border px-3 text-sm"
        required
      />
      <input
        type="text"
        placeholder="Short description (optional)"
        value={sponsorDescription}
        onChange={(e) => setSponsorDescription(e.target.value)}
        className="bg-background h-9 w-full rounded-md border px-3 text-sm"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          variant={highlighted ? "default" : "outline"}
          onClick={handleCheckout}
          disabled={loading || !sponsorName.trim() || !sponsorWebsite.trim()}
        >
          {loading ? (
            <>
              <RiLoader4Line className="mr-1.5 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Pay & Sponsor"
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowForm(false)}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

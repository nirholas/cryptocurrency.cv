"use client"

import { useState } from "react"

import { RiLoader4Line } from "@remixicon/react"

import { Button } from "@/components/ui/button"

interface CheckoutButtonProps {
  tier: string
  label: string
  highlighted?: boolean
  projectId?: string
}

export function CheckoutButton({ tier, label, highlighted, projectId }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, projectId }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/sign-in?redirect=/pricing"
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

  return (
    <Button
      size="sm"
      className="w-full"
      variant={highlighted ? "default" : "outline"}
      onClick={handleCheckout}
      disabled={loading}
    >
      {loading ? (
        <>
          <RiLoader4Line className="mr-1.5 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        label
      )}
    </Button>
  )
}

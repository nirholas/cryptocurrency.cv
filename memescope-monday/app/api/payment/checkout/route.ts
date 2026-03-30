import { headers } from "next/headers"
import { NextResponse } from "next/server"

import Stripe from "stripe"

import { auth } from "@/lib/auth"

// Pricing tiers in USD cents
const TIERS: Record<string, { name: string; amount: number; description: string }> = {
  fast_track: {
    name: "Fast Track Listing",
    amount: 4900, // $49
    description: "Priority listing within 12 hours + trending badge for 24h",
  },
  sponsorship: {
    name: "Sponsorship",
    amount: 9900, // $99
    description: "7-day featured placement + all Fast Track benefits",
  },
  premium: {
    name: "Premium Sponsorship",
    amount: 39900, // $399
    description: "30-day top placement + featured across all pages",
  },
  sponsor_weekly: {
    name: "Weekly Sponsor Slot",
    amount: 3000, // $30
    description: "7 days of featured sponsor placement on homepage & project pages",
  },
  sponsor_monthly: {
    name: "Monthly Sponsor Slot",
    amount: 9900, // $99
    description: "30 days of featured sponsor placement on homepage & project pages",
  },
}

export async function POST(request: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is not configured")
      return NextResponse.json({ error: "Payment system is not configured" }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { tier, projectId, sponsorName, sponsorWebsite, sponsorDescription } = body

    if (!tier || !TIERS[tier]) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
    }

    // Validate sponsor-specific fields
    const isSponsorTier = tier === "sponsor_weekly" || tier === "sponsor_monthly"
    if (isSponsorTier && (!sponsorName || !sponsorWebsite)) {
      return NextResponse.json(
        { error: "Sponsor name and website are required" },
        { status: 400 },
      )
    }

    const tierData = TIERS[tier]
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000"

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: tierData.name,
              description: tierData.description,
            },
            unit_amount: tierData.amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: isSponsorTier
        ? `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=sponsor`
        : `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: isSponsorTier ? `${baseUrl}/sponsors` : `${baseUrl}/pricing`,
      client_reference_id: projectId || undefined,
      customer_email: session.user.email,
      metadata: {
        tier,
        userId: session.user.id,
        projectId: projectId || "",
        ...(isSponsorTier && {
          sponsorName: sponsorName || "",
          sponsorWebsite: sponsorWebsite || "",
          sponsorDescription: sponsorDescription || "",
        }),
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}

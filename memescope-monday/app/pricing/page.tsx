import Link from "next/link"

import { RiCheckboxCircleFill } from "@remixicon/react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { CheckoutButton } from "@/components/pricing/checkout-button"

export const metadata = {
  title: "Pricing - Memescope Monday",
  description: "Choose the perfect plan for your memecoin listing",
}

const faqItems = [
  {
    id: "1",
    title: "How long does a Free Listing take?",
    content:
      "Free listings are reviewed and added to the directory within 24-48 hours, subject to basic quality checks.",
  },
  {
    id: "2",
    title: "How fast is the Fast Track listing?",
    content:
      "Fast Track listings are typically processed instantly and no later than 12 hours after submission.",
  },
  {
    id: "3",
    title: "What does the Sponsorship include?",
    content:
      "Sponsorship gets your coin featured in the Sponsors section on the homepage for 7 days, with a custom banner or highlight, plus all Fast Track benefits.",
  },
  {
    id: "4",
    title: "How do I pay?",
    content:
      "You can pay with a credit card via Stripe, or with SOL/crypto by contacting @nichxbt on Telegram or X.",
  },
  {
    id: "5",
    title: "Can I upgrade my listing later?",
    content:
      "Yes, you can upgrade from any tier to a higher one at any time. Contact us and we will apply the upgrade immediately.",
  },
]

const tiers = [
  {
    name: "Free Listing",
    price: "$0",
    description: "Get your coin listed in the directory at no cost.",
    features: [
      "Standard listing in the directory",
      "Community upvoting",
      "Comments & discussion",
      "Chain badge display",
    ],
    highlighted: false,
    isFree: true,
    stripeTier: null,
  },
  {
    name: "Fast Track",
    price: "$49",
    solPrice: "0.45 SOL",
    description: "Get listed fast with priority placement.",
    features: [
      "Listed within 12 hours (usually instant)",
      "Priority placement in directory",
      "Trending badge for 24h",
      "All free features included",
    ],
    highlighted: true,
    isFree: false,
    stripeTier: "fast_track",
  },
  {
    name: "Sponsorship",
    price: "$99",
    solPrice: "0.9 SOL",
    description: "Featured placement with maximum visibility.",
    features: [
      "Featured in Sponsors section on homepage",
      "7-day featured placement",
      "Custom banner/highlight",
      "All Fast Track features",
    ],
    highlighted: false,
    isFree: false,
    stripeTier: "sponsorship",
  },
  {
    name: "Premium Sponsorship",
    price: "$399",
    solPrice: "4 SOL",
    description: "Maximum exposure across the entire platform.",
    features: [
      "Top of directory for 30 days",
      "Featured across all pages",
      "Custom spotlight article",
      "All Sponsorship features",
    ],
    highlighted: false,
    isFree: false,
    stripeTier: "premium",
  },
]

export default function PricingPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
      <div className="mb-8 text-center">
        <h1 className="mb-3 text-2xl font-bold sm:text-3xl">Listing & Sponsorship Pricing</h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-sm">
          Get the visibility your memecoin deserves. Pay with card or crypto.
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="mx-auto mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`flex flex-col rounded-lg border p-5 ${
              tier.highlighted ? "border-primary/40 bg-primary/5 ring-primary/20 ring-1" : ""
            }`}
          >
            <div className="flex-grow">
              <h3 className="mb-1 text-base font-semibold">{tier.name}</h3>
              <div className="mb-0.5 text-2xl font-bold">{tier.price}</div>
              {tier.solPrice && (
                <p className="text-muted-foreground mb-2 text-xs">or {tier.solPrice}</p>
              )}
              <p className="text-muted-foreground mb-4 text-xs">{tier.description}</p>

              <ul className="mb-5 space-y-2 text-sm">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <RiCheckboxCircleFill
                      className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                        tier.highlighted ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-auto space-y-2 pt-3">
              {tier.isFree ? (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/projects/submit">Submit Your Coin</Link>
                </Button>
              ) : (
                <>
                  <CheckoutButton
                    tier={tier.stripeTier!}
                    label={`Pay ${tier.price}`}
                    highlighted={tier.highlighted}
                  />
                  <Button size="sm" variant="ghost" className="w-full text-xs" asChild>
                    <Link href="https://t.me/nichxbt" target="_blank" rel="noopener noreferrer">
                      Pay with crypto →
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Contact CTA */}
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <div className="rounded-lg border p-6">
          <h2 className="mb-2 text-lg font-semibold">Prefer to pay with crypto?</h2>
          <p className="text-muted-foreground mb-4 text-sm">
            Reach out to @nichxbt on Telegram or X to pay with SOL or other crypto.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="sm" asChild>
              <Link href="https://t.me/nichxbt" target="_blank" rel="noopener noreferrer">
                Contact on Telegram
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="https://x.com/swarminged" target="_blank" rel="noopener noreferrer">
                Contact on X
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mx-auto mb-12 max-w-3xl">
        <h2 className="mb-4 text-center text-xl font-bold sm:text-2xl">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full -space-y-px" defaultValue="1">
          {faqItems.map((item) => (
            <AccordionItem
              value={item.id}
              key={item.id}
              className="bg-background has-focus-visible:border-ring has-focus-visible:ring-ring/50 relative border px-4 py-1 outline-none first:rounded-t-md last:rounded-b-md last:border-b has-focus-visible:z-10 has-focus-visible:ring-[3px]"
            >
              <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline focus-visible:ring-0">
                {item.title}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-2">
                {item.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}

import { RiCheckboxCircleFill } from "@remixicon/react"

import { SPONSORSHIP_SLOTS } from "@/lib/constants"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { SponsorCheckoutButton } from "@/components/pricing/sponsor-checkout-button"
import { getLast30DaysPageviews, getLast30DaysVisitors } from "@/app/actions/plausible"

export const dynamic = 'force-dynamic'

export const metadata = {
  title: "Sponsors - Memescope Monday",
  description: "Support Memescope Monday and gain visibility for your product or service.",
}

export default async function SponsorsPage() {
  const remainingSlots = SPONSORSHIP_SLOTS.TOTAL - SPONSORSHIP_SLOTS.USED
  const [visitors, pageviews] = await Promise.all([
    getLast30DaysVisitors(),
    getLast30DaysPageviews(),
  ])

  const generalSponsorshipBenefits = [
    "Featured on our homepage sidebar.",
    "Visible on every project page.",
    "Reach a dedicated audience of developers and tech enthusiasts.",
    "Direct link to your website.",
  ]

  const faqItems = [
    {
      question: "How long does it take for my sponsorship to go live?",
      answer:
        "Typically, your sponsorship will be live within a few hours after payment confirmation.",
    },
    {
      question: "What kind of products or services can I promote?",
      answer:
        "We welcome sponsorships for products and services relevant to developers, tech enthusiasts, startups, and SaaS businesses. We reserve the right to refuse any sponsorship that is not a good fit for our audience.",
    },

    {
      question: "What are the image/logo specifications?",
      answer:
        "Please provide a square logo (e.g., PNG, JPG, SVG). We recommend a minimum width of 200px for clarity. We'll work with you to ensure it looks great.",
    },
    {
      question: "What if all sponsorship slots are filled?",
      answer:
        "If all slots are currently filled, you can contact us to be added to a waitlist. We'll notify you as soon as a slot becomes available.",
    },
  ]

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="mb-8 text-center">
        <h1 className="mb-3 text-2xl font-bold sm:text-3xl">Become a Sponsor</h1>
        <p className="text-muted-foreground mx-auto max-w-xl text-sm">
          Support Memescope Monday and gain visibility. Limited sponsorship slots for maximum impact.
        </p>
        <p className="text-primary text-center text-sm font-medium">
          Currently, <span className="font-bold">{remainingSlots}</span> slot
          {remainingSlots !== 1 ? "s are" : " is"} available!
        </p>
      </div>
      {/* General Benefits & Statistics Section */}
      <div className="mx-auto mb-4 max-w-3xl">
        <div className="bg-background/70 rounded-lg border p-5 md:p-6">
          <h2 className="mb-5 text-center text-xl font-semibold">Key Benefits & Audience Reach</h2>
          <div className="mx-auto max-w-md">
            <ul className="mb-2 space-y-2 text-sm md:text-base">
              {generalSponsorshipBenefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <RiCheckboxCircleFill className="text-primary mt-1 h-5 w-5 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-2 text-sm md:text-base">
              <div className="flex items-start gap-3">
                <RiCheckboxCircleFill className="text-primary mt-1 h-5 w-5 flex-shrink-0" />
                <span>
                  <strong>{visitors?.toLocaleString() || "N/A"}</strong> Unique Visitors{" "}
                  <span className="text-muted-foreground text-xs">(last 30 days)</span>
                </span>
              </div>
              <div className="flex items-start gap-3">
                <RiCheckboxCircleFill className="text-primary mt-1 h-5 w-5 flex-shrink-0" />
                <span>
                  <strong>{pageviews?.toLocaleString() || "N/A"}</strong> Page Views{" "}
                  <span className="text-muted-foreground text-xs">(last 30 days)</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sponsorship Options  */}
      <div className="mx-auto mb-12">
        <div className="grid grid-cols-1 overflow-hidden rounded-lg border md:grid-cols-10">
          {/* Weekly Option */}
          <div className="flex h-full flex-col p-6 md:col-span-5">
            <div className="flex-grow">
              <h3 className="mb-2 text-lg font-medium">Weekly Spotlight</h3>
              <div className="mb-3 text-3xl font-bold">
                $30
                <span className="text-muted-foreground text-base font-normal"> / week</span>
              </div>
              <p className="text-muted-foreground mb-4 text-xs">
                Ideal for short-term campaigns or specific announcements.
              </p>
              <ul className="mb-5 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <RiCheckboxCircleFill className="text-muted-foreground h-4 w-4" />
                  <span>7 days of visibility</span>
                </li>
                <li className="flex items-center gap-2">
                  <RiCheckboxCircleFill className="text-muted-foreground h-4 w-4" />
                  <span>Quick and easy setup</span>
                </li>
                <li className="flex items-center gap-2">
                  <RiCheckboxCircleFill className="text-muted-foreground h-4 w-4" />
                  <span>Homepage & Project Page display</span>
                </li>
              </ul>
            </div>
            <div className="mt-auto pt-3">
              <SponsorCheckoutButton tier="sponsor_weekly" label="Sponsor for a Week" />
            </div>
          </div>

          {/* Monthly Option */}
          <div className="bg-muted/50 flex h-full flex-col border-t p-6 md:col-span-5 md:border-t-0 md:border-l">
            <div className="flex-grow">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-primary text-lg font-medium">Monthly Partnership</h3>
                <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  Best Value
                </span>
              </div>
              <div className="text-primary mb-3 text-3xl font-bold">
                $99
                <span className="text-primary/90 text-base font-normal"> / month</span>
              </div>
              <p className="text-muted-foreground mb-4 text-xs">
                Maximize exposure with sustained visibility and best value.
              </p>
              <ul className="mb-5 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <RiCheckboxCircleFill className="text-primary h-4 w-4" />
                  <span className="font-medium">1 month of visibility</span>
                </li>
                <li className="flex items-center gap-2">
                  <RiCheckboxCircleFill className="text-primary h-4 w-4" />
                  <span className="font-medium">Quick and easy setup</span>
                </li>
                <li className="flex items-center gap-2">
                  <RiCheckboxCircleFill className="text-primary h-4 w-4" />
                  <span className="font-medium">Homepage & Project Page display</span>
                </li>
                <li className="flex items-center gap-2">
                  <RiCheckboxCircleFill className="text-primary h-4 w-4" />
                  <span className="font-medium">Most cost-effective solution</span>
                </li>
                <li className="flex items-center gap-2">
                  <RiCheckboxCircleFill className="text-primary h-4 w-4" />
                  <span className="font-medium">Priority slot consideration</span>
                </li>
              </ul>
            </div>
            <div className="mt-auto pt-3">
              <SponsorCheckoutButton tier="sponsor_monthly" label="Sponsor for a Month" highlighted />
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-4 text-center text-xl font-bold sm:text-2xl">
          Frequently Asked Questions
        </h2>{" "}
        <Accordion type="single" collapsible className="w-full -space-y-px">
          {faqItems.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-background has-focus-visible:border-ring has-focus-visible:ring-ring/50 relative border px-4 py-1 outline-none first:rounded-t-md last:rounded-b-md last:border-b has-focus-visible:z-10 has-focus-visible:ring-[3px]"
            >
              <AccordionTrigger className="py-3 text-left text-[15px] leading-6 hover:no-underline focus-visible:ring-0">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-3 text-sm">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}

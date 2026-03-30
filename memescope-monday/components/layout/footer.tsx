/* eslint-disable @next/next/no-img-element */
import Link from "next/link"

import { RiGithubFill, RiTwitterXFill } from "@remixicon/react"

// Link groups for a columnar layout
const discoverLinks = [
  { title: "Trending", href: "/trending" },
  { title: "Categories", href: "/categories" },
  { title: "Submit Project", href: "/projects/submit" },
]

const resourcesLinks = [
  { title: "Pricing", href: "/pricing" },
  { title: "Sponsors", href: "/sponsors" },
  { title: "Blog", href: "/blog" },
]

const connectLinkItems = [
  {
    href: "https://github.com/nirholas/memescope-monday",
    icon: RiGithubFill,
    label: "GitHub",
  },
  {
    href: "https://x.com/swarminged",
    icon: RiTwitterXFill,
    label: "Twitter / X",
  },
]

export default function FooterSection() {
  return (
    <footer className="bg-background border-t pt-6 pb-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-12 md:gap-x-8">
          {/* Left Section: Brand, Copyright, Author, Badges - Align left on mobile */}
          <div className="flex flex-col items-start text-left md:col-span-4 lg:col-span-4">
            <Link href="/" className="font-heading mb-3 flex items-center">
              <span className="font-heading flex items-center text-lg font-bold">
                Memescope Monday
              </span>
            </Link>
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Memescope Monday. All rights reserved. Not financial
              advice. DYOR.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              Open source project by{" "}
              <Link
                href="https://x.com/swarminged"
                target="_blank"
                rel="noopener"
                className="hover:text-primary underline"
              >
                swarmsy
              </Link>
            </p>
            <div className="flex items-center justify-start space-x-3">
              <img
                src="/monday.svg"
                alt="Memescope Monday Badge (Light Theme)"
                className="block w-[200px] dark:hidden"
              />
              <img
                src="/monday.svg"
                alt="Memescope Monday Badge (Dark Theme)"
                className="hidden w-[200px] dark:block"
              />
            </div>
          </div>

          {/* Right Section: Columnar Navigation Links - 2 colonnes sur mobile, 4 sur md */}
          <div className="grid grid-cols-2 gap-8 md:col-span-8 md:grid-cols-3">
            {/* Discover Column */}
            <div className="text-left">
              <h3 className="text-foreground text-sm font-semibold tracking-wider uppercase">
                Discover
              </h3>
              <ul role="list" className="mt-4 flex flex-col items-start space-y-3">
                {discoverLinks.map((link) => (
                  <li key={link.title}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary text-sm transition-colors duration-150"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Column */}
            <div className="text-left">
              <h3 className="text-foreground text-sm font-semibold tracking-wider uppercase">
                Resources
              </h3>
              <ul role="list" className="mt-4 flex flex-col items-start space-y-3">
                {resourcesLinks.map((link) => (
                  <li key={link.title}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary text-sm transition-colors duration-150"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect Column */}
            <div className="text-left">
              <h3 className="text-foreground text-sm font-semibold tracking-wider uppercase">
                Connect
              </h3>
              <ul role="list" className="mt-4 flex flex-col items-start space-y-3">
                {connectLinkItems.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 text-sm transition-colors duration-150"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FooterSectionProps {
  title: string;
  links: { label: string; href: string }[];
}

export default function FooterSection({ title, links }: FooterSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {/* Desktop: always-visible heading */}
      <h3 className="hidden md:block mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary)]">
        {title}
      </h3>

      {/* Mobile: tap-to-expand accordion */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="md:hidden flex w-full items-center justify-between py-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary)] cursor-pointer min-h-[44px]"
        aria-expanded={open}
      >
        {title}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[var(--color-text-tertiary)] transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Links — always visible on desktop, collapsible on mobile */}
      <ul
        className={cn(
          "space-y-2 md:block transition-all duration-200 overflow-hidden",
          open ? "max-h-96 opacity-100 pb-3" : "max-h-0 opacity-0 md:max-h-none md:opacity-100",
        )}
      >
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group flex items-center gap-1 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)] min-h-[44px] md:min-h-0"
            >
              <span className="inline-block w-0 overflow-hidden text-[#3b82f6] transition-all group-hover:w-3">
                →
              </span>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

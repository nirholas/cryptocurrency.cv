/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  /** Show the full wordmark (true) or just the V icon mark (false). */
  showText?: boolean;
  className?: string;
}

/**
 * Crypto Vision brand logo.
 *
 * Full mode: serif wordmark "cryptoVision" with oversized V.
 * Icon mode (showText=false): the "V" mark on a dark-blue rounded square.
 *
 * Used in Header, Footer, and anywhere the brand mark is needed.
 */
export default function Logo({ size = "md", showText = true, className }: LogoProps) {
  const cfg = {
    sm: { icon: 24, crypto: "text-sm", v: "text-xl", ision: "text-sm" },
    md: { icon: 28, crypto: "text-base", v: "text-2xl", ision: "text-base" },
    lg: { icon: 36, crypto: "text-xl", v: "text-3xl", ision: "text-xl" },
  }[size];

  if (!showText) {
    /* Icon‑only — the stylized "V" on dark-blue rounded square */
    return (
      <span className={cn("inline-flex items-center", className)}>
        <svg
          width={cfg.icon}
          height={cfg.icon}
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Crypto Vision"
          className="shrink-0"
        >
          <rect width="512" height="512" rx="96" fill="var(--color-accent, #1e3a5f)" />
          <path
            d="M144 128h72l8 16-56 232h-16L144 128Zm224 0h-72l-8 16 56 232h16L368 128Z"
            fill="#ffffff"
          />
          <rect x="112" y="128" width="128" height="14" rx="7" fill="#ffffff" />
          <rect x="272" y="128" width="128" height="14" rx="7" fill="#ffffff" />
        </svg>
      </span>
    );
  }

  /* Full wordmark — "cryptoVision" with oversized V */
  return (
    <span
      className={cn("inline-flex items-baseline", className)}
      aria-label="Crypto Vision News"
    >
      <span
        className={cn(cfg.crypto, "font-normal tracking-wide")}
        style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "var(--color-text-primary)" }}
      >
        crypto
      </span>
      <span
        className={cn(cfg.v, "font-bold")}
        style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "var(--color-text-primary)" }}
      >
        V
      </span>
      <span
        className={cn(cfg.ision, "font-normal tracking-wide")}
        style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "var(--color-text-primary)" }}
      >
        ision
      </span>
    </span>
  );
}

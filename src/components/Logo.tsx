import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  /** Show the full wordmark (true) or just the N icon mark (false). */
  showText?: boolean;
  className?: string;
}

/**
 * Free Crypto News brand logo.
 *
 * Full mode: wordmark "FREE CRYPTO NEWS" with oversized orange N.
 * Icon mode (showText=false): the "N" mark on a dark rounded square.
 *
 * Used in Header, Footer, and anywhere the brand mark is needed.
 */
export default function Logo({ size = "md", showText = true, className }: LogoProps) {
  const cfg = {
    sm: { wordmarkW: 160, wordmarkH: 24, icon: 24, text: "text-base" },
    md: { wordmarkW: 200, wordmarkH: 30, icon: 28, text: "text-lg" },
    lg: { wordmarkW: 260, wordmarkH: 39, icon: 36, text: "text-2xl" },
  }[size];

  if (!showText) {
    /* Icon‑only — the oversized "N" on dark rounded square */
    return (
      <span className={cn("inline-flex items-center", className)}>
        <svg
          width={cfg.icon}
          height={cfg.icon}
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Free Crypto News"
          className="shrink-0"
        >
          <rect width="512" height="512" rx="96" fill="#0f172a" />
          <text
            x="256"
            y="380"
            fontFamily="Georgia,'Times New Roman',serif"
            fontSize="360"
            fontWeight="900"
            fill="#F7931A"
            textAnchor="middle"
          >
            N
          </text>
          <rect x="56" y="56" width="400" height="6" rx="3" fill="#F7931A" opacity="0.6" />
        </svg>
      </span>
    );
  }

  /* Full wordmark — "FREE CRYPTO NEWS" */
  return (
    <span className={cn("inline-flex items-center", className)}>
      <svg
        width={cfg.wordmarkW}
        height={cfg.wordmarkH}
        viewBox="0 0 800 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Free Crypto News"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="logo-accent" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F7931A" />
            <stop offset="100%" stopColor="#E8820F" />
          </linearGradient>
        </defs>
        {/* Top accent bar */}
        <rect x="18" y="14" width="530" height="4" rx="2" fill="url(#logo-accent)" />
        <rect x="498" y="14" width="284" height="4" rx="2" fill="url(#logo-accent)" />
        {/* FREE CRYPTO */}
        <text
          x="20"
          y="80"
          fontFamily="Georgia,'Times New Roman',serif"
          fontSize="62"
          fontWeight="900"
          letterSpacing="2"
          fill="currentColor"
        >
          FREE CRYPTO{" "}
        </text>
        {/* Oversized N in Bitcoin orange */}
        <text
          x="498"
          y="80"
          fontFamily="Georgia,'Times New Roman',serif"
          fontSize="82"
          fontWeight="900"
          fill="#F7931A"
        >
          N
        </text>
        {/* EWS */}
        <text
          x="556"
          y="80"
          fontFamily="Georgia,'Times New Roman',serif"
          fontSize="62"
          fontWeight="900"
          letterSpacing="2"
          fill="currentColor"
        >
          EWS
        </text>
        {/* Rule */}
        <rect x="18" y="96" width="764" height="1.5" fill="currentColor" opacity="0.2" />
        {/* Tagline */}
        <text
          x="20"
          y="113"
          fontFamily="Georgia,'Times New Roman',serif"
          fontSize="11"
          fontWeight="400"
          letterSpacing="4"
          fill="currentColor"
          opacity="0.5"
        >
          REAL-TIME CRYPTO INTELLIGENCE
        </text>
      </svg>
    </span>
  );
}

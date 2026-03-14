"use client";

import { useState, useCallback } from "react";
import { Star } from "lucide-react";
import { useWatchlist } from "@/components/watchlist";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

interface WatchlistButtonProps {
  coinId: string;
  coinName: string;
  coinSymbol: string;
  /** Show label text next to the star */
  showLabel?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: { button: "p-1", icon: "h-3.5 w-3.5" },
  md: { button: "p-1.5", icon: "h-4 w-4" },
  lg: { button: "p-2", icon: "h-5 w-5" },
};

export function WatchlistButton({
  coinId,
  coinName,
  coinSymbol,
  showLabel = false,
  size = "md",
  className,
}: WatchlistButtonProps) {
  const { addCoin, removeCoin, isCoinWatched, coins, maxCoins } = useWatchlist();
  const { addToast } = useToast();
  const watched = isCoinWatched(coinId);
  const [animating, setAnimating] = useState(false);

  const toggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Trigger animation
      setAnimating(true);
      setTimeout(() => setAnimating(false), 300);

      if (watched) {
        removeCoin(coinId);
        addToast(`${coinName} removed from watchlist`, "info");
      } else {
        if (coins.length >= maxCoins) {
          addToast(`Watchlist is full (max ${maxCoins} coins)`, "error");
          return;
        }
        const added = addCoin({ id: coinId, name: coinName, symbol: coinSymbol });
        if (added) {
          addToast(`${coinName} added to watchlist`, "success");
        }
      }
    },
    [watched, coinId, coinName, coinSymbol, addCoin, removeCoin, addToast, coins.length, maxCoins],
  );

  const s = sizeClasses[size];

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex items-center justify-center rounded-md transition-all duration-200 gap-1.5",
        s.button,
        watched
          ? "text-yellow-500 hover:text-yellow-600"
          : "text-text-tertiary hover:text-yellow-500",
        animating && "scale-125",
        className,
      )}
      aria-label={watched ? `Remove ${coinName} from watchlist` : `Add ${coinName} to watchlist`}
      title={watched ? `Remove ${coinName} from watchlist` : `Add ${coinName} to watchlist`}
    >
      <Star
        className={cn(
          s.icon,
          "transition-transform duration-200",
          watched && "fill-current",
          animating && "rotate-[72deg]",
        )}
      />
      {showLabel && (
        <span className="text-xs font-medium">
          {watched ? "Watching" : "Watch"}
        </span>
      )}
    </button>
  );
}

"use client";

import { Star } from "lucide-react";
import { useWatchlist } from "@/components/watchlist";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

interface WatchlistButtonProps {
  coinId: string;
  coinName: string;
  coinSymbol: string;
  className?: string;
}

export function WatchlistButton({ coinId, coinName, coinSymbol, className }: WatchlistButtonProps) {
  const { addCoin, removeCoin, isCoinWatched } = useWatchlist();
  const { addToast } = useToast();
  const watched = isCoinWatched(coinId);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (watched) {
      removeCoin(coinId);
      addToast(`${coinName} removed from watchlist`, "info");
    } else {
      const added = addCoin({ id: coinId, name: coinName, symbol: coinSymbol });
      if (added) {
        addToast(`${coinName} added to watchlist`, "success");
      } else {
        addToast("Watchlist is full (max 50 coins)", "error");
      }
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex items-center justify-center rounded-md p-1.5 transition-colors",
        watched
          ? "text-yellow-500 hover:text-yellow-600"
          : "text-[var(--color-text-tertiary)] hover:text-yellow-500",
        className,
      )}
      aria-label={watched ? `Remove ${coinName} from watchlist` : `Add ${coinName} to watchlist`}
    >
      <Star className={cn("h-4 w-4", watched && "fill-current")} />
    </button>
  );
}

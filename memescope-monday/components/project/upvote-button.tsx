"use client"

import React, { useEffect, useOptimistic, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { RiThumbUpFill, RiThumbUpLine } from "@remixicon/react"
import { toast } from "sonner"

import { UPVOTE_LIMITS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { toggleUpvote } from "@/app/actions/projects"

interface UpvoteButtonProps {
  projectId: string
  initialUpvoted: boolean
  upvoteCount: number
  isAuthenticated: boolean
  variant?: "default" | "compact"
  className?: string
}

export function UpvoteButton({
  projectId,
  initialUpvoted,
  upvoteCount,
  isAuthenticated,
  variant = "default",
  className,
}: UpvoteButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDebouncing, setIsDebouncing] = useState(false)
  const [optimisticState, updateOptimisticState] = useOptimistic(
    { upvoted: initialUpvoted, count: upvoteCount },
    (state, newUpvoted: boolean) => ({
      upvoted: newUpvoted,
      count: state.count + (newUpvoted ? 1 : -1),
    }),
  )

  // Réinitialiser l'état de debounce après le temps défini dans les constantes
  useEffect(() => {
    if (isDebouncing) {
      const timer = setTimeout(() => {
        setIsDebouncing(false)
      }, UPVOTE_LIMITS.DEBOUNCE_TIME_MS)
      return () => clearTimeout(timer)
    }
  }, [isDebouncing])

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!isAuthenticated) {
      router.push("/sign-in")
      return
    }

    // Si déjà en cours de traitement ou en debounce, ignorer le clic
    if (isPending || isDebouncing) {
      return
    }

    // Activer le debounce
    setIsDebouncing(true)

    startTransition(async () => {
      updateOptimisticState(!optimisticState.upvoted)

      const response = await toggleUpvote(projectId)

      if (!response.success) {
        // Annuler la mise à jour optimiste en cas d'erreur
        updateOptimisticState(optimisticState.upvoted)
        toast.error(response.message)
      }
    })
  }

  if (variant === "compact") {
    return (
      <button
        onClick={handleUpvote}
        disabled={isPending}
        className={cn(
          "flex h-12 w-12 cursor-pointer flex-col items-center justify-center rounded-lg border transition-all duration-200",
          optimisticState.upvoted
            ? "border-primary bg-primary/5 dark:bg-primary/10"
            : "border-border/60 hover:border-primary/40",
          className,
        )}
      >
        <svg
          className={cn(
            "h-4 w-4 transition-colors",
            optimisticState.upvoted ? "text-primary" : "text-muted-foreground",
          )}
          viewBox="0 0 24 24"
          fill={optimisticState.upvoted ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
        <span
          className={cn(
            "mt-0.5 text-xs font-semibold",
            optimisticState.upvoted ? "text-primary" : "text-muted-foreground",
          )}
        >
          {optimisticState.count}
        </span>
      </button>
    )
  }

  return (
    <button
      onClick={handleUpvote}
      disabled={isPending}
      className={cn(
        "inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 transition-colors",
        optimisticState.upvoted
          ? "border-blue-500 bg-blue-500 text-white hover:border-blue-600 hover:bg-blue-600"
          : "border-gray-200 bg-gray-100 text-gray-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-400",
        !isAuthenticated && "cursor-not-allowed opacity-75",
        className,
      )}
    >
      {optimisticState.upvoted ? (
        <RiThumbUpFill className="h-4 w-4" />
      ) : (
        <RiThumbUpLine className="h-4 w-4" />
      )}
      <span className="text-sm">
        {optimisticState.count} {optimisticState.count === 1 ? "upvote" : "upvotes"}
      </span>
    </button>
  )
}

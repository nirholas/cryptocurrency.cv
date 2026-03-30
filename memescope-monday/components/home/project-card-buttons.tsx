"use client"

import Link from "next/link"

import { launchStatus as launchStatusEnum } from "@/drizzle/db/schema"
import { RiChat3Line } from "@remixicon/react"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { UpvoteButton } from "@/components/project/upvote-button"

interface ProjectCardButtonsProps {
  projectPageUrl: string
  commentCount: number
  projectId: string
  upvoteCount: number
  isAuthenticated: boolean
  hasUpvoted: boolean
  launchStatus: string
  projectName: string
}

export function ProjectCardButtons({
  projectPageUrl,
  commentCount,
  projectId,
  upvoteCount,
  isAuthenticated,
  hasUpvoted,
  launchStatus,
  projectName,
}: ProjectCardButtonsProps) {
  const isActiveLaunch = launchStatus === launchStatusEnum.ONGOING

  return (
    <div className="flex flex-shrink-0 items-center gap-2">
      {/* Comment button */}
      <Link
        href={`${projectPageUrl}#comments`}
        className="group/btn border-border/50 bg-background hover:border-primary/30 hidden h-14 w-14 flex-col items-center justify-center rounded-xl border transition-all hover:shadow-sm sm:flex"
        aria-label={`View comments for ${projectName}`}
        onClick={(e) => e.stopPropagation()}
      >
        <RiChat3Line className="text-muted-foreground group-hover/btn:text-primary h-4 w-4 transition-colors" />
        <span className="text-muted-foreground group-hover/btn:text-primary mt-0.5 text-xs font-semibold tabular-nums transition-colors">
          {commentCount}
        </span>
      </Link>

      {/* Upvote button */}
      {isActiveLaunch ? (
        <UpvoteButton
          projectId={projectId}
          initialUpvoted={hasUpvoted}
          upvoteCount={upvoteCount}
          isAuthenticated={isAuthenticated}
          variant="compact"
        />
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="border-border/50 bg-background flex h-14 w-14 flex-col items-center justify-center rounded-xl border border-dashed">
                <svg
                  className="text-muted-foreground h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
                <span className="text-muted-foreground mt-0.5 text-xs font-semibold tabular-nums">
                  {upvoteCount}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="z-100 text-xs">
              Voting closed
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

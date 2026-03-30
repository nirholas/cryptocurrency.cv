"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { RiCalendarLine, RiCheckLine, RiMessage2Line } from "@remixicon/react"
import { formatDistance } from "date-fns"

// Function to strip HTML tags from text
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim()
}

// Interface pour les props du composant
interface DashboardProjectCardProps {
  name: string
  slug: string
  logoUrl: string | null
  description: string
  launchStatus: string
  scheduledLaunchDate?: string | Date | null
  createdAt: string | Date
  commentCount?: number | string | null
  actionButton?: React.ReactNode
}

export function DashboardProjectCard({
  name,
  slug,
  logoUrl,
  description,
  launchStatus,
  scheduledLaunchDate,
  createdAt,
  commentCount,
  actionButton,
}: DashboardProjectCardProps) {
  const [imgError, setImgError] = useState(false)
  const projectPageUrl = `/projects/${slug}`

  const renderStatusBadge = () => {
    if (launchStatus === "scheduled" && scheduledLaunchDate) {
      return (
        <span className="flex items-center gap-1 text-blue-600">
          <RiCalendarLine className="h-3.5 w-3.5" />
          Scheduled: {new Date(scheduledLaunchDate).toLocaleDateString()}
        </span>
      )
    } else if (launchStatus === "ongoing") {
      // For ongoing, we'll display upvotes/comments separately
      return <span className="flex items-center gap-1 text-green-600">Active Launch</span>
    } else if (launchStatus === "launched") {
      return (
        <span className="text-muted-foreground flex items-center gap-1">
          <RiCheckLine className="h-3.5 w-3.5" />
          Launched: {formatDistance(new Date(createdAt), new Date(), { addSuffix: true })}
        </span>
      )
    }
    return null
  }

  const cardContent = (
    <>
      {logoUrl && !imgError ? (
        <Image
          src={logoUrl}
          alt={name}
          width={48}
          height={48}
          className="flex-shrink-0 rounded-md bg-white object-contain p-0.5 dark:bg-zinc-800"
          unoptimized
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="bg-muted text-muted-foreground flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md text-lg font-bold">
          {name.charAt(0)}
        </span>
      )}
      <div className="min-w-0 flex-grow">
        <h4 className="truncate text-sm font-medium sm:text-base">{name}</h4>
        <p className="text-muted-foreground mb-1 truncate text-xs sm:text-sm">
          {stripHtml(description)}
        </p>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {/* Display the main status/date badge */}
          {renderStatusBadge()}

          {/* Display Comments for ongoing and launched */}
          {(launchStatus === "ongoing" || launchStatus === "launched") && commentCount != null && (
            <span className="flex items-center gap-1">
              <RiMessage2Line className="h-3.5 w-3.5" />
              {commentCount ?? 0}
            </span>
          )}
        </div>
      </div>
    </>
  )

  if (actionButton) {
    return (
      <div className="flex flex-col justify-between gap-3 rounded-lg border p-3 sm:flex-row sm:items-center dark:border-zinc-800/50">
        <Link href={projectPageUrl} className="flex min-w-0 flex-grow items-center gap-3">
          {cardContent}
        </Link>
        <div className="w-full flex-shrink-0 sm:w-auto">{actionButton}</div>
      </div>
    )
  }

  return (
    <Link
      href={projectPageUrl}
      className="hover:bg-secondary/40 flex items-center gap-3 rounded-lg border p-3 transition-colors dark:border-zinc-800/50"
    >
      {cardContent}
    </Link>
  )
}

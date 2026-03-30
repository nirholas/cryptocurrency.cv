"use client"

import Link from "next/link"

import { RiArrowRightLine } from "@remixicon/react"

import { ProjectCard } from "./project-card"

interface Project {
  id: string
  slug: string
  name: string
  description: string | null
  logoUrl: string | null
  websiteUrl?: string | null
  upvoteCount: number
  commentCount?: number | null
  launchStatus: string
  launchType?: string | null
  scheduledLaunchDate?: Date | string | null
  createdAt: Date | string
  userHasUpvoted?: boolean
  categories?: { id: string; name: string }[]
  dailyRanking?: number | null
  chain?: string | null
  ticker?: string | null
  priceUsd?: number | null
  priceChange24h?: number | null
}

interface ProjectSectionProps {
  title: string
  projects: Project[]
  moreHref?: string
  sortByUpvotes?: boolean
  isAuthenticated: boolean
  subtitle?: string
}

export function ProjectSection({
  title,
  projects,
  moreHref,
  sortByUpvotes = false,
  isAuthenticated,
  subtitle,
}: ProjectSectionProps) {
  const sortedProjects = sortByUpvotes
    ? [...projects].sort((a, b) => (b.upvoteCount ?? 0) - (a.upvoteCount ?? 0))
    : projects

  return (
    <section>
      <div className="mb-2 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight sm:text-xl">{title}</h2>
          {subtitle && <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>}
        </div>
        {moreHref && (
          <Link
            href={moreHref}
            className="text-muted-foreground hover:text-primary flex items-center gap-1 text-xs font-medium transition-colors"
          >
            View all <RiArrowRightLine className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {sortedProjects.length > 0 ? (
        <div className="border-border/60 bg-card overflow-hidden rounded-xl border shadow-sm">
          {sortedProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              name={project.name}
              slug={project.slug}
              description={project.description || ""}
              logoUrl={project.logoUrl}
              upvoteCount={project.upvoteCount ?? 0}
              commentCount={project.commentCount ?? 0}
              launchStatus={project.launchStatus}
              launchType={project.launchType}
              dailyRanking={project.dailyRanking}
              userHasUpvoted={project.userHasUpvoted ?? false}
              categories={project.categories ?? []}
              isAuthenticated={isAuthenticated}
              index={index}
              websiteUrl={project.websiteUrl ?? undefined}
              chain={project.chain}
              ticker={project.ticker}
              priceUsd={project.priceUsd}
              priceChange24h={project.priceChange24h}
            />
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground border-border/60 bg-card rounded-xl border border-dashed py-10 text-center text-sm">
          No coins found yet. Be the first to{" "}
          <Link href="/projects/submit" className="text-primary hover:underline">
            submit one
          </Link>
          .
        </div>
      )}
    </section>
  )
}

import { Suspense } from "react"
import { headers } from "next/headers"
import Link from "next/link"

import { auth } from "@/lib/auth"
import { PROJECT_LIMITS_VARIABLES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
// import { RiFilterLine, RiArrowDownSLine } from "@remixicon/react";
import { TrendingProjectCard } from "@/components/home/trending-project-card"
import { TrendingTokens } from "@/components/home/trending-tokens"
import { getMonthBestProjects, getTopVotedProjects, getYesterdayProjects } from "@/app/actions/home"
import { getTopCategories } from "@/app/actions/projects"
import { getTrendingTokens } from "@/app/actions/trending"

interface ProjectSummary {
  id: string
  slug: string
  name: string
  description: string | null
  logoUrl: string | null
  websiteUrl?: string | null
  upvoteCount: number
  commentCount?: number | null
  launchStatus: string
  scheduledLaunchDate?: Date | string | null
  createdAt: Date | string
  userHasUpvoted?: boolean
  categories?: { id: string; name: string }[]
  chain?: string | null
  ticker?: string | null
  marketCap?: number | null
}

export const metadata = {
  title: "Trending - Memescope Monday",
  description: "Discover trending memecoins on Memescope Monday",
}

// Composant Skeleton principal
function TrendingDataSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <div className="bg-muted h-8 w-64 animate-pulse rounded"></div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array(6)
          .fill(0)
          .map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start gap-3">
                <div className="bg-muted h-12 w-12 rounded-lg"></div>
                <div className="bg-muted h-12 w-12 rounded-lg"></div>
                <div className="min-w-0 flex-1">
                  <div className="bg-muted mb-1 h-5 w-2/3 rounded"></div>
                  <div className="bg-muted h-3 w-1/3 rounded"></div>
                </div>
              </div>
              <div className="bg-muted mt-3 h-10 w-full rounded"></div>
              <div className="mt-3 flex items-center justify-between">
                <div className="bg-muted h-5 w-1/3 rounded-full"></div>
                <div className="bg-muted h-4 w-1/4 rounded"></div>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 dark:border-zinc-800">
                <div className="bg-muted h-4 w-1/4 rounded"></div>
                <div className="bg-muted h-4 w-1/5 rounded"></div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

// Composant pour afficher les données
async function TrendingData({
  filter,
  isAuthenticated,
}: {
  filter: string
  isAuthenticated: boolean
}) {
  let projects: ProjectSummary[] = [] // Utiliser le type défini
  let title

  if (filter === "today") {
    projects = await getTopVotedProjects(
      PROJECT_LIMITS_VARIABLES.VIEW_ALL_PAGE_TODAY_YESTERDAY_LIMIT,
    )
    title = "Trending Now"
  } else if (filter === "yesterday") {
    projects = await getYesterdayProjects(
      PROJECT_LIMITS_VARIABLES.VIEW_ALL_PAGE_TODAY_YESTERDAY_LIMIT,
    )
    title = "New Arrivals"
  } else {
    projects = await getMonthBestProjects(PROJECT_LIMITS_VARIABLES.VIEW_ALL_PAGE_MONTH_LIMIT)
    title = "Top Performers"
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
      </div>

      {projects.length === 0 ? (
        <div className="text-muted-foreground border-border bg-card rounded-lg border border-dashed py-8 text-center text-sm">
          No projects found for this period.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {projects.map((project: ProjectSummary) => (
            <TrendingProjectCard
              key={project.id}
              id={project.id}
              slug={project.slug}
              name={project.name}
              description={project.description || ""}
              logoUrl={project.logoUrl}
              upvoteCount={project.upvoteCount}
              launchStatus={project.launchStatus}
              userHasUpvoted={project.userHasUpvoted ?? false}
              categories={project.categories || []}
              isAuthenticated={isAuthenticated}
              chain={project.chain}
              ticker={project.ticker}
              marketCap={project.marketCap}
              createdAt={project.createdAt}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default async function TrendingPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const params = await searchParams
  const filter = params.filter || "today"
  const topCategories = await getTopCategories(5)

  const session = await auth.api.getSession({
    headers: await headers(),
  })
  const isAuthenticated = !!session?.user

  const [todayProjects, trendingTokens] = await Promise.all([
    getTopVotedProjects(),
    getTrendingTokens(),
  ])
  const ongoingLaunches = todayProjects.filter(
    (project) => project.launchStatus === "ongoing",
  ).length

  return (
    <main className="bg-secondary/20">
      <div className="container mx-auto min-h-screen max-w-6xl px-4 pt-8 pb-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:items-start">
          {/* Contenu principal */}
          <div className="space-y-6 sm:space-y-8 lg:col-span-2">
            <Suspense fallback={<TrendingDataSkeleton />}>
              <TrendingData filter={filter} isAuthenticated={isAuthenticated} />
            </Suspense>
          </div>

          {/* Sidebar */}
          <div className="top-24">
            {/* Trending Tokens from external sources */}
            <div className="mb-6">
              <TrendingTokens initialData={trendingTokens} />
            </div>

            {/* Quick Stats */}
            <div className="space-y-3 py-5 pt-0">
              <h3 className="flex items-center gap-2 font-semibold">Live Now</h3>
              <Link
                href="/trending"
                className="bg-secondary/30 hover:bg-secondary/50 border-primary block rounded-md border-l-4 px-5 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-primary text-2xl font-bold">{ongoingLaunches}</div>
                  <div className="text-sm font-medium">Active Launches</div>
                </div>
              </Link>
            </div>

            {/* Time Filters */}
            <div className="space-y-3 py-5">
              <h3 className="flex items-center gap-2 font-semibold">Explore</h3>
              <div className="space-y-2">
                <Link
                  href="/trending?filter=today"
                  className={`-mx-2 flex items-center gap-2 rounded-md p-2 text-sm transition-colors ${
                    filter === "today" ? "bg-muted font-medium" : "hover:bg-muted/40"
                  }`}
                >
                  Trending Now
                </Link>
                <Link
                  href="/trending?filter=yesterday"
                  className={`-mx-2 flex items-center gap-2 rounded-md p-2 text-sm transition-colors ${
                    filter === "yesterday" ? "bg-muted font-medium" : "hover:bg-muted/40"
                  }`}
                >
                  New Arrivals
                </Link>
                <Link
                  href="/trending?filter=month"
                  className={`-mx-2 flex items-center gap-2 rounded-md p-2 text-sm transition-colors ${
                    filter === "month" ? "bg-muted font-medium" : "hover:bg-muted/40"
                  }`}
                >
                  Top Performers
                </Link>
              </div>
            </div>

            {/* Discover More */}
            <div className="space-y-3 py-5">
              <h3 className="flex items-center gap-2 font-semibold">Discover More</h3>
              <div className="space-y-2">
                <Link
                  href="/winners"
                  className="-mx-2 flex items-center gap-2 rounded-md p-2 text-sm transition-colors hover:underline"
                >
                  Hall of Fame
                </Link>
                <Link
                  href="/categories"
                  className="-mx-2 flex items-center gap-2 rounded-md p-2 text-sm transition-colors hover:underline"
                >
                  Browse Categories
                </Link>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-3 py-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold">Top Categories</h3>
                <Button variant="ghost" size="sm" className="text-sm" asChild>
                  <Link href="/categories" className="flex items-center gap-1">
                    View all
                  </Link>
                </Button>
              </div>
              <div className="space-y-2">
                {topCategories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories?category=${category.id}`}
                    className="hover:bg-muted/40 -mx-2 flex items-center justify-between rounded-md p-2"
                  >
                    <span className="text-sm">{category.name}</span>
                    <span className="text-muted-foreground bg-secondary rounded-full px-2 py-0.5 text-xs">
                      {category.count} projects
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

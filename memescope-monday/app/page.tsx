import { headers } from "next/headers"
import Link from "next/link"

import { RiArrowRightLine, RiFireLine, RiRocketLine, RiSparklingLine } from "@remixicon/react"

import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { CountdownTimer } from "@/components/home/countdown-timer"
import { ProjectSection } from "@/components/home/project-section"
import { getNewlyListedProjects, getTopVotedProjects } from "@/app/actions/home"
import { getTopCategories } from "@/app/actions/projects"

export default async function Home() {
  const topVotedProjects = await getTopVotedProjects()
  const trendingProjects = await getTopVotedProjects(10)
  const newlyListedProjects = await getNewlyListedProjects()
  const topCategories = await getTopCategories(5)

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  return (
    <main className="min-h-screen">
      <div className="container mx-auto max-w-6xl px-4 pt-6 pb-12 md:pt-8">
        {/* Countdown Banner */}
        <CountdownTimer />

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px] lg:items-start">
          {/* Main Content */}
          <div className="space-y-10">
            <ProjectSection
              title="Top Coins Today"
              subtitle="Most voted coins this week"
              projects={topVotedProjects}
              sortByUpvotes={true}
              isAuthenticated={!!session?.user}
            />

            <ProjectSection
              title="Trending"
              subtitle="Rising fast in the community"
              projects={trendingProjects}
              moreHref="/trending"
              sortByUpvotes={true}
              isAuthenticated={!!session?.user}
            />

            <ProjectSection
              title="Just Listed"
              subtitle="Fresh submissions from the community"
              projects={newlyListedProjects}
              moreHref="/trending?filter=recent"
              sortByUpvotes={false}
              isAuthenticated={!!session?.user}
            />
          </div>

          {/* Sidebar */}
          <aside className="hidden space-y-6 lg:block">
            {/* Submit CTA Card */}
            <div className="border-primary/20 from-primary/5 to-primary/10 overflow-hidden rounded-xl border bg-gradient-to-br p-5">
              <div className="mb-1 flex items-center gap-2">
                <RiRocketLine className="text-primary h-5 w-5" />
                <h3 className="text-sm font-bold">List Your Coin</h3>
              </div>
              <p className="text-muted-foreground mb-4 text-xs leading-relaxed">
                Get your memecoin in front of thousands of traders. Free listings or boost for
                maximum visibility.
              </p>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 text-xs" asChild>
                  <Link href="/projects/submit">Submit Free</Link>
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs" asChild>
                  <Link href="/pricing">
                    <RiSparklingLine className="mr-1 h-3.5 w-3.5" />
                    Boost
                  </Link>
                </Button>
              </div>
            </div>

            {/* Top Categories */}
            <div className="border-border/60 bg-card rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RiFireLine className="h-4 w-4 text-orange-500" />
                  <h3 className="text-sm font-bold">Top Categories</h3>
                </div>
                <Link
                  href="/categories"
                  className="text-muted-foreground hover:text-primary text-xs transition-colors"
                >
                  All
                </Link>
              </div>
              <div className="space-y-0.5">
                {topCategories.map((category, i) => (
                  <Link
                    key={category.id}
                    href={`/categories?category=${category.id}`}
                    className="hover:bg-accent flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-muted-foreground/50 w-4 text-right text-xs font-medium tabular-nums">
                        {i + 1}
                      </span>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <span className="text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5 text-[11px] font-medium">
                      {category.count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="border-border/60 bg-card rounded-xl border p-4">
              <h3 className="mb-3 text-sm font-bold">Explore</h3>
              <div className="space-y-1">
                {[
                  { label: "Trending Coins", href: "/trending", icon: "🔥" },
                  { label: "Winners", href: "/winners", icon: "🏆" },
                  { label: "Categories", href: "/categories", icon: "📂" },
                  { label: "Pricing", href: "/pricing", icon: "💎" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="hover:bg-accent group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm">{link.icon}</span>
                      <span>{link.label}</span>
                    </div>
                    <RiArrowRightLine className="text-muted-foreground/0 group-hover:text-muted-foreground/60 h-3.5 w-3.5 transition-all" />
                  </Link>
                ))}
                {session?.user && (
                  <Link
                    href="/dashboard"
                    className="hover:bg-accent group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm">📊</span>
                      <span>Dashboard</span>
                    </div>
                    <RiArrowRightLine className="text-muted-foreground/0 group-hover:text-muted-foreground/60 h-3.5 w-3.5 transition-all" />
                  </Link>
                )}
              </div>
            </div>

            {/* Community Stats */}
            <div className="border-border/60 bg-card rounded-xl border p-4">
              <h3 className="mb-3 text-sm font-bold">Community</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/40 rounded-lg p-3 text-center">
                  <p className="text-foreground text-lg font-bold">
                    {topVotedProjects.length + newlyListedProjects.length}+
                  </p>
                  <p className="text-muted-foreground text-[11px]">Listed Coins</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3 text-center">
                  <p className="text-foreground text-lg font-bold">3</p>
                  <p className="text-muted-foreground text-[11px]">Chains</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-center gap-2">
                <a
                  href="https://x.com/swarminged"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground text-xs transition-colors"
                >
                  Follow on X →
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

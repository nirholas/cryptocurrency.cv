"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { format, parseISO } from "date-fns"
import {
  Ban,
  Calendar,
  CreditCard,
  Filter,
  Folder,
  Globe,
  Megaphone,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Sparkle,
  Sparkles,
  Tag,
  Trash2,
  UserCog,
  Users,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { admin } from "@/lib/auth-client"
import { LAUNCH_SETTINGS } from "@/lib/constants"
import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import {
  addCategory,
  getAdminSponsorships,
  getAdminStatsAndUsers,
  getCategories,
  getFreeLaunchAvailability,
  getRecentSubmissions,
} from "@/app/actions/admin"

type User = {
  id: string
  email: string
  name: string
  role?: string | undefined
  banned?: boolean | null
  createdAt?: string
  hasLaunched?: boolean
  projectCount?: number
}

type Submission = {
  id: string
  name: string
  slug: string
  launchStatus: string
  launchType: string | null
  chain: string | null
  ticker: string | null
  paidExpedited: boolean | null
  paidTrending: boolean | null
  scheduledLaunchDate: Date | null
  createdAt: Date
  createdBy: string | null
  userName: string | null
  userEmail: string | null
}

type Sponsorship = {
  id: string
  name: string
  description: string | null
  websiteUrl: string
  logoUrl: string | null
  tier: string
  status: string
  stripeCustomerEmail: string | null
  amountPaid: number | null
  startsAt: Date
  expiresAt: Date
  createdAt: Date
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stats, setStats] = useState<{
    totalLaunches: number
    premiumLaunches: number
    premiumPlusLaunches: number
    totalUsers: number
    newUsersToday: number
    newLaunchesToday: number
    newPremiumLaunchesToday: number
    newPremiumPlusLaunchesToday: number
  }>({
    totalLaunches: 0,
    premiumLaunches: 0,
    premiumPlusLaunches: 0,
    totalUsers: 0,
    newUsersToday: 0,
    newLaunchesToday: 0,
    newPremiumLaunchesToday: 0,
    newPremiumPlusLaunchesToday: 0,
  })
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState<string | undefined>()
  const [freeLaunchAvailability, setFreeLaunchAvailability] = useState<{
    date: string
    freeSlots: number
  } | null>(null)
  const [categories, setCategories] = useState<{ name: string }[]>([])
  const [totalCategories, setTotalCategories] = useState(0)
  const [newCategory, setNewCategory] = useState("")
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([])
  const router = useRouter()
  useIsMobile()

  // Fetch users, stats and free launch availability
  const fetchData = async () => {
    setLoading(true)
    try {
      const [{ users, stats }, freeLaunchData, recentSubmissions, sponsorshipsData] =
        await Promise.all([
          getAdminStatsAndUsers(),
          getFreeLaunchAvailability(),
          getRecentSubmissions(),
          getAdminSponsorships(),
        ])
      const mappedUsers = users.map((u) => ({
        ...u,
        role: u.role ?? undefined,
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : undefined,
      }))
      setUsers(mappedUsers)
      setFilteredUsers(mappedUsers)
      setStats(stats)
      setFreeLaunchAvailability(freeLaunchData.firstAvailableDate)
      setSubmissions(recentSubmissions)
      setSponsorships(sponsorshipsData)
    } catch {
      setUsers([])
      setFilteredUsers([])
      setStats({
        totalLaunches: 0,
        premiumLaunches: 0,
        premiumPlusLaunches: 0,
        totalUsers: 0,
        newUsersToday: 0,
        newLaunchesToday: 0,
        newPremiumLaunchesToday: 0,
        newPremiumPlusLaunchesToday: 0,
      })
      setFreeLaunchAvailability(null)
      setSubmissions([])
      setSponsorships([])
    }
    setLoading(false)
  }

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const { categories: cats, totalCount } = await getCategories()
      setCategories(cats)
      setTotalCategories(totalCount)
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  // Handle category addition
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory.trim()) return

    setIsAddingCategory(true)
    setCategoryError(null)

    const result = await addCategory(newCategory)
    if (result.success) {
      setNewCategory("")
      fetchCategories()
      toast.success("Category added successfully")
    } else {
      setCategoryError(result.error || "Failed to add category")
    }
    setIsAddingCategory(false)
  }

  useEffect(() => {
    fetchData()
    fetchCategories()
  }, [])

  // Filtres
  useEffect(() => {
    let result = [...users]
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (user) =>
          user.name?.toLowerCase().includes(query) || user.email?.toLowerCase().includes(query),
      )
    }
    if (roleFilter !== "all") {
      result = result.filter((user) => user.role === roleFilter)
    }
    if (statusFilter !== "all") {
      if (statusFilter === "banned") {
        result = result.filter((user) => user.banned === true)
      } else if (statusFilter === "active") {
        result = result.filter((user) => user.banned !== true)
      }
    }
    setFilteredUsers(result)
    setCurrentPage(1)
  }, [searchQuery, roleFilter, statusFilter, users])

  const indexOfLastUser = currentPage * itemsPerPage
  const indexOfFirstUser = indexOfLastUser - itemsPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  const uniqueRoles = Array.from(new Set(users.map((user) => user.role || "user")))

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-2 pt-6 pb-12 sm:px-4">
      <div className="mb-3 flex items-center justify-between sm:mb-4">
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        <Button size="sm" variant="outline" onClick={fetchData} className="h-8 gap-2">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <div className="bg-card rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">Users</span>
            <Users className="text-muted-foreground h-4 w-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="mt-1 block text-xl font-semibold">{stats.totalUsers}</span>
            {stats.newUsersToday > 0 && (
              <span className="text-xs text-blue-500">+{stats.newUsersToday} today</span>
            )}
          </div>
        </div>
        <div className="bg-card rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">Projects</span>
            <Folder className="text-muted-foreground h-4 w-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="mt-1 block text-xl font-semibold">{stats.totalLaunches}</span>
            {stats.newLaunchesToday > 0 && (
              <span className="text-xs text-blue-500">+{stats.newLaunchesToday} today</span>
            )}
          </div>
        </div>
        <div className="bg-card rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">Premium</span>
            <Sparkle className="text-muted-foreground h-4 w-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="mt-1 block text-xl font-semibold">{stats.premiumLaunches}</span>
            {stats.newPremiumLaunchesToday > 0 && (
              <span className="text-xs text-blue-500">+{stats.newPremiumLaunchesToday} today</span>
            )}
          </div>
        </div>
        <div className="bg-card rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">Premium Plus</span>
            <Sparkles className="text-muted-foreground h-4 w-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="mt-1 block text-xl font-semibold">{stats.premiumPlusLaunches}</span>
            {stats.newPremiumPlusLaunchesToday > 0 && (
              <span className="text-xs text-blue-500">
                +{stats.newPremiumPlusLaunchesToday} today
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Free Launch Availability */}
      <div className="bg-card overflow-hidden rounded-lg border">
        <div className="flex items-center justify-between border-b p-3">
          <div className="flex items-center gap-2">
            <Calendar className="text-muted-foreground h-4 w-4" />
            <h2 className="text-sm font-medium">Free Launch Availability</h2>
          </div>
        </div>
        <div className="p-3">
          {freeLaunchAvailability ? (
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-muted-foreground text-sm">Next available:</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium">
                    {format(parseISO(freeLaunchAvailability.date), "MMMM d, yyyy")}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    ({freeLaunchAvailability.freeSlots} slot
                    {freeLaunchAvailability.freeSlots > 1 ? "s" : ""} available)
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              No free launch slots available in the next {LAUNCH_SETTINGS.MAX_DAYS_AHEAD} days
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card overflow-hidden rounded-lg border">
        <div className="flex items-center justify-between border-b p-3">
          <div className="flex items-center gap-2">
            <Users className="text-muted-foreground h-4 w-4" />
            <h2 className="text-sm font-medium">Users</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-24 max-w-[110px] rounded-md border pr-2 pl-8 text-xs sm:w-64 sm:max-w-full"
              />
              <Search className="text-muted-foreground absolute top-2 left-2 h-4 w-4" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="flex h-8 w-8 items-center justify-center rounded-md p-0 text-xs [&>svg:last-child]:hidden">
                <Users className="text-muted-foreground h-4 w-4" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value="all">All roles</SelectItem>
                {uniqueRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex h-8 w-8 items-center justify-center rounded-md p-0 text-xs [&>svg:last-child]:hidden">
                <Shield className="text-muted-foreground h-4 w-4" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(v) => {
                setItemsPerPage(Number(v))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="flex h-8 w-8 items-center justify-center rounded-md p-0 text-xs [&>svg:last-child]:hidden">
                <Filter className="text-muted-foreground h-4 w-4" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value="5">5 / page</SelectItem>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <svg
              className="text-muted-foreground h-6 w-6 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          </div>
        ) : (
          <>
            <div className="hidden sm:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-muted-foreground p-2 text-left text-xs font-medium">
                        User
                      </th>
                      <th className="text-muted-foreground p-2 text-left text-xs font-medium">
                        Email
                      </th>
                      <th className="text-muted-foreground p-2 text-center text-xs font-medium">
                        Launched
                      </th>
                      <th className="text-muted-foreground p-2 text-center text-xs font-medium">
                        Role
                      </th>
                      <th className="text-muted-foreground p-2 text-center text-xs font-medium">
                        Status
                      </th>
                      <th className="text-muted-foreground p-2 text-right text-xs font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/10 border-t">
                        <td className="max-w-[120px] truncate p-2 font-medium">
                          {user.name || "—"}
                        </td>
                        <td className="text-muted-foreground max-w-[180px] truncate p-2">
                          {user.email}
                        </td>
                        <td className="p-2 text-center">
                          {user.hasLaunched ? (
                            <Badge
                              variant="outline"
                              className="border-green-200 bg-green-50 text-xs text-green-600"
                            >
                              Yes ({user.projectCount || 0})
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-red-200 bg-red-50 text-xs text-red-600"
                            >
                              No
                            </Badge>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          <Badge
                            variant={user.role === "admin" ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {user.role || "user"}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          {user.banned ? (
                            <Badge variant="destructive" className="text-xs">
                              Banned
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Active
                            </Badge>
                          )}
                        </td>
                        <td className="p-2 text-right">
                          <DropdownMenuUserActions
                            user={user}
                            onRefresh={fetchData}
                            router={router}
                            setIsLoading={setIsLoading}
                            isLoading={isLoading}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="divide-y sm:hidden">
              {currentUsers.map((user) => (
                <div key={user.id} className="flex items-center p-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{user.name || "—"}</div>
                    <div className="text-muted-foreground truncate text-xs">{user.email}</div>
                    <div className="mt-1 flex items-center gap-2">
                      {user.hasLaunched ? (
                        <Badge
                          variant="outline"
                          className="border-green-200 bg-green-50 text-xs text-green-600"
                        >
                          Launched ({user.projectCount || 0})
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-red-200 bg-red-50 text-xs text-red-600"
                        >
                          No Launch
                        </Badge>
                      )}
                      <Badge
                        variant={user.role === "admin" ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {user.role || "user"}
                      </Badge>
                      {user.banned ? (
                        <Badge variant="destructive" className="text-xs">
                          Banned
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenuUserActions
                    user={user}
                    onRefresh={fetchData}
                    router={router}
                    setIsLoading={setIsLoading}
                    isLoading={isLoading}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex items-center justify-between border-t p-3">
          <span className="text-muted-foreground text-xs">
            Showing {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} of{" "}
            {filteredUsers.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8"
            >
              Previous
            </Button>
            <span className="text-xs font-medium">{currentPage}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="h-8"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Categories Management */}
      <div className="bg-card overflow-hidden rounded-lg border">
        <div className="flex items-center justify-between border-b p-3">
          <div className="flex items-center gap-2">
            <Tag className="text-muted-foreground h-4 w-4" />
            <h2 className="text-sm font-medium">Categories</h2>
            <span className="text-muted-foreground text-xs">({totalCategories})</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5"
            onClick={() => setIsAddingCategory(true)}
            type="button"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="text-xs">Add Category</span>
          </Button>
        </div>
        <div className="space-y-3 p-3">
          {isAddingCategory && (
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter category name"
                className="bg-background h-8 flex-1 rounded-md border px-2 text-sm"
              />
              <Button type="submit" size="sm" className="h-8">
                Add
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8"
                onClick={() => {
                  setIsAddingCategory(false)
                  setNewCategory("")
                  setCategoryError(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </form>
          )}
          {categoryError && <div className="text-destructive text-xs">{categoryError}</div>}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="bg-muted/40 text-muted-foreground rounded-md px-2 py-1 text-xs"
              >
                {cat.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-card overflow-hidden rounded-lg border">
        <div className="flex items-center justify-between border-b p-3">
          <div className="flex items-center gap-2">
            <Folder className="text-muted-foreground h-4 w-4" />
            <h2 className="text-sm font-medium">Recent Submissions</h2>
            <span className="text-muted-foreground text-xs">({submissions.length})</span>
          </div>
        </div>
        {submissions.length === 0 ? (
          <div className="text-muted-foreground p-4 text-center text-sm">No submissions yet</div>
        ) : (
          <>
            <div className="hidden sm:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-muted-foreground p-2 text-left text-xs font-medium">
                        Project
                      </th>
                      <th className="text-muted-foreground p-2 text-left text-xs font-medium">
                        Submitted By
                      </th>
                      <th className="text-muted-foreground p-2 text-center text-xs font-medium">
                        Type
                      </th>
                      <th className="text-muted-foreground p-2 text-center text-xs font-medium">
                        Status
                      </th>
                      <th className="text-muted-foreground p-2 text-center text-xs font-medium">
                        Paid
                      </th>
                      <th className="text-muted-foreground p-2 text-right text-xs font-medium">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-muted/10 border-t">
                        <td className="max-w-[150px] p-2">
                          <div className="truncate font-medium">{sub.name}</div>
                          <div className="text-muted-foreground truncate text-xs">
                            {sub.ticker && `$${sub.ticker}`}
                            {sub.chain && ` · ${sub.chain}`}
                          </div>
                        </td>
                        <td className="max-w-[140px] p-2">
                          <div className="truncate text-sm">{sub.userName || "—"}</div>
                          <div className="text-muted-foreground truncate text-xs">
                            {sub.userEmail}
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <Badge
                            variant={
                              sub.launchType === "premium_plus"
                                ? "default"
                                : sub.launchType === "premium"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {sub.launchType || "free"}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <Badge
                            variant={
                              sub.launchStatus === "payment_pending"
                                ? "secondary"
                                : sub.launchStatus === "payment_failed"
                                  ? "destructive"
                                  : sub.launchStatus === "launched"
                                    ? "default"
                                    : "outline"
                            }
                            className="text-xs"
                          >
                            {sub.launchStatus}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          {sub.paidExpedited || sub.paidTrending ? (
                            <div className="flex items-center justify-center gap-1">
                              <CreditCard className="h-3.5 w-3.5 text-green-500" />
                              <span className="text-xs text-green-600">
                                {sub.paidExpedited && sub.paidTrending
                                  ? "Bundle"
                                  : sub.paidExpedited
                                    ? "Expedited"
                                    : "Trending"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="text-muted-foreground p-2 text-right text-xs">
                          {format(new Date(sub.createdAt), "MMM d, HH:mm")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="divide-y sm:hidden">
              {submissions.map((sub) => (
                <div key={sub.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{sub.name}</div>
                      <div className="text-muted-foreground text-xs">
                        by {sub.userName || "Unknown"} · {sub.userEmail}
                      </div>
                    </div>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {format(new Date(sub.createdAt), "MMM d")}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant={
                        sub.launchType === "premium_plus"
                          ? "default"
                          : sub.launchType === "premium"
                            ? "secondary"
                            : "outline"
                      }
                      className="text-xs"
                    >
                      {sub.launchType || "free"}
                    </Badge>
                    <Badge
                      variant={
                        sub.launchStatus === "payment_pending"
                          ? "secondary"
                          : sub.launchStatus === "payment_failed"
                            ? "destructive"
                            : "outline"
                      }
                      className="text-xs"
                    >
                      {sub.launchStatus}
                    </Badge>
                    {(sub.paidExpedited || sub.paidTrending) && (
                      <Badge
                        variant="outline"
                        className="border-green-200 bg-green-50 text-xs text-green-600"
                      >
                        <CreditCard className="mr-1 h-3 w-3" />
                        Paid
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Sponsorships */}
      <div className="bg-card overflow-hidden rounded-lg border">
        <div className="flex items-center justify-between border-b p-3">
          <div className="flex items-center gap-2">
            <Megaphone className="text-muted-foreground h-4 w-4" />
            <h2 className="text-sm font-medium">Sponsorships</h2>
            <span className="text-muted-foreground text-xs">
              ({sponsorships.filter((s) => s.status === "active").length} active)
            </span>
          </div>
        </div>
        {sponsorships.length === 0 ? (
          <div className="text-muted-foreground p-4 text-center text-sm">
            No sponsorships yet
          </div>
        ) : (
          <>
            <div className="hidden sm:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-muted-foreground p-2 text-left text-xs font-medium">
                        Sponsor
                      </th>
                      <th className="text-muted-foreground p-2 text-center text-xs font-medium">
                        Tier
                      </th>
                      <th className="text-muted-foreground p-2 text-center text-xs font-medium">
                        Status
                      </th>
                      <th className="text-muted-foreground p-2 text-center text-xs font-medium">
                        Amount
                      </th>
                      <th className="text-muted-foreground p-2 text-right text-xs font-medium">
                        Expires
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sponsorships.map((sp) => (
                      <tr key={sp.id} className="hover:bg-muted/10 border-t">
                        <td className="max-w-[180px] p-2">
                          <div className="truncate font-medium">{sp.name}</div>
                          <div className="text-muted-foreground flex items-center gap-1 truncate text-xs">
                            <Globe className="h-3 w-3" />
                            {sp.websiteUrl}
                          </div>
                          {sp.stripeCustomerEmail && (
                            <div className="text-muted-foreground truncate text-xs">
                              {sp.stripeCustomerEmail}
                            </div>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          <Badge
                            variant={sp.tier === "monthly" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {sp.tier}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <Badge
                            variant={
                              sp.status === "active"
                                ? "outline"
                                : sp.status === "expired"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className={
                              sp.status === "active"
                                ? "border-green-200 bg-green-50 text-xs text-green-600"
                                : "text-xs"
                            }
                          >
                            {sp.status}
                          </Badge>
                        </td>
                        <td className="p-2 text-center text-sm">
                          ${((sp.amountPaid || 0) / 100).toFixed(0)}
                        </td>
                        <td className="text-muted-foreground p-2 text-right text-xs">
                          {format(new Date(sp.expiresAt), "MMM d, yyyy")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="divide-y sm:hidden">
              {sponsorships.map((sp) => (
                <div key={sp.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{sp.name}</div>
                      <div className="text-muted-foreground truncate text-xs">{sp.websiteUrl}</div>
                    </div>
                    <Badge
                      variant={
                        sp.status === "active"
                          ? "outline"
                          : sp.status === "expired"
                            ? "secondary"
                            : "destructive"
                      }
                      className={
                        sp.status === "active"
                          ? "border-green-200 bg-green-50 text-xs text-green-600"
                          : "text-xs"
                      }
                    >
                      {sp.status}
                    </Badge>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Badge
                      variant={sp.tier === "monthly" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {sp.tier}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      ${((sp.amountPaid || 0) / 100).toFixed(0)} · expires{" "}
                      {format(new Date(sp.expiresAt), "MMM d")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function DropdownMenuUserActions({
  user,
  onRefresh,
  router,
  setIsLoading,
  isLoading,
}: {
  user: User
  onRefresh: () => Promise<void>
  router: any // eslint-disable-line @typescript-eslint/no-explicit-any
  setIsLoading: (value: string | undefined) => void
  isLoading: string | undefined
}) {
  // Ban user
  const handleBanUser = async (id: string) => {
    setIsLoading(`ban-${id}`)
    try {
      // Ban for 30 days
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000
      await admin.banUser({
        userId: id,
        banReason: "Admin action",
        banExpiresIn: thirtyDaysInMs,
      })
      toast.success("User banned successfully")
      onRefresh() // Refresh the list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to ban user")
    } finally {
      setIsLoading(undefined)
    }
  }

  // Unban user
  const handleUnbanUser = async (id: string) => {
    setIsLoading(`unban-${id}`)
    try {
      await admin.unbanUser({
        userId: id,
      })
      toast.success("User unbanned successfully")
      onRefresh() // Refresh the list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to unban user")
    } finally {
      setIsLoading(undefined)
    }
  }

  // Impersonate user
  const handleImpersonateUser = async (id: string) => {
    setIsLoading(`impersonate-${id}`)
    try {
      await admin.impersonateUser({ userId: id })
      toast.success("Impersonated user")
      router.push("/dashboard")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to impersonate user")
    } finally {
      setIsLoading(undefined)
    }
  }

  // Delete user
  const handleDeleteUser = async (id: string) => {
    setIsLoading(`delete-${id}`)
    try {
      await admin.removeUser({ userId: id })
      toast.success("User deleted successfully")
      onRefresh() // Refresh the list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user")
    } finally {
      setIsLoading(undefined)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-md">
        <DropdownMenuItem
          onClick={() => (user.banned ? handleUnbanUser(user.id) : handleBanUser(user.id))}
          disabled={
            isLoading?.startsWith(`ban-${user.id}`) || isLoading?.startsWith(`unban-${user.id}`)
          }
          className="focus:bg-accent focus:text-accent-foreground group rounded-md"
        >
          <Ban className="text-muted-foreground mr-2 h-4 w-4 transition-colors group-hover:text-white group-focus:text-white" />
          <span>{user.banned ? "Unban" : "Ban"} User</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleImpersonateUser(user.id)}
          disabled={isLoading === `impersonate-${user.id}`}
          className="focus:bg-accent focus:text-accent-foreground group rounded-md"
        >
          <UserCog className="text-muted-foreground mr-2 h-4 w-4 transition-colors group-hover:text-white group-focus:text-white" />
          <span>Impersonate</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleDeleteUser(user.id)}
          disabled={isLoading === `delete-${user.id}`}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive group rounded-md"
        >
          <Trash2 className="group-focus:text-destructive group-hover:text-destructive text-muted-foreground mr-2 h-4 w-4 transition-colors" />
          <span>Delete User</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

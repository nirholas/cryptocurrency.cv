export const LAUNCH_LIMITS = {
  FREE_DAILY_LIMIT: 10,
  PREMIUM_DAILY_LIMIT: 20,
  PREMIUM_PLUS_DAILY_LIMIT: 0,
  TOTAL_DAILY_LIMIT: 30,
} as const

export const USER_DAILY_LAUNCH_LIMIT = 3

export const PROJECT_LIMITS_VARIABLES = {
  TODAY_LIMIT: 30,
  YESTERDAY_LIMIT: 10,
  MONTH_LIMIT: 10,
  VIEW_ALL_PAGE_TODAY_YESTERDAY_LIMIT: 30,
  VIEW_ALL_PAGE_MONTH_LIMIT: 30,
} as const

export const LAUNCH_SETTINGS = {
  PREMIUM_PRICE: 19, // Expedited Review
  ARTICLE_PRICE: 49, // Trending Placement
  MIN_DAYS_AHEAD: 0,
  MAX_DAYS_AHEAD: 180,
  PREMIUM_MIN_DAYS_AHEAD: 1,
  PREMIUM_MAX_DAYS_AHEAD: 30,
  PREMIUM_PLUS_MIN_DAYS_AHEAD: 1,
  PREMIUM_PLUS_MAX_DAYS_AHEAD: 14,
  DAYS_PER_PAGE: 7,
  LAUNCH_HOUR_UTC: 10, // Memescope Monday starts at 10 AM UTC
} as const

export const LAUNCH_TYPES = {
  FREE: "free",
  PREMIUM: "premium",
  PREMIUM_PLUS: "premium_plus",
} as const

export const DATE_FORMAT = {
  DISPLAY: "EEE, MMM d, yyyy",
  DISPLAY_MONTH: "MMMM yyyy",
  DISPLAY_DAY: "EEE d",
  API: "yyyy-MM-dd",
  FULL: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
} as const

export const API_RATE_LIMITS = {
  SEARCH: {
    REQUESTS: 15,
    WINDOW: 60 * 1000,
  },
  DEFAULT: {
    REQUESTS: 10,
    WINDOW: 60 * 1000,
  },
} as const

export const UPVOTE_LIMITS = {
  ACTIONS_PER_WINDOW: 100,
  TIME_WINDOW_MS: 5 * 60 * 1000,
  TIME_WINDOW_MINUTES: 5,
  MIN_TIME_BETWEEN_ACTIONS_MS: 2000,
  MIN_TIME_BETWEEN_ACTIONS_SECONDS: 2,
  DEBOUNCE_TIME_MS: 500,
} as const

export const PREMIUM_PAYMENT_LINK = process.env.NEXT_PUBLIC_PREMIUM_PAYMENT_LINK!
export const PREMIUM_PLUS_PAYMENT_LINK = process.env.NEXT_PUBLIC_PREMIUM_PLUS_PAYMENT_LINK!

export const SPONSORSHIP_SLOTS = {
  TOTAL: 3,
  USED: 0,
} as const

export const DOMAIN_AUTHORITY = 0

// Memescope Monday specific
export const MEMECOIN_CATEGORIES = [
  "Meme",
  "Dog",
  "Cat",
  "AI",
  "Gaming",
  "DeFi",
  "Culture",
  "Celebrity",
  "Political",
  "Other",
] as const

export const SUPPORTED_CHAINS = [
  { id: "solana", name: "Solana", icon: "◎", color: "teal" },
  { id: "base", name: "Base", icon: "🔵", color: "blue" },
  { id: "bnb", name: "BNB Chain", icon: "🟡", color: "yellow" },
  { id: "ethereum", name: "Ethereum", icon: "⟠", color: "indigo" },
] as const

export const PAID_FEATURES = {
  expedited: { price: 19, label: "Expedited Review", description: "Skip the queue. Reviewed within 1 hour." },
  trending: { price: 49, label: "Trending Placement", description: "24h featured in the Trending section." },
  bundle: { price: 59, label: "Bundle (Both)", description: "Expedited review + 24h trending placement." },
} as const

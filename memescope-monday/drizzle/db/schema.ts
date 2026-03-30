import {
  boolean,
  doublePrecision,
  index,
  integer,
  json,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core"

// Launch status enum
export const launchStatus = {
  PAYMENT_PENDING: "payment_pending",
  PAYMENT_FAILED: "payment_failed",
  SCHEDULED: "scheduled",
  ONGOING: "ongoing",
  LAUNCHED: "launched",
} as const

// Chain enum for memecoins
export const chainType = {
  SOLANA: "solana",
  BASE: "base",
  BNB: "bnb",
  ETHEREUM: "ethereum",
} as const

export type ChainType = (typeof chainType)[keyof typeof chainType]

// Coin type enum
export const coinType = {
  EXISTING: "existing",
  UPCOMING: "upcoming",
} as const

export type CoinType = (typeof coinType)[keyof typeof coinType]

export type LaunchStatus = (typeof launchStatus)[keyof typeof launchStatus]

// Launch type enum
export const launchType = {
  FREE: "free",
  PREMIUM: "premium",
  PREMIUM_PLUS: "premium_plus",
} as const

export type LaunchType = (typeof launchType)[keyof typeof launchType]

// Ajouter de nouveaux enums pour les projets tech
export const pricingType = {
  FREE: "free",
  FREEMIUM: "freemium",
  PAID: "paid",
} as const

export const platformType = {
  WEB: "web",
  MOBILE: "mobile",
  DESKTOP: "desktop",
  API: "api",
  OTHER: "other",
} as const

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  role: text("role"),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
})

export const project = pgTable(
  "project",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    websiteUrl: text("website_url").notNull(),
    logoUrl: text("logo_url"),
    coverImageUrl: text("cover_image_url"),
    productImage: text("product_image"),
    githubUrl: text("github_url"),
    twitterUrl: text("twitter_url"),
    techStack: text("tech_stack").array(), // Array des technologies
    pricing: text("pricing").notNull().default(pricingType.FREE),
    platforms: text("platforms").array(), // Array des plateformes supportées
    launchStatus: text("launch_status").notNull().default(launchStatus.SCHEDULED),
    scheduledLaunchDate: timestamp("scheduled_launch_date"),
    launchType: text("launch_type").default(launchType.FREE),
    featuredOnHomepage: boolean("featured_on_homepage").default(false),
    dailyRanking: integer("daily_ranking"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    // Memescope Monday coin-specific fields
    ticker: text("ticker"),
    chain: text("chain").default(chainType.SOLANA),
    coinType: text("coin_type").default(coinType.EXISTING),
    contractAddress: text("contract_address"),
    telegramUrl: text("telegram_url"),
    pumpfunUrl: text("pumpfun_url"),
    dexscreenerUrl: text("dexscreener_url"),
    marketCap: doublePrecision("market_cap"),
    athMarketCap: doublePrecision("ath_market_cap"),
    volume24h: doublePrecision("volume_24h"),
    priceUsd: doublePrecision("price_usd"),
    priceChange24h: doublePrecision("price_change_24h"),
    holders: integer("holders"),
    liquidity: doublePrecision("liquidity"),
    totalSupply: text("total_supply"),
    launchDateCoin: timestamp("launch_date_coin"),
    pumpfunData: json("pumpfun_data"),
    heliusData: json("helius_data"),
    dexscreenerData: json("dexscreener_data"),
    lastEnrichedAt: timestamp("last_enriched_at"),
    trending: boolean("trending").default(false),
    paidExpedited: boolean("paid_expedited").default(false),
    paidTrending: boolean("paid_trending").default(false),
    weekLabel: text("week_label"),
  },
  (table) => {
    return {
      nameIdx: index("project_name_idx").on(table.name),
      chainIdx: index("project_chain_idx").on(table.chain),
      contractIdx: index("project_contract_idx").on(table.contractAddress),
    }
  },
)

export const category = pgTable(
  "category",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => {
    return {
      nameIdx: index("category_name_idx").on(table.name),
    }
  },
)

// Junction table for many-to-many relationship between projects and categories
export const projectToCategory = pgTable(
  "project_to_category",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "cascade" }),
  },
  (table) => {
    return {
      pk: primaryKey(table.projectId, table.categoryId),
    }
  },
)

// Interactions
export const upvote = pgTable("upvote", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// Tables pour Fuma Comment
export const fumaRoles = pgTable("fuma_roles", {
  userId: varchar("user_id", { length: 256 }).primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  canDelete: boolean("can_delete").notNull(),
})

export const fumaComments = pgTable("fuma_comments", {
  id: serial("id").primaryKey().notNull(),
  page: varchar("page", { length: 256 }).notNull(),
  thread: integer("thread"),
  author: varchar("author", { length: 256 }).notNull(),
  content: json("content").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
})

export const fumaRates = pgTable(
  "fuma_rates",
  {
    userId: varchar("user_id", { length: 256 }).notNull(),
    commentId: integer("comment_id").notNull(),
    like: boolean("like").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.commentId] }),
    index("comment_idx").on(table.commentId),
  ],
)

// New table for tracking daily launches
export const launchQuota = pgTable("launch_quota", {
  id: text("id").primaryKey(),
  date: timestamp("date").notNull().unique(),
  freeCount: integer("free_count").notNull().default(0),
  premiumCount: integer("premium_count").notNull().default(0),
  premiumPlusCount: integer("premium_plus_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// New table for tracking project submissions during coming soon phase
export const waitlistSubmission = pgTable("waitlist_submission", {
  id: text("id").primaryKey(),
  projectUrl: text("project_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
})

export const seoArticle = pgTable(
  "seo_article",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    content: text("content").notNull(), // Contenu MDX complet
    image: text("image"), // URL de l'image principale
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    publishedAt: timestamp("published_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => {
    return {
      slugIdx: index("seo_article_slug_idx").on(table.slug),
    }
  },
)

// Trollbox messages for coin pages
export const trollboxMessage = pgTable(
  "trollbox_message",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    username: text("username").notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => {
    return {
      projectIdx: index("trollbox_project_idx").on(table.projectId),
    }
  },
)

export const blogArticle = pgTable(
  "blog_article",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    content: text("content").notNull(), // Contenu MDX complet
    image: text("image"), // URL de l'image principale
    tags: text("tags").array(), // Array des tags
    author: text("author").notNull().default("Memescope Monday Team"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    publishedAt: timestamp("published_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => {
    return {
      slugIdx: index("blog_article_slug_idx").on(table.slug),
      publishedAtIdx: index("blog_article_published_at_idx").on(table.publishedAt),
    }
  },
)

// Sponsorship table for tracking paid sponsorships via Stripe
export const sponsorship = pgTable("sponsorship", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  websiteUrl: text("website_url").notNull(),
  logoUrl: text("logo_url"),
  tier: text("tier").notNull(), // "weekly" or "monthly"
  status: text("status").notNull().default("active"), // "active", "expired", "cancelled"
  stripeSessionId: text("stripe_session_id"),
  stripeCustomerEmail: text("stripe_customer_email"),
  amountPaid: integer("amount_paid"), // in cents
  startsAt: timestamp("starts_at").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

#!/bin/bash
set -e

# Prettify GitHub file browser — EVERY file gets its own unique emoji commit
cd /workspaces/memescope-monday

git config user.name "nirholas"
git config user.email "nirholas@users.noreply.github.com"

# Step 1: Squash all history
echo "📦 Squashing all history..."
git checkout --orphan temp_branch
git add -A
git commit -m "🎉 Initial commit"
git branch -D main || true
git branch -m main

COUNT=0
prettify() {
    local file="$1"
    local msg="$2"
    [ ! -e "$file" ] && return
    echo "" >> "$file"
    git add "$file"
    git commit -m "$msg" 2>/dev/null && COUNT=$((COUNT+1)) && echo "  [$COUNT] $msg" || true
}

echo ""
echo "🎨 Creating per-file commits (245 files)..."
echo ""

# ═══════════════════════════════════════════════════════════════
# .github
# ═══════════════════════════════════════════════════════════════
prettify ".github/FUNDING.yml"    "💰 FUNDING.yml — Sponsor & funding config"

# ═══════════════════════════════════════════════════════════════
# app/(auth)
# ═══════════════════════════════════════════════════════════════
prettify "app/(auth)/layout.tsx"                    "🔑 auth/layout — Authentication layout wrapper"
prettify "app/(auth)/forgot-password/page.tsx"      "🔓 forgot-password — Password recovery page"
prettify "app/(auth)/reset-password/page.tsx"       "🔄 reset-password — Password reset flow"
prettify "app/(auth)/sign-in/page.tsx"              "🚪 sign-in — User login page"
prettify "app/(auth)/sign-up/page.tsx"              "📝 sign-up — User registration page"
prettify "app/(auth)/verify-email/sent/page.tsx"    "📧 verify-email/sent — Email sent confirmation"
prettify "app/(auth)/verify-email/success/page.tsx" "✅ verify-email/success — Email verified"

# ═══════════════════════════════════════════════════════════════
# app/actions
# ═══════════════════════════════════════════════════════════════
prettify "app/actions/admin.ts"            "👑 actions/admin — Admin server actions"
prettify "app/actions/coin-data.ts"        "📊 actions/coin-data — Token data fetching"
prettify "app/actions/discord.ts"          "💬 actions/discord — Discord notifications"
prettify "app/actions/home.ts"             "🏠 actions/home — Homepage data loading"
prettify "app/actions/launch.ts"           "🚀 actions/launch — Launch countdown logic"
prettify "app/actions/plausible.ts"        "📈 actions/plausible — Analytics tracking"
prettify "app/actions/project-details.ts"  "🔍 actions/project-details — Coin detail data"
prettify "app/actions/projects.ts"         "📋 actions/projects — Project CRUD actions"
prettify "app/actions/winners.ts"          "🏆 actions/winners — Winner selection logic"

# ═══════════════════════════════════════════════════════════════
# app/admin
# ═══════════════════════════════════════════════════════════════
prettify "app/admin/layout.tsx"    "🛡️ admin/layout — Admin panel layout"
prettify "app/admin/page.tsx"      "⚙️ admin/page — Admin dashboard"

# ═══════════════════════════════════════════════════════════════
# app/api
# ═══════════════════════════════════════════════════════════════
prettify "app/api/auth/[...all]/route.ts"               "🔐 api/auth — Auth route handler"
prettify "app/api/auth/stripe/webhook/route.ts"          "💳 api/auth/stripe — Stripe webhook handler"
prettify "app/api/coins/[address]/enrich/route.ts"       "💎 api/coins/enrich — Token data enrichment"
prettify "app/api/comments/[[...comment]]/route.ts"      "💬 api/comments — Comments API route"
prettify "app/api/cron/send-ongoing-reminders/route.ts"  "⏰ api/cron/reminders — Ongoing reminders"
prettify "app/api/cron/send-winner-notifications/route.ts" "🏅 api/cron/winners — Winner notifications"
prettify "app/api/cron/update-launches/route.ts"         "🔄 api/cron/launches — Launch status updates"
prettify "app/api/payment/verify/route.ts"               "💰 api/payment/verify — Payment verification"
prettify "app/api/projects/[projectId]/status/route.ts"  "📡 api/projects/status — Project status API"
prettify "app/api/projects/check-url/route.ts"           "🔗 api/projects/check-url — URL validation"
prettify "app/api/search/route.ts"                       "🔎 api/search — Search API endpoint"
prettify "app/api/uploadthing/core.ts"                   "📤 api/uploadthing/core — Upload config"
prettify "app/api/uploadthing/route.ts"                  "📁 api/uploadthing/route — Upload endpoint"

# ═══════════════════════════════════════════════════════════════
# app/pages
# ═══════════════════════════════════════════════════════════════
prettify "app/blog/[slug]/page.tsx"    "📰 blog/[slug] — Blog article page"
prettify "app/blog/page.tsx"           "📚 blog — Blog listing page"
prettify "app/categories/page.tsx"     "🏷️ categories — Category browser"
prettify "app/dashboard/page.tsx"      "📊 dashboard — User dashboard"
prettify "app/favicon.ico"             "🎯 favicon — Site icon"
prettify "app/globals.css"             "🎨 globals.css — Global styles & Tailwind"
prettify "app/layout.tsx"              "🏗️ layout — Root application layout"
prettify "app/legal/badges/page.tsx"   "🛡️ legal/badges — Badge usage terms"
prettify "app/legal/page.tsx"          "📜 legal — Legal information"
prettify "app/legal/privacy/page.tsx"  "🔒 legal/privacy — Privacy policy"
prettify "app/legal/terms/page.tsx"    "📃 legal/terms — Terms of service"
prettify "app/not-found.tsx"           "🚫 not-found — 404 error page"
prettify "app/page.tsx"                "⚡ page — Homepage with countdown & leaderboard"
prettify "app/payment/failed/page.tsx"   "❌ payment/failed — Payment failure page"
prettify "app/payment/success/page.tsx"  "✅ payment/success — Payment confirmation"
prettify "app/pricing/page.tsx"          "💎 pricing — Pricing & plans"
prettify "app/projects/[slug]/badges/loading.tsx"   "⏳ projects/badges/loading — Badge loader"
prettify "app/projects/[slug]/badges/page.tsx"      "🏅 projects/badges — Project badges"
prettify "app/projects/[slug]/loading.tsx"           "⏳ projects/loading — Coin detail loader"
prettify "app/projects/[slug]/not-found.tsx"         "🚫 projects/not-found — Coin not found"
prettify "app/projects/[slug]/page.tsx"              "🪙 projects/[slug] — Coin detail page"
prettify "app/projects/submit/page.tsx"              "➕ projects/submit — Submit new coin"
prettify "app/reviews/[slug]/page.tsx"   "⭐ reviews/[slug] — Review detail page"
prettify "app/reviews/page.tsx"          "📝 reviews — Reviews listing"
prettify "app/settings/page.tsx"         "⚙️ settings — User settings"
prettify "app/sponsors/page.tsx"         "🤝 sponsors — Sponsor showcase"
prettify "app/trending/page.tsx"         "📈 trending — Trending coins"
prettify "app/winners/page.tsx"          "🏆 winners — Daily winners"

# ═══════════════════════════════════════════════════════════════
# components/auth
# ═══════════════════════════════════════════════════════════════
prettify "components/auth/forgot-password-form.tsx"  "🔓 forgot-password-form — Password recovery UI"
prettify "components/auth/reset-password-form.tsx"   "🔄 reset-password-form — Password reset UI"
prettify "components/auth/sign-in-form.tsx"          "🚪 sign-in-form — Login form component"
prettify "components/auth/sign-up-form.tsx"          "📋 sign-up-form — Registration form"
prettify "components/auth/turnstile-captcha.tsx"     "🤖 turnstile-captcha — Bot protection"

# ═══════════════════════════════════════════════════════════════
# components/badges
# ═══════════════════════════════════════════════════════════════
prettify "components/badges/BadgesDisplay.tsx"  "🏅 BadgesDisplay — Badge gallery component"
prettify "components/badges/copy-button.tsx"    "📋 copy-button — Clipboard copy action"
prettify "components/badges/show-code.tsx"      "💻 show-code — Badge embed code viewer"

# ═══════════════════════════════════════════════════════════════
# components/blog
# ═══════════════════════════════════════════════════════════════
prettify "components/blog/article-footer.tsx"      "📰 article-footer — Blog post footer"
prettify "components/blog/mdx-layout.tsx"          "📄 mdx-layout — MDX article layout"
prettify "components/blog/reading-time.ts"         "⏱️ reading-time — Read time calculator"
prettify "components/blog/smooth-scroll.tsx"       "🔽 smooth-scroll — Anchor scroll behavior"
prettify "components/blog/table-of-contents.tsx"   "📑 table-of-contents — Article TOC sidebar"

# ═══════════════════════════════════════════════════════════════
# components/categories
# ═══════════════════════════════════════════════════════════════
prettify "components/categories/mobile-category-selector.tsx"  "📱 mobile-category-selector — Category picker"

# ═══════════════════════════════════════════════════════════════
# components/coin
# ═══════════════════════════════════════════════════════════════
prettify "components/coin/boost-listing.tsx"     "🚀 boost-listing — Premium listing upgrade"
prettify "components/coin/coin-links.tsx"        "🔗 coin-links — Token external links"
prettify "components/coin/coin-market-data.tsx"  "📊 coin-market-data — Live market stats"
prettify "components/coin/coin-news.tsx"         "📰 coin-news — Token news feed"
prettify "components/coin/related-coins.tsx"     "🔄 related-coins — Similar tokens"
prettify "components/coin/safety-score.tsx"      "🛡️ safety-score — Risk assessment badge"
prettify "components/coin/social-buzz.tsx"       "🐝 social-buzz — Social hype indicator"

# ═══════════════════════════════════════════════════════════════
# components/dashboard
# ═══════════════════════════════════════════════════════════════
prettify "components/dashboard/dashboard-project-card.tsx"  "📊 dashboard-project-card — User's coin card"

# ═══════════════════════════════════════════════════════════════
# components (misc)
# ═══════════════════════════════════════════════════════════════
prettify "components/date-picker.tsx"   "📅 date-picker — Date selection component"
prettify "components/faq-section.tsx"   "❓ faq-section — FAQ accordion"

# ═══════════════════════════════════════════════════════════════
# components/home
# ═══════════════════════════════════════════════════════════════
prettify "components/home/countdown-timer.tsx"       "⏳ countdown-timer — Monday launch countdown"
prettify "components/home/premium-card.tsx"           "💎 premium-card — Premium listing card"
prettify "components/home/project-card-buttons.tsx"   "🔘 project-card-buttons — Card action buttons"
prettify "components/home/project-card.tsx"           "🃏 project-card — Coin listing card"
prettify "components/home/project-section.tsx"        "📦 project-section — Homepage coin section"
prettify "components/home/sponsor-card.tsx"           "🤝 sponsor-card — Sponsor display card"
prettify "components/home/top-launches-podium.tsx"    "🏆 top-launches-podium — Winners podium"
prettify "components/home/welcome-banner.tsx"         "👋 welcome-banner — Hero welcome section"

# ═══════════════════════════════════════════════════════════════
# components/icons
# ═══════════════════════════════════════════════════════════════
prettify "components/icons/bronze.svg"       "🥉 bronze.svg — Bronze medal icon"
prettify "components/icons/gold.svg"         "🥇 gold.svg — Gold medal icon"
prettify "components/icons/medal-icons.tsx"  "🏅 medal-icons — Medal icon components"
prettify "components/icons/vide.svg"         "🎖️ vide.svg — Empty medal icon"

# ═══════════════════════════════════════════════════════════════
# components/landing-page
# ═══════════════════════════════════════════════════════════════
prettify "components/landing-page/hero.tsx"  "✨ hero — Landing page hero section"

# ═══════════════════════════════════════════════════════════════
# components/layout
# ═══════════════════════════════════════════════════════════════
prettify "components/layout/footer.tsx"           "🦶 footer — Site footer"
prettify "components/layout/nav-menu.tsx"         "☰ nav-menu — Navigation menu items"
prettify "components/layout/nav.tsx"              "🧭 nav — Main navigation bar"
prettify "components/layout/search-command.tsx"   "🔍 search-command — Command palette search"
prettify "components/layout/user-nav.tsx"         "👤 user-nav — User dropdown menu"

# ═══════════════════════════════════════════════════════════════
# components/project
# ═══════════════════════════════════════════════════════════════
prettify "components/project/daily-ranking-badge.tsx"        "📆 daily-ranking-badge — Daily rank display"
prettify "components/project/edit-button.tsx"                "✏️ edit-button — Project edit trigger"
prettify "components/project/edit-project-form.tsx"          "📝 edit-project-form — Project editor modal"
prettify "components/project/project-comments.tsx"           "💬 project-comments — Comment thread"
prettify "components/project/project-image-with-loader.tsx"  "🖼️ project-image-with-loader — Lazy image"
prettify "components/project/ranking-badge.tsx"              "🏅 ranking-badge — Rank position badge"
prettify "components/project/share-button-origin.tsx"        "🔗 share-button-origin — Share source"
prettify "components/project/share-button.tsx"               "📤 share-button — Social share button"
prettify "components/project/submit-form.tsx"                "📝 submit-form — Coin submission form"
prettify "components/project/upvote-button.tsx"              "👍 upvote-button — Vote interaction"

# ═══════════════════════════════════════════════════════════════
# components/shared
# ═══════════════════════════════════════════════════════════════
prettify "components/shared/sponsor-cards.tsx"  "💝 sponsor-cards — Sponsor card grid"

# ═══════════════════════════════════════════════════════════════
# components/theme
# ═══════════════════════════════════════════════════════════════
prettify "components/theme/theme-provider.tsx"     "🌓 theme-provider — Dark/light mode context"
prettify "components/theme/theme-toggle-menu.tsx"  "🎨 theme-toggle-menu — Theme dropdown"
prettify "components/theme/theme-toggle.tsx"       "🌙 theme-toggle — Theme switch button"

# ═══════════════════════════════════════════════════════════════
# components/ui (shadcn)
# ═══════════════════════════════════════════════════════════════
prettify "components/ui/accordion.tsx"        "🪗 accordion — Collapsible sections"
prettify "components/ui/alert-dialog.tsx"     "⚠️ alert-dialog — Confirmation modal"
prettify "components/ui/alert.tsx"            "🔔 alert — Alert banner component"
prettify "components/ui/aspect-ratio.tsx"     "📐 aspect-ratio — Responsive ratio box"
prettify "components/ui/avatar.tsx"           "👤 avatar — User avatar component"
prettify "components/ui/badge.tsx"            "🏷️ badge — Status badge label"
prettify "components/ui/breadcrumb.tsx"       "🍞 breadcrumb — Navigation breadcrumbs"
prettify "components/ui/button.tsx"           "🔘 button — Button component"
prettify "components/ui/calendar.tsx"         "📅 calendar — Date picker calendar"
prettify "components/ui/card.tsx"             "🃏 card — Card container"
prettify "components/ui/carousel.tsx"         "🎠 carousel — Image/content slider"
prettify "components/ui/chart.tsx"            "📈 chart — Chart component wrapper"
prettify "components/ui/checkbox.tsx"         "☑️ checkbox — Checkbox input"
prettify "components/ui/collapsible.tsx"      "📂 collapsible — Expand/collapse"
prettify "components/ui/command.tsx"          "⌨️ command — Command palette"
prettify "components/ui/context-menu.tsx"     "📋 context-menu — Right-click menu"
prettify "components/ui/dialog.tsx"           "💬 dialog — Modal dialog"
prettify "components/ui/drawer.tsx"           "🗄️ drawer — Side drawer panel"
prettify "components/ui/dropdown-menu.tsx"    "📂 dropdown-menu — Dropdown selector"
prettify "components/ui/form.tsx"             "📝 form — Form wrapper with validation"
prettify "components/ui/glow-effect.tsx"      "✨ glow-effect — Glow animation"
prettify "components/ui/hover-card.tsx"       "🪧 hover-card — Hover preview card"
prettify "components/ui/input-otp.tsx"        "🔢 input-otp — OTP code input"
prettify "components/ui/input.tsx"            "✏️ input — Text input field"
prettify "components/ui/label.tsx"            "🏷️ label — Form field label"
prettify "components/ui/menubar.tsx"          "☰ menubar — Menu bar component"
prettify "components/ui/navigation-menu.tsx"  "🧭 navigation-menu — Nav menu"
prettify "components/ui/pagination.tsx"       "📄 pagination — Page navigation"
prettify "components/ui/popover.tsx"          "💭 popover — Floating popover"
prettify "components/ui/progress.tsx"         "🔋 progress — Progress bar"
prettify "components/ui/radio-group.tsx"      "🔘 radio-group — Radio button set"
prettify "components/ui/resizable.tsx"        "↔️ resizable — Resizable panels"
prettify "components/ui/rich-text-editor.tsx" "📝 rich-text-editor — WYSIWYG editor"
prettify "components/ui/scroll-area.tsx"      "📜 scroll-area — Custom scrollbar"
prettify "components/ui/select.tsx"           "📋 select — Dropdown select"
prettify "components/ui/separator.tsx"        "➖ separator — Visual divider"
prettify "components/ui/sheet.tsx"            "📄 sheet — Slide-out panel"
prettify "components/ui/sidebar.tsx"          "📌 sidebar — App sidebar layout"
prettify "components/ui/skeleton.tsx"         "💀 skeleton — Loading placeholder"
prettify "components/ui/slider.tsx"           "🎚️ slider — Range slider"
prettify "components/ui/sonner.tsx"           "🔔 sonner — Toast notifications"
prettify "components/ui/stepper.tsx"          "🔢 stepper — Step indicator"
prettify "components/ui/switch.tsx"           "🔀 switch — Toggle switch"
prettify "components/ui/table.tsx"            "📊 table — Data table"
prettify "components/ui/tabs.tsx"             "📑 tabs — Tab navigation"
prettify "components/ui/textarea.tsx"         "📝 textarea — Multi-line input"
prettify "components/ui/toggle-group.tsx"     "🔗 toggle-group — Button group toggle"
prettify "components/ui/toggle.tsx"           "🔀 toggle — Toggle button"
prettify "components/ui/tooltip.tsx"          "💡 tooltip — Hover tooltip"

# ═══════════════════════════════════════════════════════════════
# content
# ═══════════════════════════════════════════════════════════════
prettify "content/blog/index.ts"  "📖 content/blog — Blog content index"

# ═══════════════════════════════════════════════════════════════
# docs
# ═══════════════════════════════════════════════════════════════
prettify "docs/cron-launches.md"  "📚 docs/cron-launches — Cron job documentation"

# ═══════════════════════════════════════════════════════════════
# drizzle
# ═══════════════════════════════════════════════════════════════
prettify "drizzle/db/index.ts"                         "🗄️ drizzle/db — Database connection"
prettify "drizzle/db/schema.ts"                        "📐 drizzle/schema — Database schema definition"
prettify "drizzle/migrations/0000_pink_serpent_society.sql"     "🐍 migration/0000 — Initial schema"
prettify "drizzle/migrations/0001_dizzy_kabuki.sql"            "🎭 migration/0001 — Kabuki migration"
prettify "drizzle/migrations/0002_pale_metal_master.sql"       "🤖 migration/0002 — Metal master migration"
prettify "drizzle/migrations/0003_strange_meggan.sql"          "🦸 migration/0003 — Meggan migration"
prettify "drizzle/migrations/0004_absent_grandmaster.sql"      "♟️ migration/0004 — Grandmaster migration"
prettify "drizzle/migrations/0005_early_ikaris.sql"            "☀️ migration/0005 — Ikaris migration"
prettify "drizzle/migrations/meta/0000_snapshot.json"          "📸 migration/meta/0000 — Schema snapshot"
prettify "drizzle/migrations/meta/0001_snapshot.json"          "📸 migration/meta/0001 — Schema snapshot"
prettify "drizzle/migrations/meta/0002_snapshot.json"          "📸 migration/meta/0002 — Schema snapshot"
prettify "drizzle/migrations/meta/0003_snapshot.json"          "📸 migration/meta/0003 — Schema snapshot"
prettify "drizzle/migrations/meta/0004_snapshot.json"          "📸 migration/meta/0004 — Schema snapshot"
prettify "drizzle/migrations/meta/0005_snapshot.json"          "📸 migration/meta/0005 — Schema snapshot"
prettify "drizzle/migrations/meta/_journal.json"               "📓 migration/meta/_journal — Migration journal"

# ═══════════════════════════════════════════════════════════════
# hooks
# ═══════════════════════════════════════════════════════════════
prettify "hooks/use-mobile.ts"  "📱 use-mobile — Mobile breakpoint hook"

# ═══════════════════════════════════════════════════════════════
# lib
# ═══════════════════════════════════════════════════════════════
prettify "lib/auth-client.ts"         "🔑 auth-client — Client-side auth helpers"
prettify "lib/auth.ts"                "🔐 auth — Server auth configuration"
prettify "lib/coin-data/cmc.ts"           "📡 coin-data/cmc — CoinMarketCap fetcher"
prettify "lib/coin-data/coingecko.ts"     "🦎 coin-data/coingecko — CoinGecko fetcher"
prettify "lib/coin-data/cryptopanic.ts"   "📰 coin-data/cryptopanic — News aggregator"
prettify "lib/coin-data/detail.ts"        "🔬 coin-data/detail — Detail page enrichment"
prettify "lib/coin-data/dexscreener.ts"   "📉 coin-data/dexscreener — DEX data fetcher"
prettify "lib/coin-data/enrichment.ts"    "💡 coin-data/enrichment — Data merge pipeline"
prettify "lib/coin-data/helius.ts"        "☀️ coin-data/helius — Solana metadata provider"
prettify "lib/coin-data/index.ts"         "📦 coin-data/index — Data module exports"
prettify "lib/coin-data/pumpfun.ts"       "🎰 coin-data/pumpfun — PumpFun API client"
prettify "lib/coin-data/types.ts"         "🏷️ coin-data/types — Token data types"
prettify "lib/comment-rate-limit.ts"      "🚦 comment-rate-limit — Comment spam guard"
prettify "lib/comment.config.ts"          "💬 comment.config — Comment system config"
prettify "lib/constants.ts"               "📌 constants — App constants & launch config"
prettify "lib/content-utils.ts"           "🔧 content-utils — MDX content helpers"
prettify "lib/discord-notification.ts"    "🔔 discord-notification — Discord webhooks"
prettify "lib/email.ts"                   "📧 email — Resend email client"
prettify "lib/hooks/use-debounce.ts"      "⏱️ use-debounce — Debounce utility hook"
prettify "lib/hooks/use-search.ts"        "🔍 use-search — Search query hook"
prettify "lib/link-utils.ts"              "🔗 link-utils — URL parsing & chain detection"
prettify "lib/rate-limit.ts"              "🚧 rate-limit — Redis rate limiter"
prettify "lib/transactional-emails.ts"    "📨 transactional-emails — Email templates"
prettify "lib/uploadthing.ts"             "📤 uploadthing — File upload config"
prettify "lib/utils.ts"                   "🛠️ utils — General utility functions"
prettify "lib/validations/auth.ts"        "✅ validations/auth — Auth form schemas"

# ═══════════════════════════════════════════════════════════════
# public
# ═══════════════════════════════════════════════════════════════
prettify "public/images/badges/powered-by-dark.svg"   "🌑 badge/powered-by-dark — Dark powered badge"
prettify "public/images/badges/powered-by-light.svg"  "☀️ badge/powered-by-light — Light powered badge"
prettify "public/images/badges/top1-dark.svg"         "🥇 badge/top1-dark — #1 dark badge"
prettify "public/images/badges/top1-light.svg"        "🥇 badge/top1-light — #1 light badge"
prettify "public/images/badges/top2-dark.svg"         "🥈 badge/top2-dark — #2 dark badge"
prettify "public/images/badges/top2-light.svg"        "🥈 badge/top2-light — #2 light badge"
prettify "public/images/badges/top3-dark.svg"         "🥉 badge/top3-dark — #3 dark badge"
prettify "public/images/badges/top3-light.svg"        "🥉 badge/top3-light — #3 light badge"
prettify "public/images/banner.svg"                   "🎨 banner.svg — Animated README banner"
prettify "public/logo.png"                            "🎯 logo.png — Site logo (raster)"
prettify "public/logo.svg"                            "✨ logo.svg — Site logo (vector)"
prettify "public/monday.svg"                          "📅 monday.svg — Monday branding mark"
prettify "public/og-blog.png"                         "📸 og-blog.png — Blog OpenGraph image"
prettify "public/og.png"                              "📸 og.png — Main OpenGraph image"
prettify "public/oppieD.png"                          "🌑 oppieD.png — Dark mascot asset"
prettify "public/oppieG.png"                          "☀️ oppieG.png — Light mascot asset"
prettify "public/sponsors/landinglab.png"             "🤝 sponsors/landinglab — Sponsor logo"

# ═══════════════════════════════════════════════════════════════
# scripts
# ═══════════════════════════════════════════════════════════════
prettify "scripts/categories.ts"   "📂 scripts/categories — Category seed data"
prettify "scripts/seed-coins.ts"   "🌱 scripts/seed-coins — Database seeder"

# ═══════════════════════════════════════════════════════════════
# Root config files
# ═══════════════════════════════════════════════════════════════
prettify "drizzle.config.ts"     "🔩 drizzle.config.ts — ORM configuration"
prettify "eslint.config.mjs"     "🔍 eslint.config.mjs — Linting rules"
prettify "postcss.config.mjs"    "🎨 postcss.config.mjs — PostCSS pipeline"
prettify "next.config.ts"        "⚙️ next.config.ts — Next.js configuration"
prettify "components.json"       "🧱 components.json — shadcn/ui config"
prettify "middleware.ts"         "🛡️ middleware.ts — Auth & route middleware"
prettify "mdx-components.tsx"    "✍️ mdx-components.tsx — MDX component map"
prettify "package.json"          "📦 package.json — Dependencies & scripts"
prettify "tsconfig.json"         "🏷️ tsconfig.json — TypeScript configuration"
prettify "bun.lockb"             "🔒 bun.lockb — Dependency lockfile"

# ═══════════════════════════════════════════════════════════════
# Root docs & meta
# ═══════════════════════════════════════════════════════════════
prettify "README.md"             "📖 README.md — Project documentation"
prettify "CHANGELOG.md"          "📋 CHANGELOG.md — Release history"
prettify "CONTRIBUTING.md"       "🤝 CONTRIBUTING.md — Contribution guide"
prettify "CODE_OF_CONDUCT.md"    "💜 CODE_OF_CONDUCT.md — Community standards"

# ═══════════════════════════════════════════════════════════════
# Dotfiles
# ═══════════════════════════════════════════════════════════════
prettify ".gitignore"            "🙈 .gitignore — Ignored files config"
prettify ".env.example"          "🔐 .env.example — Environment template"

echo ""
echo "🚀 Force pushing to origin..."
git push -f origin main

echo ""
echo "✨ Done! $COUNT files prettified!"
echo "   Visit: https://github.com/nirholas/memescope-monday"

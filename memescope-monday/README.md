<p align="center">
  <img src="public/images/banner.svg" alt="Memescope Monday" width="900"/>
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js"/></a>
  <a href="https://reactjs.org"><img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React"/></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript" alt="TypeScript"/></a>
</p>

<p align="center">
  <strong>The community-driven memecoin directory.</strong><br/>
  Every Monday at 10 AM UTC, the community votes together on the best memecoin plays across Solana, Base, and BNB Chain.<br/>
  Submit your picks, upvote the best, ride together.
</p>

---

## Features

### Core

- **Coin Discovery** — Browse and discover memecoin picks submitted by the community
- **Upvoting** — Vote on the best plays; daily winners get highlighted
- **Rich Coin Pages** — Live market data, DexScreener charts, buy/sell ratios, PumpFun bonding curve status
- **Multi-Chain** — Solana (PumpFun), Base, and BNB Chain support
- **Submit Picks** — Share your memecoin finds with the community
- **Comments** — Discuss plays with other traders
- **Leaderboards** — Today's top picks, yesterday's winners, best of month
- **Launch Countdown** — Live countdown to 10 AM UTC every Monday

### Market Data (Multi-API)

- **PumpFun** — Bonding curve status, reply count, creator info, ATH market cap
- **DexScreener** — Live price, volume, liquidity, buy/sell txns, embedded charts
- **CoinGecko** — Historical data, price changes, market cap, FDV
- **CoinMarketCap** — Additional market data and rankings
- **CryptoPanic** — Aggregated crypto news with sentiment
- **Helius** — Solana token metadata and on-chain data
- **Etherscan** — ERC-20 holder counts

### Safety & Analysis

- **Safety Score (A-F)** — Algorithmic risk assessment based on liquidity, trading activity, buy/sell ratio, pair age, and community votes
- **Social Buzz Score** — Hype indicator (Dead / Low / Moderate / Hot / Viral)
- **News Feed** — Per-coin news with sentiment analysis

### Platform

- **Auth** — Email/password + Google + GitHub sign-in (Better Auth)
- **Admin Panel** — Manage submissions and users
- **Stripe Payments** — Premium launch slots (Expedited Review, Trending Placement)
- **Rate Limiting** — Redis-based anti-spam on votes, comments, and API
- **Discord Notifications** — New submissions and winner announcements
- **Email Notifications** — Transactional emails via Resend
- **Dark/Light Theme** — Full theme support

## Quick Start

```bash
# Clone
git clone https://github.com/nirholas/memescope-monday.git
cd memescope-monday

# Install
npm install --legacy-peer-deps

# Configure
cp .env.example .env.local
# Edit .env.local with your keys (see Environment Variables below)

# Database
npx drizzle-kit generate
npx drizzle-kit migrate
npx drizzle-kit push

# Run
npm run dev
```

Visit `http://localhost:3000`

## Environment Variables

### Required

| Variable             | Description                  |
| -------------------- | ---------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Auth secret key              |
| `BETTER_AUTH_URL`    | App URL for auth callbacks   |
| `NEXT_PUBLIC_URL`    | Public app URL               |

### Crypto Data APIs

| Variable              | Description             |
| --------------------- | ----------------------- |
| `HELIUS_API_KEY`      | Solana token metadata   |
| `CMC_API_KEY`         | CoinMarketCap data      |
| `COINGECKO_API_KEY`   | CoinGecko market data   |
| `CRYPTOPANIC_API_KEY` | Crypto news aggregation |
| `ETHERSCAN_API_KEY`   | ERC-20 token data       |

### Services (Optional)

| Variable                | Description               |
| ----------------------- | ------------------------- |
| `STRIPE_SECRET_KEY`     | Payment processing        |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing    |
| `RESEND_API_KEY`        | Transactional emails      |
| `REDIS_URL`             | Rate limiting             |
| `DISCORD_WEBHOOK_URL`   | Notifications             |
| `NEXT_PUBLIC_GA_ID`     | Google Analytics          |
| `TURNSTILE_SECRET_KEY`  | Cloudflare bot protection |

See [.env.example](.env.example) for the full list.

## Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Framework      | Next.js 15 + React 19               |
| Language       | TypeScript 5.8                      |
| Styling        | Tailwind CSS + shadcn/ui            |
| Database       | PostgreSQL + Drizzle ORM            |
| Auth           | Better Auth (email, Google, GitHub) |
| Payments       | Stripe                              |
| Cache          | Redis                               |
| Email          | Resend                              |
| Files          | UploadThing                         |
| Bot Protection | Cloudflare Turnstile                |
| Comments       | Fuma Comments                       |

## How Coin Detail Pages Work

When a user submits a coin, they provide the token contract address (or a PumpFun/DexScreener URL). The detail page:

1. **Auto-detects** the token address and chain from the URL
2. **Fetches data in parallel** from PumpFun, DexScreener, CoinGecko, CryptoPanic, and Helius
3. **Merges** into a unified view with live price, market stats, transaction data
4. **Calculates** a Safety Score and Social Buzz Score
5. **Embeds** a DexScreener chart directly on the page
6. **Links** to Solscan/BaseScan/BscScan, Birdeye, PumpFun, and social accounts

Supported URL formats:

- Raw address: `8J69rbLTzWWgUJziFY8jeu5tDwEPBwUz4pKBMr5rpump`
- PumpFun: `https://pump.fun/8J69rb...`
- DexScreener: `https://dexscreener.com/solana/...`
- Solscan: `https://solscan.io/token/...`
- EVM: `0x...` addresses for Base/BNB

## Project Structure

```
app/
├── page.tsx                    # Homepage with countdown & leaderboards
├── (auth)/                     # Auth pages (sign-in, sign-up, reset)
├── dashboard/                  # User dashboard & watchlist
├── projects/[slug]/            # Coin detail pages
├── projects/submit/            # Submit new coins
├── trending/                   # Browse all coins
├── admin/                      # Admin panel
└── api/                        # API routes

components/
├── project/                    # Coin cards, detail views, charts
├── home/                       # Homepage sections & leaderboards
├── layout/                     # Nav, footer, auth components
└── ui/                         # Base UI components (Radix/shadcn)

lib/
├── db/                         # Database schema & queries (Drizzle)
├── auth/                       # Auth config & helpers
├── coin-data/                  # Data enrichment (DexScreener, PumpFun, etc.)
└── constants.ts                # Launch config, pricing, dates
```

## Scripts

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Run migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio (DB explorer)
```

## Deployment

Optimized for Vercel:

1. Connect the GitHub repo to Vercel
2. Set environment variables in the Vercel dashboard
3. Auto-deploys on push

```bash
npm run build
npm run start
```

## Credits

Built on top of [Open-Launch](https://github.com/openlaunch-org/Open-Launch), an open-source product launch platform.

## License

See [LICENSE](LICENSE) for details.



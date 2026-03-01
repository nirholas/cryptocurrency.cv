# Free Crypto News — Telegram Bot 🤖

Interactive Telegram bot for real-time crypto news, prices, AI sentiment analysis, and market data — powered by [cryptocurrency.cv](https://cryptocurrency.cv).

## Features

| Command | Description |
|---|---|
| `/news [category]` | Latest headlines (bitcoin, defi, nft, solana, regulation…) |
| `/breaking` | Breaking crypto news |
| `/price [coin...]` | Check prices (`/price btc eth sol`) |
| `/sentiment [asset]` | AI market sentiment analysis |
| `/fear` | Fear & Greed Index with breakdown |
| `/trending` | Trending topics (24h) |
| `/digest` | Daily AI-powered news digest |
| `/whales` | Whale transaction alerts |
| `/ask <question>` | Ask AI about crypto news |
| `/search <query>` | Search 200+ news sources |
| `/help` | Show all commands |

**Inline Mode:** Type `@YourBot bitcoin` in any Telegram chat to search and share headlines instantly.

**Channel Broadcast:** Optionally auto-post breaking news to a Telegram channel.

## Quick Start

### 1. Create a Bot

1. Open [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow the prompts
3. Copy the bot token

### 2. Configure

```bash
export TELEGRAM_BOT_TOKEN="your-bot-token-here"

# Optional: auto-post breaking news to a channel
export TELEGRAM_CHANNEL_ID="@YourChannelName"

# Optional: custom API base URL (default: https://cryptocurrency.cv/api)
export FCN_API_BASE="https://cryptocurrency.cv/api"

# Optional: broadcast interval in ms (default: 300000 = 5 min)
export BROADCAST_INTERVAL_MS=300000
```

### 3. Install & Run

```bash
cd telegram
pnpm install
pnpm run build
pnpm start
```

Or for development:

```bash
pnpm run dev
```

### 4. Enable Inline Mode

To use inline mode (`@YourBot query`), tell BotFather:

1. Open [@BotFather](https://t.me/BotFather)
2. Send `/setinline`
3. Select your bot
4. Enter a placeholder like `Search crypto news...`

## Architecture

```
telegram/
├── src/
│   ├── index.ts          # Bot entry point, command registration, startup
│   ├── config.ts         # Environment variables & constants
│   ├── api.ts            # HTTP client for cryptocurrency.cv API
│   ├── format.ts         # Telegram message formatting utilities
│   ├── inline.ts         # Inline query handler
│   ├── broadcast.ts      # Channel broadcast (auto-post breaking news)
│   └── commands/
│       ├── news.ts       # /news — latest headlines
│       ├── breaking.ts   # /breaking — breaking news
│       ├── price.ts      # /price — crypto prices
│       ├── sentiment.ts  # /sentiment — AI sentiment
│       ├── feargreed.ts  # /fear — Fear & Greed Index
│       ├── trending.ts   # /trending — trending topics
│       ├── digest.ts     # /digest — daily digest
│       ├── whales.ts     # /whales — whale alerts
│       ├── ask.ts        # /ask — AI Q&A
│       └── search.ts     # /search — article search
├── package.json
├── tsconfig.json
└── README.md
```

The bot is a thin interactive layer over the cryptocurrency.cv REST API. Each command maps to one API call:

| Command | API Endpoint |
|---|---|
| `/news` | `GET /api/news` |
| `/breaking` | `GET /api/breaking` |
| `/price` | `GET /api/prices` |
| `/sentiment` | `GET /api/sentiment` |
| `/fear` | `GET /api/fear-greed` |
| `/trending` | `GET /api/trending` |
| `/digest` | `GET /api/digest` |
| `/whales` | `GET /api/whale-alerts` |
| `/ask` | `GET /api/ask` |
| `/search` | `GET /api/search` |

## Deployment

### Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
ENV TELEGRAM_BOT_TOKEN=""
CMD ["node", "dist/index.js"]
```

### Railway / Render / Fly.io

Set `TELEGRAM_BOT_TOKEN` as an environment variable and deploy the `telegram/` directory.

### Channel Broadcast Setup

1. Create a Telegram channel
2. Add your bot as an administrator with "Post Messages" permission
3. Set `TELEGRAM_CHANNEL_ID=@YourChannelName` (or use the numeric channel ID)
4. The bot will auto-post breaking news every 5 minutes

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `TELEGRAM_BOT_TOKEN` | ✅ | — | Bot token from @BotFather |
| `TELEGRAM_CHANNEL_ID` | ❌ | — | Channel to broadcast breaking news |
| `FCN_API_BASE` | ❌ | `https://cryptocurrency.cv/api` | API base URL |
| `BROADCAST_INTERVAL_MS` | ❌ | `300000` | Broadcast check interval (ms) |

## License

See [LICENSE](../LICENSE) in the project root.

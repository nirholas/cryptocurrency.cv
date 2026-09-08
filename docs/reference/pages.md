# Web App Pages

> Every page of the cryptocurrency.cv web app, grouped by area (news, market data, portfolio, AI tools, developer pages).
>
> Moved here from the project README. Back to the [reference index](https://github.com/nirholas/cryptocurrency.cv/blob/main/README.md).

## 🌐 Interactive Pages

The web interface provides rich, interactive pages for exploring crypto data:

### 📰 News & Content

| Page              | Description                     |
| ----------------- | ------------------------------- |
| `/`               | Home page with latest news feed |
| `/trending`       | Trending topics & sentiment     |
| `/search`         | Full-text search with filters   |
| `/sources`        | Browse news by source           |
| `/source/[id]`    | Individual source page          |
| `/tags/[slug]`    | Tag-based news filtering        |
| `/article/[slug]` | Article detail page             |
| `/topic/[slug]`   | Topic-based news                |
| `/topics`         | All topics overview             |
| `/buzz`           | Social buzz & mentions          |

### 📊 Market Data

| Page                  | Description                            |
| --------------------- | -------------------------------------- |
| `/markets`            | Market overview with prices            |
| `/markets/categories` | Market categories browser              |
| `/coin/[coinId]`      | Detailed coin page (CoinGecko-quality) |
| `/fear-greed`         | Fear & Greed Index with breakdown      |
| `/funding`            | Funding rates across exchanges         |
| `/signals`            | AI trading signals (educational)       |
| `/whales`             | Whale alert tracking                   |
| `/orderbook`          | Order book visualization               |
| `/liquidations`       | Liquidation tracking                   |
| `/dominance`          | Market dominance charts                |
| `/movers`             | Top gainers/losers                     |
| `/heatmap`            | Market heatmap visualization           |
| `/gas`                | ETH gas tracker                        |
| `/arbitrage`          | Arbitrage opportunities                |
| `/options`            | Options market data                    |
| `/oracle`             | Oracle price feeds                     |

### 🧠 AI Analysis

| Page            | Description                   |
| --------------- | ----------------------------- |
| `/ai`           | AI analysis dashboard         |
| `/factcheck`    | Claim verification dashboard  |
| `/entities`     | Entity extraction viewer      |
| `/claims`       | Extracted claims browser      |
| `/clickbait`    | Clickbait detection & scoring |
| `/narratives`   | Market narrative tracking     |
| `/onchain`      | On-chain event correlation    |
| `/origins`      | Original source finder        |
| `/citations`    | Citation network explorer     |
| `/sentiment`    | Sentiment analysis            |
| `/coverage-gap` | Coverage gap analysis         |

### 🔬 Research Tools

| Page           | Description                     |
| -------------- | ------------------------------- |
| `/backtest`    | News-based strategy backtesting |
| `/influencers` | Influencer prediction tracking  |
| `/predictions` | Prediction market integration   |
| `/portfolio`   | Portfolio-based news feed       |
| `/screener`    | Custom news screener            |
| `/correlation` | News-price correlation analysis |

### ⚙️ User Features

| Page         | Description               |
| ------------ | ------------------------- |
| `/settings`  | User preferences & themes |
| `/watchlist` | Personalized watchlist    |
| `/bookmarks` | Saved articles            |
| `/saved`     | Saved content manager     |
| `/read`      | Reading list              |
| `/digest`    | Personalized news digest  |

### 📖 Documentation & Tools

| Page          | Description                 |
| ------------- | --------------------------- |
| `/developers` | Developer portal & API docs |
| `/examples`   | Code examples & demos       |
| `/about`      | About the project           |
| `/pricing`    | Pricing tiers               |
| `/install`    | Installation guide          |
| `/blog`       | Blog index (146 posts)      |
| `/blog/[slug]` | Individual blog post       |
| `/blog/category/[category]` | Posts in one category |
| `/calculator` | Crypto calculator           |
| `/compare`    | Coin comparison             |
| `/charts`     | Advanced charting           |
| `/analytics`  | Usage analytics             |
| `/regulatory` | Regulatory tracking         |
| `/status`     | System health dashboard     |

### 🎨 UI/UX Features

| Feature | Description |
| ------- | ----------- |
| Skeleton Loading | Full-page loading skeletons during navigation |
| Swipe Gestures | Swipe-to-close mobile navigation |
| Bookmark/Share | Quick action buttons on news cards |
| Scroll Indicators | Fade edges + arrows for horizontal scroll |
| Dark Mode | System-aware with flash prevention |
| Reduced Motion | Respects `prefers-reduced-motion` |
| Accessibility | Skip links, focus rings, ARIA labels |

---

### Generate PNG Icons

SVG icons work in modern browsers. For legacy support:

```bash
npm install sharp
npm run pwa:icons
```


---

## 🖥️ Web App Pages

The web app includes **95+ pages** for market data, portfolio management, AI tools, and more:

**Page Breakdown:** 52 server components + 43 client components across 14 major categories.

### Market Data

| Page                 | Description                                       |
| -------------------- | ------------------------------------------------- |
| `/markets`           | Market overview with global stats and coin tables |
| `/markets/gainers`   | 🆕 Top gaining coins (24h)                        |
| `/markets/losers`    | 🆕 Top losing coins (24h)                         |
| `/markets/trending`  | 🆕 Trending coins by volume & social              |
| `/markets/new`       | 🆕 Newly listed cryptocurrencies                  |
| `/markets/exchanges` | 🆕 Exchange directory with volumes                |
| `/trending`          | Trending cryptocurrencies                         |
| `/movers`            | Top gainers and losers (24h)                      |

### Market Tools

| Page            | Description                              |
| --------------- | ---------------------------------------- |
| `/calculator`   | Crypto calculator with conversion & P/L  |
| `/gas`          | Ethereum gas tracker with cost estimates |
| `/heatmap`      | Market heatmap visualization             |
| `/screener`     | Advanced coin screener with filters      |
| `/correlation`  | Price correlation matrix (7/30/90 days)  |
| `/dominance`    | Market cap dominance chart               |
| `/liquidations` | Real-time liquidations feed              |
| `/buzz`         | Social buzz & trending sentiment         |
| `/charts`       | TradingView-style charts                 |

### Trading Tools

| Page         | Description                        |
| ------------ | ---------------------------------- |
| `/arbitrage` | Cross-exchange arbitrage scanner   |
| `/options`   | Options flow & analytics dashboard |
| `/orderbook` | Multi-exchange order book view     |

### Coin Details

| Page             | Description                                      |
| ---------------- | ------------------------------------------------ |
| `/coin/[coinId]` | Comprehensive coin page with charts, stats, news |
| `/compare`       | Compare multiple cryptocurrencies side-by-side   |

### AI & Analytics

| Page                   | Description                       |
| ---------------------- | --------------------------------- |
| `/ai/oracle`           | The Oracle - AI crypto assistant  |
| `/ai/brief`            | AI-generated market brief         |
| `/ai/debate`           | AI Bull vs Bear debate generator  |
| `/ai/counter`          | AI counter-argument generator     |
| `/sentiment`           | Sentiment analysis dashboard      |
| `/analytics`           | News analytics overview           |
| `/analytics/headlines` | 🆕 Headline tracking & mutations  |
| `/predictions`         | Prediction tracking & leaderboard |
| `/digest`              | AI-generated daily digest         |

### Social & Influencers

| Page           | Description                        |
| -------------- | ---------------------------------- |
| `/influencers` | Influencer reliability leaderboard |
| `/whales`      | Whale alerts & tracking            |
| `/buzz`        | Social buzz & trending sentiment   |

### Research & Intelligence

| Page               | Description                       |
| ------------------ | --------------------------------- |
| `/regulatory`      | Regulatory intelligence dashboard |
| `/coverage-gap`    | Coverage gap analysis             |
| `/protocol-health` | DeFi protocol health monitor      |

### User Features

| Page         | Description                                 |
| ------------ | ------------------------------------------- |
| `/portfolio` | Portfolio management with holdings tracking |
| `/watchlist` | Watchlist with price alerts                 |
| `/bookmarks` | 🆕 Saved articles & reading list            |
| `/settings`  | User preferences and notifications          |
| `/install`   | 🆕 PWA installation guide                   |

### Content

| Page                   | Description                     |
| ---------------------- | ------------------------------- |
| `/search`              | Search news articles            |
| `/topic/[topic]`       | Topic-specific news             |
| `/topics`              | Browse all topics               |
| `/source/[source]`     | Source-specific news            |
| `/sources`             | All news sources                |
| `/category/[category]` | Category-specific news          |
| `/article/[id]`        | Individual article view         |
| `/read/[id]`           | 🆕 Distraction-free reader mode |
| `/share/[id]`          | 🆕 Share & embed articles       |
| `/defi`                | DeFi news section               |
| `/blog`                | Blog index (146 posts)          |
| `/blog/[slug]`         | Individual blog post            |
| `/blog/category/[category]` | Posts in one category      |

### Administration

| Page          | Description                       |
| ------------- | --------------------------------- |
| `/billing`    | Billing & subscription management |
| `/pricing`    | Pricing plans                     |
| `/developers` | Developer documentation           |


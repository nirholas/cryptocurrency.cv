# 📖 Documentation Index

Welcome to the **Free Crypto News** documentation — the open-source, no-auth crypto news API and aggregator.

Whether you're a **developer** building a trading bot, a **researcher** analyzing market sentiment, or a **trader** who wants a personalized news feed, this documentation will help you get started quickly.

---

## What Is Free Crypto News?

Free Crypto News is a **100% free, open-source** cryptocurrency news API and web application. It aggregates real-time news from 200+ professional sources (CoinDesk, The Block, Decrypt, Cointelegraph, and more), enriches articles with AI-powered sentiment analysis and summaries, and exposes everything via a REST API — **no API key required**.

**What you can build with it:**

- 🤖 **Chat bots** — Discord, Slack, or Telegram bots that post crypto news
- 📊 **Trading dashboards** — Combine news sentiment with market data
- 🔬 **Research tools** — Analyze media coverage and market narratives
- 📱 **Mobile apps** — Real-time news feeds with push notifications
- 🧠 **AI agents** — Feed crypto news into LangChain, ChatGPT, or Claude

---

## 🧭 Choose Your Path

| I want to... | Start here |
|--------------|------------|
| **Call the API right now** | [Quick Start →](./QUICKSTART.md) |
| **Read the full API reference** | [API Reference →](./API.md) |
| **Browse features as a user** | [User Guide →](./USER-GUIDE.md) |
| **Set up a dev environment** | [Developer Guide →](./DEVELOPER-GUIDE.md) |
| **Use an SDK** | [SDKs →](./sdks/index.md) |
| **Integrate with AI tools** | [Integrations →](./integrations/index.md) |

---

## Getting Started

| Guide | Description |
|-------|-------------|
| [Quick Start](./QUICKSTART.md) | Get up and running in 5 minutes |
| [API Reference](./API.md) | Complete API documentation (180+ endpoints) |
| [User Guide](./USER-GUIDE.md) | Guide for web app end users |
| [Developer Guide](./DEVELOPER-GUIDE.md) | Guide for developers and contributors |
| [Examples](./EXAMPLES.md) | Code examples in Python, JS, Go, cURL |

---

## Features

| Guide | Description |
|-------|-------------|
| [All Features](./FEATURES.md) | Complete feature catalog |
| [AI Features](./AI-FEATURES.md) | Summarization, sentiment, fact-checking, RAG |
| [Advanced Features](./ADVANCED-FEATURES.md) | Terminal CLI, trading signals, Farcaster Frames, oracles |
| [Real-Time](./REALTIME.md) | WebSocket, SSE, push notifications |


---

## Tutorials

Step-by-step guides for common use cases:

| Tutorial | Description |
|----------|-------------|
| [News Basics](./tutorials/news-basics.md) | Fetching and filtering news |
| [Search & Filtering](./tutorials/search-filtering.md) | Advanced search techniques |
| [AI Features](./tutorials/ai-features.md) | Using AI-powered endpoints |
| [Market Data](./tutorials/market-data.md) | Prices, charts, and market metrics |
| [Real-Time Streaming](./tutorials/realtime-sse.md) | SSE and WebSocket feeds |
| [Webhooks](./tutorials/webhooks-integrations.md) | Setting up webhook notifications |
| [All Tutorials →](./tutorials/index.md) | Browse all 17+ tutorials |

---

## SDKs & Integrations

### SDKs

| SDK | Install |
|-----|---------|
| [Python](./sdks/python.md) | `pip install free-crypto-news` |
| [JavaScript](./sdks/javascript.md) | `npm install free-crypto-news` |
| [TypeScript](./sdks/typescript.md) | Full type definitions included |
| [React](./sdks/react.md) | Hooks & components |
| [Go](./sdks/go.md) | `go get github.com/nirholas/free-crypto-news/sdk/go` |
| [PHP](./sdks/php.md) | Composer package |
| [Ruby](./sdks/ruby.md) | Gem package |
| [Rust](./sdks/rust.md) | Cargo crate || [Java](./sdks/java.md) | Maven / Gradle |
| [Kotlin](./sdks/kotlin.md) | Kotlin Multiplatform |
| [Swift](./sdks/swift.md) | Swift Package Manager |
| [C#](./sdks/csharp.md) | NuGet package |
| [R](./sdks/r.md) | R package |
### Integrations

| Integration | Description |
|-------------|-------------|
| [Claude MCP](./integrations/mcp.md) | Use as a Claude MCP server |
| [ChatGPT Plugin](./integrations/chatgpt.md) | ChatGPT actions & plugins |
| [GitHub Copilot](./integrations/copilot-extension.md) | Copilot extension |
| [CLI](./integrations/cli.md) | Command-line interface |
| [Alfred](./integrations/alfred.md) | macOS Alfred workflow |
| [Raycast](./integrations/raycast.md) | Raycast extension |
| [Widgets](./integrations/widgets.md) | Embeddable HTML widgets |
| [Postman](./integrations/postman.md) | Postman collection |
| [All Integrations →](./integrations/index.md) | Browse all integrations |

### Platform Examples

| Platform | Description |
|----------|-------------|
| [Discord Bot](./examples/discord.md) | Build a Discord news bot |
| [Slack Bot](./examples/slack.md) | Build a Slack news bot |
| [Telegram Bot](./examples/telegram.md) | Build a Telegram news bot |
| [LangChain](./examples/langchain.md) | Use with LangChain agents |
| [React App](./examples/react.md) | Build a React news app |
| [All Examples →](./examples/index.md) | Browse all platform examples |

---

## Development

| Guide | Description |
|-------|-------------|
| [Architecture](./ARCHITECTURE.md) | System design, data flow, storage, security |
| [Developer Guide](./DEVELOPER-GUIDE.md) | Setup, components, API routes, debugging |
| [Components](./COMPONENTS.md) | React component documentation |
| [Testing](./TESTING.md) | Unit, integration, and E2E tests |
| [Database](./DATABASE.md) | Storage backends, Drizzle ORM, migrations |
| [Deployment](./DEPLOYMENT.md) | Deploy your own instance (Vercel, Docker, Railway) |
| [Scalability](./SCALABILITY.md) | Edge runtime, caching tiers, load handling |
| [Data Sources](./DATA-SOURCES-RUNBOOK.md) | Adding and managing RSS/Atom news sources |
| [Hooks](./HOOKS.md) | Custom React hooks reference |
| [SEO](./SEO.md) | Search engine optimization configuration |
| [Internationalization](./INTERNATIONALIZATION.md) | i18n setup and translation guide |

---

## Other Resources

| Resource | Description |
|----------|-------------|
| [Contributing](./CONTRIBUTING.md) | How to contribute |
| [Security](./SECURITY.md) | Security policy, architecture, and reporting |
| [Changelog](../CHANGELOG.md) | Version history |
| [License](../LICENSE) | MIT License |
| [Postman Collection](../postman/) | Import into Postman |
| [OpenAPI Spec](../chatgpt/openapi.yaml) | OpenAPI / Swagger definition |
| [RAG](./RAG.md) | Retrieval-Augmented Generation pipeline |
| [Premium](./PREMIUM.md) | Premium tier features and pricing |
| [Well-Known](./WELL-KNOWN.md) | `.well-known` endpoint documentation |
| [x402](./X402.md) | Crypto-native HTTP 402 payments |

---

## Quick Links

- **Live API:** https://cryptocurrency.cv
- **GitHub:** https://github.com/nirholas/free-crypto-news
- **Discussions:** https://github.com/nirholas/free-crypto-news/discussions
- **Issues:** https://github.com/nirholas/free-crypto-news/issues

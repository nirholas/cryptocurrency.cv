# GitHub Copilot Extension

Get real-time crypto news, market sentiment, and whale alerts directly inside **GitHub Copilot Chat** — no browser, no tab-switching.

## Overview

The `@cryptonews` Copilot agent is a GitHub Copilot Chat extension that connects Copilot to the Free Crypto News API. Ask it anything about crypto markets in plain English, or use slash commands for quick structured output.

## Installation

The extension is **not on the VS Code Marketplace yet**. Build and install the
`.vsix` from a clone:

```bash
git clone https://github.com/nirholas/cryptocurrency.cv.git
cd cryptocurrency.cv/copilot-extension
npm install
npm run compile
npx vsce package                       # produces crypto-news-copilot-<version>.vsix
code --install-extension crypto-news-copilot-*.vsix
```

Then:

1. Ensure GitHub Copilot Chat is enabled in your workspace
2. Reload the VS Code window
3. Type `@cryptonews` in any Copilot Chat window to activate

`@cryptonews` is the Copilot Chat participant handle declared by the extension.
It is not an npm package.

## Commands

| Command | What it returns |
|---------|-----------------|
| `@cryptonews /breaking` | Latest breaking headlines across all sources |
| `@cryptonews /market` | Bull/bear sentiment summary with key drivers |
| `@cryptonews /prices` | Live prices for BTC, ETH, and top altcoins |
| `@cryptonews /feargreed` | Fear & Greed Index with historical context |
| `@cryptonews /whale` | Large on-chain transaction alerts |
| `@cryptonews /trending` | Trending topics and narratives in crypto |

## Natural Language Queries

You can also ask free-form questions:

```
@cryptonews what's happening with Bitcoin today?
@cryptonews latest Ethereum Layer 2 news
@cryptonews any DeFi exploits this week?
@cryptonews summarise the top 5 stories from the last hour
```

## Source Code

The extension source lives in [`copilot-extension/`](https://github.com/nirholas/cryptocurrency.cv/tree/main/copilot-extension) and is built with TypeScript.

```
copilot-extension/
├── src/
│   └── index.ts      # Agent handler — routes commands to the API
├── package.json
├── tsconfig.json
└── README.md
```

## Configuration

The extension uses `https://cryptocurrency.cv` as the API host by default — no API key required.

## Related

- [MCP Server](mcp.md) — Claude / AI assistant integration
- [ChatGPT Plugin](chatgpt.md) — ChatGPT integration
- [AI Features](../AI-FEATURES.md) — Full AI capability overview

# Crypto Vision API Reference

> Auto-generated from endpoint metadata. Do not edit manually.
> Run: `node scripts/generate-api-docs.js`
>
> Generated: 2026-03-27T06:21:34.424Z
> Total endpoints: 353

## Overview

This API provides 353 endpoints across 30 categories covering cryptocurrency news, market data, DeFi, derivatives, on-chain analytics, AI analysis, social intelligence, NFTs, multi-chain data, and premium features.

**Base URL:** `https://cryptocurrency.cv`

**Authentication:** All endpoints require either an API key (`X-API-Key` header) or x402 micropayment (`X-PAYMENT` header).

---

## Table of Contents

- [AI Analysis](#ai-analysis) (52 endpoints)
- [API v1](#api-v1) (5 endpoints)
- [Analytics & Intelligence](#analytics-intelligence) (17 endpoints)
- [Aptos](#aptos) (4 endpoints)
- [Bitcoin](#bitcoin) (8 endpoints)
- [Data Export](#data-export) (4 endpoints)
- [DeFi](#defi) (20 endpoints)
- [Gaming & Metaverse](#gaming-metaverse) (3 endpoints)
- [Layer 2](#layer-2) (4 endpoints)
- [Macro & Traditional](#macro-traditional) (6 endpoints)
- [Market Data](#market-data) (51 endpoints)
- [NFTs](#nfts) (6 endpoints)
- [News & Content](#news-content) (31 endpoints)
- [On-Chain & Whales](#on-chain-whales) (22 endpoints)
- [Oracles](#oracles) (3 endpoints)
- [Other](#other) (23 endpoints)
- [Portfolio & Alerts](#portfolio-alerts) (15 endpoints)
- [Premium](#premium) (1 endpoints)
- [Premium AI](#premium-ai) (5 endpoints)
- [Premium Alerts](#premium-alerts) (2 endpoints)
- [Premium Analytics](#premium-analytics) (3 endpoints)
- [Premium Data](#premium-data) (1 endpoints)
- [Premium DeFi](#premium-defi) (1 endpoints)
- [Premium Market](#premium-market) (2 endpoints)
- [Premium Whales](#premium-whales) (3 endpoints)
- [Social Intelligence](#social-intelligence) (14 endpoints)
- [Solana](#solana) (9 endpoints)
- [Stablecoins](#stablecoins) (5 endpoints)
- [Sui](#sui) (4 endpoints)
- [Trading & Derivatives](#trading-derivatives) (29 endpoints)

---

## AI Analysis

### `POST /api/ai/blog-generator`
### `GET /api/ai/blog-generator`

AI blog post generator from clustered crypto news topics

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `topics` | number | No | `3` | Number of topics or comma-separated topic list |
| `days` | number | No | `7` | Number of days of historical data |
| `commit` | string | No | — | Commit changes (true/false) |

---

### `GET /api/ai/brief`

Generate a daily AI-powered crypto news brief

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `date` | string | No | — | Date in YYYY-MM-DD format |
| `format` | string | No | `full` | Response format |

---

### `GET /api/ai/correlation`

AI-driven correlation analysis between crypto assets

**Price:** `$0.001/request`

---

### `POST /api/ai/counter`
### `GET /api/ai/counter`

AI counter-argument generation for crypto narratives

**Price:** `$0.001/request`

---

### `GET /api/ai/cross-lingual`

Cross-lingual crypto news analysis and translation

**Price:** `$0.001/request`

---

### `POST /api/ai/debate`
### `GET /api/ai/debate`

AI-powered debate between bull and bear perspectives

**Price:** `$0.001/request`

---

### `GET /api/ai/digest`

AI-generated daily market digest with streaming

**Price:** `$0.001/request`
  
**Type:** Server-Sent Events (streaming)

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `topic` | string | No | — | Topic or subject to analyze |
| `coins` | string | No | — | Comma-separated cryptocurrency IDs |
| `limit` | number | No | `60` | Maximum number of results to return |

---

### `POST /api/ai/entities`
### `GET /api/ai/entities`

Extract and analyze named entities from crypto news

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | number | No | — | Filter by text |
| `types` | string | No | — | Filter by types |

---

### `GET /api/ai/entities/extract`
### `POST /api/ai/entities/extract`

Extract named entities from provided text

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | No | — | API action to perform |
| `name` | string | Yes | — | Filter by name |
| `context` | string | No | — | Filter by context |

---

### `GET /api/ai/explain`

AI explanation of complex crypto concepts and events

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `topic` | string | No | — | Topic or subject to analyze |
| `includePrice` | string | No | — | Filter by includePrice |

---

### `GET /api/ai/flash-briefing`

Flash briefing format for voice assistants

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `stories` | number | No | `5` | Filter by stories |

---

### `GET /api/ai/narratives`

AI-identified market narratives and themes

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `predict` | string | No | — | Filter by predict |

---

### `POST /api/ai/oracle`
### `GET /api/ai/oracle`

AI oracle for crypto market predictions

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | No | — | Search query string |

---

### `POST /api/ai/portfolio-news`
### `GET /api/ai/portfolio-news`

AI-curated news relevant to a specific portfolio

**Price:** `$0.001/request`

---

### `POST /api/ai/relationships`

AI-detected relationships between crypto entities and events

**Price:** `$0.001/request`

---

### `GET /api/ai/research`

Deep AI research reports on crypto topics

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `topic` | string | No | — | Topic or subject to analyze |
| `mode` | string | No | — | Filter by mode |
| `compare` | string | No | — | Filter by compare |
| `contrarian` | string | No | — | Filter by contrarian |

---

### `POST /api/ai/social`
### `GET /api/ai/social`

AI analysis of social media crypto sentiment

**Price:** `$0.001/request`

---

### `GET /api/ai/source-quality`
### `POST /api/ai/source-quality`

AI assessment of news source credibility and quality

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `source` | string | No | — | Filter by news source |
| `category` | string | No | — | Filter by category |
| `clickbait` | string | No | — | Filter by clickbait |

---

### `POST /api/ai/summarize`
### `GET /api/ai/summarize`

AI-powered article summarization

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | No | — | Filter by url |
| `text` | string | No | — | Filter by text |
| `type` | string | No | — | Data or content type |

---

### `POST /api/ai/summarize/stream`

Streaming AI article summarization

**Price:** `$0.001/request`
  
**Type:** Server-Sent Events (streaming)

---

### `GET /api/ai/synthesize`
### `POST /api/ai/synthesize`

AI synthesis of multiple news sources into unified report

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `5` | Maximum number of results to return |
| `threshold` | number | No | `0.4` | Filter by threshold |

---

### `GET /api/analyze`

General-purpose crypto analysis endpoint

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `20` | Maximum number of results to return |
| `topic` | string | No | — | Topic or subject to analyze |
| `sentiment` | string | No | — | Filter by sentiment |

---

### `GET /api/ask`

Ask natural language questions about crypto markets

**Price:** `$0.001/request`
  
**Type:** Server-Sent Events (streaming)

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | No | — | Search query string |
| `stream` | string | No | — | Filter by stream |

---

### `POST /api/classify`
### `GET /api/classify`

Classify crypto news articles by category and relevance

**Price:** `$0.001/request`

---

### `GET /api/clickbait`

Detect clickbait in crypto news headlines

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `10` | Maximum number of results to return |
| `threshold` | number | No | `0` | Filter by threshold |

---

### `POST /api/detect/ai-content`
### `GET /api/detect/ai-content`

Detect AI-generated content in crypto news

**Price:** `$0.001/request`

---

### `GET /api/digest`

Daily crypto market digest

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `24h` | Time period for data aggregation |
| `format` | string | No | `full` | Response format |

---

### `GET /api/factcheck`

AI fact-checking of crypto claims and news

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `15` | Maximum number of results to return |
| `type` | string | No | — | Data or content type |
| `confidence` | string | No | — | Filter by confidence |

---

### `GET /api/forecast`
### `POST /api/forecast`

AI-powered price forecasting for cryptocurrencies

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `asset` | string | No | — | Asset identifier (e.g., BTC, ETH) |
| `horizon` | string | No | `1d` | Filter by horizon |
| `action` | string | No | — | API action to perform |

---

### `GET /api/narratives`

Current market narratives and trending themes

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `40` | Maximum number of results to return |
| `emerging` | string | No | — | Filter by emerging |

---

### `POST /api/rag/ask`

Ask questions with AI-powered retrieval-augmented generation

**Price:** `$0.001/request`

---

### `POST /api/rag/batch`

Batch RAG queries for multiple questions

**Price:** `$0.001/request`

---

### `GET /api/rag/eval`
### `POST /api/rag/eval`

Evaluate RAG system quality and relevance

**Price:** `$0.001/request`

---

### `POST /api/rag/feedback`
### `GET /api/rag/feedback`

Submit feedback on RAG response quality

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `alerts` | string | No | — | Filter by alerts |
| `all` | string | No | — | Filter by all |
| `variant` | string | No | — | Filter by variant |
| `compare` | string | No | — | Filter by compare |
| `export` | string | No | — | Filter by export |
| `includeNegatives` | string | No | — | Filter by includeNegatives |
| `limit` | number | No | `5000` | Maximum number of results to return |
| `ack` | string | No | — | Filter by ack |

---

### `POST /api/rag/personalization`
### `GET /api/rag/personalization`
### `DELETE /api/rag/personalization`

Personalized RAG based on user preferences

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `userId` | string | No | — | User identifier |
| `export` | string | No | — | Filter by export |
| `privacy` | string | No | — | Filter by privacy |

---

### `POST /api/rag/search`

RAG vector search without LLM generation

**Price:** `$0.001/request`

---

### `POST /api/rag/stream`

Streaming RAG responses via Server-Sent Events

**Price:** `$0.001/request`
  
**Type:** Server-Sent Events (streaming)

---

### `POST /api/rag/timeline`

Timeline-aware RAG for chronological crypto analysis

**Price:** `$0.001/request`

---

### `GET /api/sentiment`

Market sentiment analysis and indicators

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `20` | Maximum number of results to return |
| `asset` | string | No | — | Asset identifier (e.g., BTC, ETH) |

---

### `GET /api/social/sentiment`

Aggregated social media sentiment analysis

**Price:** `$0.001/request`

---

### `GET /api/social/sentiment/market`

Market-wide social sentiment overview

**Price:** `$0.001/request`

---

### `GET /api/social/x/sentiment`

X/Twitter-specific crypto sentiment analysis

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `list` | string | No | `default` | Filter by list |
| `refresh` | string | No | — | Filter by refresh |
| `tweets` | number | No | `10` | Filter by tweets |

---

### `GET /api/summarize`

Summarize crypto news articles

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `5` | Maximum number of results to return |
| `source` | string | No | — | Filter by news source |
| `style` | string | No | `brief` | Output style or format |

---

### `GET /api/v1/ai/explain`

AI explanation of crypto concepts

**Price:** `$0.003/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `term` | string | No | — | Filter by term |
| `q` | string | No | — | Search query string |
| `level` | string | No | `beginner` | Filter by level |

---

### `GET /api/v1/ai/research`

AI deep research on crypto topics

**Price:** `$0.01/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `topic` | string | No | — | Topic or subject to analyze |
| `q` | string | No | — | Search query string |
| `depth` | string | No | `standard` | Filter by depth |

---

### `GET /api/v1/ask`

Ask natural language questions about crypto

**Price:** `$0.005/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | No | — | Search query string |
| `question` | string | No | — | Filter by question |
| `context_size` | number | No | `20` | Filter by context size |

---

### `GET /api/v1/classify`

Classify text or articles by crypto topic

**Price:** `$0.002/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `10` | Maximum number of results to return |
| `source` | string | No | — | Filter by news source |

---

### `GET /api/v1/digest`

AI-generated market digest

**Price:** `$0.005/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `50` | Maximum number of results to return |

---

### `GET /api/v1/forecast`

AI price forecasting

**Price:** `$0.005/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `asset` | string | No | — | Asset identifier (e.g., BTC, ETH) |
| `horizon` | string | No | `1d` | Filter by horizon |
| `action` | string | No | — | API action to perform |

---

### `GET /api/v1/narratives`

AI-identified market narratives

**Price:** `$0.005/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `40` | Maximum number of results to return |
| `emerging` | string | No | — | Filter by emerging |

---

### `GET /api/v1/sentiment`

AI sentiment analysis for crypto assets

**Price:** `$0.005/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `20` | Maximum number of results to return |
| `asset` | string | No | — | Asset identifier (e.g., BTC, ETH) |

---

### `GET /api/v1/summarize`

AI article summarization

**Price:** `$0.003/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `10` | Maximum number of results to return |
| `source` | string | No | — | Filter by news source |
| `style` | string | No | `brief` | Output style or format |

---

## API v1

### `GET /api/v1/assets`

Cryptocurrency asset listings and metadata

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `id` | string | No | — | Unique identifier |
| `limit` | number | No | `100` | Maximum number of results to return |

---

### `GET /api/v1/fundamentals`

Crypto project fundamentals and metrics

**Price:** `$0.003/request`

---

### `GET /api/v1/system/status`

API system health and status

**Price:** `$0.001/request`

---

### `GET /api/v1/usage`

API usage statistics for your key

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `api_key` | string | No | — | Filter by api key |

---

### `GET /api/v1/x402`

x402 micropayment protocol info and status

**Price:** `$0.001/request`

---

## Analytics & Intelligence

### `GET /api/analytics/anomalies`

Detect anomalies in news and market data patterns

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `hours` | number | No | `24` | Filter by hours |
| `severity` | string | No | — | Filter by severity |

---

### `GET /api/analytics/causality`
### `POST /api/analytics/causality`

Causal relationship analysis between events

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `eventId` | string | No | — | Filter by eventId |
| `type` | string | No | — | Data or content type |
| `asset` | string | No | — | Asset identifier (e.g., BTC, ETH) |
| `limit` | number | No | `50` | Maximum number of results to return |

---

### `GET /api/analytics/credibility`

News source credibility scoring and analysis

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `source` | string | No | — | Filter by news source |
| `sortBy` | string | No | `score` | Filter by sortBy |

---

### `POST /api/analytics/events`
### `GET /api/analytics/events`

Event detection and impact analysis

**Price:** `$0.001/request`

---

### `GET /api/analytics/forensics`
### `POST /api/analytics/forensics`

News forensics - coordination detection and origin tracing

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | No | `report` | API action to perform |
| `source` | string | No | — | Filter by news source |
| `article` | string | No | — | Filter by article |

---

### `GET /api/analytics/gaps`

Coverage gap detection in crypto news

**Price:** `$0.001/request`

---

### `GET /api/analytics/headlines`

Headline analytics and trend detection

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `hours` | number | No | `24` | Filter by hours |
| `changesOnly` | string | No | — | Filter by changesOnly |

---

### `GET /api/analytics/usage`

API usage analytics and statistics

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `key_prefix` | string | No | — | Filter by key prefix |
| `key_id` | string | No | — | Filter by key id |
| `days` | number | No | `30` | Number of days of historical data |
| `api_key` | string | No | — | Filter by api key |

---

### `GET /api/anomalies`
### `POST /api/anomalies`

Anomaly detection across market and news data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | No | — | API action to perform |
| `limit` | number | No | `50` | Maximum number of results to return |
| `signal` | string | No | — | Filter by signal |
| `severity` | string | No | — | Filter by severity |
| `since` | string | No | — | Start timestamp or date |

---

### `GET /api/citations`
### `POST /api/citations`

Citation verification and source attribution

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | No | `stats` | API action to perform |
| `year` | number | No | — | Filter by year |
| `keyword` | string | No | — | Filter by keyword |
| `author` | string | No | — | Filter by author |
| `limit` | number | No | `50` | Maximum number of results to return |
| `id` | string | No | — | Unique identifier |
| `name` | string | No | — | Filter by name |
| `min` | number | No | `2` | Filter by min |
| `window` | number | No | `3` | Filter by window |
| `from` | string | No | — | Start date (ISO 8601 or YYYY-MM-DD) |
| `to` | string | No | — | End date (ISO 8601 or YYYY-MM-DD) |
| `format` | string | No | `bibtex` | Response format |
| `ids` | string | No | — | Comma-separated IDs |

---

### `POST /api/claims`
### `GET /api/claims`

Fact-checkable claims extracted from crypto news

**Price:** `$0.001/request`

---

### `GET /api/coverage-gap`

Identify underreported crypto stories and events

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | No | `report` | API action to perform |
| `period` | string | No | `24h` | Time period for data aggregation |
| `topic` | string | No | — | Topic or subject to analyze |
| `severity` | string | No | — | Filter by severity |

---

### `GET /api/entities`

Named entity database for crypto organizations and people

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `30` | Maximum number of results to return |
| `type` | string | No | — | Data or content type |
| `min_mentions` | number | No | `1` | Filter by min mentions |

---

### `GET /api/events`

Crypto market events and calendar

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category` | string | No | — | Filter by category |
| `importance` | string | No | — | Filter by importance |
| `limit` | number | No | `50` | Maximum number of results to return |

---

### `GET /api/knowledge-graph`
### `POST /api/knowledge-graph`

Crypto knowledge graph of entities, events, and relationships

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `entity` | string | No | — | Filter by entity |
| `type` | string | No | — | Data or content type |
| `depth` | number | No | — | Filter by depth |
| `minMentions` | number | No | — | Filter by minMentions |
| `minWeight` | number | No | — | Filter by minWeight |

---

### `GET /api/relationships`

Entity relationship mapping in crypto ecosystem

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `20` | Maximum number of results to return |
| `actor_type` | string | No | — | Filter by actor type |
| `action` | string | No | — | API action to perform |
| `sentiment` | string | No | — | Filter by sentiment |

---

### `GET /api/v1/knowledge-graph`

Crypto entity knowledge graph

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `stats` | string | No | — | Filter by stats |
| `from` | string | No | — | Start date (ISO 8601 or YYYY-MM-DD) |
| `to` | string | No | — | End date (ISO 8601 or YYYY-MM-DD) |
| `entity` | string | No | — | Filter by entity |
| `impact` | string | No | — | Filter by impact |
| `hops` | number | No | `2` | Filter by hops |
| `q` | string | No | — | Search query string |
| `search` | number | No | — | Filter by search |
| `format` | string | No | `d3` | Response format |

---

## Aptos

### `GET /api/aptos`

Aptos blockchain overview and statistics

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | No | — | Wallet or contract address |
| `tx` | string | No | — | Filter by tx |
| `block` | string | No | — | Filter by block |
| `view` | string | No | — | Filter by view |
| `with_transactions` | string | No | — | Filter by with transactions |
| `limit` | number | No | `25` | Maximum number of results to return |
| `start` | string | No | — | Start position for pagination |

---

### `GET /api/aptos/events`

Aptos blockchain event data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | number | No | — | Wallet or contract address |
| `limit` | number | No | `25` | Maximum number of results to return |
| `start` | number | No | — | Start position for pagination |
| `handle` | string | No | — | Filter by handle |
| `field` | string | No | — | Filter by field |
| `creation_number` | string | No | — | Filter by creation number |

---

### `GET /api/aptos/resources`

Aptos account resources and state

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | No | — | Wallet or contract address |
| `type` | string | No | — | Data or content type |

---

### `GET /api/aptos/transactions`

Aptos transaction history and details

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | No | — | Wallet or contract address |
| `hash` | string | No | — | Transaction hash |
| `limit` | number | No | `25` | Maximum number of results to return |
| `start` | string | No | — | Start position for pagination |

---

## Bitcoin

### `GET /api/bitcoin`

Bitcoin network overview and market data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `10` | Maximum number of results to return |
| `lang` | string | No | `en` | Language code (e.g., en, es, zh) |

---

### `GET /api/bitcoin/block-height`

Current Bitcoin block height

**Price:** `$0.001/request`

---

### `GET /api/bitcoin/blocks`

Recent Bitcoin block data and details

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `start_height` | string | No | — | Starting block height |

---

### `GET /api/bitcoin/difficulty`

Bitcoin mining difficulty and adjustment data

**Price:** `$0.001/request`

---

### `GET /api/bitcoin/mempool/blocks`

Bitcoin mempool projected blocks

**Price:** `$0.001/request`

---

### `GET /api/bitcoin/mempool/fees`

Bitcoin mempool fee estimates

**Price:** `$0.001/request`

---

### `GET /api/bitcoin/mempool/info`

Bitcoin mempool size and transaction count

**Price:** `$0.001/request`

---

### `GET /api/v1/bitcoin`

Bitcoin network data and statistics

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `10` | Maximum number of results to return |
| `lang` | string | No | `en` | Language code (e.g., en, es, zh) |

---

## Data Export

### `GET /api/export`
### `POST /api/export`

Export market, news, and analytics data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | string | No | `news` | Data or content type |
| `format` | string | No | `json` | Response format |
| `limit` | number | No | `100` | Maximum number of results to return |
| `from` | string | No | — | Start date (ISO 8601 or YYYY-MM-DD) |
| `to` | string | No | — | End date (ISO 8601 or YYYY-MM-DD) |
| `download` | string | No | — | Set to true for file download response |

---

### `GET /api/export/jobs`

Check status of async export jobs

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `status` | string | No | — | Filter by status |
| `cleanup` | string | No | — | Filter by cleanup |
| `maxAge` | number | No | `3600000` | Filter by maxAge |

---

### `GET /api/exports`
### `POST /api/exports`

Manage and list data exports

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `schema` | string | No | — | Filter by schema |
| `archives` | string | No | — | Filter by archives |

---

### `GET /api/v1/export`

Bulk data export in JSON or CSV format

**Price:** `$0.01/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `format` | string | No | `json` | Response format |
| `type` | string | No | `coins` | Data or content type |
| `limit` | number | No | `100` | Maximum number of results to return |

---

## DeFi

### `GET /api/bridges`

Cross-chain bridge volume and activity data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `bridgeId` | number | No | — | Filter by bridgeId |

---

### `GET /api/defi`

DeFi protocol overview and aggregate statistics

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `10` | Maximum number of results to return |
| `lang` | string | No | `en` | Language code (e.g., en, es, zh) |

---

### `GET /api/defi/bridges`

DeFi bridge volumes and cross-chain flows

**Price:** `$0.001/request`

---

### `GET /api/defi/dex-volumes`

DEX trading volume across chains and protocols

**Price:** `$0.001/request`

---

### `GET /api/defi/stablecoins`

Stablecoin market data and supply statistics

**Price:** `$0.001/request`

---

### `GET /api/defi/summary`

DeFi market summary with key metrics

**Price:** `$0.001/request`

---

### `GET /api/defi/yields`

DeFi yield farming opportunities with filtering

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | string | No | — | Data or content type |
| `limit` | number | No | `20` | Maximum number of results to return |
| `chain` | string | No | — | Blockchain network (e.g., ethereum, solana) |
| `project` | string | No | — | DeFi project or protocol name |
| `stable` | string | No | — | Filter for stablecoin pools only |
| `min_tvl` | number | No | — | Minimum total value locked in USD |
| `min_apy` | number | No | — | Minimum annual percentage yield |
| `max_apy` | number | No | — | Maximum annual percentage yield |

---

### `GET /api/defi/yields/chains`

Yield data aggregated by blockchain

**Price:** `$0.001/request`

---

### `GET /api/defi/yields/median`

Median yield statistics across DeFi protocols

**Price:** `$0.001/request`

---

### `GET /api/defi/yields/projects`

Yield data aggregated by DeFi project

**Price:** `$0.001/request`

---

### `GET /api/defi/yields/search`

Search DeFi yield opportunities by criteria

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | No | — | Search query string |

---

### `GET /api/defi/yields/stablecoins`

Stablecoin-specific yield opportunities

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `min_tvl` | number | No | `1000000` | Minimum total value locked in USD |

---

### `GET /api/dex-volumes`

Decentralized exchange trading volumes

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `chain` | string | No | — | Blockchain network (e.g., ethereum, solana) |
| `top` | number | No | — | Filter by top |

---

### `GET /api/market/defi`

DeFi sector market overview

**Price:** `$0.001/request`

---

### `GET /api/solana/defi`

Solana DeFi protocol data and yields

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | No | — | Wallet or contract address |

---

### `GET /api/token-unlocks`

Upcoming token unlock schedules and amounts

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `impact` | string | No | — | Filter by impact |
| `symbol` | string | No | — | Trading symbol (e.g., BTC, ETH) |
| `limit` | number | No | `50` | Maximum number of results to return |

---

### `GET /api/unlocks`

Token unlock events and vesting schedules

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `10` | Maximum number of results to return |
| `project` | string | No | — | DeFi project or protocol name |
| `calendar` | string | No | — | Filter by calendar |

---

### `GET /api/v1/defi`

DeFi protocol data and statistics

**Price:** `$0.002/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `50` | Maximum number of results to return |
| `chain` | string | No | — | Blockchain network (e.g., ethereum, solana) |
| `category` | string | No | — | Filter by category |

---

### `GET /api/v1/dex`

DEX trading data and analytics

**Price:** `$0.002/request`

---

### `GET /api/yields`

DeFi yield farming opportunities

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `chain` | string | No | — | Blockchain network (e.g., ethereum, solana) |
| `limit` | number | No | `10` | Maximum number of results to return |

---

## Gaming & Metaverse

### `GET /api/gaming`

Blockchain gaming ecosystem overview

**Price:** `$0.001/request`

---

### `GET /api/gaming/chains`

Gaming activity by blockchain

**Price:** `$0.001/request`

---

### `GET /api/gaming/top`

Top blockchain games by activity and volume

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `25` | Maximum number of results to return |
| `sort` | string | No | `dau` | Sort field |
| `chain` | string | No | — | Blockchain network (e.g., ethereum, solana) |

---

## Layer 2

### `GET /api/l2`

Layer 2 ecosystem overview

**Price:** `$0.001/request`

---

### `GET /api/l2/activity`

Layer 2 transaction activity and growth metrics

**Price:** `$0.001/request`

---

### `GET /api/l2/projects`

Layer 2 project listings and comparisons

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | — | Maximum number of results to return |

---

### `GET /api/l2/risk`

Layer 2 risk assessment and security scores

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sort` | string | No | — | Sort field |
| `limit` | number | No | `20` | Maximum number of results to return |

---

## Macro & Traditional

### `GET /api/macro`

Macroeconomic overview relevant to crypto markets

**Price:** `$0.001/request`

---

### `GET /api/macro/correlations`

Crypto-macro correlation analysis

**Price:** `$0.001/request`

---

### `GET /api/macro/dxy`

US Dollar Index (DXY) data and crypto correlation

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `days` | number | No | `30` | Number of days of historical data |

---

### `GET /api/macro/fed`

Federal Reserve data, rates, and yield curves

**Price:** `$0.001/request`

---

### `GET /api/macro/indicators`

Key macroeconomic indicators

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `indicators` | string | No | — | Filter by indicators |
| `period` | string | No | `1d` | Time period for data aggregation |

---

### `GET /api/macro/risk-appetite`

Market risk appetite index combining macro and crypto signals

**Price:** `$0.001/request`

---

## Market Data

### `GET /api/charts`

Price chart data for cryptocurrencies

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `coin` | string | No | — | Cryptocurrency ID or symbol |
| `range` | string | No | `24h` | Filter by range |

---

### `GET /api/coincap`

CoinCap market data aggregation

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `100` | Maximum number of results to return |
| `search` | number | No | — | Filter by search |
| `offset` | number | No | `0` | Number of results to skip |

---

### `GET /api/coinmarketcap`

CoinMarketCap market data aggregation

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | No | `summary` | API action to perform |
| `limit` | number | No | `50` | Maximum number of results to return |
| `sort` | string | No | — | Sort field |
| `tag` | string | No | — | Filter by tag |
| `symbol` | string | Yes | — | Trading symbol (e.g., BTC, ETH) |
| `id` | string | Yes | — | Unique identifier |
| `category` | string | Yes | — | Filter by category |
| `period` | string | No | — | Time period for data aggregation |
| `q` | string | Yes | — | Search query string |

---

### `GET /api/coinpaprika`

CoinPaprika overview and market data

**Price:** `$0.001/request`

---

### `GET /api/coinpaprika/coins`

CoinPaprika coin listings and details

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | — | Maximum number of results to return |

---

### `GET /api/coinpaprika/exchanges`

CoinPaprika exchange data

**Price:** `$0.001/request`

---

### `GET /api/coinpaprika/search`

Search CoinPaprika for coins, exchanges, and people

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | No | — | Search query string |

---

### `GET /api/coinpaprika/tickers`

CoinPaprika ticker data with prices and volume

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `quotes` | string | No | `USD` | Filter by quotes |

---

### `GET /api/compare`

Compare multiple cryptocurrencies side by side

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `coins` | string | No | — | Comma-separated cryptocurrency IDs |

---

### `GET /api/cryptocompare`

CryptoCompare market data aggregation

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | No | `overview` | API action to perform |
| `fsyms` | string | No | — | Filter by fsyms |
| `tsyms` | string | No | — | Filter by tsyms |
| `fsym` | string | No | `BTC` | Filter by fsym |
| `tsym` | string | No | `USD` | Filter by tsym |
| `interval` | string | No | — | Data interval (e.g., hourly, daily) |
| `limit` | number | No | `100` | Maximum number of results to return |
| `exchange` | string | No | `coinbase` | Filter by exchange |
| `categories` | string | No | — | Filter by categories |
| `feeds` | string | No | — | Filter by feeds |
| `sort` | string | No | — | Sort field |
| `coinId` | number | No | `1182` | Cryptocurrency ID (e.g., bitcoin, ethereum) |

---

### `GET /api/cryptopanic`

CryptoPanic news feed aggregation

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | No | `dashboard` | API action to perform |
| `currencies` | string | No | — | Filter by currencies |
| `page` | number | No | `1` | Page number for pagination |
| `filter` | string | No | — | Filter by filter |
| `kind` | string | No | — | Filter by kind |
| `regions` | string | No | — | Filter by regions |
| `source` | string | No | — | Filter by news source |
| `limit` | number | No | `10` | Maximum number of results to return |
| `country` | string | No | — | Filter by country code |

---

### `GET /api/exchange-rates`

Fiat and crypto exchange rates

**Price:** `$0.001/request`

---

### `GET /api/exchange-rates/convert`

Currency conversion calculator

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `from` | string | No | — | Start date (ISO 8601 or YYYY-MM-DD) |
| `to` | string | No | — | End date (ISO 8601 or YYYY-MM-DD) |
| `amount` | number | No | `1` | Filter by amount |

---

### `GET /api/exchanges`

Cryptocurrency exchange listings and data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sort` | string | No | `trust` | Sort field |
| `limit` | number | No | `50` | Maximum number of results to return |

---

### `GET /api/fear-greed`

Crypto Fear & Greed Index with historical data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `days` | number | No | `30` | Number of days of historical data |

---

### `GET /api/gas`

Ethereum gas prices and network congestion

**Price:** `$0.001/request`

---

### `GET /api/gas/estimate`

Gas fee estimation for Ethereum and Bitcoin

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `network` | string | No | `ethereum` | Network name (e.g., ethereum, bitcoin) |

---

### `GET /api/gas/history`

Historical gas price data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `network` | string | No | `ethereum` | Network name (e.g., ethereum, bitcoin) |
| `days` | number | No | `7` | Number of days of historical data |

---

### `GET /api/geckoterminal`

GeckoTerminal DEX data aggregation

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `network` | string | No | `eth` | Network name (e.g., ethereum, bitcoin) |
| `type` | string | No | `trending` | Data or content type |
| `dex` | string | No | — | Filter by dex |

---

### `GET /api/global`

Global cryptocurrency market statistics

**Price:** `$0.001/request`

---

### `GET /api/market/coins`

Coin market data with advanced filtering

**Price:** `$0.001/request`

---

### `GET /api/market/compare`

Side-by-side coin comparison with market data

**Price:** `$0.001/request`

---

### `GET /api/market/dominance`

Bitcoin and altcoin market dominance data

**Price:** `$0.001/request`

---

### `GET /api/market/exchanges`

Exchange market data and rankings

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `per_page` | number | No | `100` | Results per page |
| `page` | number | No | `1` | Page number for pagination |

---

### `GET /api/market/gainers`

Top gaining cryptocurrencies by timeframe

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `10` | Maximum number of results to return |
| `timeframe` | string | No | `24h` | Time period (e.g., 1h, 24h, 7d, 30d) |

---

### `GET /api/market/global-defi`

Global DeFi market statistics

**Price:** `$0.001/request`

---

### `GET /api/market/heatmap`

Market heatmap data by sector and market cap

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `100` | Maximum number of results to return |

---

### `GET /api/market/losers`

Top losing cryptocurrencies by timeframe

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `10` | Maximum number of results to return |
| `timeframe` | string | No | `24h` | Time period (e.g., 1h, 24h, 7d, 30d) |

---

### `GET /api/market/movers`

Biggest market movers combining gainers and losers

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `5` | Maximum number of results to return |
| `timeframe` | string | No | `24h` | Time period (e.g., 1h, 24h, 7d, 30d) |

---

### `GET /api/market/orderbook`
### `POST /api/market/orderbook`

Order book depth data for trading pairs

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `symbol` | string | No | — | Trading symbol (e.g., BTC, ETH) |
| `action` | string | No | `aggregate` | API action to perform |
| `exchanges` | string | No | — | Filter by exchanges |
| `depth` | number | No | `25` | Filter by depth |
| `limit` | number | No | `20` | Maximum number of results to return |

---

### `GET /api/market/pumps`

Unusual price pump detection

**Price:** `$0.001/request`

---

### `GET /api/market/search`

Search for coins, exchanges, and tokens

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | No | — | Search query string |

---

### `GET /api/market/stream`

Real-time market data via Server-Sent Events

**Price:** `$0.001/request`
  
**Type:** Server-Sent Events (streaming)

---

### `GET /api/ohlc`

OHLC candlestick data for crypto trading pairs

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `coinId` | string | No | — | Cryptocurrency ID (e.g., bitcoin, ethereum) |
| `days` | number | No | — | Number of days of historical data |

---

### `GET /api/orderbook`

Order book depth and liquidity data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `symbol` | string | No | `BTC` | Trading symbol (e.g., BTC, ETH) |
| `market` | string | No | `spot` | Filter by market |
| `view` | string | No | `aggregated` | Filter by view |
| `exchanges` | string | No | — | Filter by exchanges |
| `orderSize` | number | No | — | Filter by orderSize |
| `side` | string | No | `buy` | Filter by side |
| `depth` | number | No | `20` | Filter by depth |

---

### `GET /api/orderbook/stream`

Real-time order book updates via Server-Sent Events

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `symbol` | string | No | — | Trading symbol (e.g., BTC, ETH) |

---

### `GET /api/prices`

Real-time cryptocurrency prices

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `coins` | string | No | — | Comma-separated cryptocurrency IDs |

---

### `GET /api/prices/stream`

Real-time price updates via Server-Sent Events

**Price:** `$0.001/request`
  
**Type:** Server-Sent Events (streaming)

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `symbols` | string | No | — | Comma-separated trading symbols |

---

### `GET /api/search`

Full-text search across news, articles, and data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `semantic` | string | No | — | Enable semantic search |

---

### `POST /api/search/semantic`

Semantic search using vector embeddings

**Price:** `$0.001/request`

---

### `GET /api/search/v2`
### `POST /api/search/v2`

Enhanced search with advanced filtering and relevance

**Price:** `$0.001/request`

---

### `GET /api/tokenterminal`

Token Terminal fundamental data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | No | `summary` | API action to perform |
| `protocol` | string | No | — | Filter by protocol |
| `limit` | number | No | — | Maximum number of results to return |

---

### `GET /api/v1/coins`

List all cryptocurrencies with market data, pagination, and sorting

**Price:** `$0.001/request`

---

### `GET /api/v1/exchanges`

Exchange listings and market data

**Price:** `$0.002/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | `1` | Page number for pagination |
| `per_page` | number | No | `50` | Results per page |

---

### `GET /api/v1/fear-greed`

Fear & Greed Index with historical trend

**Price:** `$0.002/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `days` | number | No | `30` | Number of days of historical data |

---

### `GET /api/v1/gas`

Gas price data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `network` | string | No | — | Network name (e.g., ethereum, bitcoin) |

---

### `GET /api/v1/global`

Global crypto market statistics

**Price:** `$0.001/request`

---

### `GET /api/v1/market-data`

Global cryptocurrency market statistics and trending coins

**Price:** `$0.002/request`

---

### `GET /api/v1/ohlcv`

OHLCV candlestick market data

**Price:** `$0.002/request`

---

### `GET /api/v1/orderbook`

Order book depth data

**Price:** `$0.003/request`

---

### `GET /api/v1/search`

Search across news and market data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | No | — | Search query string |
| `query` | string | No | — | Search query string |

---

## NFTs

### `GET /api/nft`

NFT market overview and statistics

**Price:** `$0.001/request`

---

### `GET /api/nft/collections/search`

Search NFT collections by name or attributes

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | No | — | Search query string |
| `limit` | number | No | `20` | Maximum number of results to return |

---

### `GET /api/nft/collections/trending`

Trending NFT collections by volume and sales

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `20` | Maximum number of results to return |
| `chain` | string | No | — | Blockchain network (e.g., ethereum, solana) |
| `category` | string | No | — | Filter by category |
| `sort_by` | string | No | — | Field to sort results by |

---

### `GET /api/nft/market`

NFT market aggregate statistics

**Price:** `$0.001/request`

---

### `GET /api/nft/sales/recent`

Recent notable NFT sales

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `50` | Maximum number of results to return |

---

### `GET /api/solana/nfts`

Solana NFT market data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | No | — | Wallet or contract address |
| `source` | string | No | — | Filter by news source |

---

## News & Content

### `GET /api/academic`
### `POST /api/academic`

Academic - News & Content

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | No | `stats` | API action to perform |
| `type` | string | No | — | Data or content type |
| `country` | string | No | — | Filter by country code |
| `verified` | string | No | — | Filter for verified entries only |
| `id` | string | No | — | Unique identifier |
| `project` | string | No | — | DeFi project or protocol name |
| `style` | string | No | `apa` | Output style or format |
| `status` | string | No | — | Filter by status |
| `limit` | number | No | `50` | Maximum number of results to return |
| `endpoint` | string | No | — | Specific endpoint to query |

---

### `GET /api/analytics/news-onchain`

Correlation between news events and on-chain activity

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `hours` | number | No | `24` | Filter by hours |

---

### `GET /api/archive`

News article archive and historical data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `stats` | string | No | — | Filter by stats |
| `index` | string | No | — | Filter by index |
| `type` | string | No | — | Data or content type |
| `trending` | string | No | — | Filter by trending |
| `hours` | number | No | `24` | Filter by hours |
| `market` | string | No | — | Filter by market |
| `start_date` | string | No | — | Filter by start date |
| `end_date` | string | No | — | Filter by end date |
| `source` | string | No | — | Filter by news source |
| `ticker` | string | No | — | Filter by ticker |
| `q` | string | No | — | Search query string |
| `sentiment` | string | No | — | Filter by sentiment |
| `tags` | string | No | — | Filter by tags |
| `limit` | number | No | `50` | Maximum number of results to return |
| `offset` | number | No | `0` | Number of results to skip |
| `format` | string | No | `full` | Response format |
| `lang` | string | No | `en` | Language code (e.g., en, es, zh) |

---

### `GET /api/archive/ipfs`
### `POST /api/archive/ipfs`

IPFS-pinned news archive for permanent storage

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | No | `list` | API action to perform |
| `cid` | string | Yes | — | Filter by cid |
| `storage` | string | No | — | Filter by storage |
| `type` | string | No | — | Data or content type |
| `limit` | number | No | `20` | Maximum number of results to return |

---

### `GET /api/archive/status`

Archive indexing status and statistics

**Price:** `$0.001/request`

---

### `GET /api/archive/v2`

Enhanced news archive with improved search and filtering

**Price:** `$0.001/request`

---

### `POST /api/archive/webhook`
### `GET /api/archive/webhook`

Webhook notifications for archive updates

**Price:** `$0.001/request`

---

### `GET /api/articles`

Browse and filter crypto news articles

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `slug` | string | No | — | Filter by slug |
| `id` | string | No | — | Unique identifier |
| `stats` | string | No | — | Filter by stats |
| `limit` | number | No | `50` | Maximum number of results to return |
| `date` | string | No | — | Date in YYYY-MM-DD format |
| `ticker` | string | No | — | Filter by ticker |
| `source` | string | No | — | Filter by news source |
| `q` | string | No | — | Search query string |

---

### `GET /api/atom`

Atom/RSS feed for crypto news

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `feed` | string | No | `all` | Filter by feed |
| `limit` | number | No | `20` | Maximum number of results to return |

---

### `GET /api/blog/posts`

Blog posts about cryptocurrency markets and analysis

**Price:** `$0.001/request`

---

### `GET /api/breaking`

Breaking crypto news headlines

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `lang` | string | No | `en` | Language code (e.g., en, es, zh) |

---

### `GET /api/commentary`

Expert commentary and opinion pieces on crypto

**Price:** `$0.001/request`
  
**Type:** Server-Sent Events (streaming)

---

### `GET /api/market/categories`

Crypto market categories and sector performance

**Price:** `$0.001/request`

---

### `GET /api/news`

Latest crypto news from 300+ sources

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sort` | string | No | — | Sort field |
| `sources` | string | No | — | Comma-separated list of sources |

---

### `GET /api/news/categories`

News categorized by topic

**Price:** `$0.001/request`

---

### `POST /api/news/extract`

Extract structured data from a news URL

**Price:** `$0.001/request`

---

### `GET /api/news/international`

International crypto news with language filtering

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `language` | string | No | `all` | Filter by language |
| `translate` | string | No | — | Filter by translate |
| `limit` | number | No | `20` | Maximum number of results to return |
| `region` | string | No | `all` | Filter by region |
| `sources` | string | No | — | Comma-separated list of sources |

---

### `GET /api/news/stream`

Real-time news stream via Server-Sent Events

**Price:** `$0.001/request`
  
**Type:** Server-Sent Events (streaming)

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `categories` | string | No | — | Filter by categories |
| `limit` | number | No | `5` | Maximum number of results to return |

---

### `GET /api/opml`

OPML feed list for RSS readers

**Price:** `$0.001/request`

---

### `GET /api/podcast`

Crypto podcast feed and episodes

**Price:** `$0.001/request`

---

### `POST /api/press-release`
### `GET /api/press-release`

Crypto press release aggregation

**Price:** `$0.001/request`

---

### `GET /api/regulatory`

Regulatory news and policy updates

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | No | `events` | API action to perform |
| `jurisdiction` | string | No | — | Filter by jurisdiction |
| `agency` | string | No | — | Filter by agency |
| `actionType` | string | No | — | Filter by actionType |
| `impact` | string | No | — | Filter by impact |
| `sector` | string | No | — | Filter by sector |
| `limit` | number | No | `50` | Maximum number of results to return |
| `offset` | number | No | `0` | Number of results to skip |
| `days` | number | No | `7` | Number of days of historical data |
| `text` | string | No | — | Filter by text |
| `title` | string | No | — | Filter by title |
| `description` | string | No | — | Filter by description |

---

### `GET /api/rss`

RSS feed for crypto news

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `feed` | string | No | `all` | Filter by feed |
| `limit` | number | No | `20` | Maximum number of results to return |

---

### `GET /api/rss-proxy`

RSS feed proxy with CORS support

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | No | — | Filter by url |

---

### `GET /api/sources`

News source listings and metadata

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `token` | string | No | — | Filter by token |

---

### `GET /api/tags`

News tag listings and tag-based browsing

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `slug` | string | No | — | Filter by slug |
| `category` | string | No | — | Filter by category |
| `sort` | string | No | — | Sort field |

---

### `GET /api/v1/categories`

News and market category listings

**Price:** `$0.001/request`

---

### `GET /api/v1/news`

Latest crypto news with filtering and pagination

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `20` | Maximum number of results to return |
| `source` | string | No | — | Filter by news source |
| `category` | string | No | — | Filter by category |
| `from` | string | No | — | Start date (ISO 8601 or YYYY-MM-DD) |
| `to` | string | No | — | End date (ISO 8601 or YYYY-MM-DD) |
| `page` | number | No | `1` | Page number for pagination |
| `per_page` | number | No | `20` | Results per page |
| `lang` | string | No | `en` | Language code (e.g., en, es, zh) |
| `sort` | string | No | — | Sort field |

---

### `GET /api/v1/sources`

News source listings

**Price:** `$0.001/request`

---

### `GET /api/v1/tags`

Tag-based content browsing

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `slug` | string | No | — | Filter by slug |
| `category` | string | No | — | Filter by category |
| `sort` | string | No | — | Sort field |

---

### `GET /api/videos`

Crypto video content aggregation

**Price:** `$0.001/request`

---

## On-Chain & Whales

### `GET /api/arkham`

Arkham Intelligence on-chain entity tracking

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | No | `smart-money-flows` | API action to perform |
| `address` | string | No | — | Wallet or contract address |
| `entity` | string | No | — | Filter by entity |
| `chain` | string | No | — | Blockchain network (e.g., ethereum, solana) |
| `token` | string | No | — | Filter by token |
| `minValueUsd` | number | No | — | Filter by minValueUsd |
| `limit` | number | No | — | Maximum number of results to return |

---

### `GET /api/data-sources/onchain`

On-chain data source status and coverage

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `view` | string | No | `dashboard` | Filter by view |
| `address` | string | No | — | Wallet or contract address |
| `chain` | string | No | `ethereum` | Blockchain network (e.g., ethereum, solana) |
| `transfers` | string | No | — | Filter by transfers |
| `minEth` | number | No | `100` | Filter by minEth |

---

### `GET /api/dune`

Dune Analytics query results and dashboards

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | number | No | — | Search query string |
| `queryId` | number | No | — | Filter by queryId |
| `executionId` | string | No | — | Filter by executionId |
| `execute` | number | No | — | Filter by execute |

---

### `GET /api/flows`

Capital flow tracking across exchanges and wallets

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `coin` | string | No | — | Cryptocurrency ID or symbol |

---

### `GET /api/nansen`

Nansen on-chain analytics data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | No | `smart-money` | API action to perform |
| `chain` | string | No | — | Blockchain network (e.g., ethereum, solana) |
| `token` | string | No | — | Filter by token |
| `txAction` | string | No | — | Filter by txAction |
| `limit` | number | No | — | Maximum number of results to return |
| `address` | string | No | — | Wallet or contract address |

---

### `GET /api/onchain/aave/markets`

Aave lending market data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `20` | Maximum number of results to return |

---

### `GET /api/onchain/aave/rates`

Aave lending and borrowing rates

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `chain` | string | No | `ethereum` | Blockchain network (e.g., ethereum, solana) |

---

### `GET /api/onchain/compound/markets`

Compound lending market data

**Price:** `$0.001/request`

---

### `GET /api/onchain/correlate`

Correlate on-chain metrics with price and news events

**Price:** `$0.001/request`

---

### `GET /api/onchain/cross-protocol`

Cross-protocol DeFi analytics and comparisons

**Price:** `$0.001/request`

---

### `GET /api/onchain/curve/pools`

Curve Finance pool data and yields

**Price:** `$0.001/request`

---

### `GET /api/onchain/events`

Significant on-chain events and transactions

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `30` | Maximum number of results to return |
| `chain` | string | No | — | Blockchain network (e.g., ethereum, solana) |
| `type` | string | No | — | Data or content type |
| `min_value` | number | No | `0` | Filter by min value |
| `min_confidence` | number | No | `50` | Filter by min confidence |

---

### `GET /api/onchain/exchange-flows`

Exchange inflow/outflow data for BTC and ETH

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `asset` | string | No | `BTC` | Asset identifier (e.g., BTC, ETH) |

---

### `GET /api/onchain/multichain`

Multi-chain on-chain analytics

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `protocol` | string | No | `uniswap` | Filter by protocol |

---

### `GET /api/onchain/uniswap/pools`

Uniswap pool data and liquidity metrics

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `20` | Maximum number of results to return |
| `order_by` | string | No | `totalValueLockedUSD` | Filter by order by |
| `order_direction` | string | No | `desc` | Filter by order direction |
| `min_liquidity` | string | No | — | Filter by min liquidity |

---

### `GET /api/onchain/uniswap/swaps`

Recent Uniswap swap transactions

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `20` | Maximum number of results to return |
| `pool` | string | No | — | Filter by pool |
| `min_usd` | string | No | — | Filter by min usd |

---

### `GET /api/stablecoins/flows`

Stablecoin capital flow tracking

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `20` | Maximum number of results to return |

---

### `GET /api/v1/onchain`

On-chain analytics data

**Price:** `$0.003/request`

---

### `GET /api/v1/whale-alerts`

Large cryptocurrency transaction alerts

**Price:** `$0.003/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `blockchain` | string | No | `all` | Blockchain to filter by |
| `minValue` | number | No | `100000` | Minimum transaction value in USD |
| `limit` | number | No | `50` | Maximum number of results to return |

---

### `GET /api/whale-alerts`

Real-time large transaction monitoring

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `blockchain` | string | No | `all` | Blockchain to filter by |
| `minValue` | number | No | `100000` | Minimum transaction value in USD |
| `limit` | number | No | `50` | Maximum number of results to return |

---

### `GET /api/whale-alerts/context`

Whale alert enrichment with market context and AI analysis

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `coin` | string | No | — | Cryptocurrency ID or symbol |
| `amount` | number | No | — | Filter by amount |
| `amountUsd` | number | No | — | Filter by amountUsd |
| `type` | string | No | — | Data or content type |
| `from` | string | No | — | Start date (ISO 8601 or YYYY-MM-DD) |
| `to` | string | No | — | End date (ISO 8601 or YYYY-MM-DD) |

---

### `GET /api/whales`

Whale wallet tracking and analysis

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | string | No | `10` | Maximum number of results to return |
| `min_usd` | string | No | `1000000` | Filter by min usd |

---

## Oracles

### `POST /api/oracle`
### `GET /api/oracle`

Price oracle overview and comparison

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | No | — | API action to perform |

---

### `GET /api/oracle/chainlink`
### `POST /api/oracle/chainlink`

Chainlink oracle data feed for crypto sentiment

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `format` | string | No | `standard` | Response format |

---

### `GET /api/oracle/prices`

Aggregated oracle price feeds

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `assets` | string | No | `bitcoin,ethereum,binancecoin,solana,ripple` | Filter by assets |
| `currency` | string | No | `usd` | Filter by currency |

---

## Other

### `GET /api/.well-known/x402`

x402 protocol discovery endpoint

**Price:** `$0.001/request`

---

### `GET /api/ai`
### `POST /api/ai`

AI-powered analysis and intelligence

**Price:** `$0.001/request`

---

### `GET /api/ai-anchor`
### `POST /api/ai-anchor`

AI news anchor video generation from crypto news

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | No | `info` | API action to perform |
| `jobId` | string | No | — | Async job identifier |

---

### `GET /api/airdrops`

Upcoming and active cryptocurrency airdrops

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `status` | string | No | — | Filter by status |
| `limit` | number | No | `50` | Maximum number of results to return |

---

### `POST /api/alexa`
### `GET /api/alexa`

Alexa skill integration endpoint

**Price:** `$0.001/request`

---

### `GET /api/article`

Single article retrieval by ID or URL

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | No | — | Filter by url |
| `title` | string | No | `Untitled` | Filter by title |
| `source` | string | No | `Unknown` | Filter by news source |

---

### `GET /api/authors`

News author profiles and statistics

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | — | Maximum number of results to return |
| `offset` | number | No | — | Number of results to skip |
| `sort` | string | No | — | Sort field |
| `search` | number | No | — | Filter by search |

---

### `POST /api/batch`

Batch multiple API requests into a single call

**Price:** `$0.001/request`

---

### `POST /api/chart-analysis`
### `GET /api/chart-analysis`

Technical chart pattern analysis

**Price:** `$0.001/request`

---

### `GET /api/contributors`

Platform contributor profiles and statistics

**Price:** `$0.001/request`

---

### `GET /api/data-sources`

Available data sources and their status

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | No | — | API action to perform |
| `category` | string | No | — | Filter by category |

---

### `GET /api/extract`

Extract structured data from crypto news articles

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | No | — | Filter by url |

---

### `GET /api/glossary`

Cryptocurrency glossary and term definitions

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category` | string | No | — | Filter by category |
| `q` | string | No | — | Search query string |
| `limit` | number | No | `100` | Maximum number of results to return |

---

### `GET /api/keys`
### `POST /api/keys`
### `DELETE /api/keys`

API key management

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `id` | string | No | — | Unique identifier |

---

### `GET /api/on-chain`

On-chain analytics overview

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `chain` | string | No | — | Blockchain network (e.g., ethereum, solana) |
| `metric` | string | No | — | Filter by metric |

---

### `GET /api/oneinch`

1inch DEX aggregator data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | No | `prices` | API action to perform |
| `chainId` | number | No | — | Filter by chainId |
| `src` | string | No | — | Filter by src |
| `dst` | string | No | — | Filter by dst |
| `amount` | string | No | — | Filter by amount |
| `from` | string | No | — | Start date (ISO 8601 or YYYY-MM-DD) |
| `slippage` | number | No | — | Filter by slippage |

---

### `POST /api/rag`
### `GET /api/rag`

RAG (Retrieval-Augmented Generation) system overview

**Price:** `$0.001/request`

---

### `GET /api/sse`

Server-Sent Events connection for real-time updates

**Price:** `$0.001/request`
  
**Type:** Server-Sent Events (streaming)

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sources` | string | No | — | Comma-separated list of sources |
| `categories` | string | No | — | Filter by categories |
| `breaking` | string | No | — | Filter by breaking |

---

### `POST /api/translate`
### `GET /api/translate`

Translate crypto news across languages

**Price:** `$0.001/request`

---

### `GET /api/v1`

API v1 root - version info and available endpoints

**Price:** `$0.001/request`

---

### `GET /api/validators`

Blockchain validator data and statistics

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `view` | string | No | — | Filter by view |
| `limit` | number | No | `50` | Maximum number of results to return |

---

### `GET /api/vector-search`
### `POST /api/vector-search`

Vector similarity search across crypto content

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | No | — | Search query string |
| `action` | string | No | — | API action to perform |
| `articleId` | string | No | — | Article unique identifier |
| `topK` | number | No | `10` | Filter by topK |
| `alpha` | number | No | `0.7` | Filter by alpha |
| `temporalDecay` | number | No | `0` | Filter by temporalDecay |
| `minScore` | number | No | `0.3` | Filter by minScore |
| `numTopics` | number | No | `8` | Filter by numTopics |
| `dateStart` | string | No | — | Filter by dateStart |
| `dateEnd` | string | No | — | Filter by dateEnd |
| `categories` | string | No | — | Filter by categories |
| `sources` | string | No | — | Comma-separated list of sources |

---

### `GET /api/ws`

WebSocket connection for real-time data streams

**Price:** `$0.001/request`
  
**Type:** Server-Sent Events (streaming)

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `mode` | string | No | — | Filter by mode |

---

## Portfolio & Alerts

### `GET /api/alerts`
### `POST /api/alerts`
### `DELETE /api/alerts`
### `PATCH /api/alerts`

Price and event alert management

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | No | — | API action to perform |
| `userId` | string | No | — | User identifier |
| `limit` | number | No | `100` | Maximum number of results to return |
| `alertId` | string | No | — | Filter by alertId |
| `id` | string | No | — | Unique identifier |

---

### `GET /api/alerts/stream`

Real-time alert notifications via Server-Sent Events

**Price:** `$0.001/request`
  
**Type:** Server-Sent Events (streaming)

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `user_id` | string | No | — | Filter by user id |
| `session_id` | string | No | — | Filter by session id |

---

### `GET /api/portfolio`

Portfolio tracking and management

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `coins` | string | No | — | Comma-separated cryptocurrency IDs |
| `limit` | number | No | `10` | Maximum number of results to return |
| `prices` | string | No | — | Filter by prices |

---

### `GET /api/portfolio/benchmark`

Portfolio performance benchmarking against indices

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `coins` | string | No | — | Comma-separated cryptocurrency IDs |
| `weights` | string | No | — | Filter by weights |
| `days` | number | No | `30` | Number of days of historical data |
| `benchmarks` | string | No | `bitcoin,ethereum` | Filter by benchmarks |

---

### `GET /api/portfolio/correlation`

Intra-portfolio asset correlation analysis

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `coins` | string | No | — | Comma-separated cryptocurrency IDs |
| `days` | number | No | `90` | Number of days of historical data |

---

### `POST /api/portfolio/holding`
### `PATCH /api/portfolio/holding`
### `DELETE /api/portfolio/holding`

Add or update portfolio holdings

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `portfolioId` | string | No | — | Filter by portfolioId |
| `coinId` | string | No | — | Cryptocurrency ID (e.g., bitcoin, ethereum) |

---

### `POST /api/portfolio/performance`

Portfolio performance charts and metrics

**Price:** `$0.001/request`

---

### `GET /api/portfolio/tax`
### `POST /api/portfolio/tax`
### `DELETE /api/portfolio/tax`

Portfolio tax implications calculator

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `portfolio_id` | string | No | `demo` | Filter by portfolio id |
| `year` | number | No | — | Filter by year |
| `jurisdiction` | string | No | `US` | Filter by jurisdiction |
| `method` | string | No | — | Filter by method |
| `format` | string | No | `json` | Response format |

---

### `POST /api/portfolio/tax-report`

Generate comprehensive portfolio tax reports

**Price:** `$0.001/request`

---

### `GET /api/predictions`
### `POST /api/predictions`

Crypto price prediction market data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `userId` | string | No | — | User identifier |
| `asset` | string | No | — | Asset identifier (e.g., BTC, ETH) |
| `status` | string | No | — | Filter by status |
| `view` | string | No | `list` | Filter by view |
| `limit` | number | No | `50` | Maximum number of results to return |
| `minPredictions` | number | No | `5` | Filter by minPredictions |

---

### `GET /api/predictions/history`

Historical prediction accuracy tracking

**Price:** `$0.001/request`

---

### `GET /api/predictions/markets`
### `POST /api/predictions/markets`

Prediction market listings and odds

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | No | `list` | API action to perform |
| `userId` | string | No | `demo_user` | User identifier |
| `id` | string | No | — | Unique identifier |
| `status` | string | No | — | Filter by status |
| `category` | string | No | — | Filter by category |

---

### `GET /api/v1/alerts`

Alert management for price and event triggers

**Price:** `$0.001/request`

---

### `GET /api/v1/predictions`
### `POST /api/v1/predictions`

Price prediction submissions and data

**Price:** `$0.003/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `userId` | string | No | — | User identifier |
| `asset` | string | No | — | Asset identifier (e.g., BTC, ETH) |
| `status` | string | No | — | Filter by status |
| `view` | string | No | `list` | Filter by view |
| `limit` | number | No | `50` | Maximum number of results to return |
| `minPredictions` | number | No | `5` | Filter by minPredictions |

---

### `GET /api/watchlist`
### `POST /api/watchlist`
### `DELETE /api/watchlist`
### `PUT /api/watchlist`

Watchlist management for tracking assets

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `check` | string | No | — | Filter by check |
| `prices` | string | No | — | Filter by prices |
| `clear` | string | No | — | Filter by clear |
| `coinId` | string | No | — | Cryptocurrency ID (e.g., bitcoin, ethereum) |

---

## Premium

### `GET /api/premium`

Premium tier overview and features

**Price:** `$0.001/request`

---

## Premium AI

### `GET /api/premium/ai/analyze`

Premium deep AI market analysis with full reports

**Price:** `$0.05/request`

---

### `GET /api/premium/ai/compare`

Premium AI-powered multi-asset comparison

**Price:** `$0.03/request`

---

### `GET /api/premium/ai/sentiment`

Premium granular AI sentiment analysis

**Price:** `$0.02/request`

---

### `GET /api/premium/ai/signals`

Premium AI trading signals with confidence scores

**Price:** `$0.05/request`

---

### `GET /api/premium/ai/summary`

Premium AI executive market summary

**Price:** `$0.01/request`

---

## Premium Alerts

### `GET /api/premium/alerts/custom`

Premium custom alert rule configuration

**Price:** `$0.001/request`

---

### `GET /api/premium/alerts/whales`

Premium whale activity alerts

**Price:** `$0.01/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `coins` | string | No | `bitcoin,ethereum` | Comma-separated cryptocurrency IDs |
| `minThreshold` | number | No | `1000000` | Filter by minThreshold |
| `concentration` | string | No | — | Filter by concentration |

---

## Premium Analytics

### `GET /api/premium/analytics/screener`

Premium advanced crypto screener

**Price:** `$0.01/request`

---

### `GET /api/premium/portfolio/analytics`

Premium portfolio analytics and insights

**Price:** `$0.01/request`

---

### `GET /api/premium/screener/advanced`

Premium advanced multi-factor crypto screener

**Price:** `$0.02/request`

---

## Premium Data

### `GET /api/premium/export/portfolio`

Premium portfolio data export

**Price:** `$0.1/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `format` | string | No | `json` | Response format |
| `portfolio_id` | string | No | — | Filter by portfolio id |

---

## Premium DeFi

### `GET /api/premium/defi/protocols`

Premium detailed DeFi protocol analytics

**Price:** `$0.002/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `500` | Maximum number of results to return |
| `category` | string | No | — | Filter by category |
| `chain` | string | No | — | Blockchain network (e.g., ethereum, solana) |
| `chains` | string | No | — | Filter by chains |
| `minTvl` | number | No | `0` | Filter by minTvl |

---

## Premium Market

### `GET /api/premium/market/coins`

Premium enhanced coin market data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `100` | Maximum number of results to return |
| `details` | string | No | — | Filter by details |

---

### `GET /api/premium/market/history`

Premium historical market data with full depth

**Price:** `$0.005/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `coinId` | string | No | — | Cryptocurrency ID (e.g., bitcoin, ethereum) |
| `range` | string | No | `1y` | Filter by range |
| `currency` | string | No | `usd` | Filter by currency |
| `ohlc` | string | No | — | Filter by ohlc |

---

## Premium Whales

### `GET /api/premium/smart-money`

Premium smart money and institutional flow tracking

**Price:** `$0.05/request`

---

### `GET /api/premium/whales/alerts`

Premium whale movement alert configuration

**Price:** `$0.05/request`

---

### `GET /api/premium/whales/transactions`

Premium detailed whale transaction data

**Price:** `$0.05/request`

---

## Social Intelligence

### `GET /api/analytics/influencers`

Influencer impact and reach analytics

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `30` | Maximum number of results to return |
| `min_credibility` | number | No | `0` | Filter by min credibility |
| `category` | string | No | — | Filter by category |
| `platform` | string | No | — | Filter by platform |
| `sort` | string | No | `credibility` | Sort field |

---

### `GET /api/data-sources/social`

Social data source status and coverage

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `view` | string | No | `dashboard` | Filter by view |
| `days` | number | No | `30` | Number of days of historical data |
| `limit` | number | No | `20` | Maximum number of results to return |
| `symbol` | string | No | — | Trading symbol (e.g., BTC, ETH) |
| `space` | string | No | — | Filter by space |

---

### `GET /api/influencers`
### `POST /api/influencers`

Crypto influencer rankings and analysis

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sortBy` | string | No | `reliability` | Filter by sortBy |
| `limit` | number | No | `50` | Maximum number of results to return |
| `minCalls` | number | No | `0` | Filter by minCalls |
| `platform` | string | No | — | Filter by platform |
| `ticker` | string | No | — | Filter by ticker |
| `view` | string | No | — | Filter by view |

---

### `GET /api/nostr`
### `POST /api/nostr`

Nostr protocol integration for decentralized publishing

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | No | — | API action to perform |
| `limit` | number | No | `20` | Maximum number of results to return |

---

### `GET /api/social`
### `POST /api/social`

Social media analytics overview

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `view` | string | No | `full` | Filter by view |
| `symbols` | string | No | — | Comma-separated trading symbols |
| `limit` | number | No | `20` | Maximum number of results to return |
| `platform` | string | No | `all` | Filter by platform |
| `format` | string | No | `json` | Response format |

---

### `GET /api/social/coins`

Social metrics for individual cryptocurrencies

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `symbols` | string | No | — | Comma-separated trading symbols |
| `limit` | number | No | `50` | Maximum number of results to return |

---

### `GET /api/social/discord`

Discord community analytics for crypto projects

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `channel_id` | string | No | — | Filter by channel id |
| `guild_id` | string | No | — | Filter by guild id |
| `limit` | number | No | `100` | Maximum number of results to return |
| `keyword` | string | No | — | Filter by keyword |
| `ticker` | string | No | — | Filter by ticker |

---

### `GET /api/social/influencer-score`
### `POST /api/social/influencer-score`

Calculate influencer impact score

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `handle` | string | No | — | Filter by handle |
| `platform` | string | No | `twitter` | Filter by platform |
| `min_score` | number | No | `0` | Filter by min score |

---

### `GET /api/social/influencers`

Crypto social media influencer rankings

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `50` | Maximum number of results to return |

---

### `GET /api/social/topics/trending`

Trending topics across crypto social media

**Price:** `$0.001/request`

---

### `GET /api/social/trending-narratives`

Trending narratives and themes from social data

**Price:** `$0.001/request`

---

### `GET /api/social/x/lists`
### `POST /api/social/x/lists`

X/Twitter crypto list management and monitoring

**Price:** `$0.001/request`

---

### `GET /api/trending`

Trending cryptocurrencies and topics

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `10` | Maximum number of results to return |
| `hours` | number | No | `24` | Filter by hours |

---

### `GET /api/v1/trending`

Trending cryptocurrencies and topics

**Price:** `$0.001/request`

---

## Solana

### `GET /api/solana`

Solana blockchain overview and statistics

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | No | — | Wallet or contract address |
| `mint` | string | No | — | Token mint address |
| `view` | string | No | — | Filter by view |
| `limit` | number | No | `20` | Maximum number of results to return |

---

### `GET /api/solana/assets`

Solana digital asset data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | No | — | Wallet or contract address |
| `id` | string | No | — | Unique identifier |
| `page` | number | No | `1` | Page number for pagination |
| `limit` | number | No | `100` | Maximum number of results to return |

---

### `GET /api/solana/balances`

Solana wallet token balances

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | No | — | Wallet or contract address |

---

### `GET /api/solana/collections`

Solana NFT collection data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `groupKey` | string | No | — | Filter by groupKey |
| `groupValue` | string | No | — | Filter by groupValue |
| `creator` | string | No | — | Filter by creator |
| `authority` | string | No | — | Filter by authority |
| `proof` | string | No | — | Filter by proof |
| `page` | number | No | `1` | Page number for pagination |
| `limit` | number | No | `100` | Maximum number of results to return |

---

### `GET /api/solana/priority-fees`

Solana priority fee estimates

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `accounts` | string | No | — | Filter by accounts |

---

### `GET /api/solana/search`

Search Solana tokens and accounts

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `owner` | string | No | — | Wallet owner address |
| `creator` | string | No | — | Filter by creator |
| `collection` | string | No | — | Filter by collection |
| `compressed` | string | No | — | Filter by compressed |
| `frozen` | string | No | — | Filter by frozen |
| `burnt` | string | No | — | Filter by burnt |
| `page` | number | No | `1` | Page number for pagination |
| `limit` | number | No | `100` | Maximum number of results to return |

---

### `GET /api/solana/tokens`

Solana token data with filtering and pagination

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `owner` | string | No | — | Wallet owner address |
| `mint` | string | No | — | Token mint address |
| `page` | number | No | `1` | Page number for pagination |
| `limit` | number | No | `100` | Maximum number of results to return |

---

### `GET /api/solana/transactions`

Solana transaction history

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | No | — | Wallet or contract address |
| `limit` | number | No | `20` | Maximum number of results to return |
| `source` | string | No | — | Filter by news source |

---

### `GET /api/solana/wallet`

Solana wallet portfolio and transaction overview

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | No | — | Wallet or contract address |

---

## Stablecoins

### `GET /api/stablecoins`

Stablecoin market overview and supply data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `chains` | string | No | — | Filter by chains |
| `limit` | number | No | `50` | Maximum number of results to return |

---

### `GET /api/stablecoins/chains`

Stablecoin distribution across blockchains

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `25` | Maximum number of results to return |

---

### `GET /api/stablecoins/depeg`

Stablecoin depeg monitoring and alerts

**Price:** `$0.001/request`

---

### `GET /api/stablecoins/dominance`

Stablecoin market dominance metrics

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `10` | Maximum number of results to return |

---

### `GET /api/v1/stablecoins`

Stablecoin market data

**Price:** `$0.002/request`

---

## Sui

### `GET /api/sui`

Sui blockchain overview and statistics

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | No | — | Wallet or contract address |
| `object` | string | No | — | Filter by object |
| `tx` | string | No | — | Filter by tx |
| `coin` | string | No | — | Cryptocurrency ID or symbol |
| `view` | string | No | — | Filter by view |
| `limit` | number | No | `50` | Maximum number of results to return |
| `cursor` | string | No | — | Filter by cursor |

---

### `GET /api/sui/balances`

Sui wallet balances and token holdings

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | No | — | Wallet or contract address |
| `coin` | string | No | — | Cryptocurrency ID or symbol |

---

### `GET /api/sui/objects`

Sui object data and state

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | No | — | Wallet or contract address |
| `id` | string | No | — | Unique identifier |
| `ids` | string | No | — | Comma-separated IDs |
| `limit` | number | No | `50` | Maximum number of results to return |
| `cursor` | string | No | — | Filter by cursor |

---

### `GET /api/sui/transactions`

Sui transaction history and details

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `address` | string | No | — | Wallet or contract address |
| `digest` | string | No | — | Filter by digest |
| `limit` | number | No | `20` | Maximum number of results to return |
| `cursor` | string | No | — | Filter by cursor |

---

## Trading & Derivatives

### `GET /api/arbitrage`
### `POST /api/arbitrage`

Cross-exchange arbitrage opportunity detection

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `symbol` | string | No | — | Trading symbol (e.g., BTC, ETH) |
| `minProfit` | number | No | `0.1` | Filter by minProfit |
| `exchange` | string | No | — | Filter by exchange |
| `limit` | number | No | `50` | Maximum number of results to return |
| `includeTriangular` | string | No | — | Filter by includeTriangular |
| `monitor` | string | No | — | Filter by monitor |

---

### `GET /api/backtest`
### `POST /api/backtest`

Strategy backtesting with historical market data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | No | `backtest` | API action to perform |
| `strategy` | string | No | `sentiment_momentum` | Filter by strategy |
| `asset` | string | No | `BTC` | Asset identifier (e.g., BTC, ETH) |
| `start` | string | No | `2025-01-01` | Start position for pagination |
| `end` | string | No | `2026-02-01` | Filter by end |
| `capital` | number | No | `10000` | Filter by capital |

---

### `GET /api/data-sources/derivatives`

Derivatives data source status and coverage

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `view` | string | No | `dashboard` | Filter by view |
| `symbol` | string | No | `BTC` | Trading symbol (e.g., BTC, ETH) |
| `currency` | string | No | `BTC` | Filter by currency |

---

### `GET /api/derivatives`

Crypto derivatives market overview

**Price:** `$0.001/request`

---

### `GET /api/derivatives/aggregated/funding`

Aggregated funding rates across exchanges

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `symbol` | string | No | — | Trading symbol (e.g., BTC, ETH) |

---

### `GET /api/derivatives/aggregated/open-interest`

Aggregated open interest across exchanges

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `symbol` | string | No | — | Trading symbol (e.g., BTC, ETH) |

---

### `GET /api/derivatives/bybit/tickers`

Bybit derivatives ticker data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category` | string | No | `linear` | Filter by category |

---

### `GET /api/derivatives/dydx/markets`

dYdX perpetual market data

**Price:** `$0.001/request`

---

### `GET /api/derivatives/okx/funding`

OKX funding rate data

**Price:** `$0.001/request`

---

### `GET /api/derivatives/okx/open-interest`

OKX open interest data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | string | No | `SWAP` | Data or content type |

---

### `GET /api/derivatives/okx/tickers`

OKX derivatives ticker data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | string | No | `SWAP` | Data or content type |

---

### `GET /api/derivatives/opportunities`

Derivatives trading opportunities and spreads

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `10` | Maximum number of results to return |

---

### `GET /api/funding`
### `POST /api/funding`

Venture capital funding rounds in crypto

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `exchange` | string | No | — | Filter by exchange |
| `symbol` | string | No | — | Trading symbol (e.g., BTC, ETH) |
| `minSpread` | number | No | `0` | Filter by minSpread |
| `alerts` | string | No | — | Filter by alerts |
| `history` | string | No | — | Filter by history |
| `historyExchange` | string | No | `binance` | Filter by historyExchange |
| `limit` | number | No | `100` | Maximum number of results to return |

---

### `GET /api/funding-rates`

Perpetual futures funding rates across exchanges

**Price:** `$0.001/request`

---

### `GET /api/hyperliquid`

Hyperliquid perpetual DEX data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | string | No | `all` | Data or content type |
| `symbol` | string | No | — | Trading symbol (e.g., BTC, ETH) |

---

### `GET /api/integrations/tradingview`
### `POST /api/integrations/tradingview`

TradingView webhook integration for alerts and signals

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | No | — | API action to perform |
| `symbol` | string | No | — | Trading symbol (e.g., BTC, ETH) |
| `timeframe` | string | No | `D` | Time period (e.g., 1h, 24h, 7d, 30d) |
| `type` | string | No | `chart` | Data or content type |
| `theme` | string | No | `dark` | Filter by theme |
| `width` | string | No | `100%` | Filter by width |
| `height` | number | No | `500` | Filter by height |
| `symbols` | string | No | — | Comma-separated trading symbols |
| `tags` | string | No | — | Filter by tags |
| `overlay` | string | No | — | Filter by overlay |
| `id` | string | No | — | Unique identifier |
| `enabled` | string | No | — | Filter by enabled |
| `fast` | number | No | `9` | Filter by fast |
| `slow` | number | No | `21` | Filter by slow |

---

### `GET /api/liquidations`

Liquidation data from perpetual futures markets

**Price:** `$0.001/request`

---

### `GET /api/market/derivatives`

Derivatives market overview and statistics

**Price:** `$0.001/request`

---

### `GET /api/options`

Crypto options market data and analytics

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `underlying` | string | No | — | Filter by underlying |
| `view` | string | No | `dashboard` | Filter by view |
| `expiry` | string | No | — | Filter by expiry |
| `limit` | number | No | `100` | Maximum number of results to return |

---

### `POST /api/research/backtest`

Research-grade strategy backtesting

**Price:** `$0.001/request`

---

### `GET /api/signals`

Trading signal generation and analysis

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `30` | Maximum number of results to return |
| `min_confidence` | number | No | `50` | Filter by min confidence |
| `ticker` | string | No | — | Filter by ticker |

---

### `GET /api/signals/narrative`

Narrative-based trading signals

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `signals` | string | No | — | Filter by signals |

---

### `GET /api/trading/arbitrage`

Trading arbitrage opportunity detection

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | string | No | `all` | Data or content type |
| `symbol` | string | No | — | Trading symbol (e.g., BTC, ETH) |
| `minSpread` | number | No | `0` | Filter by minSpread |
| `minProfit` | number | No | `0` | Filter by minProfit |
| `exchange` | string | No | — | Filter by exchange |
| `limit` | number | No | `50` | Maximum number of results to return |
| `sortBy` | string | No | `score` | Filter by sortBy |
| `view` | string | No | `opportunities` | Filter by view |

---

### `GET /api/trading/options`

Options trading data and strategies

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `view` | string | No | `dashboard` | Filter by view |
| `underlying` | string | No | `BTC` | Filter by underlying |
| `expiry` | string | No | — | Filter by expiry |
| `limit` | number | No | `50` | Maximum number of results to return |
| `unusual` | string | No | — | Filter by unusual |
| `blocks` | string | No | — | Filter by blocks |
| `minPremium` | number | No | `0` | Filter by minPremium |

---

### `GET /api/trading/orderbook`

Trading order book analysis

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `symbol` | string | No | — | Trading symbol (e.g., BTC, ETH) |
| `view` | string | No | `aggregated` | Filter by view |
| `depth` | number | No | `25` | Filter by depth |
| `exchanges` | string | No | — | Filter by exchanges |
| `market` | string | No | `spot` | Filter by market |
| `size` | number | No | `10000` | Filter by size |
| `side` | string | No | `both` | Filter by side |

---

### `GET /api/tradingview`

TradingView integration and chart data

**Price:** `$0.001/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | No | `config` | API action to perform |
| `symbol` | string | No | — | Trading symbol (e.g., BTC, ETH) |
| `query` | string | No | — | Search query string |
| `type` | string | No | — | Data or content type |
| `exchange` | string | No | — | Filter by exchange |
| `limit` | number | No | `30` | Maximum number of results to return |
| `from` | number | No | `0` | Start date (ISO 8601 or YYYY-MM-DD) |
| `to` | number | No | — | End date (ISO 8601 or YYYY-MM-DD) |
| `resolution` | string | No | `D` | Filter by resolution |
| `countback` | number | No | — | Filter by countback |
| `symbols` | string | No | — | Comma-separated trading symbols |
| `theme` | string | No | `dark` | Filter by theme |

---

### `GET /api/v1/derivatives`

Derivatives market data

**Price:** `$0.003/request`

---

### `GET /api/v1/liquidations`

Liquidation data from futures markets

**Price:** `$0.003/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `symbol` | string | No | — | Trading symbol (e.g., BTC, ETH) |
| `limit` | number | No | `20` | Maximum number of results to return |
| `min_value` | number | No | `0` | Filter by min value |

---

### `GET /api/v1/signals`

Trading signals with confidence scores

**Price:** `$0.005/request`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | `30` | Maximum number of results to return |
| `min_confidence` | number | No | `50` | Filter by min confidence |

---

## Summary

| Category | Endpoints |
|----------|-----------|
| AI Analysis | 52 |
| API v1 | 5 |
| Analytics & Intelligence | 17 |
| Aptos | 4 |
| Bitcoin | 8 |
| Data Export | 4 |
| DeFi | 20 |
| Gaming & Metaverse | 3 |
| Layer 2 | 4 |
| Macro & Traditional | 6 |
| Market Data | 51 |
| NFTs | 6 |
| News & Content | 31 |
| On-Chain & Whales | 22 |
| Oracles | 3 |
| Other | 23 |
| Portfolio & Alerts | 15 |
| Premium | 1 |
| Premium AI | 5 |
| Premium Alerts | 2 |
| Premium Analytics | 3 |
| Premium Data | 1 |
| Premium DeFi | 1 |
| Premium Market | 2 |
| Premium Whales | 3 |
| Social Intelligence | 14 |
| Solana | 9 |
| Stablecoins | 5 |
| Sui | 4 |
| Trading & Derivatives | 29 |
| **Total** | **353** |

---

*Generated by [scripts/generate-api-docs.js](../scripts/generate-api-docs.js) from [endpoint-metadata.generated.ts](../src/lib/openapi/endpoint-metadata.generated.ts)*
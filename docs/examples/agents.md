# AI Agents

Production-ready AI agent templates for automated crypto trading, research, and monitoring.

## Overview

| Agent | Description | Use Case |
|-------|-------------|----------|
| [Trading Bot](#trading-bot) | AI-powered signal generator | Automated trading signals |
| [Research Assistant](#research-assistant) | Deep-dive crypto research | Market analysis, reports |
| [Alert Bot](#alert-bot) | Real-time news alerts | Breaking news, whale alerts |
| [Digest Bot](#digest-bot) | Scheduled news digests | Daily/weekly summaries |
| [Sentiment Tracker](#sentiment-tracker) | Live sentiment dashboard | Market mood monitoring |

## Quick Start

```bash
cd examples/agents
pip install -r requirements.txt

# Set API keys
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
```

---

## Trading Bot

AI-powered trading signal generator combining news sentiment with market data.

### Features

- Multi-source news aggregation (358 sources)
- Sentiment scoring with confidence levels
- Buy/Sell/Hold signals with explanations
- Configurable risk parameters
- Backtesting mode

### Usage

```bash
# Interactive mode
python trading-bot.py

# Specific coins
python trading-bot.py --coins BTC,ETH,SOL

# Risk level
python trading-bot.py --strategy conservative
python trading-bot.py --strategy moderate
python trading-bot.py --strategy aggressive

# Backtest mode
python trading-bot.py --backtest 30d

# Output signals to JSON
python trading-bot.py --output signals.json
```

### Strategy Configuration

| Strategy | Confidence | Position Size | Stop Loss | Take Profit |
|----------|------------|---------------|-----------|-------------|
| Conservative | 80% | 2% | 2% | 6% |
| Moderate | 70% | 5% | 3% | 10% |
| Aggressive | 60% | 10% | 5% | 15% |

### Example Output

```
╔══════════════════════════════════════════════════════════════════╗
║                    🤖 CRYPTO TRADING BOT                         ║
╠══════════════════════════════════════════════════════════════════╣
║  Strategy: Moderate | Confidence Threshold: 70%                  ║
╚══════════════════════════════════════════════════════════════════╝

📊 TRADING SIGNALS

┌─────────┬────────┬──────────┬──────────┬──────────┬────────────┐
│ Asset   │ Signal │ Price    │ Target   │ Stop     │ Confidence │
├─────────┼────────┼──────────┼──────────┼──────────┼────────────┤
│ BTC     │ 🟢 BUY │ $67,234  │ $73,957  │ $65,216  │ 78%        │
│ ETH     │ ⚪ HOLD│ $3,456   │ -        │ -        │ 65%        │
│ SOL     │ 🟢 BUY │ $145.20  │ $159.72  │ $140.84  │ 82%        │
│ XRP     │ 🔴 SELL│ $0.62    │ $0.56    │ $0.64    │ 71%        │
└─────────┴────────┴──────────┴──────────┴──────────┴────────────┘

📰 SIGNAL REASONING

BTC (BUY @ 78%):
  • 12 bullish articles in last 24h (sentiment: 0.72)
  • ETF inflow news driving institutional demand
  • Fear & Greed at 67 (Greed) - momentum favorable
  • Technical: Price above 20-day MA

SOL (BUY @ 82%):
  • 8 bullish articles mentioning DeFi growth
  • TVL increase covered by multiple sources
  • Positive developer activity sentiment
```

### Code Structure

```python
# trading-bot.py
from langchain.tools import tool
from langchain_openai import ChatOpenAI

@tool
def get_coin_news(coin: str) -> str:
    """Get recent news for a cryptocurrency."""
    articles = fetch_news(coin.upper(), limit=10)
    return format_articles(articles)

@tool
def get_coin_sentiment(coin: str) -> str:
    """Get sentiment analysis for a cryptocurrency."""
    return json.dumps(fetch_sentiment(coin.upper()))

@tool
def get_breaking_news() -> str:
    """Get breaking crypto news from the last 2 hours."""
    return format_articles(fetch_breaking())

# Create agent with tools
tools = [get_coin_news, get_coin_sentiment, get_breaking_news]
agent = create_openai_functions_agent(llm, tools, prompt)
```

---

## Research Assistant

Deep-dive crypto research with citations and follow-up Q&A.

### Features

- Multi-depth research (quick, standard, deep)
- Source citations with links
- Follow-up Q&A mode
- Report generation (Markdown, HTML, PDF)
- Historical analysis

### Usage

```bash
# Interactive mode
python research-assistant.py

# Single query
python research-assistant.py --query "What's happening with Ethereum L2s?"

# Generate report
python research-assistant.py --query "DeFi trends" --report --depth deep

# Output formats
python research-assistant.py --query "BTC analysis" --format markdown
python research-assistant.py --query "BTC analysis" --format html
```

### Research Depths

| Depth | Articles | Sources | Time |
|-------|----------|---------|------|
| Quick | 10 | 3 | ~10s |
| Standard | 25 | 5 | ~30s |
| Deep | 50+ | 10+ | ~60s |

### Example Session

```
╔══════════════════════════════════════════════════════════════════╗
║                  🔬 CRYPTO RESEARCH ASSISTANT                    ║
╚══════════════════════════════════════════════════════════════════╝

You: What's the current state of Bitcoin ETFs?

🔍 Researching... (analyzing 25 articles from 8 sources)

══════════════════════════════════════════════════════════════════

📊 BITCOIN ETF ANALYSIS

**Summary:**
Bitcoin spot ETFs have seen unprecedented success since their January 2024
approval, with combined AUM exceeding $50 billion. BlackRock's IBIT leads
with $20B+ in assets.

**Key Findings:**

1. **Record Inflows** - ETFs saw $1.2B inflows this week alone [1][2]
2. **Institutional Adoption** - Major pension funds adding BTC exposure [3]
3. **Fee Competition** - Average fees dropped to 0.25% [4]
4. **Market Impact** - ETF demand absorbing 10x daily mining output [5]

**Sources:**
[1] CoinDesk - "Bitcoin ETF Inflows Hit Weekly Record" (2h ago)
[2] Bloomberg - "BlackRock ETF Dominates Crypto Flows" (5h ago)
[3] Reuters - "Pension Funds Eye Bitcoin Allocation" (1d ago)
[4] The Block - "ETF Fee Wars Intensify" (2d ago)
[5] Glassnode - "ETF Demand vs Mining Supply" (3d ago)

══════════════════════════════════════════════════════════════════

You: How does this compare to gold ETFs?

🔍 Researching follow-up...
```

---

## Alert Bot

Real-time news alerts to Discord, Slack, or Telegram.

### Features

- Keyword-based filtering
- Breaking news alerts
- Whale movement alerts
- Multi-channel support
- Rate limiting to avoid spam

### Usage

```bash
# Keyword alerts to Telegram
python alert-bot.py --keywords "bitcoin,regulation" --channel telegram

# Breaking news to Discord
python alert-bot.py --breaking --channel discord

# Whale alerts to Slack
python alert-bot.py --whales --min-amount 10000000 --channel slack

# Console testing
python alert-bot.py --keywords "bitcoin" --channel console
```

### Configuration

```yaml
# alert-config.yaml
channels:
  telegram:
    bot_token: "YOUR_BOT_TOKEN"
    chat_id: "-1001234567890"
  discord:
    webhook_url: "https://discord.com/api/webhooks/..."
  slack:
    webhook_url: "https://hooks.slack.com/services/..."

filters:
  keywords: ["bitcoin", "ethereum", "regulation", "sec", "etf"]
  min_sentiment_score: 0.5
  breaking_only: false
  
rate_limits:
  max_alerts_per_hour: 20
  cooldown_seconds: 30
```

### Alert Format

**Telegram:**
```
🚨 BREAKING NEWS

Bitcoin ETF sees record $1B single-day inflow

📰 Source: CoinDesk
⏰ 5 minutes ago
🟢 Sentiment: Bullish (0.82)

🔗 Read more: https://...
```

---

## Digest Bot

Scheduled AI-powered news digests.

### Features

- Daily/weekly/monthly schedules
- AI-generated summaries
- HTML email templates
- Slack/Discord delivery
- Top stories selection

### Usage

```bash
# Generate daily digest (console)
python digest-bot.py --frequency daily --generate-now

# HTML email digest
python digest-bot.py --frequency daily --output html --channel email

# Weekly roundup to Slack
python digest-bot.py --frequency weekly --channel slack

# Save to file
python digest-bot.py --frequency daily --output markdown --channel file
```

### Digest Example

```markdown
# 📰 Daily Crypto Digest
**February 2, 2026**

## 🔥 Top Stories

### 1. Bitcoin ETF Sees Record Inflows
Institutional demand continues to surge as spot Bitcoin ETFs recorded
their highest single-day inflows of $1.2 billion...
[Read more](https://...)

### 2. Ethereum Foundation Announces Roadmap
The latest technical roadmap focuses on scaling solutions and
improved staking mechanisms...
[Read more](https://...)

### 3. Solana DeFi TVL Reaches New ATH
Total Value Locked on Solana crosses $10 billion milestone...
[Read more](https://...)

## 📊 Market Sentiment
- **Overall:** Bullish (67/100)
- **Fear & Greed:** Greed (71)
- **BTC Sentiment:** Very Bullish
- **ETH Sentiment:** Bullish
- **SOL Sentiment:** Very Bullish

## 🐋 Notable Whale Activity
- 5,000 BTC moved from Coinbase to unknown wallet ($335M)
- 100,000 ETH deposited to staking contract ($345M)

## 📈 Market Movers
| Coin | Price | 24h Change |
|------|-------|------------|
| BTC | $67,234 | +2.3% |
| ETH | $3,456 | +1.8% |
| SOL | $145 | +5.2% |
```

---

## Sentiment Tracker

Live terminal dashboard for market sentiment monitoring.

### Features

- Real-time sentiment updates
- ASCII charts
- VADER + LLM hybrid analysis
- Trend detection
- Multi-asset tracking

### Usage

```bash
# Default dashboard
python sentiment-tracker.py

# Specific assets
python sentiment-tracker.py --assets BTC,ETH,SOL

# Export data
python sentiment-tracker.py --export sentiment.csv
```

### Dashboard

```
╔══════════════════════════════════════════════════════════════════╗
║                   📊 SENTIMENT TRACKER                           ║
╠══════════════════════════════════════════════════════════════════╣
║  Last Update: 2 seconds ago | Mode: Real-time                    ║
╚══════════════════════════════════════════════════════════════════╝

OVERALL MARKET SENTIMENT
████████████████████░░░░░░░░░░  67% BULLISH

ASSET SENTIMENTS
┌─────────┬───────────┬─────────┬─────────┬──────────────────────┐
│ Asset   │ Sentiment │ Score   │ Trend   │ Sparkline (24h)      │
├─────────┼───────────┼─────────┼─────────┼──────────────────────┤
│ BTC     │ BULLISH   │ +0.72   │ ↑ +0.15 │ ▂▃▄▅▆▆▇▇█▇▆▇        │
│ ETH     │ BULLISH   │ +0.58   │ ↑ +0.08 │ ▃▄▄▅▅▆▆▆▇▆▆▇        │
│ SOL     │ V.BULLISH │ +0.85   │ ↑ +0.22 │ ▂▃▄▅▆▇▇██▇█▇        │
│ XRP     │ NEUTRAL   │ +0.12   │ ↓ -0.05 │ ▄▅▅▄▄▄▃▃▄▄▄▅        │
│ ADA     │ BEARISH   │ -0.31   │ ↓ -0.18 │ ▆▅▅▄▄▃▃▂▂▃▂▂        │
└─────────┴───────────┴─────────┴─────────┴──────────────────────┘

RECENT SENTIMENT SHIFTS
• 10m ago: SOL sentiment jumped +0.15 (DeFi TVL news)
• 25m ago: ADA sentiment dropped -0.12 (delayed update)
• 1h ago:  BTC sentiment rose +0.08 (ETF inflows)

[Press 'q' to quit, 'r' to refresh, 's' to export]
```

---

## Requirements

```txt
# requirements.txt
langchain>=0.1.0
langchain-openai>=0.0.5
langchain-anthropic>=0.1.0
requests>=2.31.0
pandas>=2.0.0
rich>=13.0.0
python-telegram-bot>=20.0
discord.py>=2.0.0
slack-sdk>=3.0.0
schedule>=1.2.0
```

---

## Related

- [AI Platforms Integration](ai-platforms.md)
- [LangChain Tool](langchain.md)
- [API Reference](../API.md)

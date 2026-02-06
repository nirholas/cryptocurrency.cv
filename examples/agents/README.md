# 🤖 AI Agent Templates

Production-ready AI agent templates for cryptocurrency news and trading applications. Built with LangChain and designed for real-world deployment.

## Available Agents

| Agent | Description | Key Features |
|-------|-------------|--------------|
| [Trading Bot](trading-bot.py) | AI-powered trading signal generator | Multi-strategy, sentiment analysis, LangChain tools |
| [Research Assistant](research-assistant.py) | Deep-dive crypto research with citations | Multi-depth research, follow-up Q&A, report generation |
| [Alert Bot](alert-bot.py) | Real-time news alerts | Telegram/Discord/Slack, keyword filters, whale tracking |
| [Digest Bot](digest-bot.py) | Scheduled AI news digests | Email/Slack delivery, HTML templates, scheduling |
| [Sentiment Tracker](sentiment-tracker.py) | Live sentiment dashboard | VADER+LLM hybrid, terminal charts, trend detection |

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set your API keys
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."

# 3. Run any agent!
```

### Trading Bot

```bash
# Generate trading signals for Bitcoin
python trading-bot.py --coin btc --strategy moderate

# Scan top 10 coins for opportunities
python trading-bot.py --scan --limit 10

# Output: trading_signals.json
```

### Research Assistant

```bash
# Interactive mode
python research-assistant.py

# Single query
python research-assistant.py --query "What's happening with Ethereum L2s?"

# Generate full report
python research-assistant.py --query "DeFi trends" --report --depth deep
```

### Alert Bot

```bash
# Keyword alerts to Telegram
python alert-bot.py --keywords "bitcoin,regulation" --channel telegram

# Breaking news only to Discord
python alert-bot.py --breaking --channel discord

# Whale movement alerts
python alert-bot.py --whales --min-amount 10000000 --channel slack

# Console testing (no setup required)
python alert-bot.py --keywords "bitcoin" --channel console
```

### Digest Bot

```bash
# Generate daily digest (console)
python digest-bot.py --frequency daily --generate-now

# HTML email digest
python digest-bot.py --frequency daily --output html --channel email

# Weekly roundup to file
python digest-bot.py --frequency weekly --output markdown --channel file

# Scheduled delivery (cron format)
python digest-bot.py --schedule "0 8 * * *" --channel email
```

### Sentiment Tracker

```bash
# Live dashboard
python sentiment-tracker.py --coins btc,eth,sol

# All major coins with alerts
python sentiment-tracker.py --all-coins --alert-threshold 0.3

# Export to CSV
python sentiment-tracker.py --coins btc,eth --export csv

# Historical analysis
python sentiment-tracker.py --historical --hours 24
```

## Environment Variables

```bash
# LLM Providers (pick one or more)
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."

# Messaging (Alert Bot)
export TELEGRAM_BOT_TOKEN="..."
export TELEGRAM_CHAT_ID="..."
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
export SLACK_WEBHOOK_URL="https://hooks.slack.com/..."

# Email (Digest Bot)
export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="you@gmail.com"
export SMTP_PASSWORD="app-password"
export DIGEST_EMAIL_TO="recipient@example.com"
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Free Crypto News API                      │
│            https://cryptocurrency.cv/api/*             │
│                                                              │
│  /api/news    /api/search    /api/trending    /api/breaking │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Agent Templates                          │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Trading  │  │ Research │  │  Alert   │  │  Digest  │    │
│  │   Bot    │  │ Assistant│  │   Bot    │  │   Bot    │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
│       └─────────────┴──────┬──────┴─────────────┘           │
│                            │                                 │
│              ┌─────────────┴─────────────┐                  │
│              │   LangChain Tool Layer    │                  │
│              │  @tool get_news, search   │                  │
│              └─────────────┬─────────────┘                  │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 LLM Provider Layer                    │   │
│  │    OpenAI (GPT-4)  │  Anthropic (Claude)  │  Ollama  │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│              ┌─────────────┴─────────────┐    ┌──────────┐  │
│              │    Sentiment Tracker      │◀──▶│ Dashboard│  │
│              │   VADER + LLM Hybrid      │    └──────────┘  │
│              └───────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Output Channels                           │
│                                                              │
│  📱 Telegram  │  💬 Discord  │  💼 Slack  │  📧 Email       │
│  🖥️ Console   │  📁 Files    │  🌐 Webhooks                 │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints Used

| Endpoint | Description | Used By |
|----------|-------------|---------|
| `/api/news` | Latest news (130+ sources) | All agents |
| `/api/search?q=` | Keyword search | Research, Trading |
| `/api/news/{category}` | Category-filtered news | Digest |
| `/api/trending` | Trending topics | Research, Digest |
| `/api/breaking` | Breaking news | Alert, Digest |
| `/api/whales` | Whale transactions | Alert |

## Extending Agents

Each agent is designed to be easily extended:

```python
# Add a new LangChain tool to any agent
from langchain_core.tools import tool

@tool
def my_custom_tool(query: str) -> str:
    """Description for the LLM."""
    # Your implementation
    return result

# Add to agent's tool list
agent = create_react_agent(llm, [get_news, search, my_custom_tool])
```

## License

MIT - Use freely in your projects!

## Related

- [Free Crypto News API](https://cryptocurrency.cv) - The underlying API
- [LangChain Tool](../langchain-tool.py) - Simple LangChain integration
- [Sentiment Analysis](../sentiment-analysis.py) - Standalone sentiment tool

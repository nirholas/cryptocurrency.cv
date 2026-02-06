# 🤖 AI Platform Integration Examples

Complete tutorials for using Free Crypto News API with various AI assistants and platforms.

## Supported Platforms

| Platform | Type | Integration Method | Tutorial |
|----------|------|-------------------|----------|
| [ChatGPT](#chatgpt) | OpenAI | Custom GPT / Plugin / Developer Mode | [chatgpt.md](chatgpt.md) |
| [Claude](#claude) | Anthropic | MCP Server (stdio) | [claude.md](claude.md) |
| [LobeHub](#lobehub) | Open Source | Plugin System | [lobehub.md](lobehub.md) |
| [OpenWebUI](#openwebui) | Open Source | Tools / Functions | [openwebui.md](openwebui.md) |
| [Cursor](#cursor) | AI IDE | MCP / Direct API | [cursor.md](cursor.md) |
| [Windsurf](#windsurf) | AI IDE | MCP / Context | [windsurf.md](windsurf.md) |
| [Continue.dev](#continuedev) | VSCode Extension | Context Provider | [continue.md](continue.md) |
| [LangChain](#langchain) | Framework | Custom Tool | [langchain.md](langchain.md) |
| [AutoGPT](#autogpt) | Agent | Plugin | [autogpt.md](autogpt.md) |
| [CrewAI](#crewai) | Agent Framework | Tool | [crewai.md](crewai.md) |

---

## Quick Comparison

| Platform | Best For | Setup Complexity | Real-time | MCP Support |
|----------|----------|------------------|-----------|-------------|
| ChatGPT | General users | ⭐ Easy | ❌ | ✅ via SSE |
| Claude | Power users | ⭐⭐ Medium | ✅ | ✅ Native |
| LobeHub | Self-hosted | ⭐⭐ Medium | ✅ | ✅ Gateway |
| OpenWebUI | Local LLMs | ⭐⭐ Medium | ✅ | ❌ |
| Cursor | Developers | ⭐ Easy | ✅ | ✅ Native |
| Windsurf | Developers | ⭐ Easy | ✅ | ✅ Native |
| Continue.dev | VSCode users | ⭐⭐ Medium | ✅ | ✅ Native |
| LangChain | Python/JS devs | ⭐⭐⭐ Advanced | ✅ | ❌ |
| AutoGPT | Autonomous agents | ⭐⭐⭐ Advanced | ✅ | ❌ |
| CrewAI | Multi-agent teams | ⭐⭐⭐ Advanced | ✅ | ❌ |

---

## ChatGPT

### Method 1: Custom GPT (Easiest)

1. Go to [ChatGPT GPT Builder](https://chat.openai.com/gpts/editor)
2. Create a new GPT
3. Add this to the Instructions:

```
You are a crypto news expert. Use the Free Crypto News API to fetch real-time cryptocurrency news.

API Base: https://cryptocurrency.cv

Available endpoints:
- GET /api/news - Latest news
- GET /api/search?q={query} - Search news
- GET /api/ai/sentiment?asset={symbol} - Get sentiment
- GET /api/market/fear-greed - Fear & Greed Index
- GET /api/trending - Trending topics
```

4. Under "Actions", add the OpenAPI schema from:
   `https://cryptocurrency.cv/chatgpt/openapi.yaml`

### Method 2: Developer Mode (Advanced)

See [chatgpt.md](chatgpt.md) for full MCP/SSE integration.

---

## Claude

### Claude Desktop Integration

1. Install the MCP server:
```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news/mcp
npm install
```

2. Add to Claude config (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "crypto-news": {
      "command": "node",
      "args": ["/path/to/free-crypto-news/mcp/index.js"]
    }
  }
}
```

3. Restart Claude Desktop

4. Try: "Get me the latest Bitcoin news with sentiment analysis"

---

## LobeHub

See [lobehub.md](lobehub.md) for full setup with plugin manifest and agent configuration.

---

## OpenWebUI

OpenWebUI supports custom tools/functions that can call our API:

1. Open **Workspace** → **Tools** → **Create Tool**
2. Paste the Python tool code from [openwebui.md](openwebui.md)
3. Save and use in any chat

See [openwebui.md](openwebui.md) for complete tool implementations.

---

## Cursor

Cursor AI supports MCP servers natively:

1. Open Settings → Features → MCP
2. Add the crypto-news server configuration
3. Use tools in Chat or Composer

See [cursor.md](cursor.md) for full tutorial with code generation examples.

---

## Windsurf

Windsurf supports MCP and Cascade for autonomous coding:

1. Configure MCP in `~/.codeium/windsurf/mcp_config.json`
2. Use Memories for persistent API context
3. Let Cascade build complete features

See [windsurf.md](windsurf.md) for complete integration guide.

---

## Continue.dev

Continue.dev VSCode extension supports MCP and custom context providers:

1. Add MCP server to `~/.continue/config.json`
2. Create slash commands for common tasks
3. Use @docs for API reference

See [continue.md](continue.md) for full configuration examples.

---

## LangChain

LangChain integration for Python and JavaScript:

```python
from langchain.tools import tool
import requests

@tool
def get_crypto_news(limit: int = 10) -> str:
    """Get latest crypto news."""
    response = requests.get(
        "https://cryptocurrency.cv/api/news",
        params={"limit": limit}
    )
    return response.json()
```

See [langchain.md](langchain.md) for complete toolkit, agents, and RAG examples.

---

## AutoGPT

AutoGPT plugin for autonomous crypto research:

1. Clone the plugin to `autogpt/plugins/crypto_news_plugin`
2. Add to `ALLOWLISTED_PLUGINS` in `.env`
3. Use commands like `crypto_news`, `crypto_sentiment`

See [autogpt.md](autogpt.md) for full plugin implementation.

---

## CrewAI

CrewAI multi-agent integration for collaborative research:

```python
from crewai import Agent, Crew
from crypto_tools import CRYPTO_TOOLS

analyst = Agent(
    role="Crypto Analyst",
    tools=CRYPTO_TOOLS
)

crew = Crew(agents=[analyst], tasks=[...])
crew.kickoff()
```

See [crewai.md](crewai.md) for complete crew implementations.

---

## Getting Started

1. Choose your platform from the list above
2. Follow the step-by-step tutorial
3. Start asking about crypto news!

**No API key required** for basic usage.

---

## All Tutorials

| Tutorial | Lines | Description |
|----------|-------|-------------|
| [chatgpt.md](chatgpt.md) | ~400 | Custom GPT, Plugin, Developer Mode MCP |
| [claude.md](claude.md) | ~450 | MCP Server, Projects, API examples |
| [lobehub.md](lobehub.md) | ~500 | Plugin manifest, Agent, MCP Gateway |
| [openwebui.md](openwebui.md) | ~500 | Tools/Functions, Model Files, RAG |
| [cursor.md](cursor.md) | ~450 | MCP, Docs, Notepads, Rules |
| [windsurf.md](windsurf.md) | ~400 | MCP, Memories, Cascade |
| [continue.md](continue.md) | ~400 | MCP, Context Providers, Slash Commands |
| [langchain.md](langchain.md) | ~600 | Tools, Agents, LangGraph, RAG |
| [autogpt.md](autogpt.md) | ~500 | Plugin, Commands, Agent Goals |
| [crewai.md](crewai.md) | ~600 | Tools, Crews, Hierarchical Agents |

**Total: ~4,800 lines of tutorials across 10 platforms**

---

## API Quick Reference

```bash
# Latest news
curl https://cryptocurrency.cv/api/news?limit=10

# Search
curl "https://cryptocurrency.cv/api/search?q=bitcoin+etf"

# Sentiment
curl https://cryptocurrency.cv/api/ai/sentiment?asset=BTC

# Fear & Greed
curl https://cryptocurrency.cv/api/market/fear-greed

# Trending
curl https://cryptocurrency.cv/api/trending
```

---

## MCP Server

For Claude, Cursor, Windsurf, Continue.dev, and other MCP-compatible tools:

**Local (stdio):**
```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news/mcp && npm install
```

**Remote (SSE):**
```
https://plugins.support/sse
```

---

## Links

- **API Documentation:** https://cryptocurrency.cv/docs/api
- **MCP Server:** /mcp/ in this repository
- **OpenAPI Schema:** https://cryptocurrency.cv/chatgpt/openapi.yaml
- **Code Examples:** ../python/, ../javascript/, ../typescript/
- **GitHub:** https://github.com/nirholas/free-crypto-news

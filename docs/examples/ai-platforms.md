# AI Platforms Integration

Complete tutorials for using Free Crypto News with AI assistants and development tools.

## Supported Platforms

| Platform | Type | Method | Setup Time |
|----------|------|--------|------------|
| [ChatGPT](#chatgpt) | OpenAI | Custom GPT / Plugin | 5 min |
| [Claude](#claude) | Anthropic | MCP Server | 5 min |
| [LobeHub](#lobehub) | Open Source | Plugin System | 10 min |
| [OpenWebUI](#openwebui) | Local LLMs | Functions | 10 min |
| [Cursor](#cursor) | AI IDE | MCP / Direct | 2 min |
| [Windsurf](#windsurf) | AI IDE | MCP | 2 min |
| [Continue.dev](#continuedev) | VS Code | Context Provider | 5 min |
| [LangChain](#langchain) | Framework | Custom Tool | 5 min |
| [AutoGPT](#autogpt) | Agent | Plugin | 10 min |
| [CrewAI](#crewai) | Multi-Agent | Tool | 10 min |

---

## ChatGPT

### Method 1: Custom GPT (Easiest)

1. Go to [ChatGPT GPT Builder](https://chat.openai.com/gpts/editor)
2. Create a new GPT
3. Add these instructions:

```
You are a crypto news expert. Use the Free Crypto News API to fetch real-time cryptocurrency news.

API Base: https://cryptocurrency.cv

Available endpoints:
- GET /api/news - Latest news
- GET /api/search?q={query} - Search news  
- GET /api/ai/sentiment?asset={symbol} - Get sentiment
- GET /api/fear-greed - Fear & Greed Index
- GET /api/trending - Trending topics
```

4. Under **Actions**, import the OpenAPI schema:
   ```
   https://cryptocurrency.cv/chatgpt/openapi.yaml
   ```

### Method 2: ChatGPT Actions

Add this OpenAPI spec to your GPT:

```yaml
openapi: 3.0.0
info:
  title: Free Crypto News
  version: 1.0.0
servers:
  - url: https://cryptocurrency.cv
paths:
  /api/news:
    get:
      operationId: getNews
      summary: Get latest crypto news
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: News articles
  /api/search:
    get:
      operationId: searchNews
      summary: Search news articles
      parameters:
        - name: q
          in: query
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Search results
```

---

## Claude

### Claude Desktop (MCP)

1. Install the MCP server:
```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news/mcp
npm install
```

2. Add to Claude config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

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

4. Try: *"Get me the latest Bitcoin news with sentiment analysis"*

### Available Tools (40+)

| Category | Tools |
|----------|-------|
| News | `get_news`, `search_news`, `get_breaking`, `get_by_source` |
| Market | `get_fear_greed`, `get_trending`, `get_prices` |
| AI | `get_sentiment`, `analyze_article`, `get_digest` |
| Trading | `get_signals`, `get_whales`, `get_arbitrage` |

---

## LobeHub

### Plugin Configuration

1. Open LobeHub Settings → Plugins
2. Add custom plugin with this manifest:

```json
{
  "identifier": "crypto-news",
  "manifest": "https://cryptocurrency.cv/.well-known/ai-plugin.json",
  "type": "custom"
}
```

3. Enable the plugin

### Agent Configuration

Create a crypto-focused agent:

```yaml
name: Crypto Analyst
description: Real-time crypto news and market analysis
plugins:
  - crypto-news
systemPrompt: |
  You are a cryptocurrency analyst with access to real-time news.
  Use the crypto-news plugin to fetch current market data.
  Always cite your sources and provide balanced analysis.
```

---

## OpenWebUI

### Function Setup

1. Go to **Workspace** → **Functions**
2. Create new function:

```python
"""
title: Crypto News
description: Fetch real-time cryptocurrency news
author: Free Crypto News
version: 1.0.0
"""

import requests

class Tools:
    def __init__(self):
        self.base_url = "https://cryptocurrency.cv"
    
    def get_news(self, limit: int = 10) -> str:
        """Get latest crypto news."""
        response = requests.get(f"{self.base_url}/api/news?limit={limit}")
        articles = response.json().get("articles", [])
        return "\n".join([f"• {a['title']} ({a['source']})" for a in articles])
    
    def search_news(self, query: str) -> str:
        """Search crypto news."""
        response = requests.get(f"{self.base_url}/api/search?q={query}")
        articles = response.json().get("articles", [])
        return "\n".join([f"• {a['title']} ({a['source']})" for a in articles])
    
    def get_sentiment(self, asset: str = "BTC") -> str:
        """Get sentiment for a cryptocurrency."""
        response = requests.get(f"{self.base_url}/api/ai/sentiment?asset={asset}")
        data = response.json()
        return f"{asset}: {data['label']} (score: {data['score']:.2f})"
```

---

## Cursor

### MCP Integration

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "crypto-news": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-crypto-news"]
    }
  }
}
```

### Direct API Context

Add to your project's context:

```markdown
## Crypto News API

Base URL: https://cryptocurrency.cv

### Endpoints
- GET /api/news - Latest news
- GET /api/search?q={query} - Search
- GET /api/ai/sentiment?asset={symbol} - Sentiment
- GET /api/fear-greed - Market index
```

---

## Windsurf

### MCP Configuration

Add to Windsurf settings:

```json
{
  "mcp": {
    "servers": {
      "crypto-news": {
        "command": "node",
        "args": ["path/to/mcp/index.js"]
      }
    }
  }
}
```

### Cascade Context

Add a `.cascade/context.md`:

```markdown
# Project Context

This project uses the Free Crypto News API for market data.

API Base: https://cryptocurrency.cv
- /api/news - Get latest news
- /api/ai/sentiment - Get market sentiment
- /api/fear-greed - Fear & Greed Index
```

---

## Continue.dev

### Context Provider

Add to `.continue/config.json`:

```json
{
  "contextProviders": [
    {
      "name": "crypto-news",
      "params": {
        "apiUrl": "https://cryptocurrency.cv"
      }
    }
  ],
  "customCommands": [
    {
      "name": "crypto",
      "description": "Get crypto news context",
      "prompt": "Fetch the latest crypto news from the API and summarize"
    }
  ]
}
```

### Custom Provider

```typescript
// .continue/providers/crypto-news.ts
import { ContextProvider } from "@anthropic/continue";

export default {
  name: "crypto-news",
  async getContext(query: string) {
    const response = await fetch(
      `https://cryptocurrency.cv/api/search?q=${query}`
    );
    const { articles } = await response.json();
    return articles.map(a => ({
      title: a.title,
      content: a.description,
      source: a.source
    }));
  }
};
```

---

## LangChain

### Python Tool

```python
from langchain.tools import tool
import requests

@tool
def get_crypto_news(query: str = "") -> str:
    """Get the latest cryptocurrency news. Optionally filter by search query."""
    base_url = "https://cryptocurrency.cv"
    
    if query:
        url = f"{base_url}/api/search?q={query}&limit=10"
    else:
        url = f"{base_url}/api/news?limit=10"
    
    response = requests.get(url)
    articles = response.json().get("articles", [])
    
    return "\n".join([
        f"• {a['title']} ({a['source']}, {a['timeAgo']})"
        for a in articles
    ])

@tool
def get_crypto_sentiment(asset: str) -> str:
    """Get sentiment analysis for a cryptocurrency symbol (e.g., BTC, ETH)."""
    url = f"https://cryptocurrency.cv/api/ai/sentiment?asset={asset}"
    response = requests.get(url)
    data = response.json()
    return f"{asset}: {data['label']} (score: {data['score']:.2f}, confidence: {data['confidence']:.0%})"
```

### Agent Setup

```python
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.prompts import ChatPromptTemplate

llm = ChatOpenAI(model="gpt-4")
tools = [get_crypto_news, get_crypto_sentiment]

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a crypto analyst. Use tools to fetch real-time data."),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}")
])

agent = create_openai_functions_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools)

result = executor.invoke({"input": "What's the latest on Bitcoin?"})
```

---

## AutoGPT

### Plugin Structure

```
autogpt-crypto-news/
├── __init__.py
├── crypto_news.py
└── ai_plugin.json
```

**crypto_news.py:**
```python
import requests

class CryptoNewsPlugin:
    def __init__(self):
        self.base_url = "https://cryptocurrency.cv"
    
    def get_news(self, limit: int = 10) -> list:
        response = requests.get(f"{self.base_url}/api/news?limit={limit}")
        return response.json().get("articles", [])
    
    def search(self, query: str) -> list:
        response = requests.get(f"{self.base_url}/api/search?q={query}")
        return response.json().get("articles", [])
```

---

## CrewAI

### Tool Definition

```python
from crewai_tools import BaseTool
import requests

class CryptoNewsTool(BaseTool):
    name: str = "crypto_news"
    description: str = "Fetch real-time cryptocurrency news"
    
    def _run(self, query: str = "") -> str:
        if query:
            url = f"https://cryptocurrency.cv/api/search?q={query}"
        else:
            url = "https://cryptocurrency.cv/api/news?limit=10"
        
        response = requests.get(url)
        articles = response.json().get("articles", [])
        
        return "\n".join([f"• {a['title']}" for a in articles])
```

### Crew Setup

```python
from crewai import Agent, Task, Crew

researcher = Agent(
    role="Crypto Researcher",
    goal="Find and analyze cryptocurrency news",
    tools=[CryptoNewsTool()],
    backstory="Expert crypto analyst with real-time market access"
)

task = Task(
    description="Research the latest Bitcoin developments",
    agent=researcher
)

crew = Crew(agents=[researcher], tasks=[task])
result = crew.kickoff()
```

---

## Related

- [MCP Server Documentation](../integrations/mcp.md)
- [AI Agents](agents.md)
- [API Reference](../API.md)

# Integration Examples

> Copy-paste integrations for Python, JavaScript/TypeScript, ChatGPT, MCP, LangChain, Discord, Telegram, HTML widgets, cURL, and the hosted MCP HTTP gateway.
>
> Moved here from the project README. Back to the [reference index](https://github.com/nirholas/cryptocurrency.cv/blob/main/README.md).

Pick your platform. Copy the code. Ship it.

---

## 🐍 Python

**Zero dependencies.** Just copy the file.

```bash
curl -O https://raw.githubusercontent.com/nirholas/cryptocurrency.cv/main/sdk/python/crypto_news.py
```

```python
from crypto_news import CryptoNews

news = CryptoNews()

# Get latest news
for article in news.get_latest(5):
    print(f"📰 {article['title']}")
    print(f"   {article['source']} • {article['timeAgo']}")
    print(f"   {article['link']}\n")

# Search for topics
eth_news = news.search("ethereum,etf", limit=5)

# DeFi news
defi = news.get_defi(5)

# Bitcoin news
btc = news.get_bitcoin(5)

# Breaking (last 2 hours)
breaking = news.get_breaking(5)
```

**One-liner:**

```python
import urllib.request, json
news = json.loads(urllib.request.urlopen("https://cryptocurrency.cv/api/news?limit=5").read())
print(news["articles"][0]["title"])
```

---

## 🟨 JavaScript / TypeScript

**Works in Node.js and browsers.**

### TypeScript SDK (npm)

```bash
npm install @nirholas/crypto-news
```

```typescript
import { CryptoNews } from "@nirholas/crypto-news";

const client = new CryptoNews();

// Fully typed responses
const articles = await client.getLatest(10);
const health = await client.getHealth();
```

### Vanilla JavaScript

```bash
curl -O https://raw.githubusercontent.com/nirholas/cryptocurrency.cv/main/sdk/javascript/crypto-news.js
```

```javascript
import { CryptoNews } from "./crypto-news.js";

const news = new CryptoNews();

// Get latest
const articles = await news.getLatest(5);
articles.forEach((a) => console.log(`${a.title} - ${a.source}`));

// Search
const eth = await news.search("ethereum");

// DeFi / Bitcoin / Breaking
const defi = await news.getDefi(5);
const btc = await news.getBitcoin(5);
const breaking = await news.getBreaking(5);
```

**One-liner:**

```javascript
const news = await fetch(
  "https://cryptocurrency.cv/api/news?limit=5",
).then((r) => r.json());
console.log(news.articles[0].title);
```

---

## 🤖 ChatGPT (Custom GPT)

Build a crypto news GPT in 2 minutes.

1. Go to [chat.openai.com](https://chat.openai.com) → Create GPT
2. Click **Configure** → **Actions** → **Create new action**
3. Paste this OpenAPI schema:

```yaml
openapi: 3.1.0
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
            default: 10
  /api/search:
    get:
      operationId: searchNews
      summary: Search crypto news
      parameters:
        - name: q
          in: query
          required: true
          schema:
            type: string
  /api/defi:
    get:
      operationId: getDefiNews
      summary: Get DeFi news
  /api/bitcoin:
    get:
      operationId: getBitcoinNews
      summary: Get Bitcoin news
  /api/breaking:
    get:
      operationId: getBreakingNews
      summary: Get breaking news
```

4. No authentication needed
5. Save and test: _"What's the latest crypto news?"_

Full schema: [`chatgpt/openapi.yaml`](https://github.com/nirholas/cryptocurrency.cv/blob/main/chatgpt/openapi.yaml)

---

## 🔮 MCP Server (Claude Desktop & ChatGPT Developer Mode)

The MCP server gives AI assistants live crypto news. The hosted endpoint exposes **47 tools**; the local package exposes **55 tools, 6 resources and 3 prompts** (full list in [`mcp/README.md`](https://github.com/nirholas/cryptocurrency.cv/blob/main/mcp/README.md)).

### Option 0: Hosted endpoint, zero install

A Streamable-HTTP endpoint runs at `https://cryptocurrency.cv/api/mcp`. Claude Desktop, Claude Code, Cursor, and any other Streamable-HTTP client can use it without cloning anything:

```json
{
  "mcpServers": {
    "crypto-news": {
      "url": "https://cryptocurrency.cv/api/mcp"
    }
  }
}
```

```bash
claude mcp add --transport http crypto-news https://cryptocurrency.cv/api/mcp
```

### Sample tools

| Tool                    | Description                    |
| ----------------------- | ------------------------------ |
| `get_crypto_news`       | Latest news from 358 sources   |
| `search_crypto_news`    | Search by keywords             |
| `get_defi_news`         | DeFi-specific news             |
| `get_bitcoin_news`      | Bitcoin-specific news          |
| `get_breaking_news`     | Breaking news (last 2 hours)   |
| `get_news_sources`      | List all sources               |
| `get_api_health`        | API health check               |
| `get_trending_topics`   | Trending topics with sentiment |
| `get_crypto_stats`      | Analytics & statistics         |
| `analyze_news`          | News with sentiment analysis   |
| `get_archive`           | Historical news archive        |
| `get_archive_stats`     | Archive statistics             |
| `find_original_sources` | Original source tracking       |
| `get_portfolio_news`    | Portfolio news with prices     |

### Option 1: hosted endpoint (nothing to install)

`https://cryptocurrency.cv/api/mcp` speaks Streamable HTTP, is stateless, and
needs no key. 47 tools.

```bash
claude mcp add --transport http crypto-news https://cryptocurrency.cv/api/mcp
```

Claude Desktop, Cursor and Windsurf take the same URL:

```json
{
  "mcpServers": {
    "crypto-news": {
      "url": "https://cryptocurrency.cv/api/mcp"
    }
  }
}
```

### Option 2: local stdio server

The published package is `@nirholas/free-crypto-news-mcp` (55 tools, 6
resources, 3 prompts).

**Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "crypto-news": {
      "command": "npx",
      "args": ["-y", "@nirholas/free-crypto-news-mcp"]
    }
  }
}
```

To run from source instead, build it first: the entry point is `dist/index.js`,
which only exists after `npm run build`.

```bash
git clone https://github.com/nirholas/cryptocurrency.cv.git
cd cryptocurrency.cv/mcp && npm install && npm run build
```

```json
{
  "mcpServers": {
    "crypto-news": {
      "command": "node",
      "args": ["/absolute/path/to/cryptocurrency.cv/mcp/dist/index.js"]
    }
  }
}
```

**Restart Claude.** Ask: _"Get me the latest crypto news"_

### Option 3: ChatGPT Developer Mode

1. Enable Developer Mode in Settings → Apps → Advanced
2. Create a new app pointing at `https://cryptocurrency.cv/api/mcp`
3. No authentication needed

To self-host that HTTP endpoint, `npm run start:http` in `mcp/` serves it at
`POST /mcp` on `PORT` (default 3333). There is no SSE transport: Streamable
HTTP replaced it in the MCP spec.

Full documentation: [`mcp/README.md`](https://github.com/nirholas/cryptocurrency.cv/blob/main/mcp/README.md)

---

## 🦜 LangChain

```python
from langchain.tools import tool
import requests

@tool
def get_crypto_news(limit: int = 5) -> str:
    """Get latest cryptocurrency news from 358 sources."""
    r = requests.get(f"https://cryptocurrency.cv/api/news?limit={limit}")
    return "\n".join([f"• {a['title']} ({a['source']})" for a in r.json()["articles"]])

@tool
def search_crypto_news(query: str) -> str:
    """Search crypto news by keyword."""
    r = requests.get(f"https://cryptocurrency.cv/api/search?q={query}")
    return "\n".join([f"• {a['title']}" for a in r.json()["articles"]])

# Use in your agent
tools = [get_crypto_news, search_crypto_news]
```

Full example: [`examples/langchain-tool.py`](https://github.com/nirholas/cryptocurrency.cv/blob/main/examples/langchain-tool.py)

---

## 🎮 Discord Bot

```javascript
const { Client, EmbedBuilder } = require("discord.js");

client.on("messageCreate", async (msg) => {
  if (msg.content === "!news") {
    const { articles } = await fetch(
      "https://cryptocurrency.cv/api/breaking?limit=5",
    ).then((r) => r.json());

    const embed = new EmbedBuilder()
      .setTitle("🚨 Breaking Crypto News")
      .setColor(0x00ff00);

    articles.forEach((a) =>
      embed.addFields({
        name: a.source,
        value: `[${a.title}](${a.link})`,
      }),
    );

    msg.channel.send({ embeds: [embed] });
  }
});
```

Full bot: [`examples/discord-bot.js`](https://github.com/nirholas/cryptocurrency.cv/blob/main/examples/discord-bot.js)

---

## 🤖 Telegram Bot

```python
from telegram import Update
from telegram.ext import Application, CommandHandler
import aiohttp

async def news(update: Update, context):
    async with aiohttp.ClientSession() as session:
        async with session.get('https://cryptocurrency.cv/api/news?limit=5') as r:
            data = await r.json()

    msg = "📰 *Latest Crypto News*\n\n"
    for a in data['articles']:
        msg += f"• [{a['title']}]({a['link']})\n"

    await update.message.reply_text(msg, parse_mode='Markdown')

app = Application.builder().token("YOUR_TOKEN").build()
app.add_handler(CommandHandler("news", news))
app.run_polling()
```

Full bot: [`examples/telegram-bot.py`](https://github.com/nirholas/cryptocurrency.cv/blob/main/examples/telegram-bot.py)

---

## 🌐 HTML Widget

Embed on any website:

```html
<script>
  async function loadNews() {
    const { articles } = await fetch(
      "https://cryptocurrency.cv/api/news?limit=5",
    ).then((r) => r.json());
    document.getElementById("news").innerHTML = articles
      .map(
        (a) =>
          `<div><a href="${a.link}">${a.title}</a> <small>${a.source}</small></div>`,
      )
      .join("");
  }
  loadNews();
</script>
<div id="news">Loading...</div>
```

Full styled widget: [`widget/crypto-news-widget.html`](https://github.com/nirholas/cryptocurrency.cv/blob/main/widget/crypto-news-widget.html)

---

## 🖥️ cURL / Terminal

```bash
# Latest news
curl -s https://cryptocurrency.cv/api/news | jq '.articles[:3]'

# Search
curl -s "https://cryptocurrency.cv/api/search?q=bitcoin,etf" | jq

# DeFi news
curl -s https://cryptocurrency.cv/api/defi | jq

# Pretty print titles
curl -s https://cryptocurrency.cv/api/news | jq -r '.articles[] | "📰 \(.title) (\(.source))"'
```


---

## 🤖 Integrations

- **Claude Desktop MCP**: [`/mcp`](https://github.com/nirholas/cryptocurrency.cv/tree/main/mcp)
- **ChatGPT Plugin**: [`/chatgpt`](https://github.com/nirholas/cryptocurrency.cv/tree/main/chatgpt)
- **Postman Collection**: [`/postman`](https://github.com/nirholas/cryptocurrency.cv/tree/main/postman)
- **Bot Examples**: Discord, Telegram, Slack in [`/examples`](https://github.com/nirholas/cryptocurrency.cv/tree/main/examples)
- **Embeddable Widget**: [`/widget`](https://github.com/nirholas/cryptocurrency.cv/tree/main/widget)


---

## 🌐 Live HTTP Deployment

**Free Crypto News** is deployed and accessible over HTTP via [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http) transport — no local installation required.

**Endpoint:**
```
https://modelcontextprotocol.name/mcp/free-crypto-news
```

### Connect from any MCP Client

Add to your MCP client configuration (Claude Desktop, Cursor, SperaxOS, etc.):

```json
{
  "mcpServers": {
    "free-crypto-news": {
      "type": "http",
      "url": "https://modelcontextprotocol.name/mcp/free-crypto-news"
    }
  }
}
```

### Available Tools (4)

| Tool | Description |
|------|-------------|
| `get_latest_news` | Get latest cryptocurrency news |
| `get_bitcoin_news` | Bitcoin-specific news |
| `get_ethereum_news` | Ethereum-specific news |
| `get_defi_news` | DeFi-related news |

### Example Requests

**Get latest cryptocurrency news:**
```bash
curl -X POST https://modelcontextprotocol.name/mcp/free-crypto-news \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_latest_news","arguments":{"limit":5}}}'
```

**Bitcoin-specific news:**
```bash
curl -X POST https://modelcontextprotocol.name/mcp/free-crypto-news \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_bitcoin_news","arguments":{"limit":5}}}'
```

**Ethereum-specific news:**
```bash
curl -X POST https://modelcontextprotocol.name/mcp/free-crypto-news \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_ethereum_news","arguments":{"limit":5}}}'
```

### List All Tools

```bash
curl -X POST https://modelcontextprotocol.name/mcp/free-crypto-news \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Also Available On

- **[SperaxOS](https://chat.sperax.io)** — Browse and install from the [MCP marketplace](https://chat.sperax.io/community/mcp)
- **All 27 MCP servers** — See the full catalog at [modelcontextprotocol.name](https://modelcontextprotocol.name)

> Powered by [modelcontextprotocol.name](https://modelcontextprotocol.name) — the open MCP HTTP gateway

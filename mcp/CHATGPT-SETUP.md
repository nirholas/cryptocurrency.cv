# ChatGPT Developer Mode Setup Guide

Complete guide for using Free Crypto News MCP with ChatGPT Developer Mode.

## Prerequisites

✅ ChatGPT Pro, Plus, Business, Enterprise, or Education account  
✅ Developer Mode enabled in ChatGPT settings  
✅ Node.js 18+ installed

## 🚀 Official MCP Server

**Production URL:** `https://plugins.support/sse`

No need to deploy! Use the official server or run locally for testing.

## Step 1: Enable Developer Mode

1. Go to [ChatGPT Settings → Apps](https://chatgpt.com/#settings/Connectors)
2. Click on **Advanced settings**
3. Enable **Developer mode**
4. The "Create app" button will now appear

## Step 2: Choose Deployment Method

### Option A: Local Development (Quick Test)

Best for testing and development.

```bash
# Clone and install
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news/mcp
npm install

# Start HTTP/SSE server
npm run start:http
```

Server runs at `http://localhost:3001`

⚠️ **Note:** Local servers only work if ChatGPT can reach your machine (same network or tunneling).

### Option B: Cloud Deployment (Production)

Best for reliable access from anywhere.

#### Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
cd free-crypto-news/mcp
railway login
railway init
railway up

# Get your deployment URL
railway open
```

#### Deploy to Render

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create new "Web Service"
4. Connect GitHub repo
5. Configure:
   - **Build Command:** `cd mcp && npm install`
   - **Start Command:** `cd mcp && node http-server.js`
   - **Environment:** Node
6. Deploy

#### Deploy to Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Deploy
cd free-crypto-news/mcp
fly launch
fly deploy
```

## Step 3: Create App in ChatGPT

1. Go to [ChatGPT Apps settings](https://chatgpt.com/#settings/Connectors)
2. Click **"Create app"** (next to Advanced settings)
3. Fill in the form:

| Field | Value |
|-------|-------|
| **App Name** | Free Crypto News |
| **Description** | Get real-time crypto news from 130+ sources |
| **Protocol** | SSE (Server-Sent Events) |
| **Endpoint URL** | `https://plugins.support/sse` (official)<br/>or<br/>`http://localhost:3001/sse` (local) |
| **Authentication** | No Authentication |

4. Click **Create**
5. App appears in "Drafts" section

## Step 4: Test the Connection

1. Start a new ChatGPT conversation
2. Click the **+** menu (Plus menu)
3. Select **Developer mode**
4. Choose **Free Crypto News** from the list
5. Try a test prompt:

```
Use the Free Crypto News app's get_crypto_news tool to fetch 
the latest 5 headlines. Do not use built-in browsing.
```

## Step 5: Tool Management

In [App settings](https://chatgpt.com/#settings/Connectors), click on your app:

- **Toggle tools on/off** - Disable tools you don't need
- **Refresh tools** - Pull updated tool definitions from server
- **View tool details** - See full schemas and descriptions

## Prompting Tips for ChatGPT

### ✅ Good Prompts (Explicit)

```
Use the "Free Crypto News" app's "search_crypto_news" tool 
to search for "Ethereum ETF" news. Limit to 10 results.
Do not use built-in browsing or web search.
```

```
Call the get_portfolio_news tool with coins="btc,eth,sol" 
and prices=true. Only use the Free Crypto News connector.
```

### ❌ Bad Prompts (Ambiguous)

```
Show me crypto news
```
*Too vague - may use built-in tools instead*

```
Search for Bitcoin news
```
*Doesn't specify the app or tool*

### Best Practices

1. **Be explicit about the app:**
   - "Use the Free Crypto News app..."
   - "Call the [tool] from Free Crypto News..."

2. **Specify tool names:**
   - Use backticks: `get_crypto_news`
   - Exact names help ChatGPT pick the right tool

3. **Disable alternatives:**
   - "Do not use built-in browsing"
   - "Only use the Free Crypto News connector"

4. **Show parameters:**
   - `{ "limit": 5, "sentiment": "bullish" }`
   - Helps avoid parameter errors

## Available Tools Reference

| Tool | Use When | Example |
|------|----------|---------|
| `get_crypto_news` | General headlines | "Get latest news" |
| `search_crypto_news` | Specific topics | "Search for 'SEC regulation'" |
| `get_breaking_news` | Urgent news | "Breaking news in last 2 hours" |
| `get_trending_topics` | Market trends | "What's trending?" |
| `analyze_news` | Sentiment analysis | "Find bullish news" |
| `get_portfolio_news` | Portfolio tracking | "News for BTC, ETH, SOL" |
| `get_bitcoin_news` | Bitcoin-only | "Bitcoin-specific news" |
| `get_defi_news` | DeFi-only | "DeFi protocol news" |

## Confirmation Settings

All tools have `readOnlyHint: true` annotation, so:

- ✅ **No confirmation prompts** - Tools execute immediately
- ✅ **Safe operations** - All tools are read-only (fetch data only)
- ✅ **No data modification** - Cannot write/delete anything

If you still see confirmations, check:
1. Server is sending proper `annotations` in tool definitions
2. ChatGPT recognized the `readOnlyHint` flag
3. Refresh the app in settings to pull latest tool schemas

## Troubleshooting

### "Could not connect to app"

**Cause:** Server is unreachable  
**Fix:**
- Verify server is running: `curl http://localhost:3001/health`
- Check firewall settings
- For cloud: Verify deployment is live

### "Tool not found"

**Cause:** ChatGPT can't find the tool  
**Fix:**
- Refresh app in settings to sync tools
- Use exact tool name from docs
- Be more explicit in your prompt

### "Using built-in tools instead of MCP"

**Cause:** Prompt is too vague  
**Fix:**
- Add "Do not use built-in browsing"
- Specify app name explicitly
- Use exact tool names in backticks

### Rate Limits

Free Crypto News API has no rate limits, but ChatGPT might limit tool calls:
- Pace your requests
- Don't call multiple tools rapidly in succession
- Let previous tool calls complete first

## Example Conversation Flow

```
👤 You: Enable the Free Crypto News app in developer mode.

🤖 ChatGPT: I've enabled the Free Crypto News app. What would you like to know?

👤 You: Use get_trending_topics to show what's trending in the last 24 hours.

🤖 ChatGPT: [Calls get_trending_topics tool]
Here are the trending crypto topics:
1. 🟢 Bitcoin ETF - 45 mentions (bullish)
2. 🔴 SEC Regulation - 32 mentions (bearish)
...

👤 You: Now use search_crypto_news to find articles about the Bitcoin ETF.

🤖 ChatGPT: [Calls search_crypto_news with keywords="Bitcoin ETF"]
I found 15 articles about Bitcoin ETF:
...
```

## Security Notes

- ✅ **Read-only access** - No write operations possible
- ✅ **No authentication** - Free API, no keys exposed
- ✅ **Public data only** - No personal information accessed
- ⚠️ **Local deployment** - localhost may expose port 3001

## Support

- **Issues:** https://github.com/nirholas/free-crypto-news/issues
- **API Docs:** https://cryptocurrency.cv/api/docs
- **MCP Spec:** https://modelcontextprotocol.io

---

Built with ❤️ using [Model Context Protocol](https://modelcontextprotocol.io)

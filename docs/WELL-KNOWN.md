# Well-Known Endpoints

Standard `.well-known` endpoints for AI agent discovery, payment protocols, and API specifications.

---

## Overview

Free Crypto News provides several well-known endpoints following web standards for automatic discovery by AI agents, browsers, and other clients.

| Endpoint | Purpose | Standard |
|----------|---------|----------|
| `/.well-known/x402` | x402 payment discovery | [x402 Protocol](https://x402.org) |
| `/.well-known/agent.json` | Agent card | A2A / agent discovery |
| `/.well-known/ai-plugin.json` | AI plugin manifest | [ChatGPT Plugins](https://platform.openai.com/docs/plugins) |
| `/api/openapi.json` | OpenAPI 3.1 specification (also what ChatGPT Actions imports) | [OpenAPI 3.1](https://spec.openapis.org/oas/v3.1.0) |
| `/api/docs` | Interactive API docs | Swagger UI |
| `/api/llms.txt`, `/api/llms-full.txt` | LLM-oriented API reference | [llms.txt](https://llmstxt.org) |
| `/api/version` | Running commit, build time, Cloud Run revision | — |
| `/api/health` | Health status with per-subsystem checks | — |

Every one of these is exempt from rate limiting and from x402 payment: an agent
must be able to read the manual without paying for it, and without pretending to
be a browser. cURL, wget, GPTBot, ClaudeBot and PerplexityBot are all allowed.

---

## x402 Discovery

The x402 discovery endpoint enables AI agents to automatically discover paid endpoints and their pricing.

### Endpoint

```
GET /.well-known/x402
```

### Response

```json
{
  "name": "Free Crypto News API",
  "description": "Real-time crypto news and AI analysis",
  "version": "1.0.0",
  "environment": "production",
  
  "network": {
    "name": "Base Mainnet",
    "chainId": 8453,
    "currency": "USDC"
  },
  
  "facilitator": {
    "url": "https://api.developer.coinbase.com/platform/v2/x402",
    "provider": "Coinbase"
  },
  
  "payTo": "0x4027FdaC1a5216e264A00a5928b8366aE59cE888",
  
  "resources": [
    {
      "method": "GET",
      "path": "/api/v1/news",
      "price": "$0.001",
      "description": "Latest crypto news",
      "mimeType": "application/json"
    },
    {
      "method": "GET",
      "path": "/api/v1/coins",
      "price": "$0.002",
      "description": "All cryptocurrency data"
    },
    {
      "method": "GET",
      "path": "/api/v1/analysis",
      "price": "$0.005",
      "description": "AI market analysis"
    }
  ],
  
  "categories": [
    {
      "name": "News",
      "icon": "📰",
      "endpoints": [...]
    },
    {
      "name": "Market Data",
      "icon": "📊",
      "endpoints": [...]
    },
    {
      "name": "AI Analysis",
      "icon": "🤖",
      "endpoints": [...]
    }
  ],
  
  "links": {
    "documentation": "https://cryptocurrency.cv/docs",
    "openapi": "https://cryptocurrency.cv/api/openapi.json",
    "github": "https://github.com/nirholas/cryptocurrency.cv"
  }
}
```

### Usage

```bash
# Discover available paid endpoints
curl https://cryptocurrency.cv/.well-known/x402

# Check if x402 is configured
curl -s https://cryptocurrency.cv/.well-known/x402 | jq '.configured'
```

---

## OpenAPI Specification

The dynamic OpenAPI 3.1 specification describes all API endpoints.

### Endpoint

```
GET /api/openapi.json
```

### Features

- **Dynamic Host Detection**: Automatically uses correct base URL
- **Complete Schema**: All endpoints, parameters, and response types
- **Tags**: Endpoints grouped by category
- **Examples**: Sample responses for each endpoint

### Response Structure

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "Free Crypto News API",
    "description": "🆓 100% FREE crypto news API. No API keys required!",
    "version": "1.0.0"
  },
  "servers": [
    { "url": "https://cryptocurrency.cv" }
  ],
  "paths": {
    "/api/news": { ... },
    "/api/search": { ... },
    "/api/defi": { ... },
    "/api/bitcoin": { ... },
    "/api/breaking": { ... },
    "/api/sources": { ... }
  },
  "components": {
    "schemas": {
      "Article": { ... },
      "NewsResponse": { ... }
    }
  }
}
```

### Usage

```bash
# Get OpenAPI spec
curl https://cryptocurrency.cv/api/openapi.json

# Use with code generators
npx openapi-generator-cli generate \
  -i https://cryptocurrency.cv/api/openapi.json \
  -g typescript-axios \
  -o ./sdk
```

---

## Interactive API Docs

Swagger UI documentation with try-it-out functionality.

### Endpoint

```
GET /api/docs
```

### Features

- **Interactive Testing**: Try API calls directly in browser
- **Request Builder**: Visual parameter configuration
- **Response Examples**: See actual API responses
- **Dark Theme**: Developer-friendly interface

### Access

Open in browser: [https://cryptocurrency.cv/api/docs](https://cryptocurrency.cv/api/docs)

---

## ChatGPT Plugin Manifest

OpenAPI specification for ChatGPT plugin integration.

### Endpoint

```
GET /api/openapi.json
```

### Manifest Location

The ChatGPT plugin expects the manifest at:

```
/.well-known/ai-plugin.json
```

!!! note "ChatGPT Plugin"
    ChatGPT Actions consume the live OpenAPI spec at `/api/openapi.json`. (`chatgpt/openapi.yaml` exists in the repository as a hand-written plugin manifest, but it is not served over HTTP.) See the [ChatGPT Integration](integrations/chatgpt.md) guide for setup.

### Manifest Structure

```json
{
  "schema_version": "v1",
  "name_for_human": "Free Crypto News",
  "name_for_model": "crypto_news",
  "description_for_human": "Get real-time crypto news, market data, and sentiment analysis.",
  "description_for_model": "Provides access to cryptocurrency news from 358 sources, market prices, Fear & Greed Index, and search functionality.",
  "auth": { "type": "none" },
  "api": {
    "type": "openapi",
    "url": "https://cryptocurrency.cv/api/openapi.json"
  }
}
```

---

## Agent Discovery Patterns

### AI Agent Auto-Discovery

AI agents can discover this API's capabilities automatically:

```python
import httpx

# 1. Check x402 for paid endpoints
x402 = httpx.get("https://cryptocurrency.cv/.well-known/x402").json()
print(f"Available endpoints: {len(x402['resources'])}")

# 2. Get OpenAPI spec for full API details
openapi = httpx.get("https://cryptocurrency.cv/api/openapi.json").json()
print(f"API version: {openapi['info']['version']}")

# 3. Start using the API
news = httpx.get("https://cryptocurrency.cv/api/news").json()
```

### MCP Server Discovery

The MCP (Model Context Protocol) server can be discovered via:

| Method | URL or command | Tools |
|--------|----------------|-------|
| **Streamable HTTP (hosted)** | `https://cryptocurrency.cv/api/mcp` | 47 |
| **Local stdio** | `npx -y @nirholas/free-crypto-news-mcp` | 55 (+6 resources, 3 prompts) |
| **Local stdio, from source** | `node mcp/dist/index.js` (after `npm run build`) | 55 |

See [MCP Server Integration](integrations/mcp.md) for details.

---

## Standards Compliance

### Implemented Standards

| Standard | Status | Description |
|----------|--------|-------------|
| **x402 Protocol** | ✅ | Payment Required response handling |
| **OpenAPI 3.1** | ✅ | API specification |
| **JSON Schema** | ✅ | Request/response validation |
| **CORS** | ✅ | Cross-origin requests |
| **Cache-Control** | ✅ | Proper caching headers |

### Response Headers

All well-known endpoints include proper headers:

```http
Content-Type: application/json
Cache-Control: public, s-maxage=60
Access-Control-Allow-Origin: *
```

---

## Testing Endpoints

### Verify All Endpoints

```bash
# x402 discovery
curl -s https://cryptocurrency.cv/.well-known/x402 | jq '.name'

# OpenAPI spec
curl -s https://cryptocurrency.cv/api/openapi.json | jq '.info.title'

# ChatGPT plugin
curl -s https://cryptocurrency.cv/api/openapi.json | head -10
```

### Health Check

```bash
curl https://cryptocurrency.cv/api/health
```

Response:

```json
{
  "status": "healthy",
  "timestamp": "2026-02-02T12:00:00Z",
  "version": "1.0.0"
}
```

---

## See Also

- [x402 Payments](X402.md) - Micropayments documentation
- [API Reference](API.md) - Complete API documentation
- [MCP Server](integrations/mcp.md) - Model Context Protocol integration
- [ChatGPT Plugin](integrations/chatgpt.md) - ChatGPT integration

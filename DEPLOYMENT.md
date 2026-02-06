# 🚀 Deployment Guide

Complete guide to deploying Free Crypto News to various platforms.

---

## Table of Contents

- [Quick Deploy](#quick-deploy)
- [Vercel (Recommended)](#vercel-recommended)
- [Railway](#railway)
- [Docker](#docker)
- [Self-Hosted](#self-hosted)
- [Environment Variables](#environment-variables)
- [Domain Setup](#domain-setup)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Quick Deploy

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nirholas/free-crypto-news)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/free-crypto-news)

---

## Vercel (Recommended)

Vercel is the recommended platform for Free Crypto News due to its Edge Functions and global CDN.

### Method 1: GitHub Integration

1. **Fork the repository**
   ```bash
   # Or clone and push to your own repo
   git clone https://github.com/nirholas/free-crypto-news.git
   cd free-crypto-news
   ```

2. **Connect to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel auto-detects Next.js settings

3. **Configure Environment Variables** (optional)
   ```
   GROQ_API_KEY=gsk_...  # For AI features
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait ~2 minutes for build
   - Your app is live at `your-project.vercel.app`

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd free-crypto-news
vercel

# Production deploy
vercel --prod
```

### Vercel Configuration

The project includes `vercel.json` for optimal settings:

```json
{
  "framework": "nextjs",
  "regions": ["iad1", "sfo1", "cdg1", "hnd1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, OPTIONS" }
      ]
    }
  ]
}
```

### Vercel Edge Config (Optional)

For dynamic configuration without redeploying:

```javascript
// src/lib/config.ts
import { get } from '@vercel/edge-config';

export async function getConfig() {
  return {
    featuredSource: await get('featuredSource') || 'coindesk',
    maxArticles: await get('maxArticles') || 100,
  };
}
```

---

## Railway

Railway is used for the **WebSocket server** (real-time features) and can also host the main app.

### WebSocket Server Deployment (Recommended)

The WebSocket server enables real-time news streaming to connected clients.

#### Method 1: Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd free-crypto-news
railway init

# Deploy
railway up

# Generate public domain
railway domain
```

Your WebSocket server will be available at:
- **URL:** `https://free-crypto-news-production.up.railway.app`
- **WebSocket:** `wss://free-crypto-news-production.up.railway.app`
- **Health:** `https://free-crypto-news-production.up.railway.app/health`
- **Stats:** `https://free-crypto-news-production.up.railway.app/stats`

#### Method 2: Railway Dashboard

1. Go to [railway.app/new](https://railway.app/new)
2. Click **Deploy from GitHub repo**
3. Select `nirholas/free-crypto-news`
4. Railway auto-detects `railway.json` config
5. Click Deploy
6. Go to **Settings → Networking → Generate Domain**

### Connect WebSocket to Vercel

After deploying to Railway, add this env variable to **Vercel**:

```
WS_ENDPOINT=wss://free-crypto-news-production.up.railway.app
```

### Test WebSocket Connection

```javascript
const ws = new WebSocket('wss://free-crypto-news-production.up.railway.app');

ws.onopen = () => console.log('Connected!');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('New article:', data.title);
};
```

### Railway Configuration

The project includes `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node ws-server.js",
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### Full App Deployment (Alternative)

You can also deploy the entire Next.js app to Railway:

1. **Create Railway Account**
   - Sign up at [railway.app](https://railway.app)

2. **New Project from GitHub**
   ```
   Railway Dashboard → New Project → Deploy from GitHub repo
   ```

3. **Configure Build**
   ```
   Build Command: npm run build
   Start Command: npm start
   ```

4. **Environment Variables**
   ```
   NODE_ENV=production
   GROQ_API_KEY=gsk_...  # Optional
   ```

5. **Generate Domain**
   - Settings → Domains → Generate Domain
   - Or add custom domain

### Railway.toml

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
healthcheckPath = "/api/health"
healthcheckTimeout = 30

[env]
NODE_ENV = "production"
```

---

## Docker

### Dockerfile

```dockerfile
# Base image
FROM node:20-alpine AS base
WORKDIR /app

# Dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - GROQ_API_KEY=${GROQ_API_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Build & Run

```bash
# Build image
docker build -t free-crypto-news .

# Run container
docker run -p 3000:3000 -e GROQ_API_KEY=gsk_... free-crypto-news

# Or with docker-compose
docker-compose up -d
```

### Docker Hub

```bash
# Tag and push
docker tag free-crypto-news yourusername/free-crypto-news:latest
docker push yourusername/free-crypto-news:latest
```

---

## Self-Hosted

### Prerequisites

- Node.js 18+ (20 recommended)
- npm or pnpm
- 512MB+ RAM
- Reverse proxy (nginx/caddy)

### Installation

```bash
# Clone repository
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news

# Install dependencies
npm install

# Build for production
npm run build

# Start server
npm start
```

### PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "crypto-news" -- start

# Auto-restart on reboot
pm2 startup
pm2 save

# View logs
pm2 logs crypto-news

# Monitor
pm2 monit
```

### ecosystem.config.js

```javascript
module.exports = {
  apps: [{
    name: 'crypto-news',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    env_production: {
      GROQ_API_KEY: 'gsk_...',
    },
  }],
};
```

### Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/crypto-news
server {
    listen 80;
    server_name news.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name news.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/news.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/news.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache static assets
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

### Caddy (Alternative)

```
# Caddyfile
news.yourdomain.com {
    reverse_proxy localhost:3000
    encode gzip
    
    header /api/* {
        Access-Control-Allow-Origin *
        Cache-Control "public, s-maxage=300"
    }
}
```

---

## Environment Variables

### Required

None! The core API works without any configuration.

### Recommended

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `KV_REST_API_URL` | Upstash Redis REST URL | Vercel → Storage → Upstash Redis |
| `KV_REST_API_TOKEN` | Upstash Redis REST Token | Vercel → Storage → Upstash Redis |
| `ADMIN_TOKEN` | Admin API protection | Generate with `openssl rand -hex 32` |

### Optional - AI Features

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `GROQ_API_KEY` | AI summaries (recommended, free) | [console.groq.com](https://console.groq.com) |
| `OPENAI_API_KEY` | OpenAI alternative | [platform.openai.com](https://platform.openai.com) |
| `ANTHROPIC_API_KEY` | Claude alternative | [console.anthropic.com](https://console.anthropic.com) |
| `OPENROUTER_API_KEY` | Multi-model router | [openrouter.ai](https://openrouter.ai) |

### Optional - Real-time Features

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `WS_ENDPOINT` | WebSocket server URL | Deploy `ws-server.js` to Railway |

### Optional - Other

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `NEXT_PUBLIC_BASE_URL` | Public app URL | `https://cryptocurrency.cv` |
| `GOOGLE_CLOUD_API_KEY` | Translation API | - |

### Setting Up Vercel KV (Upstash Redis)

1. Go to **Vercel Dashboard** → Your Project → **Storage**
2. Click **Upstash for Redis** in Marketplace
3. Create a new Redis database (free tier available)
4. Click **Connect to Project**
5. Environment variables are added automatically

### Generating ADMIN_TOKEN

```bash
# Generate a secure random token
openssl rand -hex 32

# Example output: a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
```

Add this value as `ADMIN_TOKEN` in Vercel Environment Variables.

### Example .env.local

```bash
# .env.local (development)
NODE_ENV=development

# KV Store (Upstash Redis)
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your_token_here

# Admin Protection
ADMIN_TOKEN=your_secure_random_token

# AI Features (pick one - Groq is free!)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...

# WebSocket Server (optional)
WS_ENDPOINT=wss://free-crypto-news-production.up.railway.app

# Translation (optional)
GOOGLE_CLOUD_API_KEY=AIzaxxxxxxxxxxxxxxxxxx
```

### Production Environment

```bash
# Set in your hosting platform's dashboard
# or via CLI:

# Vercel
vercel env add GROQ_API_KEY
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN
vercel env add ADMIN_TOKEN

# Railway
railway variables set GROQ_API_KEY=gsk_...

# Docker
docker run -e GROQ_API_KEY=gsk_... ...
```

---

## Domain Setup

### Custom Domain on Vercel

1. Go to Project Settings → Domains
2. Add your domain: `news.yourdomain.com`
3. Configure DNS:
   ```
   Type: CNAME
   Name: news
   Value: cname.vercel-dns.com
   ```
4. SSL is automatic

### Custom Domain on Railway

1. Settings → Domains → Custom Domain
2. Add DNS records:
   ```
   Type: CNAME
   Name: news
   Value: your-project.up.railway.app
   ```

### Cloudflare Setup

1. Add site to Cloudflare
2. Update nameservers
3. Add DNS record:
   ```
   Type: CNAME
   Name: news
   Target: your-deployment.vercel.app
   Proxy: ON (orange cloud)
   ```
4. SSL/TLS → Full (strict)

---

## Monitoring

### Health Checks

```bash
# Basic health check
curl https://your-domain.com/api/health

# Expected response
{
  "status": "ok",
  "timestamp": "2026-01-22T12:00:00Z",
  "version": "2.0.0"
}
```

### Uptime Monitoring

Recommended services:
- [UptimeRobot](https://uptimerobot.com) (free)
- [Better Uptime](https://betteruptime.com)
- [Pingdom](https://pingdom.com)

Configure to check:
- `GET /api/health` every 5 minutes
- Alert on non-200 response

### Analytics

```javascript
// next.config.js
module.exports = {
  // Vercel Analytics (automatic)
  // Or add custom analytics
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Analytics-Id', value: 'your-analytics-id' }
      ]
    }];
  }
};
```

### Error Tracking

```javascript
// src/app/error.tsx
'use client';

export default function Error({ error, reset }) {
  // Report to Sentry, LogRocket, etc.
  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

---

## Troubleshooting

### Common Issues

#### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

#### Memory Issues

```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

#### Edge Runtime Errors

```typescript
// Ensure compatibility
export const runtime = 'edge';  // Must be at top of route file
```

#### CORS Issues

```typescript
// src/app/api/[...route]/route.ts
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
```

#### Rate Limiting

If you hit rate limits on upstream APIs:

```typescript
// Implement exponential backoff
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url);
    } catch (err) {
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Logs

```bash
# Vercel
vercel logs your-project.vercel.app

# Railway
railway logs

# Docker
docker logs crypto-news

# PM2
pm2 logs crypto-news
```

### Support

- 📖 [Documentation](index.md)
- 💬 [GitHub Discussions](https://github.com/nirholas/free-crypto-news/discussions)
- 🐛 [Report Issues](https://github.com/nirholas/free-crypto-news/issues)

---

## x402 Micropayments (Mainnet Deployment)

Enable cryptocurrency micropayments for premium API access using the x402 protocol.

### Overview

x402 uses HTTP 402 Payment Required to enable pay-per-request API access with USDC on Base. Clients pay micropayments (typically $0.001-$0.05) per API call, settled on-chain.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `X402_PAYMENT_ADDRESS` | Your wallet address (receives USDC) | **Yes** for mainnet |
| `X402_NETWORK` | Network: `eip155:8453` (Base) or `eip155:84532` (Sepolia) | No (auto-detected) |
| `X402_FACILITATOR_URL` | Facilitator service URL | No (uses CDP) |
| `X402_TESTNET` | Set to `true` to force testnet even in production | No |
| `X402_SOLANA_PAYMENT_ADDRESS` | Solana wallet address (for multi-chain) | No |

### Mainnet Deployment Checklist

Before deploying x402 to production:

- [ ] **Generate a secure wallet address** for receiving payments
- [ ] Set `X402_PAYMENT_ADDRESS` to your wallet address
- [ ] Verify network auto-detection works (production uses Base Mainnet)
- [ ] Test with Base Sepolia first (`X402_TESTNET=true`)
- [ ] Set up monitoring for payment transactions
- [ ] Configure webhook for payment notifications (optional)
- [ ] Review pricing in `src/lib/x402-config.ts`

### Quick Setup

```bash
# 1. Set your payment address (CRITICAL)
vercel env add X402_PAYMENT_ADDRESS
# Enter your Ethereum/Base wallet address: 0xYourWalletAddress

# 2. Optionally set facilitator (defaults to CDP in production)
vercel env add X402_FACILITATOR_URL
# Enter: https://api.cdp.coinbase.com/platform/v2/x402

# 3. Deploy
vercel --prod
```

### Network Auto-Detection

The x402 configuration automatically detects the environment:

| Environment | Network | Facilitator |
|-------------|---------|-------------|
| Production (`VERCEL_ENV=production`) | Base Mainnet | CDP |
| Preview/Development | Base Sepolia | x402.org |
| `X402_TESTNET=true` | Base Sepolia | x402.org |

### Supported Facilitators

| Facilitator | URL | Notes |
|-------------|-----|-------|
| CDP (Coinbase) | `https://api.cdp.coinbase.com/platform/v2/x402` | Default for production |
| x402.org | `https://x402.org/facilitator` | Default for testnet |
| PayAI | `https://facilitator.payai.network` | Multi-chain support |

### Testing Before Mainnet

1. **Deploy to Vercel Preview** (auto-uses testnet):
   ```bash
   vercel
   ```

2. **Test the discovery endpoint**:
   ```bash
   curl https://your-preview.vercel.app/api/.well-known/x402
   ```

3. **Verify 402 responses**:
   ```bash
   curl -v https://your-preview.vercel.app/api/v1/coins
   # Should return HTTP 402 with payment instructions
   ```

4. **Test payment flow with testnet USDC**:
   - Get testnet USDC from [Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)
   - Use the x402 client examples in `/examples/`

### Monitoring Payments

After deployment, monitor payments:

```bash
# View transactions on BaseScan
https://basescan.org/address/YOUR_PAYMENT_ADDRESS

# Use x402scan for protocol-level analytics
https://x402scan.com/
```

### Pricing Configuration

Edit `src/lib/x402-config.ts` to adjust pricing:

```typescript
export const PREMIUM_PRICING = {
  '/api/premium/ai/sentiment': { price: 0.02 },  // $0.02 per request
  '/api/premium/whales/transactions': { price: 0.05 },
  // ...
};
```

### Security Considerations

- Never expose your private key - only the payment ADDRESS is needed
- Use a dedicated wallet for receiving API payments
- Monitor for unusual transaction patterns
- Consider using a multi-sig for large payment volumes
- Set up alerts for payment failures

---

## Security Checklist

Before going to production:

- [ ] Remove any test API keys
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS only
- [ ] Configure CSP headers
- [ ] Set up rate limiting
- [ ] Enable error tracking
- [ ] Set up uptime monitoring
- [ ] Review CORS settings
- [ ] Test health endpoint
- [ ] Document any custom configuration
- [ ] Set `X402_PAYMENT_ADDRESS` for micropayments
- [ ] Test x402 payment flow end-to-end

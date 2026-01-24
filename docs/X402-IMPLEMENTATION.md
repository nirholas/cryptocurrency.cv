# x402 Payment Protocol Implementation

This document describes the x402 payment protocol integration in Free Crypto News API.

## Overview

x402 is Coinbase's HTTP 402 Payment Required protocol that enables micropayments for API access using USDC. Our implementation follows best practices from top facilitators like Dexter (432k+ transactions, $25M+ volume).

## Features

### ✅ Implemented

| Feature | Description |
|---------|-------------|
| **Multi-Chain Accepts** | Accept payments on Base (mainnet + Sepolia), ready for Solana |
| **Bazaar Discovery** | AI agents can discover endpoints at `/api/.well-known/x402` |
| **Lifecycle Hooks** | `beforeVerify`, `afterVerify`, `beforeSettle`, `afterSettle` for analytics |
| **v2 Protocol Headers** | Support both v1 (`X-Payment`) and v2 (`PAYMENT-SIGNATURE`) |
| **Hybrid Auth** | API keys + x402 micropayments in the same middleware |
| **Access Passes** | Time-based passes (1hr, 24hr, 7-day) for premium features |
| **Rate Limiting** | Per-wallet and per-key rate limits |

## Architecture

```
src/lib/x402/
├── index.ts       # Main exports
├── config.ts      # Network, facilitator, payment configuration
├── pricing.ts     # Endpoint pricing tiers
├── routes.ts      # Route configuration for middleware
├── middleware.ts  # Payment + API key middleware
├── rate-limit.ts  # Rate limiting logic
├── hooks.ts       # Payment lifecycle hooks
├── server.ts      # x402 server setup
└── features.ts    # Feature flags and endpoint metadata
```

## Configuration

### Environment Variables

```bash
# Required in production
X402_PAYMENT_ADDRESS=0xYourWalletAddress

# Optional - defaults to CDP in production, x402.org in development
X402_FACILITATOR_URL=https://api.cdp.coinbase.com/platform/v2/x402

# Optional - override network (auto-detected from VERCEL_ENV/NODE_ENV)
X402_NETWORK=eip155:8453

# Optional - force testnet even in production
X402_TESTNET=true

# Optional - Solana support
X402_SOLANA_PAYMENT_ADDRESS=YourSolanaAddress
```

### Environment Auto-Detection

The x402 configuration automatically detects the correct network:

| Environment | Network | Facilitator | Detection |
|-------------|---------|-------------|-----------|
| `VERCEL_ENV=production` | Base Mainnet | CDP | Vercel production deployment |
| `NODE_ENV=production` | Base Mainnet | CDP | Other production environments |
| `X402_TESTNET=true` | Base Sepolia | x402.org | Force testnet in any environment |
| Development | Base Sepolia | x402.org | Local development |

### Supported Networks

| Network | Chain ID | Status |
|---------|----------|--------|
| Base Mainnet | eip155:8453 | ✅ Active (production default) |
| Base Sepolia | eip155:84532 | ✅ Active (development default) |
| Polygon | eip155:137 | 🔧 Ready |
| Ethereum | eip155:1 | 🔧 Ready |
| Solana Mainnet | solana:5eykt4... | 🔧 Ready (needs X402_SOLANA_PAYMENT_ADDRESS) |

### Production Deployment Checklist

Before deploying x402 to mainnet:

- [ ] Set `X402_PAYMENT_ADDRESS` to your wallet address
- [ ] Verify environment auto-detection is correct (`/api/v1/x402`)
- [ ] Test payment flow on Base Sepolia first
- [ ] Set up wallet monitoring on BaseScan
- [ ] Review pricing configuration

## Usage

### In API Routes

```typescript
import { hybridAuthMiddleware } from '@/lib/x402';

export async function GET(request: NextRequest) {
  // Check for API key or x402 payment
  const authResult = await hybridAuthMiddleware(request, '/api/v1/coins');
  if (authResult) return authResult; // Returns 402 or 429 if auth fails

  // Proceed with request...
  return NextResponse.json({ data: '...' });
}
```

### Lifecycle Hooks (Analytics)

```typescript
import { paymentHooks } from '@/lib/x402';

// Track successful payments
paymentHooks.on('afterSettle', async (event) => {
  await analytics.track('payment_success', {
    amount: event.amount,
    wallet: event.payer,
    endpoint: event.resource,
  });
});

// Alert on large payments
paymentHooks.on('afterSettle', async (event) => {
  if (BigInt(event.amount) > BigInt(1000000)) { // > $1
    await sendSlackNotification(`Large payment: ${event.amount} for ${event.resource}`);
  }
});
```

### Bazaar Discovery

Endpoints are automatically discoverable by AI agents at:

```
GET /api/.well-known/x402
```

Response includes:
- All priced endpoints with methods, paths, prices
- Supported networks and payment addresses
- SDK links and usage examples
- Categories for easier navigation

## Pricing

### Subscription Tiers

| Tier | Price | Requests/Day | Features |
|------|-------|--------------|----------|
| Free | $0 | 100 | Basic endpoints |
| Pro | $29/mo | 10,000 | All endpoints, priority |
| Enterprise | Custom | Unlimited | Dedicated support |

### Pay-Per-Request

| Category | Price Range |
|----------|-------------|
| News | $0.001 |
| Market Data | $0.001 - $0.002 |
| DeFi | $0.003 |
| AI Analysis | $0.005 |
| Export | $0.01 |

## Client Examples

### JavaScript/TypeScript

```typescript
import { payFetch } from '@x402/fetch';
import { Wallet } from 'ethers';

const wallet = new Wallet(process.env.PRIVATE_KEY);
const response = await payFetch('https://free-crypto-news.vercel.app/api/v1/news', {
  wallet,
});
const data = await response.json();
```

### Python

```python
import x402
wallet = x402.Wallet(os.environ['PRIVATE_KEY'])
response = x402.get('https://free-crypto-news.vercel.app/api/v1/news', wallet=wallet)
```

### cURL (with pre-signed header)

```bash
curl -H "X-Payment: <payment_signature>" \
  https://free-crypto-news.vercel.app/api/v1/news
```

## Comparison with Top Facilitators

Based on research from x402scan.com/facilitators:

| Feature | Dexter (432k txns) | Us |
|---------|-------------------|-----|
| Multi-chain | 40+ chains | Base + Solana ready |
| Discovery | Bazaar v2 | ✅ Implemented |
| Lifecycle hooks | Full suite | ✅ Implemented |
| SDK wrappers | JS, Python, Go | ✅ Examples provided |
| Access passes | Yes | ✅ Implemented |
| Subscriptions | Yes | ✅ Implemented |

## Security

- Payment addresses validated server-side
- All signatures verified by facilitator
- Rate limiting prevents abuse
- API keys are hashed (never stored raw)
- Webhook signatures for key events

## Troubleshooting

### 402 Response but Payment Not Working

1. Check wallet has sufficient USDC on the correct network
2. Verify facilitator URL is correct for environment
3. Check that payment signature includes correct nonce

### Rate Limit Exceeded

1. Upgrade to higher tier
2. Use per-request payments instead
3. Contact support for enterprise tier

## Resources

- [x402 Protocol Documentation](https://docs.x402.org)
- [Coinbase x402 GitHub](https://github.com/coinbase/x402)
- [x402scan.com](https://x402scan.com) - Explorer and analytics
- [PayAI Facilitator](https://payai.network) - Multi-chain support

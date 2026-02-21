/**
 * x402 Payment Middleware
 *
 * Protects premium API routes using the x402 payment protocol.
 * Clients that hit /api/premium/* without a valid payment header
 * will receive a 402 Payment Required response with instructions
 * on how to pay in USDC on Base.
 *
 * No subscriptions. No Stripe. No accounts.
 * Pay per request, on-chain, permissionlessly.
 *
 * @see https://x402.org
 */
import { paymentMiddleware } from '@x402/next';

const RECEIVE_ADDRESS =
  (process.env.X402_RECEIVE_ADDRESS as `0x${string}`) ??
  '0x40252CFDF8B20Ed757D61ff157719F33Ec332402';

export default paymentMiddleware(RECEIVE_ADDRESS, {
  // Standard premium endpoints — $0.001 USDC per call
  '/api/premium/:path*': {
    price: '$0.001',
    network: 'base',
    config: {
      description: 'Free Crypto News Premium API — pay per request in USDC on Base',
    },
  },
});

export const config = {
  matcher: ['/api/premium/:path*'],
};

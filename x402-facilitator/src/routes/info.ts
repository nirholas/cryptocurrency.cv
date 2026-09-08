import { Hono } from 'hono';

import { SUPPORTED_CHAINS } from '../config/chains.js';
import { getTokensForChain } from '../config/tokens.js';
import type { Facilitator } from '../core/facilitator.js';

export function infoRoute(facilitator: Facilitator): Hono {
  const app = new Hono();
  app.get('/', (c) =>
    c.json({
      name: 'x402-facilitator',
      address: facilitator.address,
      schemes: ['exact'],
      chains: SUPPORTED_CHAINS.map((chain) => ({
        chainId: chain.chainId,
        name: chain.name,
        network: chain.network,
        testnet: chain.testnet,
        blockExplorerUrl: chain.blockExplorerUrl,
        tokens: getTokensForChain(chain.chainId).map((t) => ({
          symbol: t.symbol,
          address: t.address,
          decimals: t.decimals,
          eip712: t.eip712,
        })),
      })),
      endpoints: ['POST /verify', 'POST /settle', 'GET /supported', 'GET /health', 'GET /info', 'GET /metrics'],
    }),
  );
  return app;
}

import { Hono } from 'hono';
import { createPublicClient, http } from 'viem';

import { SUPPORTED_CHAINS } from '../config/chains.js';

const VERSION = '1.0.0';

export function healthRoute(uptime: () => number): Hono {
  const app = new Hono();
  app.get('/', async (c) => {
    const chains = await Promise.all(
      SUPPORTED_CHAINS.map(async (chain) => {
        try {
          const client = createPublicClient({ transport: http(chain.rpcUrl, { timeout: 5_000 }) });
          const blockNumber = await client.getBlockNumber();
          return { chainId: chain.chainId, network: chain.network, connected: true, blockNumber: Number(blockNumber) };
        } catch (error) {
          return { chainId: chain.chainId, network: chain.network, connected: false, error: (error as Error).message };
        }
      }),
    );
    const allDown = chains.every((ch) => !ch.connected);
    return c.json({ status: allDown ? 'degraded' : 'ok', version: VERSION, uptime: uptime(), chains }, allDown ? 503 : 200);
  });
  return app;
}

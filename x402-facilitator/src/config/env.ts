import { z } from 'zod';

const hex32 = z
  .string()
  .regex(/^0x[0-9a-fA-F]{64}$/, 'must be a 0x-prefixed 32-byte hex private key');

const envSchema = z.object({
  FACILITATOR_PRIVATE_KEY: hex32,
  BASE_RPC_URL: z.string().url().default('https://mainnet.base.org'),
  BASE_SEPOLIA_RPC_URL: z.string().url().default('https://sepolia.base.org'),
  ARBITRUM_RPC_URL: z.string().url().default('https://arb1.arbitrum.io/rpc'),
  ARBITRUM_SEPOLIA_RPC_URL: z.string().url().default('https://sepolia-rollup.arbitrum.io/rpc'),
  ETHEREUM_RPC_URL: z.string().url().default('https://eth.llamarpc.com'),
  PORT: z.coerce.number().int().positive().default(3402),
  HOST: z.string().default('0.0.0.0'),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  CORS_ORIGINS: z.string().default('*'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
  throw new Error(`Invalid environment: ${issues}`);
}

export const env: Env = parsed.data;

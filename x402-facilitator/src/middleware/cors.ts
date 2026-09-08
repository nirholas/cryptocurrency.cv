import { cors as honoCors } from 'hono/cors';

/** CORS from a comma-separated origin list ("*" allows every origin). */
export function cors(origins: string) {
  const list = origins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const allowAll = list.length === 0 || list.includes('*');
  return honoCors({
    origin: allowAll ? '*' : list,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-PAYMENT', 'Authorization'],
    exposeHeaders: ['X-PAYMENT-RESPONSE'],
    maxAge: 600,
  });
}

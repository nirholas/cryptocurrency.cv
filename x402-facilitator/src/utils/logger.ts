import pino from 'pino';

const level = process.env.LOG_LEVEL ?? 'info';

export const logger = pino({
  level,
  base: { service: 'x402-facilitator' },
  timestamp: pino.stdTimeFunctions.isoTime,
});

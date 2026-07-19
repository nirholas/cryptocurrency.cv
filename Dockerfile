# Multi-stage build for the free-crypto-news Next.js app (standalone output).
# Build:  docker build -t cryptocurrency-cv .
# Run:    docker run -p 3000:3000 cryptocurrency-cv

FROM node:24-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@10

# patch-next-write-atomic.js is required by the postinstall hook
COPY package.json pnpm-lock.yaml .npmrc patch-next-write-atomic.js ./
RUN pnpm install --frozen-lockfile

COPY . .

# DOCKER_BUILD=1 switches next.config.js to standalone output
ENV DOCKER_BUILD=1 \
    CI=true \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS=--max-old-space-size=8192
RUN pnpm exec next build

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

RUN apk --no-cache add wget && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Standalone output includes server.js, traced node_modules, public/ and content/
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/content ./content
COPY --from=builder --chown=nextjs:nodejs /app/messages ./messages

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]

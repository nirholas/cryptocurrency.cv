# Dockerfile.ws — Lightweight WebSocket server image
# Runs ws-server.js standalone with minimal dependencies.
#
# Build:  docker build -f Dockerfile.ws -t crypto-news-ws .
# Run:    docker run -p 8080:8080 -e REDIS_URL=redis://redis:6379 crypto-news-ws

FROM node:25-alpine AS base

RUN apk add --no-cache wget

WORKDIR /app

# Install only the WS server dependencies (ws + redis)
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --prod --frozen-lockfile

COPY ws-server.js ./

# Non-root for security
RUN addgroup -S wsgroup && adduser -S wsuser -G wsgroup
USER wsuser

ENV NODE_ENV=production
ENV PORT=8080
ENV WS_HEALTH_PORT=8081

EXPOSE 8080 8081

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD wget --spider -q http://localhost:8080/health || exit 1

CMD ["node", "ws-server.js"]

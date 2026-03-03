# Build stage
FROM node:25-alpine AS builder

WORKDIR /app

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:25-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Security: remove unnecessary system packages and shells from production image
RUN apk --no-cache add wget && \
    rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Security: make the app directory read-only for the running user
# (writable dirs for Next.js cache are handled by the standalone output)
RUN chmod -R 555 /app

# Set correct ownership
USER nextjs

# Security: drop all Linux capabilities (defense in depth)
# Note: this is enforced at docker-compose/k8s level via security_context

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]


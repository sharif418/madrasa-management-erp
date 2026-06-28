# ── Stage 1: Dependencies ──────────────────────────────────────────
FROM oven/bun:1-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package + lock files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile --ignore-scripts

# Generate Prisma client
COPY prisma ./prisma/
RUN bunx prisma generate

# ── Stage 2: Build ─────────────────────────────────────────────────
FROM oven/bun:1-alpine AS builder
RUN apk add --no-cache libc6-compat openssl nodejs
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . ./

# Build the Next.js app (standalone output)
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
ARG MM_SECRET
ENV MM_SECRET=$MM_SECRET
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN bun run build

# ── Stage 3: Production runner ─────────────────────────────────────
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standard build output
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/start.sh ./start.sh

# Set correct ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./start.sh"]

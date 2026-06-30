# syntax=docker/dockerfile:1

# ---------- 1. deps: install once, cached as its own layer ----------
FROM node:22-alpine AS deps
WORKDIR /app
# Corepack ships with Node but is disabled by default - this activates
# the exact pnpm version pinned in package.json's "packageManager" field,
# so the image always installs with the same pnpm everyone develops with.
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---------- 2. builder: compile the Next.js app ----------
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# DATABASE_URL isn't needed at build time (mysql2's pool connects lazily),
# but Next.js still wants the env vars it knows about to be defined.
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# ---------- 3. runner: the actual production image ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Full node_modules (not just a trimmed "standalone" copy) so that
# `pnpm run db:push` / `pnpm run db:seed` (which run db/*.ts directly via
# tsx) work from this same image, alongside `pnpm run start` for serving.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/db ./db

RUN mkdir -p storage/uploads && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

CMD ["pnpm", "run", "start"]
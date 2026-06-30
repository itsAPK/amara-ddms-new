# syntax=docker/dockerfile:1

# ---------- Base Image: Configures Corepack and pnpm ----------
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# ---------- 1. deps: install once, cached as its own layer ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
# Uses BuildKit cache mount to leverage the pnpm store across builds
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ---------- 2. builder: compile the Next.js app ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# ---------- 3. runner: the actual production image ----------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy full dependencies + source code for db:push / db:seed to work seamlessly
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/db ./db

RUN mkdir -p storage/uploads && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

CMD ["pnpm", "run", "start"]
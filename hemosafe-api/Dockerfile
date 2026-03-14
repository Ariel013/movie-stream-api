# ──────────────────────────────────────────────
# Stage 1: deps — install production dependencies
# ──────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Install build tools required for native addons (bcrypt, etc.)
RUN apk add --no-cache libc6-compat python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

# ──────────────────────────────────────────────
# Stage 2: builder — compile TypeScript
# ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# ──────────────────────────────────────────────
# Stage 3: runner — minimal production image
# ──────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Security: run as non-root
RUN addgroup --system --gid 1001 hemosafe \
 && adduser  --system --uid 1001 --ingroup hemosafe api

ENV NODE_ENV=production
ENV PORT=3001

# Copy only what is needed to run
COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/dist         ./dist
COPY --from=builder /app/prisma       ./prisma

# Prisma engine binaries
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN chown -R api:hemosafe /app
USER api

EXPOSE 3001

# Health check — used by Docker Swarm / Compose healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/v1/health || exit 1

# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]

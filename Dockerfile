# syntax=docker/dockerfile:1

# ---- Build stage ---------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Production dependencies ---------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Runtime stage ---------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist/multiposting-app ./dist/multiposting-app
COPY package.json ./

RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
USER nodejs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --spider -q http://127.0.0.1:${PORT}/ || exit 1

CMD ["node", "dist/multiposting-app/server/server.mjs"]

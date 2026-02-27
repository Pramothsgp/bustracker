FROM oven/bun:1.2.4-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy all source needed for workspace resolution and runtime
COPY package.json bun.lock ./
COPY apps/server ./apps/server
COPY apps/web/package.json ./apps/web/package.json
COPY apps/mobile/package.json ./apps/mobile/package.json
COPY packages/shared ./packages/shared
COPY packages/db ./packages/db
COPY packages/email ./packages/email
COPY packages/config ./packages/config

# Install production dependencies
RUN bun install --frozen-lockfile

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser

USER appuser

EXPOSE 8080

CMD ["bun", "apps/server/src/index.ts"]

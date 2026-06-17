# syntax=docker/dockerfile:1
# To use this Dockerfile, you have to set `output: 'standalone'` in your next.config.mjs file.

FROM node:22.17.0-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
  pnpm i --frozen-lockfile --dangerously-allow-all-builds


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Dummy env vars for build stage so next build compiles without live DB connection
ENV DATABASE_URI="postgresql://postgres:dummy@localhost:5432/dummy"
ENV PAYLOAD_SECRET="dummy-secret-at-least-32-characters-long-for-build"
ARG NEXT_PUBLIC_SERVER_URL="http://localhost:3000"
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL

ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable pnpm && pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Enable pnpm so CLI commands (seed, migrate) work from the Coolify terminal
RUN corepack enable pnpm

# Copy full node_modules and source into /app/cli so Payload CLI commands work.
# These are kept separate from the standalone output to avoid conflicts.
COPY --from=deps /app/node_modules /app/cli/node_modules
COPY --from=builder /app/src /app/cli/src
COPY --from=builder /app/package.json /app/cli/package.json
COPY --from=builder /app/pnpm-lock.yaml /app/cli/pnpm-lock.yaml
COPY --from=builder /app/tsconfig.json /app/cli/tsconfig.json

# Remove this line if you do not have this folder
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache and media uploads
RUN mkdir .next
RUN chown nextjs:nodejs .next
RUN mkdir -p /app/media && chown -R nextjs:nodejs /app/media

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Run DB migrations automatically on every deploy, then start the server
COPY --from=builder /app/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["/app/docker-entrypoint.sh"]

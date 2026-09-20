# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------------------
# Firefly Studio production image (E25-01)
# Multi-stage, non-root, standalone Next.js output.
# ---------------------------------------------------------------------------

# Node 24, the current LTS — NOT 25.
#
# Dependabot moved this to node:25-alpine, which does not build at all: Node 25
# is the Current line and no longer ships corepack, so the next line fails with
# `corepack: not found` and the image never gets past its second layer. It is
# also the wrong support line for a self-hosted finance app — an odd-numbered
# release is EOL in months, where 24 is supported into 2028.
FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm" PATH="/pnpm:$PATH"
RUN corepack enable && apk add --no-cache libc6-compat

# --- dependencies ----------------------------------------------------------
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# `prepare` installs the git pre-commit hook (E23-08). The script is copied in
# because pnpm runs prepare during install, and this stage has the manifests
# but not yet the source — without it the build fails on a missing module. The
# script itself no-ops when there is no .git, which is the case here.
COPY scripts/install-hooks.mjs ./scripts/install-hooks.mjs
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# --- build -----------------------------------------------------------------
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build-time env only; real secrets are injected at runtime.
ENV APP_ENCRYPTION_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= \
    AUTH_SECRET=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= \
    DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN pnpm build && pnpm build:migrator

# --- runtime ---------------------------------------------------------------
FROM base AS runner
WORKDIR /app

# Stamped by the release workflow so a running container can say what it is.
ARG APP_VERSION=0.0.0-dev
ARG VCS_REF=unknown
ARG BUILD_DATE=unknown

ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 \
    APP_VERSION=${APP_VERSION} APP_VCS_REF=${VCS_REF}

LABEL org.opencontainers.image.title="Firefly Studio" \
      org.opencontainers.image.description="A modern front-end client for Firefly III" \
      org.opencontainers.image.source="https://github.com/jituboss/firefly-studio" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.licenses="MIT"

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

# Migrations must ship with the image so the entrypoint can apply them.
COPY --from=build --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=build --chown=nextjs:nodejs /app/dist/migrate.cjs ./dist/migrate.cjs
COPY --chown=nextjs:nodejs docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]

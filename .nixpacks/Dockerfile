# syntax=docker/dockerfile:1
#
# opensourcelegends.com, run on Bun.
#
# This file lives at .nixpacks/Dockerfile because that is the path dev2's compose
# stack builds (cli-tools dev2/dev2-site provision records it per site, and
# re-provisioning keeps it). It used to be nixpacks output (Node + pnpm); it is now
# a hand-written Bun image, so do not regenerate it with nixpacks.
#
# Contract with /home/anthony/www/opensourcelegends.com on dev2, unchanged from the
# Node image: listens on 3000 inside the container (compose maps
# 127.0.0.1:APP_PORT), answers / for the deploy health check, reads DATABASE_URL
# from app.env at run time. The app has no NEXT_PUBLIC_* build args and no volumes.

FROM oven/bun:1.4.0-slim AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# `bun --bun next build` (the build script): Next runs on Bun, not Node.
RUN bun run build

FROM oven/bun:1.4.0-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Docker sets HOSTNAME to the container id and Next's standalone server binds to it
# literally; it must listen on every interface for the published port to reach it.
ENV HOSTNAME=0.0.0.0
# Standalone output: server.js plus only the dependencies it imports.
COPY --from=build --chown=bun:bun /app/.next/standalone ./
COPY --from=build --chown=bun:bun /app/.next/static ./.next/static
# public/ holds the card art (and /releases/v1, /releases/v2). It is served as
# static files and src/lib/og.tsx reads it at request time from process.cwd().
COPY --from=build --chown=bun:bun /app/public ./public
# The oven/bun image ships a non-root `bun` user. Nothing is written at run time
# (no volumes; the waitlist is in Postgres).
USER bun
EXPOSE 3000
# 127.0.0.1, not localhost: localhost resolves ::1 first and Next binds IPv4 only.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"
CMD ["bun", "server.js"]

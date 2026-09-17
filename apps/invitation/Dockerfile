ARG BUN_VERSION=1.4.0
ARG CADDY_VERSION=2.11.4

FROM oven/bun:${BUN_VERSION}-alpine AS build

WORKDIR /workspace

COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/package.json
COPY apps/invitation/package.json apps/invitation/package.json
RUN bun install --frozen-lockfile --ignore-scripts

COPY apps/invitation apps/invitation

ARG PUBLIC_POCKETBASE_URL=https://api-wedding.onlytest.my.id
ARG PUBLIC_WEDDING_URL=https://wedding.onlytest.my.id
ARG PUBLIC_INVITATION_URL=https://onlytest.my.id
ENV PUBLIC_POCKETBASE_URL=$PUBLIC_POCKETBASE_URL
ENV PUBLIC_WEDDING_URL=$PUBLIC_WEDDING_URL
ENV PUBLIC_INVITATION_URL=$PUBLIC_INVITATION_URL

RUN bun run --cwd apps/invitation build

FROM caddy:${CADDY_VERSION}-alpine

ARG GIT_SHA=unknown

COPY deployment/Caddyfile.static /etc/caddy/Caddyfile
COPY --from=build /workspace/apps/invitation/build /srv

RUN printf '%s\n' "$GIT_SHA" > /srv/_wedez_revision

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1

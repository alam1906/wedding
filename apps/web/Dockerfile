FROM oven/bun:1-alpine AS build

WORKDIR /workspace

COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/package.json
COPY apps/invitation/package.json apps/invitation/package.json
RUN bun install --frozen-lockfile --ignore-scripts

COPY apps/web apps/web

ARG PUBLIC_POCKETBASE_URL=https://api-wedding.onlytest.my.id
ARG PUBLIC_WEDDING_URL=https://wedding.onlytest.my.id
ARG PUBLIC_INVITATION_URL=https://onlytest.my.id
ENV PUBLIC_POCKETBASE_URL=$PUBLIC_POCKETBASE_URL
ENV PUBLIC_WEDDING_URL=$PUBLIC_WEDDING_URL
ENV PUBLIC_INVITATION_URL=$PUBLIC_INVITATION_URL

RUN bun run --cwd apps/web build

FROM nginx:1.27-alpine

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/web/build /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

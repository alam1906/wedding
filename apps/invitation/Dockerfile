FROM oven/bun:1-alpine AS build

WORKDIR /workspace

COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/package.json
COPY apps/invitation/package.json apps/invitation/package.json
RUN bun install --frozen-lockfile --ignore-scripts

COPY apps/invitation apps/invitation

ARG PUBLIC_POCKETBASE_URL=https://api-wedding.onlytest.my.id
ARG PUBLIC_WEDDING_URL=https://wedding.onlytest.my.id
ENV PUBLIC_POCKETBASE_URL=$PUBLIC_POCKETBASE_URL
ENV PUBLIC_WEDDING_URL=$PUBLIC_WEDDING_URL

RUN bun run --cwd apps/invitation build

FROM node:22-alpine

WORKDIR /workspace/apps/invitation
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /workspace/node_modules /workspace/node_modules
COPY --from=build /workspace/apps/invitation/node_modules ./node_modules
COPY --from=build /workspace/apps/invitation/build ./build

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD node -e "fetch('http://127.0.0.1:3000/').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "build"]

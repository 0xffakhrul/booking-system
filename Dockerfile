# The whole app in one image: the API plus the built React app, which the API serves (ADR-0010).
# Build context is the repo root, because npm workspaces keep one package-lock.json there.
#
#   docker build --target prod -t booking-system .      (CI does this on every PR and merge)

FROM node:24-slim AS base
WORKDIR /app
# Copy only the manifests first, so the `npm ci` layers stay cached until dependencies change
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/

# dev: the API only; docker compose mounts api/src and api/migrations over the copied files
FROM base AS dev
RUN npm ci --workspace api
COPY api/ api/
WORKDIR /app/api
CMD ["npm", "run", "dev"]

# build: compile the API and build the React app
FROM base AS build
RUN npm ci
COPY api/ api/
COPY web/ web/
RUN npm run build --workspace api && npm run build --workspace web

# prod: runtime dependencies and compiled output only
FROM base AS prod
ENV NODE_ENV=production \
    WEB_DIST_DIR=/app/web/dist
# Security fixes released since the base image was built, so Trivy doesn't fail on ones already fixed
RUN apt-get update \
 && apt-get upgrade -y --no-install-recommends \
 && rm -rf /var/lib/apt/lists/*
# Nothing installs packages at runtime, so npm and corepack go: less to patch and less to attack
RUN npm ci --workspace api --omit=dev \
 && npm cache clean --force \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /opt/yarn-*
COPY --from=build /app/api/dist ./api/dist
COPY --from=build /app/api/migrations ./api/migrations
COPY --from=build /app/web/dist ./web/dist
WORKDIR /app/api
USER node
EXPOSE 3009
# Migrations and the app role: `node dist/db/setup.js` (MIGRATION_DATABASE_URL + DATABASE_URL)
CMD ["node", "dist/index.js"]

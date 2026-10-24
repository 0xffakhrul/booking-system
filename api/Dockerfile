# Build context is the repo root (see docker-compose.yml), because npm workspaces
# keep a single package-lock.json at the root.

FROM node:24-slim AS base
WORKDIR /app
# Copy only the manifests first, so the `npm ci` layer is cached until dependencies change
COPY package.json package-lock.json ./
COPY api/package.json api/

# dev: all dependencies; docker compose mounts api/src and api/migrations over the copied files
FROM base AS dev
RUN npm ci --workspace api
COPY api/ api/
WORKDIR /app/api
CMD ["npm", "run", "dev"]

# build: compile TypeScript
FROM base AS build
RUN npm ci --workspace api
COPY api/ api/
RUN npm run typecheck --workspace api && npm run build --workspace api

# prod: runtime dependencies + compiled output only, run as the non-root `node` user
FROM base AS prod
ENV NODE_ENV=production
RUN npm ci --workspace api --omit=dev && npm cache clean --force
COPY --from=build /app/api/dist ./api/dist
COPY --from=build /app/api/migrations ./api/migrations
WORKDIR /app/api
USER node
EXPOSE 3009
CMD ["node", "dist/index.js"]

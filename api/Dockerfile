FROM node:24-slim AS base
WORKDIR /app
COPY package.json package-lock.json ./

# dev
FROM base AS dev
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# build
FROM base AS build
RUN npm install
COPY . .
RUN npm run typecheck && npm run build

# prod
FROM base AS prod
ENV NODE_ENV=production
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3009
CMD ["node", "dist/index.js"]
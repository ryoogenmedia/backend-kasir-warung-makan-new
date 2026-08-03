# syntax=docker/dockerfile:1

# Install dependencies separately so Docker can reuse this layer when only
# application source files change.
FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package.json ./

# Prisma config validates DATABASE_URL during client generation. This value is
# only used while building; the real value must be supplied at runtime.
ENV DATABASE_URL=mysql://docker:docker@127.0.0.1:3306/docker

RUN npm install --no-audit --no-fund

# Build the application and remove development-only packages afterwards.
FROM dependencies AS builder

COPY . .

RUN npx prisma generate
RUN npm run build
RUN test -f /app/dist/src/main.js
RUN npm prune --omit=dev

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/package.json ./package.json

# Uploads are runtime data. A Dokploy volume can be mounted at /app/uploads.
RUN mkdir -p uploads/menus uploads/promos uploads/payments uploads/branding \
    && chown -R node:node /app/uploads

USER node

EXPOSE 3000

CMD ["node", "dist/src/main.js"]

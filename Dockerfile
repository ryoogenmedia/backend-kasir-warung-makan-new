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
# Keep the schema available for one-off Prisma maintenance commands in Dokploy.
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/prisma.config.ts ./prisma.config.ts

# Uploads and WhatsApp credentials are runtime data. Dokploy volumes can be
# mounted at these paths without masking the application files in /app.
RUN mkdir -p uploads/menus uploads/promos uploads/payments uploads/branding \
    .baileys_auth_sender .baileys_auth_receiver \
    && chown -R node:node /app/uploads /app/.baileys_auth_sender \
    /app/.baileys_auth_receiver

USER node

EXPOSE 3000

CMD ["node", "dist/src/main.js"]

# Install dependencies separately so Docker can reuse this layer when only
# application source files change.
FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package.json ./

# Prisma config validates DATABASE_URL during client generation. This value is
# only used while building; the real value must be supplied at runtime.
ENV DATABASE_URL=mysql://docker:docker@127.0.0.1:3306/docker

RUN npm install --no-audit --no-fund

# Build the application
FROM dependencies AS builder

WORKDIR /app

COPY . .

RUN npx prisma generate
RUN npm run build
RUN npx tsc --outDir dist --module commonjs --target ES2023 --esModuleInterop true --skipLibCheck true prisma/seed.ts prisma/seeders/*.ts || true
RUN test -f /app/dist/src/main.js

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Ensure uploads, auth dirs exist and grant full ownership of /app to node user
RUN mkdir -p uploads/menus uploads/promos uploads/payments uploads/branding \
    .baileys_auth_sender .baileys_auth_receiver \
    && chown -R node:node /app

USER node

EXPOSE 3000

CMD ["node", "dist/src/main.js"]

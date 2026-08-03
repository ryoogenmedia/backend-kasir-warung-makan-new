import 'dotenv/config';
import { defineConfig, env } from '@prisma/config';

const seedCommand =
  process.env.NODE_ENV === 'production'
    ? 'node dist/prisma/seed.js'
    : 'npx ts-node prisma/seed.ts';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    seed: seedCommand,
  },
});

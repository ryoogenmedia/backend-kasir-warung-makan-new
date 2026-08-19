import 'dotenv/config';
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import mariadb from 'mariadb';

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    // No DATABASE_URL — return a stub client that will fail gracefully on queries
    return new PrismaClient() as any;
  }
  const pool = mariadb.createPool({
    uri: dbUrl,
    connectionLimit: 5,
    acquireTimeout: 30000,
    connectTimeout: 10000,
  });
  const adapter = new PrismaMariaDb(pool);
  return new PrismaClient({ adapter }) as any;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      const pool = mariadb.createPool({
        uri: dbUrl,
        connectionLimit: 5,
        acquireTimeout: 30000,
        connectTimeout: 10000,
      });
      const adapter = new PrismaMariaDb(pool);
      super({ adapter });
    } else {
      super();
    }
  }

  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      this.logger.warn('DATABASE_URL environment variable is not defined');
      return;
    }
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (err) {
      this.logger.error('Failed to connect to database on startup:', err);
    }
  }
}

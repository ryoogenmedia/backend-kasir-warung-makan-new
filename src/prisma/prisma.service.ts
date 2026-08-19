import 'dotenv/config';
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();
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

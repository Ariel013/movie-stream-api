import {
  Injectable, OnModuleInit, OnModuleDestroy, Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import type { INestApplication } from '@nestjs/common';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { level: 'warn',  emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'query', emit: 'event' },
      ],
    });
  }

  async onModuleInit() {
    // Log slow queries in development
    if (process.env.NODE_ENV !== 'production') {
      (this.$on as any)('query', (e: { query: string; duration: number }) => {
        if (e.duration > 500) {
          this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
        }
      });
    }

    (this.$on as any)('error', (e: { message: string }) => {
      this.logger.error(`Prisma error: ${e.message}`);
    });

    await this.$connect();
    this.logger.log('Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /** Enable graceful shutdown via NestJS lifecycle. */
  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }

  /**
   * Run a set of operations in a Prisma interactive transaction.
   * Usage: await this.prisma.transaction(tx => tx.bloodBag.update(...))
   */
  async transaction<T>(
    fn: (tx: Omit<PrismaService, 'transaction' | 'enableShutdownHooks'>) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(fn as any, {
      maxWait: 5_000,
      timeout: 10_000,
    });
  }
}

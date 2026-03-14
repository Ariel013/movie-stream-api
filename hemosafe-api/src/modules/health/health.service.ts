import {
  Injectable,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';

interface CheckResult {
  status: 'ok' | 'error';
  latencyMs: number;
  error?: string;
}

export interface HealthReport {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: CheckResult;
    redis: CheckResult;
    memory: { heapUsedMb: number; heapTotalMb: number; rssMb: number };
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly version = process.env.npm_package_version ?? '1.0.0';

  // Simple in-memory request counter for metrics (resets on restart)
  private requestCount  = 0;
  private errorCount    = 0;
  private startedAt     = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async check(): Promise<HealthReport> {
    const [db, cache] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const mem = process.memoryUsage();
    const memory = {
      heapUsedMb:  Math.round(mem.heapUsed  / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      rssMb:       Math.round(mem.rss       / 1024 / 1024),
    };

    const allOk   = db.status === 'ok' && cache.status === 'ok';
    const anyDown = db.status === 'error' || cache.status === 'error';

    const report: HealthReport = {
      status:    anyDown ? 'error' : allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version:   this.version,
      uptime:    Math.floor((Date.now() - this.startedAt) / 1000),
      checks:    { database: db, redis: cache, memory },
    };

    if (anyDown) {
      this.logger.warn('Health check failed', report);
      throw new ServiceUnavailableException(report);
    }

    return report;
  }

  private async checkDatabase(): Promise<CheckResult> {
    const t0 = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', latencyMs: Date.now() - t0 };
    } catch (err: any) {
      return { status: 'error', latencyMs: Date.now() - t0, error: err.message };
    }
  }

  private async checkRedis(): Promise<CheckResult> {
    const t0 = Date.now();
    try {
      const pong = await this.redis.ping();
      if (pong !== 'PONG') throw new Error('Unexpected PING response');
      return { status: 'ok', latencyMs: Date.now() - t0 };
    } catch (err: any) {
      return { status: 'error', latencyMs: Date.now() - t0, error: err.message };
    }
  }

  /**
   * Returns Prometheus text format metrics.
   * Called by GET /api/v1/metrics, scraped by Prometheus every 15s.
   *
   * For full instrumentation install `prom-client` and replace this
   * with PrometheusModule from @willsoto/nestjs-prometheus.
   */
  async getMetrics(): Promise<string> {
    const mem   = process.memoryUsage();
    const uptime = Math.floor((Date.now() - this.startedAt) / 1000);

    const lines = [
      '# HELP process_uptime_seconds Time since the API process started',
      '# TYPE process_uptime_seconds gauge',
      `process_uptime_seconds ${uptime}`,

      '# HELP process_heap_used_bytes V8 heap used',
      '# TYPE process_heap_used_bytes gauge',
      `process_heap_used_bytes ${mem.heapUsed}`,

      '# HELP process_heap_total_bytes V8 heap total',
      '# TYPE process_heap_total_bytes gauge',
      `process_heap_total_bytes ${mem.heapTotal}`,

      '# HELP process_rss_bytes Resident Set Size',
      '# TYPE process_rss_bytes gauge',
      `process_rss_bytes ${mem.rss}`,

      '# HELP hemosafe_api_info API version info',
      '# TYPE hemosafe_api_info gauge',
      `hemosafe_api_info{version="${this.version}",node_version="${process.version}"} 1`,
    ];

    return lines.join('\n') + '\n';
  }

  /** Called by the LoggingInterceptor to update counters. */
  incrementRequest(isError: boolean): void {
    this.requestCount++;
    if (isError) this.errorCount++;
  }
}

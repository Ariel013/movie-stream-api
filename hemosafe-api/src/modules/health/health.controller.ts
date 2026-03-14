import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';
import type { HealthReport } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * GET /api/v1/health
   *
   * Used by:
   *   - Docker HEALTHCHECK (wget -q -O- http://localhost:3001/api/v1/health)
   *   - CI/CD smoke tests
   *   - Nginx upstream health probe
   *   - Prometheus blackbox exporter
   *
   * Returns HTTP 200 when all checks pass, HTTP 503 on any failure.
   */
  @Get()
  @ApiOperation({ summary: 'System health check' })
  async check(): Promise<HealthReport> {
    return this.healthService.check();
  }

  /**
   * GET /api/v1/metrics
   *
   * Returns Prometheus-format text metrics for application-level instrumentation.
   * Scraped by Prometheus every 15s.
   */
  @Get('metrics')
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  async metrics() {
    return this.healthService.getMetrics();
  }
}

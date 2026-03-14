import { HealthService } from './health.service';
import type { HealthReport } from './health.service';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    check(): Promise<HealthReport>;
    metrics(): Promise<string>;
}

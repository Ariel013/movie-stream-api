import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { BatchSyncDto } from './dto/batch-sync.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';

@ApiTags('Sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  /**
   * POST /sync/batch
   *
   * Accepts up to 50 offline-queued mutations in one request.
   * Each operation carries its own X-Idempotency-Key via the operationId field,
   * so replaying the batch is always safe.
   *
   * Response: array of per-operation results with status:
   *   'applied'   — executed successfully
   *   'duplicate' — already seen (idempotency cache hit)
   *   'conflict'  — server version is newer; client should pull
   *   'error'     — unexpected failure
   */
  @Post('batch')
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({ summary: 'Process a batch of offline-queued mutations' })
  async batch(
    @Body() dto: BatchSyncDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    const results = await this.syncService.processBatch(dto, actor);
    return { results };
  }

  /**
   * GET /sync/pull?since=<ISO>&scopes=stock,reservations,patients,notifications
   *
   * Returns all records changed after `since` for the actor's facility.
   * Client merges these into IndexedDB (server wins on conflict).
   * If `since` is omitted, returns the last 500 records per scope (initial load).
   */
  @Get('pull')
  @ApiOperation({ summary: 'Pull server changes since last sync' })
  async pull(
    @Query('since') sinceStr: string | undefined,
    @Query('scopes') scopesStr: string | undefined,
    @CurrentUser() actor: JwtPayload,
  ) {
    const since  = sinceStr ? new Date(sinceStr) : null;
    const scopes = scopesStr ? scopesStr.split(',') : ['stock', 'reservations', 'patients', 'notifications'];

    const data = await this.syncService.pull(since, scopes, actor.facilityId ?? actor.sub, actor.sub);
    return { data };
  }
}

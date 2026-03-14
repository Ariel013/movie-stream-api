import { SyncService } from './sync.service';
import { BatchSyncDto } from './dto/batch-sync.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class SyncController {
    private readonly syncService;
    constructor(syncService: SyncService);
    batch(dto: BatchSyncDto, actor: JwtPayload): Promise<{
        results: import("./sync.service").OperationResult[];
    }>;
    pull(sinceStr: string | undefined, scopesStr: string | undefined, actor: JwtPayload): Promise<{
        data: import("./sync.service").PullResponse;
    }>;
}

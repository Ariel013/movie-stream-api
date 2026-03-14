export declare class SyncOperationDto {
    operationId: string;
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    endpoint: string;
    payload: Record<string, unknown>;
    entityType: string;
    entityId: string;
}
export declare class BatchSyncDto {
    operations: SyncOperationDto[];
}

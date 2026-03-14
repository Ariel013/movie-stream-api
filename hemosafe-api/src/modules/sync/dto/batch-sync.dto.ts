import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsObject,
  IsString,
  IsUUID,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator';

export class SyncOperationDto {
  @IsUUID()
  operationId: string;

  @IsIn(['POST', 'PUT', 'PATCH', 'DELETE'])
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';

  @IsString()
  endpoint: string;

  @IsObject()
  payload: Record<string, unknown>;

  @IsString()
  entityType: string;

  @IsString()
  entityId: string;
}

export class BatchSyncDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SyncOperationDto)
  operations: SyncOperationDto[];
}

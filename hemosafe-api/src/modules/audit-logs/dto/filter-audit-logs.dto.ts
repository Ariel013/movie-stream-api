import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class FilterAuditLogsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Exact match on entity name' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  entity?: string;

  @ApiPropertyOptional({ description: 'Partial match on actor name, entity ID, or action string' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

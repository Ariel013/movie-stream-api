import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class FilterPatientsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Partial match on name, national ID, or medical record number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true')  return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;
}

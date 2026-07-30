import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class FilterDonorsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Partial match on national ID or full name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by donor eligibility' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true')  return true;
    if (value === 'false') return false;
    return value;
  })
  isEligible?: boolean;
}

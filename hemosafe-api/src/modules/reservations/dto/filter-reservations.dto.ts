import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReservationStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class FilterReservationsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ReservationStatus })
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @ApiPropertyOptional({ description: 'Partial match on reservation code or hospital name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

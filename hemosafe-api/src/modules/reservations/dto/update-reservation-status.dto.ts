import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReservationStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateReservationStatusDto {
  @ApiProperty({ enum: ReservationStatus })
  @IsEnum(ReservationStatus)
  status: ReservationStatus;

  @ApiPropertyOptional({ description: 'Required when cancelling' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  cancelReason?: string;
}

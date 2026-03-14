import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AboGroup, RhFactor } from '@prisma/client';
import {
  IsDateString, IsEnum, IsInt, IsOptional,
  IsString, IsUUID, Max, Min,
} from 'class-validator';

export class CreateBloodBagDto {
  @ApiProperty({ example: 'BAG-2025-001234' })
  @IsString()
  code: string;

  @ApiProperty({ enum: AboGroup })
  @IsEnum(AboGroup)
  aboGroup: AboGroup;

  @ApiProperty({ enum: RhFactor })
  @IsEnum(RhFactor)
  rhFactor: RhFactor;

  @ApiProperty({ example: '550a8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  bloodTypeId: string;

  /** Required when actor role is ADMIN — BLOOD_BANK uses their own facilityId */
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bloodBankId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  donorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  screeningId?: string;

  @ApiProperty({ minimum: 100, maximum: 600, example: 450 })
  @IsInt()
  @Min(100)
  @Max(600)
  volumeMl: number;

  @ApiProperty({ example: '2025-10-01T09:00:00Z' })
  @IsDateString()
  collectedAt: string;

  @ApiProperty({ example: '2025-11-12T09:00:00Z' })
  @IsDateString()
  expiresAt: string;
}

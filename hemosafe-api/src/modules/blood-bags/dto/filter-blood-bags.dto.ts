import { ApiPropertyOptional } from '@nestjs/swagger';
import { AboGroup, BagStatus, RhFactor } from '@prisma/client';
import {
  IsEnum, IsInt, IsOptional, IsUUID, Max, Min,
} from 'class-validator';

export class FilterBloodBagsDto {
  @ApiPropertyOptional({ enum: AboGroup })
  @IsOptional()
  @IsEnum(AboGroup)
  aboGroup?: AboGroup;

  @ApiPropertyOptional({ enum: RhFactor })
  @IsOptional()
  @IsEnum(RhFactor)
  rhFactor?: RhFactor;

  @ApiPropertyOptional({ enum: BagStatus })
  @IsOptional()
  @IsEnum(BagStatus)
  status?: BagStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bloodBankId?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

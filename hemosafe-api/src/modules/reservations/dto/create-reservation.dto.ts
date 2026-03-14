import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AboGroup, RhFactor, UrgencyLevel } from '@prisma/client';
import {
  IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min,
} from 'class-validator';

export class CreateReservationDto {
  @ApiProperty()
  @IsUUID()
  bloodBankId: string;

  @ApiProperty({ enum: AboGroup })
  @IsEnum(AboGroup)
  aboGroup: AboGroup;

  @ApiProperty({ enum: RhFactor })
  @IsEnum(RhFactor)
  rhFactor: RhFactor;

  @ApiProperty()
  @IsUUID()
  bloodTypeId: string;

  @ApiProperty({ minimum: 1, maximum: 50 })
  @IsInt() @Min(1) @Max(50)
  quantity: number;

  @ApiProperty({ enum: UrgencyLevel, default: UrgencyLevel.ROUTINE })
  @IsEnum(UrgencyLevel)
  urgency: UrgencyLevel = UrgencyLevel.ROUTINE;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  prescriptionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

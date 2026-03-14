import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UrgencyLevel } from '@prisma/client';

export class CreatePrescriptionDto {
  @ApiProperty({ description: 'UUID of the patient' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ description: 'UUID of the required blood type' })
  @IsUUID()
  bloodTypeId: string;

  @ApiProperty({ description: 'Number of blood bags requested (1–50)', minimum: 1, maximum: 50 })
  @IsInt()
  @Min(1)
  @Max(50)
  quantity: number;

  @ApiProperty({ enum: UrgencyLevel, description: 'Urgency level of the prescription' })
  @IsEnum(UrgencyLevel)
  urgency: UrgencyLevel;

  @ApiPropertyOptional({ description: 'Clinical notes for the prescription' })
  @IsOptional()
  @IsString()
  clinicalNotes?: string;

  @ApiPropertyOptional({ description: 'Expiry date of the prescription in ISO 8601 format' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

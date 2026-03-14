import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePatientDto {
  @ApiPropertyOptional({
    description: 'UUID of the hospital (ADMIN only — overrides token facilityId)',
  })
  @IsOptional()
  @IsUUID()
  hospitalId?: string;

  @ApiPropertyOptional({ description: 'National ID of the patient' })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ description: 'Date of birth in ISO 8601 format' })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiPropertyOptional({ description: 'UUID of the patient blood type' })
  @IsOptional()
  @IsUUID()
  bloodTypeId?: string;

  @ApiPropertyOptional({ description: 'Internal medical record number' })
  @IsOptional()
  @IsString()
  medicalRecordNo?: string;
}

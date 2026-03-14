import {
  IsUUID,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateScreeningDto {
  @ApiProperty({ description: 'UUID of the donor being screened' })
  @IsUUID()
  donorId: string;

  @ApiPropertyOptional({ description: 'Hemoglobin level in g/dL' })
  @IsOptional()
  @IsNumber()
  hemoglobinGDl?: number;

  @ApiPropertyOptional({ description: 'Blood pressure reading (max 10 chars, e.g. 120/80)' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  bloodPressure?: string;

  @ApiPropertyOptional({ description: 'Weight in kilograms' })
  @IsOptional()
  @IsNumber()
  weightKg?: number;

  @ApiPropertyOptional({ description: 'Body temperature in Celsius' })
  @IsOptional()
  @IsNumber()
  temperatureC?: number;

  @ApiProperty({ description: 'Whether the donor passed the screening' })
  @IsBoolean()
  isPassed: boolean;

  @ApiPropertyOptional({ description: 'Additional notes from the screening' })
  @IsOptional()
  @IsString()
  notes?: string;
}

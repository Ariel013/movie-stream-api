import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail, IsNumber, IsOptional, IsString, IsUUID, Max, Min,
} from 'class-validator';

export class CreateBloodBankDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Unique facility code' })
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty({ description: 'Region UUID' })
  @IsUUID()
  regionId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ format: 'email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Latitude (-90 to 90)' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude (-180 to 180)' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;
}

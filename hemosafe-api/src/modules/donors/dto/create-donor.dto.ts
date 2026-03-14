import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsUUID,
  IsOptional,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDonorDto {
  @ApiProperty({ description: 'National ID of the donor' })
  @IsString()
  @IsNotEmpty()
  nationalId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ description: 'Date of birth in ISO 8601 format' })
  @IsDateString()
  dob: string;

  @ApiProperty({ description: 'UUID of the blood type' })
  @IsUUID()
  bloodTypeId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'UUID of the blood bank where the donor is registered' })
  @IsOptional()
  @IsUUID()
  registeredBankId?: string;
}

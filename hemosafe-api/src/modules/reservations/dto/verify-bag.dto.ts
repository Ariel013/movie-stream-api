import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class VerifyBagDto {
  @ApiProperty({ description: 'Barcode printed on the blood bag', example: 'BAG-2025-001234' })
  @IsString()
  @MinLength(3)
  bagCode: string;
}

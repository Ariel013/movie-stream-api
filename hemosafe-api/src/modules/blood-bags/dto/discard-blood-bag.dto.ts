import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class DiscardBloodBagDto {
  @ApiProperty({ example: 'Contamination detected during quality check' })
  @IsString()
  @MinLength(10)
  reason: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTransferDto {
  @ApiProperty({ description: 'Destination blood bank ID' })
  @IsUUID()
  toBankId: string;

  @ApiPropertyOptional({ description: 'Reason for the transfer' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'IDs of blood bags to transfer (min 1)',
    type: [String],
    format: 'uuid',
  })
  @IsUUID('all', { each: true })
  @ArrayMinSize(1)
  bloodBagIds: string[];
}

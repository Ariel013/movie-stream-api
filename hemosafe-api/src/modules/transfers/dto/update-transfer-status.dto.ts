import { ApiProperty } from '@nestjs/swagger';
import { TransferStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

/**
 * Allowed FSM transitions:
 *   INITIATED → IN_TRANSIT  (initiator bank marks as shipped)
 *   IN_TRANSIT → RECEIVED   (recipient bank confirms receipt)
 * CANCELLED is handled by the dedicated cancel endpoint.
 */
export class UpdateTransferStatusDto {
  @ApiProperty({
    enum: [TransferStatus.IN_TRANSIT, TransferStatus.RECEIVED],
    description: 'New transfer status. Only INITIATED→IN_TRANSIT→RECEIVED are allowed here.',
  })
  @IsEnum(TransferStatus)
  status: TransferStatus;
}

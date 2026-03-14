import { ReservationStatus } from '@prisma/client';
export declare class UpdateReservationStatusDto {
    status: ReservationStatus;
    cancelReason?: string;
}

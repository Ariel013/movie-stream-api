import { ReservationStatus, UrgencyLevel } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { JwtPayload } from '../../../common/decorators/current-user.decorator';
export interface AvailableBagRow {
    id: string;
    code: string;
    expires_at: Date;
    volume_ml: number;
    blood_bank_id: string;
    blood_type_id: string;
}
export declare class ReservationValidatorService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    assertBloodBankExists(bloodBankId: string): Promise<void>;
    assertBloodTypeExists(bloodTypeId: string): Promise<void>;
    assertPrescriptionValid(prescriptionId: string, hospitalId: string, bloodTypeId: string, quantity: number): Promise<void>;
    assertSufficientStock(bags: AvailableBagRow[], requestedQty: number, urgency: UrgencyLevel): AvailableBagRow[];
    private readonly FSM;
    assertFsmTransition(current: ReservationStatus, next: ReservationStatus): void;
    assertRoleForTransition(actor: JwtPayload, to: ReservationStatus): void;
    assertCancelReasonProvided(reason: string | undefined): void;
    assertNotExpired(expiresAt: Date): void;
}

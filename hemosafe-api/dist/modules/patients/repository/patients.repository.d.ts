import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
export declare class PatientsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(hospitalId?: string): Prisma.PrismaPromise<{
        id: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        nationalId: string | null;
        dob: Date | null;
        bloodTypeId: string | null;
        hospitalId: string;
        medicalRecordNo: string | null;
    }[]>;
    findById(id: string): Prisma.Prisma__PatientClient<({
        bloodType: {
            id: string;
            aboGroup: import(".prisma/client").$Enums.AboGroup;
            rhFactor: import(".prisma/client").$Enums.RhFactor;
            label: string;
            compatibleDonor: string[];
        } | null;
        prescriptions: {
            id: string;
            createdAt: Date;
            bloodTypeId: string;
            expiresAt: Date | null;
            hospitalId: string;
            patientId: string;
            physicianId: string;
            quantity: number;
            urgency: import(".prisma/client").$Enums.UrgencyLevel;
            clinicalNotes: string | null;
            isFulfilled: boolean;
            fulfilledAt: Date | null;
        }[];
        hospital: {
            name: string;
            type: import(".prisma/client").$Enums.FacilityType;
            email: string | null;
            id: string;
            phone: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            address: string;
            regionId: string;
        };
    } & {
        id: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        nationalId: string | null;
        dob: Date | null;
        bloodTypeId: string | null;
        hospitalId: string;
        medicalRecordNo: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    create(data: Prisma.PatientCreateInput): Prisma.Prisma__PatientClient<{
        id: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        nationalId: string | null;
        dob: Date | null;
        bloodTypeId: string | null;
        hospitalId: string;
        medicalRecordNo: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, data: Prisma.PatientUpdateInput): Prisma.Prisma__PatientClient<{
        id: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        nationalId: string | null;
        dob: Date | null;
        bloodTypeId: string | null;
        hospitalId: string;
        medicalRecordNo: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    deactivate(id: string): Prisma.Prisma__PatientClient<{
        id: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        nationalId: string | null;
        dob: Date | null;
        bloodTypeId: string | null;
        hospitalId: string;
        medicalRecordNo: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}

import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
export declare class PatientsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(hospitalId?: string): Prisma.PrismaPromise<({
        bloodType: {
            label: string;
        } | null;
    } & {
        id: string;
        hospitalId: string;
        nationalId: string | null;
        firstName: string;
        lastName: string;
        dob: Date | null;
        bloodTypeId: string | null;
        medicalRecordNo: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findById(id: string): Prisma.Prisma__PatientClient<({
        hospital: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            type: import(".prisma/client").$Enums.FacilityType;
            code: string;
            address: string;
            regionId: string;
            phone: string | null;
            email: string | null;
        };
        bloodType: {
            id: string;
            aboGroup: import(".prisma/client").$Enums.AboGroup;
            rhFactor: import(".prisma/client").$Enums.RhFactor;
            label: string;
            compatibleDonor: string[];
        } | null;
        prescriptions: {
            id: string;
            hospitalId: string;
            bloodTypeId: string;
            createdAt: Date;
            patientId: string;
            physicianId: string;
            quantity: number;
            urgency: import(".prisma/client").$Enums.UrgencyLevel;
            clinicalNotes: string | null;
            isFulfilled: boolean;
            fulfilledAt: Date | null;
            expiresAt: Date | null;
        }[];
    } & {
        id: string;
        hospitalId: string;
        nationalId: string | null;
        firstName: string;
        lastName: string;
        dob: Date | null;
        bloodTypeId: string | null;
        medicalRecordNo: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    create(data: Prisma.PatientCreateInput): Prisma.Prisma__PatientClient<{
        id: string;
        hospitalId: string;
        nationalId: string | null;
        firstName: string;
        lastName: string;
        dob: Date | null;
        bloodTypeId: string | null;
        medicalRecordNo: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, data: Prisma.PatientUpdateInput): Prisma.Prisma__PatientClient<{
        id: string;
        hospitalId: string;
        nationalId: string | null;
        firstName: string;
        lastName: string;
        dob: Date | null;
        bloodTypeId: string | null;
        medicalRecordNo: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    deactivate(id: string): Prisma.Prisma__PatientClient<{
        id: string;
        hospitalId: string;
        nationalId: string | null;
        firstName: string;
        lastName: string;
        dob: Date | null;
        bloodTypeId: string | null;
        medicalRecordNo: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}

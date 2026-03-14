import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientsService } from './patients.service';
export declare class PatientsController {
    private readonly patientsService;
    constructor(patientsService: PatientsService);
    findAll(actor: JwtPayload): import(".prisma/client").Prisma.PrismaPromise<{
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
    findOne(id: string, actor: JwtPayload): Promise<{
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
    }>;
    create(dto: CreatePatientDto, actor: JwtPayload): import(".prisma/client").Prisma.Prisma__PatientClient<{
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
    update(id: string, dto: Partial<CreatePatientDto>, actor: JwtPayload): import(".prisma/client").Prisma.Prisma__PatientClient<{
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
    deactivate(id: string, actor: JwtPayload): import(".prisma/client").Prisma.Prisma__PatientClient<{
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

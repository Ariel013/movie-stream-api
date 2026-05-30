import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientsService } from './patients.service';
export declare class PatientsController {
    private readonly patientsService;
    constructor(patientsService: PatientsService);
    findAll(actor: JwtPayload): import(".prisma/client").Prisma.PrismaPromise<({
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
    findOne(id: string, actor: JwtPayload): Promise<{
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
    }>;
    create(dto: CreatePatientDto, actor: JwtPayload): import(".prisma/client").Prisma.Prisma__PatientClient<{
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
    update(id: string, dto: Partial<CreatePatientDto>, actor: JwtPayload): import(".prisma/client").Prisma.Prisma__PatientClient<{
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
    deactivate(id: string, actor: JwtPayload): import(".prisma/client").Prisma.Prisma__PatientClient<{
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

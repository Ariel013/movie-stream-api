import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientsRepository } from './repository/patients.repository';

@Injectable()
export class PatientsService {
  constructor(private readonly patientsRepository: PatientsRepository) {}

  findAll(actor: JwtPayload, page: number, limit: number, search?: string, isActive?: boolean) {
    if (actor.role === UserRole.BLOOD_BANK) {
      throw new ForbiddenException('Blood banks cannot access patient records');
    }
    if (actor.role === UserRole.HOSPITAL) {
      return this.patientsRepository.findAll(actor.facilityId ?? undefined, page, limit, search, isActive);
    }
    return this.patientsRepository.findAll(undefined, page, limit, search, isActive);
  }

  async findOne(id: string, actor: JwtPayload) {
    if (actor.role === UserRole.BLOOD_BANK) {
      throw new ForbiddenException('Blood banks cannot access patient records');
    }
    const patient = await this.patientsRepository.findById(id);
    if (!patient) {
      throw new NotFoundException(`Patient ${id} not found`);
    }
    if (actor.role === UserRole.HOSPITAL && patient.hospitalId !== actor.facilityId) {
      throw new ForbiddenException('Access denied to this patient');
    }
    return patient;
  }

  create(dto: CreatePatientDto, actor: JwtPayload) {
    if (actor.role === UserRole.BLOOD_BANK) {
      throw new ForbiddenException('Blood banks cannot create patient records');
    }

    const hospitalId =
      actor.role === UserRole.HOSPITAL
        ? (actor.facilityId ?? undefined)
        : (dto.hospitalId ?? undefined);

    return this.patientsRepository.create({
      hospital: { connect: { id: hospitalId } },
      nationalId: dto.nationalId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      dob: dto.dob ? new Date(dto.dob) : undefined,
      bloodType: dto.bloodTypeId
        ? { connect: { id: dto.bloodTypeId } }
        : undefined,
      medicalRecordNo: dto.medicalRecordNo,
    });
  }

  async update(id: string, dto: Partial<CreatePatientDto>, actor: JwtPayload) {
    if (actor.role === UserRole.BLOOD_BANK) {
      throw new ForbiddenException('Blood banks cannot update patient records');
    }
    await this.assertHospitalOwnership(id, actor);
    return this.patientsRepository.update(id, {
      nationalId: dto.nationalId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      dob: dto.dob ? new Date(dto.dob) : undefined,
      bloodType: dto.bloodTypeId
        ? { connect: { id: dto.bloodTypeId } }
        : undefined,
      medicalRecordNo: dto.medicalRecordNo,
    });
  }

  async deactivate(id: string, actor: JwtPayload) {
    if (actor.role === UserRole.BLOOD_BANK) {
      throw new ForbiddenException('Blood banks cannot deactivate patient records');
    }
    await this.assertHospitalOwnership(id, actor);
    return this.patientsRepository.deactivate(id);
  }

  private async assertHospitalOwnership(id: string, actor: JwtPayload) {
    if (actor.role !== UserRole.HOSPITAL) return;
    const patient = await this.patientsRepository.findById(id);
    if (!patient) {
      throw new NotFoundException(`Patient ${id} not found`);
    }
    if (patient.hospitalId !== actor.facilityId) {
      throw new ForbiddenException('Access denied to this patient');
    }
  }
}

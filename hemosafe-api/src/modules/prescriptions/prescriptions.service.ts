import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { PrescriptionsRepository } from './repository/prescriptions.repository';

@Injectable()
export class PrescriptionsService {
  constructor(
    private readonly prescriptionsRepository: PrescriptionsRepository,
  ) {}

  findAll(actor: JwtPayload) {
    if (actor.role === UserRole.BLOOD_BANK) {
      throw new ForbiddenException('Blood banks cannot access prescriptions');
    }
    if (actor.role === UserRole.HOSPITAL) {
      return this.prescriptionsRepository.findAll({
        hospitalId: actor.facilityId ?? undefined,
      });
    }
    return this.prescriptionsRepository.findAll();
  }

  async findOne(id: string, actor: JwtPayload) {
    if (actor.role === UserRole.BLOOD_BANK) {
      throw new ForbiddenException('Blood banks cannot access prescriptions');
    }
    const prescription = await this.prescriptionsRepository.findById(id);
    if (!prescription) {
      throw new NotFoundException(`Prescription ${id} not found`);
    }
    if (
      actor.role === UserRole.HOSPITAL &&
      prescription.hospitalId !== actor.facilityId
    ) {
      throw new ForbiddenException('Access denied to this prescription');
    }
    return prescription;
  }

  create(dto: CreatePrescriptionDto, actor: JwtPayload) {
    if (actor.role === UserRole.BLOOD_BANK) {
      throw new ForbiddenException('Blood banks cannot create prescriptions');
    }

    const hospitalId: string =
      actor.role === UserRole.HOSPITAL
        ? actor.facilityId!
        : ((dto as any).hospitalId ?? (() => { throw new Error('hospitalId required for ADMIN'); })());

    return this.prescriptionsRepository.create({
      patient:    { connect: { id: dto.patientId } },
      physician:  { connect: { id: actor.sub } },
      bloodType:  { connect: { id: dto.bloodTypeId } },
      hospitalId,
      quantity: dto.quantity,
      urgency: dto.urgency,
      clinicalNotes: dto.clinicalNotes,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
  }

  async markFulfilled(id: string, actor: JwtPayload) {
    if (actor.role === UserRole.BLOOD_BANK) {
      throw new ForbiddenException('Blood banks cannot fulfill prescriptions');
    }
    const prescription = await this.prescriptionsRepository.findById(id);
    if (!prescription) {
      throw new NotFoundException(`Prescription ${id} not found`);
    }
    if (
      actor.role !== UserRole.ADMIN &&
      prescription.hospitalId !== actor.facilityId
    ) {
      throw new ForbiddenException(
        'Only ADMIN or the same hospital can fulfill this prescription',
      );
    }
    return this.prescriptionsRepository.markFulfilled(id);
  }

  findUnfulfilled(actor: JwtPayload) {
    if (actor.role === UserRole.BLOOD_BANK) {
      throw new ForbiddenException('Blood banks cannot access prescriptions');
    }
    if (actor.role === UserRole.HOSPITAL) {
      return this.prescriptionsRepository.findUnfulfilled(
        actor.facilityId ?? undefined,
      );
    }
    return this.prescriptionsRepository.findUnfulfilled();
  }
}

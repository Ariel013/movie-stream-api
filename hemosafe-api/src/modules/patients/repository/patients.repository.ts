import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PatientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(hospitalId?: string) {
    return this.prisma.patient.findMany({
      where: hospitalId ? { hospitalId } : undefined,
    });
  }

  findById(id: string) {
    return this.prisma.patient.findUnique({
      where: { id },
      include: {
        hospital: true,
        bloodType: true,
        prescriptions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  create(data: Prisma.PatientCreateInput) {
    return this.prisma.patient.create({ data });
  }

  update(id: string, data: Prisma.PatientUpdateInput) {
    return this.prisma.patient.update({ where: { id }, data });
  }

  deactivate(id: string) {
    return this.prisma.patient.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PatientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    hospitalId: string | undefined,
    page: number,
    limit: number,
    search?: string,
    isActive?: boolean,
  ) {
    const where: Prisma.PatientWhereInput = {
      ...(hospitalId && { hospitalId }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { firstName:       { contains: search, mode: 'insensitive' } },
          { lastName:        { contains: search, mode: 'insensitive' } },
          { nationalId:      { contains: search, mode: 'insensitive' } },
          { medicalRecordNo: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.patient.findMany({
        where,
        include: { bloodType: { select: { label: true } } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.patient.count({ where }),
    ]);
    return { data, total, page, limit };
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

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PrescriptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(where: Prisma.PrescriptionWhereInput | undefined, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.prescription.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.prescription.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  findById(id: string) {
    return this.prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: true,
        physician: true,
        bloodType: true,
        reservations: {
          take: 5,
        },
      },
    });
  }

  create(data: Prisma.PrescriptionCreateInput) {
    return this.prisma.prescription.create({ data });
  }

  markFulfilled(id: string) {
    return this.prisma.prescription.update({
      where: { id },
      data: {
        isFulfilled: true,
        fulfilledAt: new Date(),
      },
    });
  }

  async findUnfulfilled(hospitalId: string | undefined, page: number, limit: number) {
    const where: Prisma.PrescriptionWhereInput = {
      isFulfilled: false,
      ...(hospitalId ? { hospitalId } : {}),
    };
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.prescription.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.prescription.count({ where }),
    ]);
    return { data, total, page, limit };
  }
}

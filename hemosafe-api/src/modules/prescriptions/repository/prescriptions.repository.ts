import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PrescriptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(where?: Prisma.PrescriptionWhereInput) {
    return this.prisma.prescription.findMany({ where });
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

  findUnfulfilled(hospitalId?: string) {
    return this.prisma.prescription.findMany({
      where: {
        isFulfilled: false,
        ...(hospitalId ? { hospitalId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DonorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(where?: Prisma.DonorWhereInput) {
    return this.prisma.donor.findMany({ where });
  }

  findById(id: string) {
    return this.prisma.donor.findUnique({
      where: { id },
      include: {
        bloodType: true,
        registeredBank: true,
        screenings: {
          take: 5,
          orderBy: { screenedAt: 'desc' },
        },
      },
    });
  }

  create(data: Prisma.DonorCreateInput) {
    return this.prisma.donor.create({ data });
  }

  update(id: string, data: Prisma.DonorUpdateInput) {
    return this.prisma.donor.update({ where: { id }, data });
  }

  markIneligible(id: string, reason: string) {
    return this.prisma.donor.update({
      where: { id },
      data: {
        isEligible: false,
        ineligibilityReason: reason,
      },
    });
  }

  findEligible() {
    return this.prisma.donor.findMany({
      where: { isEligible: true },
    });
  }
}

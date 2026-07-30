import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DonorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    where: Prisma.DonorWhereInput | undefined,
    page: number,
    limit: number,
    search?: string,
    isEligible?: boolean,
  ) {
    const finalWhere: Prisma.DonorWhereInput = {
      ...where,
      ...(isEligible !== undefined && { isEligible }),
      ...(search && {
        OR: [
          { nationalId: { contains: search, mode: 'insensitive' } },
          { firstName:  { contains: search, mode: 'insensitive' } },
          { lastName:   { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.donor.findMany({
        where: finalWhere,
        include: { bloodType: { select: { label: true } } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.donor.count({ where: finalWhere }),
    ]);
    return { data, total, page, limit };
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

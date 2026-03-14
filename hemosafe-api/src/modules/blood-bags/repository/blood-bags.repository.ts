import { Injectable } from '@nestjs/common';
import { BagStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

const BAG_INCLUDE = {
  bloodType:  { select: { label: true, aboGroup: true, rhFactor: true } },
  donor:      { select: { id: true, firstName: true, lastName: true } },
  bloodBank:  { select: { id: true, name: true, code: true } },
} satisfies Prisma.BloodBagInclude;

@Injectable()
export class BloodBagsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    where: Prisma.BloodBagWhereInput,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.bloodBag.findMany({
        where,
        include: BAG_INCLUDE,
        orderBy: { expiresAt: 'asc' },   // FEFO order
        skip,
        take: limit,
      }),
      this.prisma.bloodBag.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  findById(id: string) {
    return this.prisma.bloodBag.findUnique({
      where: { id },
      include: {
        ...BAG_INCLUDE,
        stockMovements: { orderBy: { createdAt: 'desc' }, take: 20 },
        screening:      true,
      },
    });
  }

  findByCode(code: string) {
    return this.prisma.bloodBag.findUnique({ where: { code }, include: BAG_INCLUDE });
  }

  create(data: Prisma.BloodBagCreateInput) {
    return this.prisma.bloodBag.create({ data, include: BAG_INCLUDE });
  }

  updateStatus(
    id: string,
    status: BagStatus,
    extra?: Partial<Prisma.BloodBagUpdateInput>,
  ) {
    return this.prisma.bloodBag.update({
      where: { id },
      data:  { status, ...extra },
      include: BAG_INCLUDE,
    });
  }

  /** Count available bags per blood type for a given bank. */
  stockSummary(bloodBankId: string) {
    return this.prisma.bloodBag.groupBy({
      by:     ['bloodTypeId'],
      where:  { bloodBankId, status: 'AVAILABLE', expiresAt: { gt: new Date() } },
      _count: { id: true },
    });
  }

  /** Bags expiring within the next 48 h. */
  expiringSoon(bloodBankId?: string) {
    const in48h = new Date(Date.now() + 48 * 3600 * 1000);
    return this.prisma.bloodBag.findMany({
      where: {
        status:    'AVAILABLE',
        expiresAt: { lte: in48h, gt: new Date() },
        ...(bloodBankId && { bloodBankId }),
      },
      include: { bloodType: { select: { label: true } }, bloodBank: { select: { name: true } } },
      orderBy: { expiresAt: 'asc' },
    });
  }
}

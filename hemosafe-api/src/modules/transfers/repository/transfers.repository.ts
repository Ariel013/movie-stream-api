import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

const TRANSFER_INCLUDE = {
  fromBank:  { select: { id: true, name: true, code: true } },
  toBank:    { select: { id: true, name: true, code: true } },
  initiator: { select: { id: true, firstName: true, lastName: true } },
  receiver:  { select: { id: true, firstName: true, lastName: true } },
  transferBags: {
    include: {
      bloodBag: {
        include: {
          bloodType: { select: { label: true } },
        },
      },
    },
  },
} satisfies Prisma.TransferInclude;

@Injectable()
export class TransfersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(where: Prisma.TransferWhereInput, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.transfer.findMany({
        where,
        include: TRANSFER_INCLUDE,
        orderBy: [{ initiatedAt: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.transfer.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  findById(id: string) {
    return this.prisma.transfer.findUnique({
      where: { id },
      include: TRANSFER_INCLUDE,
    });
  }

  create(data: Prisma.TransferCreateInput) {
    return this.prisma.transfer.create({ data, include: TRANSFER_INCLUDE });
  }

  update(id: string, data: Prisma.TransferUpdateInput) {
    return this.prisma.transfer.update({ where: { id }, data, include: TRANSFER_INCLUDE });
  }
}

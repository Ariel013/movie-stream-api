import { Injectable } from '@nestjs/common';
import { Prisma, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

const RESERVATION_INCLUDE = {
  hospital:        { select: { id: true, name: true, code: true } },
  bloodBank:       { select: { id: true, name: true, code: true } },
  bloodType:       { select: { label: true } },
  requester:       { select: { id: true, firstName: true, lastName: true } },
  reservationBags: { include: { bloodBag: { select: { id: true, code: true, expiresAt: true } } } },
} satisfies Prisma.ReservationInclude;

@Injectable()
export class ReservationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    where: Prisma.ReservationWhereInput,
    page: number,
    limit: number,
    status?: ReservationStatus,
    search?: string,
  ) {
    const finalWhere: Prisma.ReservationWhereInput = {
      ...where,
      ...(status && { status }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { hospital: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.reservation.findMany({
        where: finalWhere,
        include: RESERVATION_INCLUDE,
        orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.reservation.count({ where: finalWhere }),
    ]);
    return { data, total, page, limit };
  }

  findById(id: string) {
    return this.prisma.reservation.findUnique({
      where: { id },
      include: RESERVATION_INCLUDE,
    });
  }

  findByCode(code: string) {
    return this.prisma.reservation.findUnique({ where: { code }, include: RESERVATION_INCLUDE });
  }

  create(data: Prisma.ReservationCreateInput) {
    return this.prisma.reservation.create({ data, include: RESERVATION_INCLUDE });
  }

  update(id: string, data: Prisma.ReservationUpdateInput) {
    return this.prisma.reservation.update({ where: { id }, data, include: RESERVATION_INCLUDE });
  }

  /** Find all PENDING/CONFIRMED reservations past their 24h TTL. */
  findExpired() {
    return this.prisma.reservation.findMany({
      where: {
        status:    { in: ['PENDING', 'CONFIRMED'] },
        expiresAt: { lt: new Date() },
      },
      include: { reservationBags: true },
    });
  }
}

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

  findAll(where: Prisma.ReservationWhereInput) {
    return this.prisma.reservation.findMany({
      where,
      include: RESERVATION_INCLUDE,
      orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
    });
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

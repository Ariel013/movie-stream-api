import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number, limit: number, entity?: string, search?: string) {
    const where: Prisma.AuditLogWhereInput = {
      ...(entity && { entity }),
      ...(search && {
        OR: [
          { action: { contains: search, mode: 'insensitive' } },
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName:  { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        take: limit,
        skip,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: rows.map((r: typeof rows[0]) => ({ ...r, id: String(r.id) })),
      total,
      page,
      limit,
    };
  }

  async distinctEntities(): Promise<string[]> {
    const rows = await this.prisma.auditLog.findMany({
      distinct: ['entity'],
      select: { entity: true },
      orderBy: { entity: 'asc' },
    });
    return rows.map((r) => r.entity);
  }
}

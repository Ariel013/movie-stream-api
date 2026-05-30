import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(limit = 100, skip = 0) {
    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      data: rows.map((r: typeof rows[0]) => ({ ...r, id: String(r.id) })),
      total,
      limit,
      skip,
    };
  }
}

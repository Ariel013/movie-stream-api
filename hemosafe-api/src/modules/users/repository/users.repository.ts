import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

const SAFE_SELECT = {
  id: true, email: true, role: true,
  firstName: true, lastName: true, phone: true,
  facilityId: true, isActive: true, lastLoginAt: true, createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(where?: Prisma.UserWhereInput) {
    return this.prisma.user.findMany({ where, select: SAFE_SELECT });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { ...SAFE_SELECT, facility: { select: { id: true, name: true, type: true } } },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data, select: SAFE_SELECT });
  }

  update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where: { id }, data, select: SAFE_SELECT });
  }

  deactivate(id: string) {
    return this.prisma.user.update({
      where: { id },
      data:  { isActive: false },
      select: SAFE_SELECT,
    });
  }
}

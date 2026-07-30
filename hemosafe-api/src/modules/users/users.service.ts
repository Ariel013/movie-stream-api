import {
  Injectable, NotFoundException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { UsersRepository } from './repository/users.repository';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  async findAll(actor: JwtPayload, page: number, limit: number) {
    // HOSPITAL and BLOOD_BANK see only users of their own facility
    if (actor.role !== UserRole.ADMIN) {
      return this.repo.findAll({ facilityId: actor.facilityId ?? undefined }, page, limit);
    }
    return this.repo.findAll(undefined, page, limit);
  }

  async findOne(id: string, actor: JwtPayload) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    this.assertFacilityAccess(actor, user.facilityId);
    return user;
  }

  async create(dto: CreateUserDto, actor: JwtPayload) {
    // Only ADMIN can create users of any role or for any facility
    if (actor.role !== UserRole.ADMIN) {
      if (dto.facilityId !== actor.facilityId) {
        throw new ForbiddenException('Cannot create user for another facility');
      }
      // Prevent privilege escalation: a non-ADMIN can only provision staff
      // with their own role — never ADMIN, never a different facility's role.
      if (dto.role !== actor.role) {
        throw new ForbiddenException(`Cannot create a user with role ${dto.role}`);
      }
    }

    const exists = await this.repo.findByEmail(dto.email);
    if (exists) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.repo.create({
      email: dto.email, passwordHash,
      role: dto.role, firstName: dto.firstName, lastName: dto.lastName,
      phone: dto.phone,
      ...(dto.facilityId && { facility: { connect: { id: dto.facilityId } } }),
    });
  }

  async update(id: string, dto: UpdateUserDto, actor: JwtPayload) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    this.assertFacilityAccess(actor, user.facilityId);
    return this.repo.update(id, dto);
  }

  /** Toggles the account: deactivates an active user, reactivates an inactive one. */
  async toggleActive(id: string, actor: JwtPayload) {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can activate/deactivate users');
    }
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return this.repo.setActive(id, !user.isActive);
  }

  private assertFacilityAccess(actor: JwtPayload, targetFacilityId: string | null) {
    if (actor.role === UserRole.ADMIN) return;
    if (targetFacilityId !== actor.facilityId) {
      throw new ForbiddenException('Access to user in another facility denied');
    }
  }
}

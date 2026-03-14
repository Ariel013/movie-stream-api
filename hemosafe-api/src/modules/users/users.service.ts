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

  async findAll(actor: JwtPayload) {
    // HOSPITAL and BLOOD_BANK see only users of their own facility
    if (actor.role !== UserRole.ADMIN) {
      return this.repo.findAll({ facilityId: actor.facilityId ?? undefined });
    }
    return this.repo.findAll();
  }

  async findOne(id: string, actor: JwtPayload) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    this.assertFacilityAccess(actor, user.facilityId);
    return user;
  }

  async create(dto: CreateUserDto, actor: JwtPayload) {
    // Only ADMIN can create users of any role or for any facility
    if (actor.role !== UserRole.ADMIN && dto.facilityId !== actor.facilityId) {
      throw new ForbiddenException('Cannot create user for another facility');
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

  async deactivate(id: string, actor: JwtPayload) {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can deactivate users');
    }
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return this.repo.deactivate(id);
  }

  private assertFacilityAccess(actor: JwtPayload, targetFacilityId: string | null) {
    if (actor.role === UserRole.ADMIN) return;
    if (targetFacilityId !== actor.facilityId) {
      throw new ForbiddenException('Access to user in another facility denied');
    }
  }
}

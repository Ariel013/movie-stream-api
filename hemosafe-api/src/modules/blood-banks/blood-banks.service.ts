import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { BloodBanksRepository } from './repository/blood-banks.repository';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateBloodBankDto } from './dto/create-blood-bank.dto';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class BloodBanksService {
  constructor(
    private readonly repo: BloodBanksRepository,
    private readonly prisma: PrismaService,
  ) {}

  findAll(regionId: string | undefined, page: number, limit: number) {
    return this.repo.findAll(regionId, page, limit);
  }

  async findOne(id: string) {
    const bank = await this.repo.findById(id);
    if (!bank) throw new NotFoundException(`Blood bank ${id} not found`);
    return bank;
  }

  async create(dto: CreateBloodBankDto, actor: JwtPayload) {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can create blood banks');
    }

    const bank = await this.repo.create({
      name:    dto.name,
      code:    dto.code,
      address: dto.address,
      phone:   dto.phone,
      email:   dto.email,
      region:  { connect: { id: dto.regionId } },
    });

    if (dto.lat !== undefined && dto.lng !== undefined) {
      await this.setLocation(bank.id, dto.lat, dto.lng);
    }

    return bank;
  }

  async update(id: string, dto: Partial<CreateBloodBankDto>, actor: JwtPayload) {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can update blood banks');
    }
    await this.findOne(id);   // ensure it exists and is a blood bank

    const data: Record<string, unknown> = {};
    if (dto.name     !== undefined) data['name']    = dto.name;
    if (dto.code     !== undefined) data['code']    = dto.code;
    if (dto.address  !== undefined) data['address'] = dto.address;
    if (dto.phone    !== undefined) data['phone']   = dto.phone;
    if (dto.email    !== undefined) data['email']   = dto.email;
    if (dto.regionId !== undefined) data['region']  = { connect: { id: dto.regionId } };

    const bank = await this.repo.update(id, data as any);

    if (dto.lat !== undefined && dto.lng !== undefined) {
      await this.setLocation(id, dto.lat, dto.lng);
    }

    return bank;
  }

  /**
   * Persists the PostGIS `location` column — not a Prisma-modeled field (see
   * schema.prisma comment on Facility), so it's written via raw SQL, same
   * pattern as prisma/seed.ts.
   */
  private setLocation(id: string, lat: number, lng: number) {
    return this.prisma.$executeRaw`
      UPDATE facilities
      SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      WHERE id = ${id}::uuid
    `;
  }

  async stockSummary(bankId: string, actor: JwtPayload) {
    if (actor.role === UserRole.BLOOD_BANK && actor.facilityId !== bankId) {
      throw new ForbiddenException('Blood banks can only view their own stock');
    }
    if (actor.role === UserRole.HOSPITAL) {
      throw new ForbiddenException('Hospitals cannot access blood bank stock details');
    }
    return this.repo.stockSummary(bankId);
  }

  nearby(lat: number, lng: number, radiusKm: number) {
    return this.repo.nearby(lat, lng, radiusKm);
  }
}

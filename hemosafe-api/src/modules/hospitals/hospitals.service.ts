import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { HospitalsRepository } from './repository/hospitals.repository';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateHospitalDto } from './dto/create-hospital.dto';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class HospitalsService {
  constructor(
    private readonly repo: HospitalsRepository,
    private readonly prisma: PrismaService,
  ) {}

  findAll(regionId: string | undefined, page: number, limit: number) {
    return this.repo.findAll(regionId, page, limit);
  }

  async findOne(id: string) {
    const hospital = await this.repo.findById(id);
    if (!hospital) throw new NotFoundException(`Hospital ${id} not found`);
    return hospital;
  }

  async create(dto: CreateHospitalDto, actor: JwtPayload) {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can create hospitals');
    }

    const hospital = await this.repo.create({
      name:    dto.name,
      code:    dto.code,
      address: dto.address,
      phone:   dto.phone,
      email:   dto.email,
      region:  { connect: { id: dto.regionId } },
    });

    if (dto.lat !== undefined && dto.lng !== undefined) {
      await this.setLocation(hospital.id, dto.lat, dto.lng);
    }

    return hospital;
  }

  async update(id: string, dto: Partial<CreateHospitalDto>, actor: JwtPayload) {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can update hospitals');
    }
    await this.findOne(id);   // ensure it exists and is a hospital

    const data: Record<string, unknown> = {};
    if (dto.name    !== undefined) data['name']    = dto.name;
    if (dto.code    !== undefined) data['code']    = dto.code;
    if (dto.address !== undefined) data['address'] = dto.address;
    if (dto.phone   !== undefined) data['phone']   = dto.phone;
    if (dto.email   !== undefined) data['email']   = dto.email;
    if (dto.regionId !== undefined) data['region'] = { connect: { id: dto.regionId } };

    const hospital = await this.repo.update(id, data as any);

    if (dto.lat !== undefined && dto.lng !== undefined) {
      await this.setLocation(id, dto.lat, dto.lng);
    }

    return hospital;
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

  nearby(lat: number, lng: number, radiusKm: number) {
    return this.repo.nearby(lat, lng, radiusKm);
  }
}

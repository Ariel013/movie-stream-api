import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { HospitalsRepository } from './repository/hospitals.repository';
import type { CreateHospitalDto } from './dto/create-hospital.dto';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class HospitalsService {
  constructor(private readonly repo: HospitalsRepository) {}

  findAll(regionId?: string) {
    return this.repo.findAll(regionId);
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

    return this.repo.create({
      name:    dto.name,
      code:    dto.code,
      address: dto.address,
      phone:   dto.phone,
      email:   dto.email,
      region:  { connect: { id: dto.regionId } },
    });
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

    return this.repo.update(id, data as any);
  }

  nearby(lat: number, lng: number, radiusKm: number) {
    return this.repo.nearby(lat, lng, radiusKm);
  }
}

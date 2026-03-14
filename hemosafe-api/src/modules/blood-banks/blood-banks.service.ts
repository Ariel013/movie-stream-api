import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { BloodBanksRepository } from './repository/blood-banks.repository';
import type { CreateBloodBankDto } from './dto/create-blood-bank.dto';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class BloodBanksService {
  constructor(private readonly repo: BloodBanksRepository) {}

  findAll(regionId?: string) {
    return this.repo.findAll(regionId);
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

    return this.repo.create({
      name:    dto.name,
      code:    dto.code,
      address: dto.address,
      phone:   dto.phone,
      email:   dto.email,
      region:  { connect: { id: dto.regionId } },
    });
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

    return this.repo.update(id, data as any);
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

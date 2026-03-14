import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDonorDto } from './dto/create-donor.dto';
import { CreateScreeningDto } from './dto/create-screening.dto';
import { DonorsRepository } from './repository/donors.repository';

@Injectable()
export class DonorsService {
  constructor(
    private readonly donorsRepository: DonorsRepository,
    private readonly prisma: PrismaService,
  ) {}

  findAll(actor: JwtPayload) {
    if (actor.role === UserRole.BLOOD_BANK) {
      return this.donorsRepository.findAll({
        registeredBankId: actor.facilityId ?? undefined,
      });
    }
    return this.donorsRepository.findAll();
  }

  async findOne(id: string, actor: JwtPayload) {
    const donor = await this.donorsRepository.findById(id);
    if (!donor) {
      throw new NotFoundException(`Donor ${id} not found`);
    }
    if (
      actor.role === UserRole.BLOOD_BANK &&
      donor.registeredBankId !== actor.facilityId
    ) {
      throw new ForbiddenException('Access denied to this donor');
    }
    return donor;
  }

  create(dto: CreateDonorDto, actor: JwtPayload) {
    if (actor.role === UserRole.HOSPITAL) {
      throw new ForbiddenException('Hospitals cannot create donors');
    }
    return this.donorsRepository.create({
      nationalId: dto.nationalId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      dob: new Date(dto.dob),
      bloodType: { connect: { id: dto.bloodTypeId } },
      phone: dto.phone,
      email: dto.email,
      registeredBank: dto.registeredBankId
        ? { connect: { id: dto.registeredBankId } }
        : undefined,
    });
  }

  update(id: string, dto: Partial<CreateDonorDto>, actor: JwtPayload) {
    return this.donorsRepository.update(id, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      email: dto.email,
      dob: dto.dob ? new Date(dto.dob) : undefined,
      bloodType: dto.bloodTypeId
        ? { connect: { id: dto.bloodTypeId } }
        : undefined,
      registeredBank: dto.registeredBankId
        ? { connect: { id: dto.registeredBankId } }
        : undefined,
    });
  }

  async createScreening(dto: CreateScreeningDto, actor: JwtPayload) {
    const screening = await this.prisma.healthScreening.create({
      data: {
        donor: { connect: { id: dto.donorId } },
        screener: actor.sub ? { connect: { id: actor.sub } } : undefined,
        hemoglobinGDl: dto.hemoglobinGDl,
        bloodPressure: dto.bloodPressure,
        weightKg: dto.weightKg,
        temperatureC: dto.temperatureC,
        isPassed: dto.isPassed,
        notes: dto.notes,
      },
    });

    if (!dto.isPassed) {
      await this.donorsRepository.markIneligible(
        dto.donorId,
        dto.notes ?? 'Failed health screening',
      );
    }

    return screening;
  }
}

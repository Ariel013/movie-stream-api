"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonorsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const donors_repository_1 = require("./repository/donors.repository");
let DonorsService = class DonorsService {
    constructor(donorsRepository, prisma) {
        this.donorsRepository = donorsRepository;
        this.prisma = prisma;
    }
    findAll(actor) {
        if (actor.role === client_1.UserRole.BLOOD_BANK) {
            return this.donorsRepository.findAll({
                registeredBankId: actor.facilityId ?? undefined,
            });
        }
        return this.donorsRepository.findAll();
    }
    async findOne(id, actor) {
        const donor = await this.donorsRepository.findById(id);
        if (!donor) {
            throw new common_1.NotFoundException(`Donor ${id} not found`);
        }
        if (actor.role === client_1.UserRole.BLOOD_BANK &&
            donor.registeredBankId !== actor.facilityId) {
            throw new common_1.ForbiddenException('Access denied to this donor');
        }
        return donor;
    }
    create(dto, actor) {
        if (actor.role === client_1.UserRole.HOSPITAL) {
            throw new common_1.ForbiddenException('Hospitals cannot create donors');
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
    update(id, dto, actor) {
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
    async createScreening(dto, actor) {
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
            await this.donorsRepository.markIneligible(dto.donorId, dto.notes ?? 'Failed health screening');
        }
        return screening;
    }
};
exports.DonorsService = DonorsService;
exports.DonorsService = DonorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [donors_repository_1.DonorsRepository,
        prisma_service_1.PrismaService])
], DonorsService);
//# sourceMappingURL=donors.service.js.map
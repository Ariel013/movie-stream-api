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
exports.BloodBanksService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const blood_banks_repository_1 = require("./repository/blood-banks.repository");
let BloodBanksService = class BloodBanksService {
    constructor(repo) {
        this.repo = repo;
    }
    findAll(regionId) {
        return this.repo.findAll(regionId);
    }
    async findOne(id) {
        const bank = await this.repo.findById(id);
        if (!bank)
            throw new common_1.NotFoundException(`Blood bank ${id} not found`);
        return bank;
    }
    async create(dto, actor) {
        if (actor.role !== client_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only ADMIN can create blood banks');
        }
        return this.repo.create({
            name: dto.name,
            code: dto.code,
            address: dto.address,
            phone: dto.phone,
            email: dto.email,
            region: { connect: { id: dto.regionId } },
        });
    }
    async update(id, dto, actor) {
        if (actor.role !== client_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only ADMIN can update blood banks');
        }
        await this.findOne(id);
        const data = {};
        if (dto.name !== undefined)
            data['name'] = dto.name;
        if (dto.code !== undefined)
            data['code'] = dto.code;
        if (dto.address !== undefined)
            data['address'] = dto.address;
        if (dto.phone !== undefined)
            data['phone'] = dto.phone;
        if (dto.email !== undefined)
            data['email'] = dto.email;
        if (dto.regionId !== undefined)
            data['region'] = { connect: { id: dto.regionId } };
        return this.repo.update(id, data);
    }
    async stockSummary(bankId, actor) {
        if (actor.role === client_1.UserRole.BLOOD_BANK && actor.facilityId !== bankId) {
            throw new common_1.ForbiddenException('Blood banks can only view their own stock');
        }
        if (actor.role === client_1.UserRole.HOSPITAL) {
            throw new common_1.ForbiddenException('Hospitals cannot access blood bank stock details');
        }
        return this.repo.stockSummary(bankId);
    }
    nearby(lat, lng, radiusKm) {
        return this.repo.nearby(lat, lng, radiusKm);
    }
};
exports.BloodBanksService = BloodBanksService;
exports.BloodBanksService = BloodBanksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [blood_banks_repository_1.BloodBanksRepository])
], BloodBanksService);
//# sourceMappingURL=blood-banks.service.js.map
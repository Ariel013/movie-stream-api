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
exports.HospitalsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const hospitals_repository_1 = require("./repository/hospitals.repository");
let HospitalsService = class HospitalsService {
    constructor(repo) {
        this.repo = repo;
    }
    findAll(regionId) {
        return this.repo.findAll(regionId);
    }
    async findOne(id) {
        const hospital = await this.repo.findById(id);
        if (!hospital)
            throw new common_1.NotFoundException(`Hospital ${id} not found`);
        return hospital;
    }
    async create(dto, actor) {
        if (actor.role !== client_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only ADMIN can create hospitals');
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
            throw new common_1.ForbiddenException('Only ADMIN can update hospitals');
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
    nearby(lat, lng, radiusKm) {
        return this.repo.nearby(lat, lng, radiusKm);
    }
};
exports.HospitalsService = HospitalsService;
exports.HospitalsService = HospitalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [hospitals_repository_1.HospitalsRepository])
], HospitalsService);
//# sourceMappingURL=hospitals.service.js.map
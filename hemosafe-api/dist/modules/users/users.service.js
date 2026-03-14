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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const client_1 = require("@prisma/client");
const users_repository_1 = require("./repository/users.repository");
let UsersService = class UsersService {
    constructor(repo) {
        this.repo = repo;
    }
    async findAll(actor) {
        if (actor.role !== client_1.UserRole.ADMIN) {
            return this.repo.findAll({ facilityId: actor.facilityId ?? undefined });
        }
        return this.repo.findAll();
    }
    async findOne(id, actor) {
        const user = await this.repo.findById(id);
        if (!user)
            throw new common_1.NotFoundException(`User ${id} not found`);
        this.assertFacilityAccess(actor, user.facilityId);
        return user;
    }
    async create(dto, actor) {
        if (actor.role !== client_1.UserRole.ADMIN && dto.facilityId !== actor.facilityId) {
            throw new common_1.ForbiddenException('Cannot create user for another facility');
        }
        const exists = await this.repo.findByEmail(dto.email);
        if (exists)
            throw new common_1.ConflictException('Email already in use');
        const passwordHash = await bcrypt.hash(dto.password, 12);
        return this.repo.create({
            email: dto.email, passwordHash,
            role: dto.role, firstName: dto.firstName, lastName: dto.lastName,
            phone: dto.phone,
            ...(dto.facilityId && { facility: { connect: { id: dto.facilityId } } }),
        });
    }
    async update(id, dto, actor) {
        const user = await this.repo.findById(id);
        if (!user)
            throw new common_1.NotFoundException(`User ${id} not found`);
        this.assertFacilityAccess(actor, user.facilityId);
        return this.repo.update(id, dto);
    }
    async deactivate(id, actor) {
        if (actor.role !== client_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only ADMIN can deactivate users');
        }
        const user = await this.repo.findById(id);
        if (!user)
            throw new common_1.NotFoundException(`User ${id} not found`);
        return this.repo.deactivate(id);
    }
    assertFacilityAccess(actor, targetFacilityId) {
        if (actor.role === client_1.UserRole.ADMIN)
            return;
        if (targetFacilityId !== actor.facilityId) {
            throw new common_1.ForbiddenException('Access to user in another facility denied');
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_repository_1.UsersRepository])
], UsersService);
//# sourceMappingURL=users.service.js.map
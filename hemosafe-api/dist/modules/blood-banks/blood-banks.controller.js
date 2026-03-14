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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BloodBanksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const blood_banks_service_1 = require("./blood-banks.service");
const create_blood_bank_dto_1 = require("./dto/create-blood-bank.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const audit_decorator_1 = require("../../common/decorators/audit.decorator");
let BloodBanksController = class BloodBanksController {
    constructor(service) {
        this.service = service;
    }
    findAll(regionId) {
        return this.service.findAll(regionId);
    }
    nearby(lat, lng, radiusKm) {
        return this.service.nearby(lat, lng, radiusKm);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    stockSummary(id, actor) {
        return this.service.stockSummary(id, actor);
    }
    create(dto, actor) {
        return this.service.create(dto, actor);
    }
    update(id, dto, actor) {
        return this.service.update(id, dto, actor);
    }
};
exports.BloodBanksController = BloodBanksController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List blood banks, optionally filtered by region' }),
    (0, swagger_1.ApiQuery)({ name: 'regionId', required: false, type: String }),
    __param(0, (0, common_1.Query)('regionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BloodBanksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('nearby'),
    (0, swagger_1.ApiOperation)({ summary: 'Find blood banks within a radius using PostGIS' }),
    (0, swagger_1.ApiQuery)({ name: 'lat', required: true, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'lng', required: true, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'radiusKm', required: true, type: Number }),
    __param(0, (0, common_1.Query)('lat', common_1.ParseFloatPipe)),
    __param(1, (0, common_1.Query)('lng', common_1.ParseFloatPipe)),
    __param(2, (0, common_1.Query)('radiusKm', common_1.ParseFloatPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", void 0)
], BloodBanksController.prototype, "nearby", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get blood bank details' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BloodBanksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/stock'),
    (0, swagger_1.ApiOperation)({
        summary: 'Stock summary for a blood bank. BLOOD_BANK sees own only; ADMIN sees all.',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BloodBanksController.prototype, "stockSummary", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, audit_decorator_1.AuditEntity)('blood-banks'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a blood bank (ADMIN only)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_blood_bank_dto_1.CreateBloodBankDto, Object]),
    __metadata("design:returntype", void 0)
], BloodBanksController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, audit_decorator_1.AuditEntity)('blood-banks'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a blood bank (ADMIN only)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], BloodBanksController.prototype, "update", null);
exports.BloodBanksController = BloodBanksController = __decorate([
    (0, swagger_1.ApiTags)('blood-banks'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)({ path: 'blood-banks', version: '1' }),
    __metadata("design:paramtypes", [blood_banks_service_1.BloodBanksService])
], BloodBanksController);
//# sourceMappingURL=blood-banks.controller.js.map
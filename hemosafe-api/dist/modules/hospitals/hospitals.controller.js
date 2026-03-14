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
exports.HospitalsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const hospitals_service_1 = require("./hospitals.service");
const create_hospital_dto_1 = require("./dto/create-hospital.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const audit_decorator_1 = require("../../common/decorators/audit.decorator");
let HospitalsController = class HospitalsController {
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
    create(dto, actor) {
        return this.service.create(dto, actor);
    }
    update(id, dto, actor) {
        return this.service.update(id, dto, actor);
    }
};
exports.HospitalsController = HospitalsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List hospitals, optionally filtered by region' }),
    (0, swagger_1.ApiQuery)({ name: 'regionId', required: false, type: String }),
    __param(0, (0, common_1.Query)('regionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HospitalsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('nearby'),
    (0, swagger_1.ApiOperation)({ summary: 'Find hospitals within a radius using PostGIS' }),
    (0, swagger_1.ApiQuery)({ name: 'lat', required: true, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'lng', required: true, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'radiusKm', required: true, type: Number }),
    __param(0, (0, common_1.Query)('lat', common_1.ParseFloatPipe)),
    __param(1, (0, common_1.Query)('lng', common_1.ParseFloatPipe)),
    __param(2, (0, common_1.Query)('radiusKm', common_1.ParseFloatPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", void 0)
], HospitalsController.prototype, "nearby", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get hospital details' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HospitalsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, audit_decorator_1.AuditEntity)('hospitals'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a hospital (ADMIN only)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_hospital_dto_1.CreateHospitalDto, Object]),
    __metadata("design:returntype", void 0)
], HospitalsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, audit_decorator_1.AuditEntity)('hospitals'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a hospital (ADMIN only)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], HospitalsController.prototype, "update", null);
exports.HospitalsController = HospitalsController = __decorate([
    (0, swagger_1.ApiTags)('hospitals'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)({ path: 'hospitals', version: '1' }),
    __metadata("design:paramtypes", [hospitals_service_1.HospitalsService])
], HospitalsController);
//# sourceMappingURL=hospitals.controller.js.map
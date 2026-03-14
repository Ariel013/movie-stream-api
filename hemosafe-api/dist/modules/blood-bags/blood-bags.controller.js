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
exports.BloodBagsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const blood_bags_service_1 = require("./blood-bags.service");
const create_blood_bag_dto_1 = require("./dto/create-blood-bag.dto");
const filter_blood_bags_dto_1 = require("./dto/filter-blood-bags.dto");
const discard_blood_bag_dto_1 = require("./dto/discard-blood-bag.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const audit_decorator_1 = require("../../common/decorators/audit.decorator");
let BloodBagsController = class BloodBagsController {
    constructor(service) {
        this.service = service;
    }
    findAll(dto, actor) {
        return this.service.findAll(dto, actor);
    }
    expiringSoon(actor) {
        return this.service.expiringSoon(actor);
    }
    stockSummary(bloodBankId, actor) {
        return this.service.stockSummary(bloodBankId, actor);
    }
    findOne(id, actor) {
        return this.service.findOne(id, actor);
    }
    create(dto, actor) {
        return this.service.create(dto, actor);
    }
    discard(id, dto, actor) {
        return this.service.discard(id, dto, actor);
    }
};
exports.BloodBagsController = BloodBagsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List blood bags with filters (FEFO order)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filter_blood_bags_dto_1.FilterBloodBagsDto, Object]),
    __metadata("design:returntype", void 0)
], BloodBagsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('expiring-soon'),
    (0, swagger_1.ApiOperation)({ summary: 'Bags expiring within 48h (triggers FEFO alerts)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BloodBagsController.prototype, "expiringSoon", null);
__decorate([
    (0, common_1.Get)('stock-summary/:bloodBankId'),
    (0, swagger_1.ApiOperation)({ summary: 'Available bag count per blood type for a bank' }),
    __param(0, (0, common_1.Param)('bloodBankId', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BloodBagsController.prototype, "stockSummary", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single blood bag with movement history' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BloodBagsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.BLOOD_BANK, client_1.UserRole.ADMIN),
    (0, audit_decorator_1.AuditEntity)('blood_bags'),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new blood bag (BLOOD_BANK / ADMIN)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_blood_bag_dto_1.CreateBloodBagDto, Object]),
    __metadata("design:returntype", void 0)
], BloodBagsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/discard'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.BLOOD_BANK, client_1.UserRole.ADMIN),
    (0, audit_decorator_1.AuditEntity)('blood_bags'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Mark a bag as discarded with reason' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, discard_blood_bag_dto_1.DiscardBloodBagDto, Object]),
    __metadata("design:returntype", void 0)
], BloodBagsController.prototype, "discard", null);
exports.BloodBagsController = BloodBagsController = __decorate([
    (0, swagger_1.ApiTags)('blood-bags'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)({ path: 'blood-bags', version: '1' }),
    __metadata("design:paramtypes", [blood_bags_service_1.BloodBagsService])
], BloodBagsController);
//# sourceMappingURL=blood-bags.controller.js.map
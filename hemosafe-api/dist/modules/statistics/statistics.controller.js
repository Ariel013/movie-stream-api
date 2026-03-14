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
exports.StatisticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const statistics_service_1 = require("./statistics.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let StatisticsController = class StatisticsController {
    constructor(service) {
        this.service = service;
    }
    nationalSummary() {
        return this.service.nationalSummary();
    }
    regionalSummary(regionId) {
        return this.service.regionalSummary(regionId);
    }
    facilityStock(facilityId, actor) {
        return this.service.facilityStock(facilityId, actor);
    }
    donorStats() {
        return this.service.donorStats();
    }
    reservationTrends(days) {
        const d = days ? parseInt(days, 10) : 30;
        return this.service.reservationTrends(d);
    }
};
exports.StatisticsController = StatisticsController;
__decorate([
    (0, common_1.Get)('national'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.HOSPITAL),
    (0, swagger_1.ApiOperation)({ summary: 'National blood-bank system summary (ADMIN, HOSPITAL)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StatisticsController.prototype, "nationalSummary", null);
__decorate([
    (0, common_1.Get)('regional/:regionId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Regional summary scoped to one region (ADMIN)' }),
    __param(0, (0, common_1.Param)('regionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StatisticsController.prototype, "regionalSummary", null);
__decorate([
    (0, common_1.Get)('facility/:facilityId/stock'),
    (0, swagger_1.ApiOperation)({
        summary: 'Stock summary for a specific blood bank. BLOOD_BANK sees own only. ADMIN sees all.',
    }),
    __param(0, (0, common_1.Param)('facilityId', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StatisticsController.prototype, "facilityStock", null);
__decorate([
    (0, common_1.Get)('donors'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Top donors and donation trends (ADMIN)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StatisticsController.prototype, "donorStats", null);
__decorate([
    (0, common_1.Get)('reservation-trends'),
    (0, swagger_1.ApiQuery)({ name: 'days', required: false, type: Number, description: 'Lookback window in days (default 30)' }),
    (0, swagger_1.ApiOperation)({ summary: 'Reservations per day grouped by status' }),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StatisticsController.prototype, "reservationTrends", null);
exports.StatisticsController = StatisticsController = __decorate([
    (0, swagger_1.ApiTags)('statistics'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)({ path: 'statistics', version: '1' }),
    __metadata("design:paramtypes", [statistics_service_1.StatisticsService])
], StatisticsController);
//# sourceMappingURL=statistics.controller.js.map
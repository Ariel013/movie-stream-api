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
exports.TransfersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const transfers_service_1 = require("./transfers.service");
const create_transfer_dto_1 = require("./dto/create-transfer.dto");
const update_transfer_status_dto_1 = require("./dto/update-transfer-status.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const audit_decorator_1 = require("../../common/decorators/audit.decorator");
let TransfersController = class TransfersController {
    constructor(service) {
        this.service = service;
    }
    findAll(actor) {
        return this.service.findAll(actor);
    }
    findOne(id, actor) {
        return this.service.findOne(id, actor);
    }
    create(dto, actor) {
        return this.service.create(dto, actor);
    }
    updateStatus(id, dto, actor) {
        return this.service.updateStatus(id, dto, actor);
    }
    cancel(id, actor) {
        return this.service.cancel(id, actor);
    }
};
exports.TransfersController = TransfersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List transfers visible to the authenticated user' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get transfer details' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.BLOOD_BANK, client_1.UserRole.ADMIN),
    (0, audit_decorator_1.AuditEntity)('transfers'),
    (0, swagger_1.ApiOperation)({ summary: 'Initiate a blood bag transfer (BLOOD_BANK / ADMIN)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_transfer_dto_1.CreateTransferDto, Object]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, audit_decorator_1.AuditEntity)('transfers'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Advance transfer status (FSM). ' +
            'INITIATED→IN_TRANSIT (initiator bank). IN_TRANSIT→RECEIVED (recipient bank).',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_transfer_status_dto_1.UpdateTransferStatusDto, Object]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id/cancel'),
    (0, audit_decorator_1.AuditEntity)('transfers'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel an INITIATED transfer (initiating bank only)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "cancel", null);
exports.TransfersController = TransfersController = __decorate([
    (0, swagger_1.ApiTags)('transfers'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)({ path: 'transfers', version: '1' }),
    __metadata("design:paramtypes", [transfers_service_1.TransfersService])
], TransfersController);
//# sourceMappingURL=transfers.controller.js.map
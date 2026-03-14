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
exports.ReservationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const reservations_service_1 = require("./reservations.service");
const create_reservation_dto_1 = require("./dto/create-reservation.dto");
const update_reservation_status_dto_1 = require("./dto/update-reservation-status.dto");
const search_blood_dto_1 = require("./dto/search-blood.dto");
const verify_bag_dto_1 = require("./dto/verify-bag.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const audit_decorator_1 = require("../../common/decorators/audit.decorator");
let ReservationsController = class ReservationsController {
    constructor(service) {
        this.service = service;
    }
    search(dto) {
        return this.service.searchNearbyBlood(dto);
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
    verifyBag(reservationId, dto, actor) {
        return this.service.verifyBag(reservationId, dto, actor);
    }
};
exports.ReservationsController = ReservationsController;
__decorate([
    (0, common_1.Post)('search'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.HOSPITAL, client_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Find nearby blood banks with available stock (PostGIS search)',
        description: 'Returns blood banks sorted by distance (nearest first) that have ' +
            'at least `quantity` bags of the requested blood type. ' +
            'Use the result to choose a blood bank before creating a reservation.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of blood banks with distance and available count',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_blood_dto_1.SearchBloodDto]),
    __metadata("design:returntype", void 0)
], ReservationsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List reservations (scoped by role)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReservationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get full reservation details with allocated bags' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ReservationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.HOSPITAL, client_1.UserRole.ADMIN),
    (0, audit_decorator_1.AuditEntity)('reservations'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create reservation — atomically allocates bags with FEFO + FOR UPDATE',
        description: 'Runs inside a REPEATABLE READ transaction with:\n' +
            '1. Advisory lock on (bankId, bloodTypeId) — prevents deadlocks\n' +
            '2. SELECT FOR UPDATE SKIP LOCKED — row-level bag locking\n' +
            '3. FEFO ordering (soonest expiry allocated first)\n' +
            '4. EMERGENCY requests allow partial fill\n' +
            'Reservation expires after 24 hours if not collected.',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Reservation created with bags allocated' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Insufficient stock' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_reservation_dto_1.CreateReservationDto, Object]),
    __metadata("design:returntype", void 0)
], ReservationsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, audit_decorator_1.AuditEntity)('reservations'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Transition reservation status (FSM-guarded)',
        description: 'Valid transitions:\n' +
            '• PENDING    → CONFIRMED  (BLOOD_BANK)\n' +
            '• CONFIRMED  → DISPATCHED (BLOOD_BANK)\n' +
            '• DISPATCHED → DELIVERED  (HOSPITAL) — marks bags DISTRIBUTED\n' +
            '• PENDING/CONFIRMED → CANCELLED (any) — releases bags to AVAILABLE\n' +
            'Invalid transitions return 400.',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_reservation_status_dto_1.UpdateReservationStatusDto, Object]),
    __metadata("design:returntype", void 0)
], ReservationsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/verify-bag'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.BLOOD_BANK, client_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Verify a bag barcode belongs to this reservation (pickup check)',
        description: 'Blood bank staff scans each bag barcode before handing over to the patient. ' +
            'Returns { valid, bagId, message }.',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, verify_bag_dto_1.VerifyBagDto, Object]),
    __metadata("design:returntype", void 0)
], ReservationsController.prototype, "verifyBag", null);
exports.ReservationsController = ReservationsController = __decorate([
    (0, swagger_1.ApiTags)('reservations'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)({ path: 'reservations', version: '1' }),
    __metadata("design:paramtypes", [reservations_service_1.ReservationsService])
], ReservationsController);
//# sourceMappingURL=reservations.controller.js.map
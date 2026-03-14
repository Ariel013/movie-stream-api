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
var ReservationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationsService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const reservation_engine_service_1 = require("./engine/reservation-engine.service");
const geo_search_service_1 = require("./engine/geo-search.service");
const reservations_repository_1 = require("./repository/reservations.repository");
let ReservationsService = ReservationsService_1 = class ReservationsService {
    constructor(engine, geoSearch, repo) {
        this.engine = engine;
        this.geoSearch = geoSearch;
        this.repo = repo;
        this.logger = new common_1.Logger(ReservationsService_1.name);
    }
    searchNearbyBlood(dto) {
        return this.geoSearch.findNearbyWithStock(dto.lat, dto.lng, dto.radiusKm ?? 50, dto.bloodTypeId, dto.quantity);
    }
    findAll(actor) {
        return this.repo.findAll(this.scopeWhere(actor));
    }
    async findOne(id, actor) {
        const r = await this.repo.findById(id);
        if (!r)
            throw new common_1.NotFoundException(`Reservation ${id} not found`);
        this.assertAccess(actor, r);
        return r;
    }
    create(dto, actor) {
        if (actor.role === client_1.UserRole.BLOOD_BANK) {
            throw new common_1.ForbiddenException('Blood banks cannot create reservations');
        }
        const hospitalId = actor.role === client_1.UserRole.HOSPITAL
            ? actor.facilityId
            : dto.hospitalId;
        if (!hospitalId) {
            throw new common_1.ForbiddenException('hospitalId is required for ADMIN');
        }
        return this.engine.allocate({
            hospitalId,
            bloodBankId: dto.bloodBankId,
            bloodTypeId: dto.bloodTypeId,
            quantity: dto.quantity,
            urgency: dto.urgency,
            prescriptionId: dto.prescriptionId,
            notes: dto.notes,
            requestedBy: actor.sub,
        });
    }
    async updateStatus(id, dto, actor) {
        const reservation = await this.repo.findById(id);
        if (!reservation)
            throw new common_1.NotFoundException(`Reservation ${id} not found`);
        this.assertAccess(actor, reservation);
        return this.engine.transition(id, dto.status, actor, dto.cancelReason);
    }
    verifyBag(reservationId, dto, actor) {
        return this.engine.verifyBagForPickup(reservationId, dto.bagCode, actor);
    }
    async runExpiryJob() {
        const count = await this.engine.expireStaleReservations();
        if (count > 0) {
            this.logger.warn(`Expiry cron: processed ${count} stale reservation(s)`);
        }
    }
    scopeWhere(actor) {
        if (actor.role === client_1.UserRole.ADMIN)
            return {};
        if (actor.role === client_1.UserRole.HOSPITAL)
            return { hospitalId: actor.facilityId };
        if (actor.role === client_1.UserRole.BLOOD_BANK)
            return { bloodBankId: actor.facilityId };
        return {};
    }
    assertAccess(actor, r) {
        if (actor.role === client_1.UserRole.ADMIN)
            return;
        if (actor.role === client_1.UserRole.HOSPITAL && r.hospitalId !== actor.facilityId) {
            throw new common_1.ForbiddenException('Access denied to this reservation');
        }
        if (actor.role === client_1.UserRole.BLOOD_BANK && r.bloodBankId !== actor.facilityId) {
            throw new common_1.ForbiddenException('Access denied to this reservation');
        }
    }
};
exports.ReservationsService = ReservationsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReservationsService.prototype, "runExpiryJob", null);
exports.ReservationsService = ReservationsService = ReservationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [reservation_engine_service_1.ReservationEngineService,
        geo_search_service_1.GeoSearchService,
        reservations_repository_1.ReservationsRepository])
], ReservationsService);
//# sourceMappingURL=reservations.service.js.map
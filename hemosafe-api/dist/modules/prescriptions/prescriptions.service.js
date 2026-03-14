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
exports.PrescriptionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prescriptions_repository_1 = require("./repository/prescriptions.repository");
let PrescriptionsService = class PrescriptionsService {
    constructor(prescriptionsRepository) {
        this.prescriptionsRepository = prescriptionsRepository;
    }
    findAll(actor) {
        if (actor.role === client_1.UserRole.BLOOD_BANK) {
            throw new common_1.ForbiddenException('Blood banks cannot access prescriptions');
        }
        if (actor.role === client_1.UserRole.HOSPITAL) {
            return this.prescriptionsRepository.findAll({
                hospitalId: actor.facilityId ?? undefined,
            });
        }
        return this.prescriptionsRepository.findAll();
    }
    async findOne(id, actor) {
        if (actor.role === client_1.UserRole.BLOOD_BANK) {
            throw new common_1.ForbiddenException('Blood banks cannot access prescriptions');
        }
        const prescription = await this.prescriptionsRepository.findById(id);
        if (!prescription) {
            throw new common_1.NotFoundException(`Prescription ${id} not found`);
        }
        if (actor.role === client_1.UserRole.HOSPITAL &&
            prescription.hospitalId !== actor.facilityId) {
            throw new common_1.ForbiddenException('Access denied to this prescription');
        }
        return prescription;
    }
    create(dto, actor) {
        if (actor.role === client_1.UserRole.BLOOD_BANK) {
            throw new common_1.ForbiddenException('Blood banks cannot create prescriptions');
        }
        const hospitalId = actor.role === client_1.UserRole.HOSPITAL
            ? actor.facilityId
            : (dto.hospitalId ?? (() => { throw new Error('hospitalId required for ADMIN'); })());
        return this.prescriptionsRepository.create({
            patient: { connect: { id: dto.patientId } },
            physician: { connect: { id: actor.sub } },
            bloodType: { connect: { id: dto.bloodTypeId } },
            hospitalId,
            quantity: dto.quantity,
            urgency: dto.urgency,
            clinicalNotes: dto.clinicalNotes,
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        });
    }
    async markFulfilled(id, actor) {
        if (actor.role === client_1.UserRole.BLOOD_BANK) {
            throw new common_1.ForbiddenException('Blood banks cannot fulfill prescriptions');
        }
        const prescription = await this.prescriptionsRepository.findById(id);
        if (!prescription) {
            throw new common_1.NotFoundException(`Prescription ${id} not found`);
        }
        if (actor.role !== client_1.UserRole.ADMIN &&
            prescription.hospitalId !== actor.facilityId) {
            throw new common_1.ForbiddenException('Only ADMIN or the same hospital can fulfill this prescription');
        }
        return this.prescriptionsRepository.markFulfilled(id);
    }
    findUnfulfilled(actor) {
        if (actor.role === client_1.UserRole.BLOOD_BANK) {
            throw new common_1.ForbiddenException('Blood banks cannot access prescriptions');
        }
        if (actor.role === client_1.UserRole.HOSPITAL) {
            return this.prescriptionsRepository.findUnfulfilled(actor.facilityId ?? undefined);
        }
        return this.prescriptionsRepository.findUnfulfilled();
    }
};
exports.PrescriptionsService = PrescriptionsService;
exports.PrescriptionsService = PrescriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prescriptions_repository_1.PrescriptionsRepository])
], PrescriptionsService);
//# sourceMappingURL=prescriptions.service.js.map
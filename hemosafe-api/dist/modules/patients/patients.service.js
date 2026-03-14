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
exports.PatientsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const patients_repository_1 = require("./repository/patients.repository");
let PatientsService = class PatientsService {
    constructor(patientsRepository) {
        this.patientsRepository = patientsRepository;
    }
    findAll(actor) {
        if (actor.role === client_1.UserRole.BLOOD_BANK) {
            throw new common_1.ForbiddenException('Blood banks cannot access patient records');
        }
        if (actor.role === client_1.UserRole.HOSPITAL) {
            return this.patientsRepository.findAll(actor.facilityId ?? undefined);
        }
        return this.patientsRepository.findAll();
    }
    async findOne(id, actor) {
        if (actor.role === client_1.UserRole.BLOOD_BANK) {
            throw new common_1.ForbiddenException('Blood banks cannot access patient records');
        }
        const patient = await this.patientsRepository.findById(id);
        if (!patient) {
            throw new common_1.NotFoundException(`Patient ${id} not found`);
        }
        if (actor.role === client_1.UserRole.HOSPITAL && patient.hospitalId !== actor.facilityId) {
            throw new common_1.ForbiddenException('Access denied to this patient');
        }
        return patient;
    }
    create(dto, actor) {
        if (actor.role === client_1.UserRole.BLOOD_BANK) {
            throw new common_1.ForbiddenException('Blood banks cannot create patient records');
        }
        const hospitalId = actor.role === client_1.UserRole.HOSPITAL
            ? (actor.facilityId ?? undefined)
            : (dto.hospitalId ?? undefined);
        return this.patientsRepository.create({
            hospital: { connect: { id: hospitalId } },
            nationalId: dto.nationalId,
            firstName: dto.firstName,
            lastName: dto.lastName,
            dob: dto.dob ? new Date(dto.dob) : undefined,
            bloodType: dto.bloodTypeId
                ? { connect: { id: dto.bloodTypeId } }
                : undefined,
            medicalRecordNo: dto.medicalRecordNo,
        });
    }
    update(id, dto, actor) {
        if (actor.role === client_1.UserRole.BLOOD_BANK) {
            throw new common_1.ForbiddenException('Blood banks cannot update patient records');
        }
        return this.patientsRepository.update(id, {
            nationalId: dto.nationalId,
            firstName: dto.firstName,
            lastName: dto.lastName,
            dob: dto.dob ? new Date(dto.dob) : undefined,
            bloodType: dto.bloodTypeId
                ? { connect: { id: dto.bloodTypeId } }
                : undefined,
            medicalRecordNo: dto.medicalRecordNo,
        });
    }
    deactivate(id, actor) {
        if (actor.role === client_1.UserRole.BLOOD_BANK) {
            throw new common_1.ForbiddenException('Blood banks cannot deactivate patient records');
        }
        return this.patientsRepository.deactivate(id);
    }
};
exports.PatientsService = PatientsService;
exports.PatientsService = PatientsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [patients_repository_1.PatientsRepository])
], PatientsService);
//# sourceMappingURL=patients.service.js.map
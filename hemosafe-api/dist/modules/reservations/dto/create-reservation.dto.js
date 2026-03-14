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
exports.CreateReservationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class CreateReservationDto {
    constructor() {
        this.urgency = client_1.UrgencyLevel.ROUTINE;
    }
}
exports.CreateReservationDto = CreateReservationDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "bloodBankId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.AboGroup }),
    (0, class_validator_1.IsEnum)(client_1.AboGroup),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "aboGroup", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.RhFactor }),
    (0, class_validator_1.IsEnum)(client_1.RhFactor),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "rhFactor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "bloodTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 1, maximum: 50 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], CreateReservationDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.UrgencyLevel, default: client_1.UrgencyLevel.ROUTINE }),
    (0, class_validator_1.IsEnum)(client_1.UrgencyLevel),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "urgency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "prescriptionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "notes", void 0);
//# sourceMappingURL=create-reservation.dto.js.map
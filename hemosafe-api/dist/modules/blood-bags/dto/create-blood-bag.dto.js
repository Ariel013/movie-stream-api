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
exports.CreateBloodBagDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class CreateBloodBagDto {
}
exports.CreateBloodBagDto = CreateBloodBagDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'BAG-2025-001234' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBloodBagDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.AboGroup }),
    (0, class_validator_1.IsEnum)(client_1.AboGroup),
    __metadata("design:type", String)
], CreateBloodBagDto.prototype, "aboGroup", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.RhFactor }),
    (0, class_validator_1.IsEnum)(client_1.RhFactor),
    __metadata("design:type", String)
], CreateBloodBagDto.prototype, "rhFactor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550a8400-e29b-41d4-a716-446655440001' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateBloodBagDto.prototype, "bloodTypeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateBloodBagDto.prototype, "bloodBankId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateBloodBagDto.prototype, "donorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateBloodBagDto.prototype, "screeningId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 100, maximum: 600, example: 450 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(100),
    (0, class_validator_1.Max)(600),
    __metadata("design:type", Number)
], CreateBloodBagDto.prototype, "volumeMl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-10-01T09:00:00Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateBloodBagDto.prototype, "collectedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-11-12T09:00:00Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateBloodBagDto.prototype, "expiresAt", void 0);
//# sourceMappingURL=create-blood-bag.dto.js.map
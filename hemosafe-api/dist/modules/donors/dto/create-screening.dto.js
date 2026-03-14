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
exports.CreateScreeningDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateScreeningDto {
}
exports.CreateScreeningDto = CreateScreeningDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'UUID of the donor being screened' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateScreeningDto.prototype, "donorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Hemoglobin level in g/dL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateScreeningDto.prototype, "hemoglobinGDl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Blood pressure reading (max 10 chars, e.g. 120/80)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10),
    __metadata("design:type", String)
], CreateScreeningDto.prototype, "bloodPressure", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Weight in kilograms' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateScreeningDto.prototype, "weightKg", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Body temperature in Celsius' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateScreeningDto.prototype, "temperatureC", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the donor passed the screening' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateScreeningDto.prototype, "isPassed", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Additional notes from the screening' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateScreeningDto.prototype, "notes", void 0);
//# sourceMappingURL=create-screening.dto.js.map
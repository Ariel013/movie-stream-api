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
exports.SearchBloodDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class SearchBloodDto {
    constructor() {
        this.radiusKm = 50;
    }
}
exports.SearchBloodDto = SearchBloodDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Blood type to search for (UUID of blood_types row)' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SearchBloodDto.prototype, "bloodTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 1, maximum: 50, description: 'Number of bags needed' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], SearchBloodDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Hospital latitude', example: 36.7372 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsLatitude)(),
    __metadata("design:type", Number)
], SearchBloodDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Hospital longitude', example: 3.0865 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsLongitude)(),
    __metadata("design:type", Number)
], SearchBloodDto.prototype, "lng", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Search radius in km (default 50km)',
        minimum: 1,
        maximum: 500,
        default: 50,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    (0, class_validator_1.Max)(500),
    __metadata("design:type", Number)
], SearchBloodDto.prototype, "radiusKm", void 0);
//# sourceMappingURL=search-blood.dto.js.map
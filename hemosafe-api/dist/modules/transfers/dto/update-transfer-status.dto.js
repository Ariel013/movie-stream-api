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
exports.UpdateTransferStatusDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class UpdateTransferStatusDto {
}
exports.UpdateTransferStatusDto = UpdateTransferStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: [client_1.TransferStatus.IN_TRANSIT, client_1.TransferStatus.RECEIVED],
        description: 'New transfer status. Only INITIATED→IN_TRANSIT→RECEIVED are allowed here.',
    }),
    (0, class_validator_1.IsEnum)(client_1.TransferStatus),
    __metadata("design:type", String)
], UpdateTransferStatusDto.prototype, "status", void 0);
//# sourceMappingURL=update-transfer-status.dto.js.map
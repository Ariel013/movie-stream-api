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
exports.DonorsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const create_donor_dto_1 = require("./dto/create-donor.dto");
const create_screening_dto_1 = require("./dto/create-screening.dto");
const donors_service_1 = require("./donors.service");
let DonorsController = class DonorsController {
    constructor(donorsService) {
        this.donorsService = donorsService;
    }
    findAll(actor) {
        return this.donorsService.findAll(actor);
    }
    findOne(id, actor) {
        return this.donorsService.findOne(id, actor);
    }
    create(dto, actor) {
        return this.donorsService.create(dto, actor);
    }
    update(id, dto, actor) {
        return this.donorsService.update(id, dto, actor);
    }
    createScreening(dto, actor) {
        return this.donorsService.createScreening(dto, actor);
    }
};
exports.DonorsController = DonorsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DonorsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DonorsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.BLOOD_BANK, client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_donor_dto_1.CreateDonorDto, Object]),
    __metadata("design:returntype", void 0)
], DonorsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], DonorsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('screenings'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.BLOOD_BANK, client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_screening_dto_1.CreateScreeningDto, Object]),
    __metadata("design:returntype", void 0)
], DonorsController.prototype, "createScreening", null);
exports.DonorsController = DonorsController = __decorate([
    (0, swagger_1.ApiTags)('donors'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('donors'),
    __metadata("design:paramtypes", [donors_service_1.DonorsService])
], DonorsController);
//# sourceMappingURL=donors.controller.js.map
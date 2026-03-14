"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BloodBanksModule = void 0;
const common_1 = require("@nestjs/common");
const blood_banks_controller_1 = require("./blood-banks.controller");
const blood_banks_service_1 = require("./blood-banks.service");
const blood_banks_repository_1 = require("./repository/blood-banks.repository");
let BloodBanksModule = class BloodBanksModule {
};
exports.BloodBanksModule = BloodBanksModule;
exports.BloodBanksModule = BloodBanksModule = __decorate([
    (0, common_1.Module)({
        controllers: [blood_banks_controller_1.BloodBanksController],
        providers: [blood_banks_service_1.BloodBanksService, blood_banks_repository_1.BloodBanksRepository],
        exports: [blood_banks_service_1.BloodBanksService],
    })
], BloodBanksModule);
//# sourceMappingURL=blood-banks.module.js.map
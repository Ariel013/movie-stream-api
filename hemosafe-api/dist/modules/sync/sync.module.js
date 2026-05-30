"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncModule = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("@nestjs-modules/ioredis");
const sync_service_1 = require("./sync.service");
const sync_controller_1 = require("./sync.controller");
const idempotency_interceptor_1 = require("../../common/interceptors/idempotency.interceptor");
let SyncModule = class SyncModule {
};
exports.SyncModule = SyncModule;
exports.SyncModule = SyncModule = __decorate([
    (0, common_1.Module)({
        imports: [ioredis_1.RedisModule],
        controllers: [sync_controller_1.SyncController],
        providers: [sync_service_1.SyncService, idempotency_interceptor_1.IdempotencyInterceptor],
        exports: [sync_service_1.SyncService],
    })
], SyncModule);
//# sourceMappingURL=sync.module.js.map
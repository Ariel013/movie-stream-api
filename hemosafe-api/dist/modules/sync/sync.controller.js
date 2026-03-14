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
exports.SyncController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const sync_service_1 = require("./sync.service");
const batch_sync_dto_1 = require("./dto/batch-sync.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const idempotency_interceptor_1 = require("../../common/interceptors/idempotency.interceptor");
let SyncController = class SyncController {
    constructor(syncService) {
        this.syncService = syncService;
    }
    async batch(dto, actor) {
        const results = await this.syncService.processBatch(dto, actor.sub);
        return { results };
    }
    async pull(sinceStr, scopesStr, actor) {
        const since = sinceStr ? new Date(sinceStr) : null;
        const scopes = scopesStr ? scopesStr.split(',') : ['stock', 'reservations', 'patients', 'notifications'];
        const data = await this.syncService.pull(since, scopes, actor.facilityId ?? actor.sub);
        return { data };
    }
};
exports.SyncController = SyncController;
__decorate([
    (0, common_1.Post)('batch'),
    (0, common_1.UseInterceptors)(idempotency_interceptor_1.IdempotencyInterceptor),
    (0, swagger_1.ApiOperation)({ summary: 'Process a batch of offline-queued mutations' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [batch_sync_dto_1.BatchSyncDto, Object]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "batch", null);
__decorate([
    (0, common_1.Get)('pull'),
    (0, swagger_1.ApiOperation)({ summary: 'Pull server changes since last sync' }),
    __param(0, (0, common_1.Query)('since')),
    __param(1, (0, common_1.Query)('scopes')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "pull", null);
exports.SyncController = SyncController = __decorate([
    (0, swagger_1.ApiTags)('Sync'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('sync'),
    __metadata("design:paramtypes", [sync_service_1.SyncService])
], SyncController);
//# sourceMappingURL=sync.controller.js.map
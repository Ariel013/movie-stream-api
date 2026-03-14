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
exports.IdempotencyInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const ioredis_1 = require("@nestjs-modules/ioredis");
let IdempotencyInterceptor = class IdempotencyInterceptor {
    constructor(redis) {
        this.redis = redis;
        this.TTL_SECONDS = 86_400;
        this.KEY_PREFIX = 'idem:';
    }
    async intercept(ctx, next) {
        const req = ctx.switchToHttp().getRequest();
        if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
            return next.handle();
        }
        const idempotencyKey = req.headers['x-idempotency-key'];
        if (!idempotencyKey) {
            return next.handle();
        }
        const redisKey = `${this.KEY_PREFIX}${idempotencyKey}`;
        const cached = await this.redis.get(redisKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            const res = ctx.switchToHttp().getResponse();
            res.status(parsed.statusCode);
            return (0, rxjs_1.of)(parsed.body);
        }
        const lock = await this.redis.set(`${redisKey}:lock`, '1', 'EX', 30, 'NX');
        if (!lock) {
            throw new common_1.HttpException('A request with this idempotency key is already in progress', common_1.HttpStatus.CONFLICT);
        }
        return next.handle().pipe((0, operators_1.tap)({
            next: async (body) => {
                const res = ctx.switchToHttp().getResponse();
                const statusCode = res.statusCode || 200;
                await this.redis.set(redisKey, JSON.stringify({ statusCode, body }), 'EX', this.TTL_SECONDS);
                await this.redis.del(`${redisKey}:lock`);
            },
            error: async () => {
                await this.redis.del(`${redisKey}:lock`);
            },
        }));
    }
};
exports.IdempotencyInterceptor = IdempotencyInterceptor;
exports.IdempotencyInterceptor = IdempotencyInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, ioredis_1.InjectRedis)()),
    __metadata("design:paramtypes", [Function])
], IdempotencyInterceptor);
//# sourceMappingURL=idempotency.interceptor.js.map
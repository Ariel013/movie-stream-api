"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const helmet_1 = require("helmet");
const compression = require("compression");
const app_module_1 = require("./app.module");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const audit_interceptor_1 = require("./common/interceptors/audit.interceptor");
const prisma_service_1 = require("./prisma/prisma.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log', 'debug'],
    });
    const config = app.get(config_1.ConfigService);
    const prisma = app.get(prisma_service_1.PrismaService);
    const reflector = app.get(core_1.Reflector);
    app.use((0, helmet_1.default)());
    app.use(compression());
    app.enableCors({
        origin: config.get('FRONTEND_URL'),
        credentials: true,
    });
    app.enableVersioning({ type: common_1.VersioningType.URI, defaultVersion: '1' });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor(), new transform_interceptor_1.TransformInterceptor(), new audit_interceptor_1.AuditInterceptor(prisma, reflector));
    if (config.get('NODE_ENV') !== 'production') {
        const swaggerConfig = new swagger_1.DocumentBuilder()
            .setTitle('HEMOSAFE API')
            .setDescription('National Blood Bank Management System')
            .setVersion('1.0')
            .addBearerAuth()
            .addTag('auth')
            .addTag('users')
            .addTag('hospitals')
            .addTag('blood-banks')
            .addTag('blood-bags')
            .addTag('donors')
            .addTag('patients')
            .addTag('prescriptions')
            .addTag('reservations')
            .addTag('transfers')
            .addTag('notifications')
            .addTag('statistics')
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
        swagger_1.SwaggerModule.setup('api/docs', app, document);
    }
    await prisma.enableShutdownHooks(app);
    const port = config.get('PORT', 3001);
    await app.listen(port);
    console.log(`🩸 HEMOSAFE API running on http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map
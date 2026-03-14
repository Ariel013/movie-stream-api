import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const config = app.get(ConfigService);
  const prisma = app.get(PrismaService);
  const reflector = app.get(Reflector);

  // ── Security ──────────────────────────────────────────────────────────────
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: config.get<string>('FRONTEND_URL'),
    credentials: true,
  });

  // ── API versioning ─────────────────────────────────────────────────────────
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.setGlobalPrefix('api');

  // ── Global pipes, filters, interceptors ────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
    new AuditInterceptor(prisma, reflector),
  );

  // ── Swagger ────────────────────────────────────────────────────────────────
  if (config.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
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

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  await prisma.enableShutdownHooks(app);

  const port = config.get<number>('PORT', 3001);
  await app.listen(port);
  console.log(`🩸 HEMOSAFE API running on http://localhost:${port}/api`);
}

bootstrap();

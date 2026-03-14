import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionsRepository } from './repository/prescriptions.repository';

@Module({
  imports: [PrismaModule],
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService, PrescriptionsRepository],
  exports: [PrescriptionsService, PrescriptionsRepository],
})
export class PrescriptionsModule {}

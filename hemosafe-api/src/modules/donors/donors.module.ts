import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DonorsController } from './donors.controller';
import { DonorsService } from './donors.service';
import { DonorsRepository } from './repository/donors.repository';

@Module({
  imports: [PrismaModule],
  controllers: [DonorsController],
  providers: [DonorsService, DonorsRepository],
  exports: [DonorsService, DonorsRepository],
})
export class DonorsModule {}

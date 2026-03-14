import { Module } from '@nestjs/common';
import { BloodBanksController } from './blood-banks.controller';
import { BloodBanksService } from './blood-banks.service';
import { BloodBanksRepository } from './repository/blood-banks.repository';

@Module({
  controllers: [BloodBanksController],
  providers:   [BloodBanksService, BloodBanksRepository],
  exports:     [BloodBanksService],
})
export class BloodBanksModule {}

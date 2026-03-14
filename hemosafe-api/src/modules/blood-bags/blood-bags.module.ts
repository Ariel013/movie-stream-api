import { Module } from '@nestjs/common';
import { BloodBagsController } from './blood-bags.controller';
import { BloodBagsService } from './blood-bags.service';
import { BloodBagsRepository } from './repository/blood-bags.repository';

@Module({
  controllers: [BloodBagsController],
  providers: [BloodBagsService, BloodBagsRepository],
  exports: [BloodBagsService, BloodBagsRepository],
})
export class BloodBagsModule {}

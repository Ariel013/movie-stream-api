import { Module } from '@nestjs/common';
import { BloodBagsController } from './blood-bags.controller';
import { BloodBagsService } from './blood-bags.service';
import { BloodBagsRepository } from './repository/blood-bags.repository';
import { CacheService } from '../../common/cache/cache.service';

@Module({
  controllers: [BloodBagsController],
  providers: [BloodBagsService, BloodBagsRepository, CacheService],
  exports: [BloodBagsService, BloodBagsRepository],
})
export class BloodBagsModule {}

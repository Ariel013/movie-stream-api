import { Module } from '@nestjs/common';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { CacheService } from '../../common/cache/cache.service';

@Module({
  controllers: [StatisticsController],
  providers:   [StatisticsService, CacheService],
  exports:     [StatisticsService],
})
export class StatisticsModule {}

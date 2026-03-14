import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { ReservationsRepository } from './repository/reservations.repository';
import { ReservationEngineService } from './engine/reservation-engine.service';
import { GeoSearchService } from './engine/geo-search.service';
import { LockingService } from './engine/locking.service';
import { ReservationValidatorService } from './engine/reservation-validator.service';

@Module({
  controllers: [ReservationsController],
  providers: [
    // Orchestrator
    ReservationsService,

    // Engine layer
    ReservationEngineService,
    LockingService,
    ReservationValidatorService,
    GeoSearchService,

    // Data layer
    ReservationsRepository,
  ],
  exports: [ReservationsService, ReservationEngineService, GeoSearchService],
})
export class ReservationsModule {}

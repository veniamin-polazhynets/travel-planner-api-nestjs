import { Module } from '@nestjs/common';
import { TripsController } from './trips.controller';
import { TripsRepository } from './trips.repository';
import { TripsService } from './trips.service';

@Module({
  providers: [TripsService, TripsRepository],
  controllers: [TripsController],
})
export class TripsModule {}

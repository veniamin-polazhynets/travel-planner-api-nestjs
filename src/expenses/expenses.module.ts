import { Module } from '@nestjs/common';
import { TripsModule } from '../trips/trips.module';
import { ExpensesController } from './expenses.controller';
import { ExpensesRepository } from './expenses.repository';
import { ExpensesService } from './expenses.service';

@Module({
  imports: [TripsModule],
  providers: [ExpensesService, ExpensesRepository],
  controllers: [ExpensesController],
})
export class ExpensesModule {}

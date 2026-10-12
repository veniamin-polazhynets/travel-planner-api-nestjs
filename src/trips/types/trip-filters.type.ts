import { QueryTripsDto } from '../dto';

export type TripFilters = Omit<QueryTripsDto, 'page' | 'limit'>;

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Trip } from '@prisma/client';
import { PaginatedResponseDto } from '../common/dto';
import {
  CreateTripDto,
  QueryTripsDto,
  TripResponseDto,
  UpdateTripDto,
} from './dto';
import { TripsRepository } from './trips.repository';

@Injectable()
export class TripsService {
  constructor(private readonly tripsRepository: TripsRepository) {}

  async create(userId: number, dto: CreateTripDto): Promise<TripResponseDto> {
    if (dto.endDate < dto.startDate) {
      throw new BadRequestException(
        'End date must be greater than or equal to start date',
      );
    }

    const trip = await this.tripsRepository.create({
      ...dto,
      userId,
    });

    return TripResponseDto.fromEntity(trip);
  }

  async getMany(
    userId: number,
    query: QueryTripsDto,
  ): Promise<PaginatedResponseDto<TripResponseDto>> {
    if (query.to && query.from) {
      if (new Date(query.from) > new Date(query.to)) {
        throw new BadRequestException(
          'Parameter "to" must be greater than or equal to parameter "from"',
        );
      }
    }

    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const take = limit;

    const [trips, total] = await this.tripsRepository.findManyByUserId(
      userId,
      skip,
      take,
      query,
    );

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: trips.map(TripResponseDto.fromEntity),
      meta: { total, page, limit, totalPages },
    };
  }

  async getById(userId: number, tripId: number): Promise<TripResponseDto> {
    const trip = await this.getTripAndCheckAccess(userId, tripId);

    return TripResponseDto.fromEntity(trip);
  }

  async update(
    userId: number,
    tripId: number,
    dto: UpdateTripDto,
  ): Promise<TripResponseDto> {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        'Body must contain at least one field to update',
      );
    }

    const trip = await this.getTripAndCheckAccess(userId, tripId);

    const startDate = dto.startDate ? new Date(dto.startDate) : trip.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : trip.endDate;

    if (endDate < startDate) {
      throw new BadRequestException(
        'End date must be greater than or equal to start date',
      );
    }

    const updatedTrip = await this.tripsRepository.update(tripId, dto);

    return TripResponseDto.fromEntity(updatedTrip);
  }

  async delete(userId: number, tripId: number): Promise<void> {
    await this.getTripAndCheckAccess(userId, tripId);
    await this.tripsRepository.delete(tripId);
  }

  async getTripAndCheckAccess(userId: number, tripId: number): Promise<Trip> {
    const trip = await this.tripsRepository.findById(tripId);

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    if (trip.userId !== userId) {
      throw new ForbiddenException('You do not have access to this trip');
    }

    return trip;
  }
}

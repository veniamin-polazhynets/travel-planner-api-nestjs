import { Injectable } from '@nestjs/common';
import { Prisma, Trip } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TripFilters } from './types';

@Injectable()
export class TripsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.TripUncheckedCreateInput): Promise<Trip> {
    return await this.prisma.trip.create({ data });
  }

  async findManyByUserId(
    userId: number,
    skip: number,
    take: number,
    filters: TripFilters,
  ): Promise<[Trip[], number]> {
    const where: Prisma.TripWhereInput = {
      userId,
    };
    const orderBy: Prisma.TripOrderByWithRelationInput[] = [
      { [filters.sortBy]: filters.order },
      { id: 'desc' },
    ];

    if (filters.search) {
      where.title = { contains: filters.search, mode: 'insensitive' };
    }
    if (filters.country) {
      where.country = filters.country;
    }
    if (filters.city) {
      where.city = filters.city;
    }
    if (filters.from) {
      where.startDate = { gte: new Date(filters.from) };
    }
    if (filters.to) {
      where.endDate = { lte: new Date(filters.to) };
    }

    return await Promise.all([
      this.prisma.trip.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prisma.trip.count({ where }),
    ]);
  }

  async findById(id: number): Promise<Trip | null> {
    return await this.prisma.trip.findFirst({
      where: { id },
    });
  }

  async update(id: number, data: Prisma.TripUpdateInput): Promise<Trip> {
    return await this.prisma.trip.update({ where: { id }, data });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.trip.delete({ where: { id } });
  }
}

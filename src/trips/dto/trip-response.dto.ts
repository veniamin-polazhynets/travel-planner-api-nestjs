import { Trip } from '@prisma/client';

export class TripResponseDto {
  id: number;
  title: string;
  country: string;
  city: string;
  startDate: string;
  endDate: string;
  budget: string;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(trip: Trip): TripResponseDto {
    return {
      id: trip.id,
      title: trip.title,
      country: trip.country,
      city: trip.city,
      startDate: trip.startDate.toISOString().split('T')[0],
      endDate: trip.endDate.toISOString().split('T')[0],
      budget: trip.budget.toFixed(2),
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
    };
  }
}

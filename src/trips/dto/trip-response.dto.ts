import { ApiProperty } from '@nestjs/swagger';
import { Trip } from '@prisma/client';
import { PaginationMetaDto } from '../../common/dto';

export class TripResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Trip to Italy' })
  title: string;

  @ApiProperty({ example: 'Italy' })
  country: string;

  @ApiProperty({ example: 'Rome' })
  city: string;

  @ApiProperty({
    example: '2026-08-01',
    description: 'Trip start date in YYYY-MM-DD format',
  })
  startDate: string;

  @ApiProperty({
    example: '2026-08-07',
    description: 'Trip end date in YYYY-MM-DD format',
  })
  endDate: string;

  @ApiProperty({ example: '3000.00', description: 'Trip budget in USD' })
  budget: string;

  @ApiProperty({ example: '2026-06-01T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-01T12:00:00.000Z' })
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

export class TripsPaginatedResponseDto {
  @ApiProperty({ type: [TripResponseDto] })
  data: TripResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

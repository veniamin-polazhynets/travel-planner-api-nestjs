import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto';

export class QueryTripsDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'trip',
    description: 'Case insensitive search for trip title',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({
    example: 'Italy',
    description: 'Filter by country name',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  country?: string;

  @ApiPropertyOptional({ example: 'Rome', description: 'Filter by city name' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  city?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Field to sort by',
  })
  @IsOptional()
  @IsIn(['createdAt', 'startDate', 'endDate', 'budget'])
  sortBy: 'createdAt' | 'startDate' | 'endDate' | 'budget' = 'createdAt';

  @ApiPropertyOptional({ example: 'desc', description: 'Sorting order' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    example: '2026-06-01',
    description:
      'Start date for filtering trips. Returns trips starting on or after this date',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-08-31',
    description:
      'End date for filtering trips. Returns trips starting on or before this date. Must be greater than or equal to parameter "from"',
  })
  @IsDateString()
  @IsOptional()
  to?: string;
}

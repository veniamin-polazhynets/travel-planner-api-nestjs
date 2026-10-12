import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto';

export class QueryTripsDto extends PaginationDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  country?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  city?: string;

  @IsOptional()
  @IsIn(['createdAt', 'startDate', 'endDate', 'budget'])
  sortBy: 'createdAt' | 'startDate' | 'endDate' | 'budget' = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;
}

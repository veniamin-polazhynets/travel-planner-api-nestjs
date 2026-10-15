import { ExpenseCategory } from '@prisma/client';
import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto';

export class QueryExpensesDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @IsOptional()
  @IsIn(['createdAt', 'amount'])
  sortBy: 'createdAt' | 'amount' = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';
}

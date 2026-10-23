import { ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseCategory } from '@prisma/client';
import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto';

export class QueryExpensesDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'FOOD' })
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Field to sort by',
  })
  @IsOptional()
  @IsIn(['createdAt', 'amount'])
  sortBy: 'createdAt' | 'amount' = 'createdAt';

  @ApiPropertyOptional({ example: 'desc', description: 'Sorting order' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';
}

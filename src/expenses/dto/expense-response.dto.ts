import { ApiProperty } from '@nestjs/swagger';
import { Expense } from '@prisma/client';
import { PaginationMetaDto } from '../../common/dto';

export class ExpenseResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  tripId: number;

  @ApiProperty({ example: 'Nannarella' })
  title: string;

  @ApiProperty({ example: '50.00', description: 'Expense amount in USD' })
  amount: string;

  @ApiProperty({
    example: 'FOOD',
  })
  category: string;

  @ApiProperty({ example: '2026-06-01T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-01T12:00:00.000Z' })
  updatedAt: Date;

  static fromEntity(expense: Expense): ExpenseResponseDto {
    return {
      id: expense.id,
      tripId: expense.tripId,
      title: expense.title,
      amount: expense.amount.toFixed(2),
      category: expense.category,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };
  }
}

export class ExpensesPaginatedResponseDto {
  @ApiProperty({ type: [ExpenseResponseDto] })
  data: ExpenseResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

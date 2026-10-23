import { ApiProperty } from '@nestjs/swagger';
import { ExpenseCategory } from '@prisma/client';

export class CategorySummaryDto {
  @ApiProperty({ example: 'FOOD' })
  category: ExpenseCategory;

  @ApiProperty({
    example: '250.00',
    description: 'Total amount of all expenses in specific category',
  })
  totalAmount: string;
}

export class ExpensesSummaryDto {
  @ApiProperty({ example: '3000.00', description: 'Budget of trip' })
  budget: string;

  @ApiProperty({
    example: '500.00',
    description: 'Total amount of money spent across all expenses of trip',
  })
  totalSpent: string;

  @ApiProperty({ example: '2500.00', description: 'Remaining budget of trip' })
  remainingBudget: string;

  @ApiProperty({
    example: false,
    description: 'Indicates whether total expenses have exceeded budget',
  })
  isOverBudget: boolean;

  @ApiProperty({ example: 5, description: 'Number of all expenses of trip' })
  totalExpenses: number;

  @ApiProperty({
    type: [CategorySummaryDto],
    description: 'Breakdown of total expenses grouped by category',
  })
  byCategory: CategorySummaryDto[];
}

import { ExpenseCategory } from '@prisma/client';

export class CategorySummaryDto {
  category: ExpenseCategory;
  totalAmount: string;
}

export class ExpensesSummaryDto {
  budget: string;
  totalSpent: string;
  remainingBudget: string;
  isOverBudget: boolean;
  totalExpenses: number;
  byCategory: CategorySummaryDto[];
}

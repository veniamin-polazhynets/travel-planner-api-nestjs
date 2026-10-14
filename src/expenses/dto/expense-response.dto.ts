import { Expense } from '@prisma/client';

export class ExpenseResponseDto {
  id: number;
  tripId: number;
  title: string;
  amount: string;
  category: string;
  createdAt: Date;
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

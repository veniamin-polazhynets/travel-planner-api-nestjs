import { ExpenseCategory, Prisma } from '@prisma/client';

export type TripExpensesTotals = {
  totalSpent: Prisma.Decimal;
  totalExpenses: number;
};

export type ExpenseCategoryTotal = {
  category: ExpenseCategory;
  totalAmount: Prisma.Decimal;
};

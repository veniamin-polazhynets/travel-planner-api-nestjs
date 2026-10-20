import { Injectable } from '@nestjs/common';
import { Expense, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ExpenseCategoryTotal,
  ExpenseFilters,
  TripExpensesTotals,
} from './types';

@Injectable()
export class ExpensesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ExpenseUncheckedCreateInput): Promise<Expense> {
    return await this.prisma.expense.create({ data });
  }

  async findManyByTripId(
    tripId: number,
    skip: number,
    take: number,
    filters: ExpenseFilters,
  ): Promise<[Expense[], number]> {
    const where: Prisma.ExpenseWhereInput = {
      tripId,
    };

    const orderBy: Prisma.ExpenseOrderByWithRelationInput[] = [
      { [filters.sortBy]: filters.order },
      { id: 'desc' },
    ];

    if (filters.category) {
      where.category = filters.category;
    }

    return await Promise.all([
      this.prisma.expense.findMany({ where, skip, take, orderBy }),
      this.prisma.expense.count({ where }),
    ]);
  }

  async findById(id: number): Promise<Expense | null> {
    return await this.prisma.expense.findUnique({ where: { id } });
  }

  async update(
    id: number,
    data: Prisma.ExpenseUncheckedUpdateInput,
  ): Promise<Expense> {
    return await this.prisma.expense.update({ where: { id }, data });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.expense.delete({ where: { id } });
  }

  async findTripExpensesTotals(tripId: number): Promise<TripExpensesTotals> {
    const result = await this.prisma.expense.aggregate({
      where: { tripId },
      _sum: { amount: true },
      _count: { id: true },
    });

    return {
      totalSpent: result._sum.amount ?? new Prisma.Decimal(0),
      totalExpenses: result._count.id,
    };
  }

  async findExpenseCategoriesTotals(
    tripId: number,
  ): Promise<ExpenseCategoryTotal[]> {
    const result = await this.prisma.expense.groupBy({
      by: ['category'],
      where: { tripId },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    return result.map((item) => ({
      category: item.category,
      totalAmount: item._sum.amount ?? new Prisma.Decimal(0),
    }));
  }
}

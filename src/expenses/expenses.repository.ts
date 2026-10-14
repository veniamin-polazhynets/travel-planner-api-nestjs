import { Injectable } from '@nestjs/common';
import { Expense, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpensesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ExpenseUncheckedCreateInput): Promise<Expense> {
    return await this.prisma.expense.create({ data });
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
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { Expense } from '@prisma/client';
import { PaginatedResponseDto } from '../common/dto';
import { RedisService } from '../common/redis/redis.service';
import { assertNonEmptyBody } from '../common/utils';
import { TripsService } from '../trips/trips.service';
import {
  CreateExpenseDto,
  ExpenseResponseDto,
  ExpensesSummaryDto,
  QueryExpensesDto,
  UpdateExpenseDto,
} from './dto';
import { ExpensesRepository } from './expenses.repository';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly expensesRepository: ExpensesRepository,
    private readonly tripsService: TripsService,
    private readonly redisService: RedisService,
  ) {}

  async create(
    userId: number,
    tripId: number,
    dto: CreateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    await this.tripsService.getTripAndCheckAccess(userId, tripId);
    const expense = await this.expensesRepository.create({ ...dto, tripId });
    await this.redisService.del(`trips:${tripId}:expenses:summary`);

    return ExpenseResponseDto.fromEntity(expense);
  }

  async getMany(
    userId: number,
    tripId: number,
    query: QueryExpensesDto,
  ): Promise<PaginatedResponseDto<ExpenseResponseDto>> {
    await this.tripsService.getTripAndCheckAccess(userId, tripId);

    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const take = limit;

    const [expenses, total] = await this.expensesRepository.findManyByTripId(
      tripId,
      skip,
      take,
      query,
    );

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: expenses.map(ExpenseResponseDto.fromEntity),
      meta: { total, page, limit, totalPages },
    };
  }

  async getById(
    userId: number,
    tripId: number,
    expenseId: number,
  ): Promise<ExpenseResponseDto> {
    const expense = await this.getExpenseAndCheckAccess(
      userId,
      tripId,
      expenseId,
    );

    return ExpenseResponseDto.fromEntity(expense);
  }

  async update(
    userId: number,
    tripId: number,
    expenseId: number,
    dto: UpdateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    assertNonEmptyBody(dto);

    await this.getExpenseAndCheckAccess(userId, tripId, expenseId);
    const updatedExpense = await this.expensesRepository.update(expenseId, dto);
    await this.redisService.del(`trips:${tripId}:expenses:summary`);

    return ExpenseResponseDto.fromEntity(updatedExpense);
  }

  async delete(
    userId: number,
    tripId: number,
    expenseId: number,
  ): Promise<void> {
    await this.getExpenseAndCheckAccess(userId, tripId, expenseId);
    await this.expensesRepository.delete(expenseId);
    await this.redisService.del(`trips:${tripId}:expenses:summary`);
  }

  async getSummary(
    userId: number,
    tripId: number,
  ): Promise<ExpensesSummaryDto> {
    const cacheKey = `trips:${tripId}:expenses:summary`;

    const trip = await this.tripsService.getTripAndCheckAccess(userId, tripId);

    const cachedSummary = await this.redisService.get(cacheKey);

    if (cachedSummary) {
      return JSON.parse(cachedSummary);
    }

    const [tripExpensesTotals, expenseCategoriesTotals] = await Promise.all([
      this.expensesRepository.findTripExpensesTotals(tripId),
      this.expensesRepository.findExpenseCategoriesTotals(tripId),
    ]);

    const remainingBudget = trip.budget.sub(tripExpensesTotals.totalSpent);
    const isOverBudget = remainingBudget.isNegative();

    const summary = {
      budget: trip.budget.toFixed(2),
      totalSpent: tripExpensesTotals.totalSpent.toFixed(2),
      remainingBudget: remainingBudget.toFixed(2),
      isOverBudget,
      totalExpenses: tripExpensesTotals.totalExpenses,
      byCategory: expenseCategoriesTotals.map((item) => ({
        category: item.category,
        totalAmount: item.totalAmount.toFixed(2),
      })),
    };
    await this.redisService.set(cacheKey, summary, 600);

    return summary;
  }

  private async getExpenseAndCheckAccess(
    userId: number,
    tripId: number,
    expenseId: number,
  ): Promise<Expense> {
    await this.tripsService.getTripAndCheckAccess(userId, tripId);
    const expense = await this.expensesRepository.findById(expenseId);

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    if (expense.tripId !== tripId) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }
}

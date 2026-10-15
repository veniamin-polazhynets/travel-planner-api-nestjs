import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Expense } from '@prisma/client';
import { PaginatedResponseDto } from '../common/dto';
import { TripsService } from '../trips/trips.service';
import {
  CreateExpenseDto,
  ExpenseResponseDto,
  QueryExpensesDto,
  UpdateExpenseDto,
} from './dto';
import { ExpensesRepository } from './expenses.repository';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly expensesRepository: ExpensesRepository,
    private readonly tripsService: TripsService,
  ) {}

  async create(
    userId: number,
    tripId: number,
    dto: CreateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    await this.tripsService.getTripAndCheckAccess(userId, tripId);
    const expense = await this.expensesRepository.create({ ...dto, tripId });

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
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        'Body must contain at least one field to update',
      );
    }
    await this.getExpenseAndCheckAccess(userId, tripId, expenseId);
    const updatedExpense = await this.expensesRepository.update(expenseId, dto);

    return ExpenseResponseDto.fromEntity(updatedExpense);
  }

  async delete(
    userId: number,
    tripId: number,
    expenseId: number,
  ): Promise<void> {
    await this.getExpenseAndCheckAccess(userId, tripId, expenseId);
    await this.expensesRepository.delete(expenseId);
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

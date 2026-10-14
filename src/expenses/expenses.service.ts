import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Expense } from '@prisma/client';
import { TripsService } from '../trips/trips.service';
import { CreateExpenseDto, ExpenseResponseDto, UpdateExpenseDto } from './dto';
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

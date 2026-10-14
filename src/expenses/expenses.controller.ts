import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { CreateExpenseDto, ExpenseResponseDto, UpdateExpenseDto } from './dto';
import { ExpensesService } from './expenses.service';

@UseGuards(JwtAuthGuard)
@Controller('/trips/:tripId/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: User,
    @Param('tripId', ParseIntPipe) tripId: number,
    @Body() dto: CreateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    return await this.expensesService.create(user.id, tripId, dto);
  }

  @Get(':expenseId')
  @HttpCode(HttpStatus.OK)
  async getById(
    @CurrentUser() user: User,
    @Param('tripId', ParseIntPipe) tripId: number,
    @Param('expenseId', ParseIntPipe) expenseId: number,
  ): Promise<ExpenseResponseDto> {
    return await this.expensesService.getById(user.id, tripId, expenseId);
  }

  @Patch(':expenseId')
  @HttpCode(HttpStatus.OK)
  async update(
    @CurrentUser() user: User,
    @Param('tripId', ParseIntPipe) tripId: number,
    @Param('expenseId', ParseIntPipe) expenseId: number,
    @Body() dto: UpdateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    return await this.expensesService.update(user.id, tripId, expenseId, dto);
  }

  @Delete(':expenseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: User,
    @Param('tripId', ParseIntPipe) tripId: number,
    @Param('expenseId', ParseIntPipe) expenseId: number,
  ): Promise<void> {
    await this.expensesService.delete(user.id, tripId, expenseId);
  }
}

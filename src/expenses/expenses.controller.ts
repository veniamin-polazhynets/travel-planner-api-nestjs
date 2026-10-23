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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { PaginatedResponseDto } from '../common/dto';
import {
  CreateExpenseDto,
  ExpenseResponseDto,
  ExpensesPaginatedResponseDto,
  ExpensesSummaryDto,
  QueryExpensesDto,
  UpdateExpenseDto,
} from './dto';
import { ExpensesService } from './expenses.service';

@UseGuards(JwtAuthGuard)
@ApiTags('Expenses')
@ApiBearerAuth('JWT-auth')
@ApiBadRequestResponse({ description: 'Validation failed' })
@ApiUnauthorizedResponse({
  description: 'Missing, invalid or expired access token',
})
@ApiForbiddenResponse({ description: 'You do not have access to this trip' })
@ApiNotFoundResponse({ description: 'Trip not found' })
@Controller('trips/:tripId/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create expense for trip' })
  @ApiCreatedResponse({
    description: 'Successfully created expense',
    type: ExpenseResponseDto,
  })
  async create(
    @CurrentUser() user: User,
    @Param('tripId', ParseIntPipe) tripId: number,
    @Body() dto: CreateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    return await this.expensesService.create(user.id, tripId, dto);
  }

  @Get('summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get trip expenses analytics and budget summary' })
  @ApiOkResponse({
    description: 'Successfully returned trip expenses summary',
    type: ExpensesSummaryDto,
  })
  async getSummary(
    @CurrentUser() user: User,
    @Param('tripId', ParseIntPipe) tripId: number,
  ): Promise<ExpensesSummaryDto> {
    return await this.expensesService.getSummary(user.id, tripId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get list of trip expenses' })
  @ApiOkResponse({
    description: 'Successfully returned list of trip expenses',
    type: ExpensesPaginatedResponseDto,
  })
  async getMany(
    @CurrentUser() user: User,
    @Param('tripId', ParseIntPipe) tripId: number,
    @Query() query: QueryExpensesDto,
  ): Promise<PaginatedResponseDto<ExpenseResponseDto>> {
    return await this.expensesService.getMany(user.id, tripId, query);
  }

  @Get(':expenseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get trip expense by id' })
  @ApiOkResponse({
    description: 'Successfully returned trip expense',
    type: ExpenseResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Expense not found' })
  async getById(
    @CurrentUser() user: User,
    @Param('tripId', ParseIntPipe) tripId: number,
    @Param('expenseId', ParseIntPipe) expenseId: number,
  ): Promise<ExpenseResponseDto> {
    return await this.expensesService.getById(user.id, tripId, expenseId);
  }

  @Patch(':expenseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update trip expense' })
  @ApiOkResponse({
    description: 'Successfully updated trip expense',
    type: ExpenseResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Expense not found' })
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
  @ApiOperation({ summary: 'Delete trip expense' })
  @ApiNoContentResponse({
    description: 'Successfully deleted trip expense',
  })
  @ApiNotFoundResponse({ description: 'Expense not found' })
  async delete(
    @CurrentUser() user: User,
    @Param('tripId', ParseIntPipe) tripId: number,
    @Param('expenseId', ParseIntPipe) expenseId: number,
  ): Promise<void> {
    await this.expensesService.delete(user.id, tripId, expenseId);
  }
}

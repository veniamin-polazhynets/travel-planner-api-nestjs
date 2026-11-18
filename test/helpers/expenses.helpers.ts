import { INestApplication } from '@nestjs/common';
import { ExpenseCategory } from '@prisma/client';
import request from 'supertest';
import { expect } from 'vitest';
import { ExpenseResponseDto } from '../../src/expenses/dto';
import { generateUniqueSuffix } from './common.helpers';

export type CreateExpensePayload = {
  title: string;
  amount: number;
  category?: ExpenseCategory;
};

export const generateExpenseData = (
  overrides?: Partial<CreateExpensePayload>,
) => {
  const uniqueSuffix = generateUniqueSuffix();

  const expenseData: CreateExpensePayload = {
    title: `Nannarella ${uniqueSuffix}`,
    amount: 50,
    category: 'FOOD',
  };

  return { ...expenseData, ...overrides };
};

export const createExpense = async (
  app: INestApplication,
  tripId: number,
  accessToken: string,
  expenseData: CreateExpensePayload,
): Promise<ExpenseResponseDto> => {
  const response = await request(app.getHttpServer())
    .post(`/trips/${tripId}/expenses`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send(expenseData);

  if (response.status !== 201) {
    throw new Error(
      `createExpense failed (${response.status}) for tripId=${tripId}: ${JSON.stringify(response.body)}`,
    );
  }

  return response.body;
};

export const createManyExpenses = async (
  app: INestApplication,
  tripId: number,
  accessToken: string,
  count: number,
): Promise<void> => {
  for (let i = 0; i < count; i++) {
    await createExpense(app, tripId, accessToken, generateExpenseData());
  }
};

export const expectExpense = (
  actualExpense: ExpenseResponseDto,
  expected?: Partial<ExpenseResponseDto>,
) => {
  return expect(actualExpense).toMatchObject({
    id: expect.any(Number),
    tripId: expect.any(Number),
    title: expect.any(String),
    amount: expect.any(String),
    category: expect.any(String),
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
    ...expected,
  });
};

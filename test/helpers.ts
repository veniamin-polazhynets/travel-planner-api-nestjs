import { INestApplication } from '@nestjs/common';
import { ExpenseCategory } from '@prisma/client';
import request from 'supertest';
import { expect, it } from 'vitest';
import { RegistrationDto } from '../src/auth/dto';
import { PaginationMetaDto } from '../src/common/dto';
import { RedisService } from '../src/common/redis/redis.service';
import { ExpenseResponseDto } from '../src/expenses/dto';
import { PrismaService } from '../src/prisma/prisma.service';
import { TripResponseDto } from '../src/trips/dto';
import { UserResponseDto } from '../src/users/dto';
import { TestHelper } from './test-helper';

export type CreatedUserData = {
  credentials: RegistrationDto;
  user: UserResponseDto;
  accessToken: string;
  cookies: string[];
  registerResponse: request.Response;
};

export type CreateTripPayload = {
  title: string;
  country: string;
  city: string;
  startDate: string;
  endDate: string;
  budget: number;
};

export type CreateExpensePayload = {
  title: string;
  amount: number;
  category?: ExpenseCategory;
};

export const generateCredentials = () => {
  const timestamp = Date.now().toString();
  const randomSalt = Math.random().toString(36).substring(2, 7);
  const unique = `${timestamp}_${randomSalt}`;

  return {
    username: `User${unique}`.slice(0, 30),
    email: `user${unique}@example.com`,
    password: `Password${unique}`,
  };
};

export const registerUser = async (
  app: INestApplication,
  credentials: RegistrationDto,
): Promise<request.Response> => {
  return await request(app.getHttpServer())
    .post('/auth/register')
    .send(credentials);
};

export const createUser = async (
  app: INestApplication,
): Promise<CreatedUserData> => {
  const credentials = generateCredentials();
  const registerResponse = await registerUser(app, credentials);
  const rawCookies = registerResponse.headers['set-cookie'];
  const cookies: string[] = Array.isArray(rawCookies)
    ? rawCookies
    : [rawCookies];

  if (registerResponse.status !== 201) {
    throw new Error(
      `createUser failed (${registerResponse.status}): ${JSON.stringify(registerResponse.body)}`,
    );
  }

  return {
    credentials,
    user: registerResponse.body.user,
    accessToken: registerResponse.body.accessToken,
    cookies,
    registerResponse,
  };
};

export const createAdmin = async (
  app: INestApplication,
): Promise<CreatedUserData> => {
  const data = await createUser(app);

  const prisma = app.get(PrismaService);
  const redis = app.get(RedisService);

  const updatedUser = await prisma.user.update({
    where: { id: data.user.id },
    data: { role: 'ADMIN' },
  });
  await redis.del(`user:${data.user.id}:session`);

  data.user.role = updatedUser.role;

  return data;
};

export const expectUser = (
  actualUser: UserResponseDto,
  expected?: Partial<UserResponseDto>,
) => {
  return expect(actualUser).toMatchObject({
    id: expect.any(Number),
    username: expect.any(String),
    email: expect.any(String),
    role: expect.any(String),
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
    ...expected,
  });
};

export const expectPaginationMeta = (
  actualMeta: PaginationMetaDto,
  expected?: Partial<PaginationMetaDto>,
) => {
  return expect(actualMeta).toMatchObject({
    total: expect.any(Number),
    page: expect.any(Number),
    limit: expect.any(Number),
    totalPages: expect.any(Number),
    ...expected,
  });
};

export const generateTripData = (overrides?: Partial<CreateTripPayload>) => {
  const timestamp = Date.now().toString();
  const randomSalt = Math.random().toString(36).substring(2, 7);
  const unique = `${timestamp}_${randomSalt}`;

  const tripData: CreateTripPayload = {
    title: `Trip to Italy ${unique}`,
    country: 'Italy',
    city: 'Rome',
    startDate: '2026-08-01',
    endDate: '2026-08-07',
    budget: 3000,
  };

  return { ...tripData, ...overrides };
};

export const createTrip = async (
  app: INestApplication,
  accessToken: string,
  tripData: CreateTripPayload,
): Promise<TripResponseDto> => {
  const response = await request(app.getHttpServer())
    .post('/trips')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(tripData);

  if (response.status !== 201) {
    throw new Error(
      `createTrip failed (${response.status}): ${JSON.stringify(response.body)}`,
    );
  }

  return response.body;
};

export const createManyTrips = async (
  app: INestApplication,
  accessToken: string,
  count: number,
): Promise<void> => {
  for (let i = 0; i < count; i++) {
    await createTrip(app, accessToken, generateTripData());
  }
};

export const expectTrip = (
  actualTrip: TripResponseDto,
  expected?: Partial<TripResponseDto>,
) => {
  return expect(actualTrip).toMatchObject({
    id: expect.any(Number),
    title: expect.any(String),
    country: expect.any(String),
    city: expect.any(String),
    startDate: expect.any(String),
    endDate: expect.any(String),
    budget: expect.any(String),
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
    ...expected,
  });
};

export const generateExpenseData = (
  overrides?: Partial<CreateExpensePayload>,
) => {
  const timestamp = Date.now().toString();
  const randomSalt = Math.random().toString(36).substring(2, 7);
  const unique = `${timestamp}_${randomSalt}`;

  const expenseData: CreateExpensePayload = {
    title: `Nannarella ${unique}`,
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

export const testUnauthorizedCases = (
  helper: TestHelper,
  method: 'post' | 'get' | 'patch' | 'delete',
  url: string | (() => Promise<string>),
) => {
  const getUrl = async () => (typeof url === 'string' ? url : await url());

  it('should return 401 when token is missing, invalid or expired', async () => {
    const url = await getUrl();

    const response = await request(helper.app.getHttpServer())
      [method](url)
      .set('Authorization', 'Bearer ')
      .send();

    expect(response.status).toBe(401);
  });

  it('should return 401 when authorization header is not provided', async () => {
    const url = await getUrl();

    const response = await request(helper.app.getHttpServer())
      [method](url)
      .send();

    expect(response.status).toBe(401);
  });

  it('should return 401 when authorization type is invalid', async () => {
    const url = await getUrl();
    const { accessToken } = await createUser(helper.app);

    const response = await request(helper.app.getHttpServer())
      [method](url)
      .set('Authorization', `Basic ${accessToken}`)
      .send();

    expect(response.status).toBe(401);
  });

  it('should return 401 when user no longer exists', async () => {
    const url = await getUrl();
    const { accessToken, user } = await createUser(helper.app);

    await helper.prisma.user.delete({ where: { id: user.id } });

    const response = await request(helper.app.getHttpServer())
      [method](url)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('User no longer exists');
  });
};

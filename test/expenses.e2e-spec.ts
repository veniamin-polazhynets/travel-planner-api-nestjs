import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  createExpense,
  createManyExpenses,
  createTrip,
  createUser,
  expectExpense,
  expectPaginationMeta,
  generateExpenseData,
  generateTripData,
  testUnauthorizedCases,
} from './helpers';
import { TestHelper } from './test-helper';

describe('Expenses', () => {
  const helper = new TestHelper();

  beforeAll(async () => {
    await helper.initApp();
  });

  afterEach(async () => {
    await helper.cleanDatabase();
  });

  afterAll(async () => {
    await helper.closeApp();
  });

  describe('POST /trips/:tripId/expenses', () => {
    it('should create expense for trip and return 201', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );

      const response = await request(helper.app.getHttpServer())
        .post(`/trips/${trip.id}/expenses`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Nannarella',
          amount: 50,
          category: 'FOOD',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        tripId: trip.id,
        title: 'Nannarella',
        amount: '50.00',
        category: 'FOOD',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should create expense with default "other" category when not provided', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );

      const response = await request(helper.app.getHttpServer())
        .post(`/trips/${trip.id}/expenses`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Nannarella',
          amount: 50,
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        tripId: trip.id,
        title: 'Nannarella',
        amount: '50.00',
        category: 'OTHER',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should return 400 when any of input data is invalid', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );

      const response = await request(helper.app.getHttpServer())
        .post(`/trips/${trip.id}/expenses`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 1,
          amount: -50,
          category: 'abc',
        });

      expect(response.status).toBe(400);
    });

    it('should return 403 when trip owner is not current user', async () => {
      const { accessToken: ownerAccessToken } = await createUser(helper.app);
      const { accessToken: currentUserAccessToken } = await createUser(
        helper.app,
      );
      const trip = await createTrip(
        helper.app,
        ownerAccessToken,
        generateTripData(),
      );

      const response = await request(helper.app.getHttpServer())
        .post(`/trips/${trip.id}/expenses`)
        .set('Authorization', `Bearer ${currentUserAccessToken}`)
        .send({
          title: 'Nannarella',
          amount: 50,
          category: 'FOOD',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('You do not have access to this trip');
    });

    it('should return 404 when trip does not exist', async () => {
      const { accessToken } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .post('/trips/999/expenses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Nannarella',
          amount: 50,
          category: 'FOOD',
        });

      expect(response.status).toBe(404);
    });

    testUnauthorizedCases(helper, 'post', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );

      return `/trips/${trip.id}/expenses`;
    });
  });

  describe('GET /trips/:tripId/expenses', () => {
    it('should return empty data array, default meta, and 200 when trip has no expenses', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );

      const response = await request(helper.app.getHttpServer())
        .get(`/trips/${trip.id}/expenses`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual([]);
      expect(response.body).toHaveProperty('meta');
      expectPaginationMeta(response.body.meta, {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should return expenses array and 200', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );
      await createExpense(
        helper.app,
        trip.id,
        accessToken,
        generateExpenseData(),
      );

      const response = await request(helper.app.getHttpServer())
        .get(`/trips/${trip.id}/expenses`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(1);
      expect(response.body).toHaveProperty('meta');
      expectPaginationMeta(response.body.meta, {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should apply default pagination', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );
      await createManyExpenses(helper.app, trip.id, accessToken, 12);

      const response = await request(helper.app.getHttpServer())
        .get(`/trips/${trip.id}/expenses`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(10);
      expect(response.body).toHaveProperty('meta');
      expectPaginationMeta(response.body.meta, {
        total: 12,
        page: 1,
        limit: 10,
        totalPages: 2,
      });
    });

    it('should return second page', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );
      await createManyExpenses(helper.app, trip.id, accessToken, 12);

      const response = await request(helper.app.getHttpServer())
        .get(`/trips/${trip.id}/expenses?page=2`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(2);
      expect(response.body).toHaveProperty('meta');
      expectPaginationMeta(response.body.meta, {
        total: 12,
        page: 2,
        limit: 10,
        totalPages: 2,
      });
    });

    it('should change number of expenses on page', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );
      await createManyExpenses(helper.app, trip.id, accessToken, 12);

      const response = await request(helper.app.getHttpServer())
        .get(`/trips/${trip.id}/expenses?limit=5`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(5);
      expect(response.body).toHaveProperty('meta');
      expectPaginationMeta(response.body.meta, {
        total: 12,
        page: 1,
        limit: 5,
        totalPages: 3,
      });
    });

    it('should return expenses based on category', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );
      await createManyExpenses(helper.app, trip.id, accessToken, 10);
      await createExpense(
        helper.app,
        trip.id,
        accessToken,
        generateExpenseData({ category: 'OTHER' }),
      );

      const response = await request(helper.app.getHttpServer())
        .get(`/trips/${trip.id}/expenses?category=OTHER`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(1);
      expect(response.body).toHaveProperty('meta');
      expectPaginationMeta(response.body.meta, {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should sort expenses by amount in ascending order', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );
      await createExpense(
        helper.app,
        trip.id,
        accessToken,
        generateExpenseData({ amount: 50 }),
      );
      await createExpense(
        helper.app,
        trip.id,
        accessToken,
        generateExpenseData({ amount: 10 }),
      );
      await createExpense(
        helper.app,
        trip.id,
        accessToken,
        generateExpenseData({ amount: 25 }),
      );

      const response = await request(helper.app.getHttpServer())
        .get(`/trips/${trip.id}/expenses?sortBy=amount&order=asc`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(3);
      expect(response.body.data[0].amount).toBe('10.00');
      expect(response.body.data[1].amount).toBe('25.00');
      expect(response.body.data[2].amount).toBe('50.00');
      expect(response.body).toHaveProperty('meta');
      expectPaginationMeta(response.body.meta, {
        total: 3,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should return 403 when trip owner is not current user', async () => {
      const { accessToken: ownerAccessToken } = await createUser(helper.app);
      const { accessToken: currentUserAccessToken } = await createUser(
        helper.app,
      );
      const trip = await createTrip(
        helper.app,
        ownerAccessToken,
        generateTripData(),
      );

      const response = await request(helper.app.getHttpServer())
        .get(`/trips/${trip.id}/expenses`)
        .set('Authorization', `Bearer ${currentUserAccessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('You do not have access to this trip');
    });

    it('should return 404 when trip does not exist', async () => {
      const { accessToken } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .get('/trips/999/expenses')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });

    testUnauthorizedCases(helper, 'get', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );

      return `/trips/${trip.id}/expenses`;
    });
  });

  describe('GET /trips/:tripId/expenses/summary', () => {
    it('should return expenses summary with zero totals and 200 when trip has no expenses', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData({ budget: 1000 }),
      );

      const response = await request(helper.app.getHttpServer())
        .get(`/trips/${trip.id}/expenses/summary`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        budget: '1000.00',
        totalSpent: '0.00',
        remainingBudget: '1000.00',
        isOverBudget: false,
        totalExpenses: 0,
      });
      expect(response.body.byCategory).toEqual([]);
    });

    it('should return expenses summary and 200', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData({ budget: 1000 }),
      );
      await createExpense(
        helper.app,
        trip.id,
        accessToken,
        generateExpenseData({ title: 'Lunch', amount: 50, category: 'FOOD' }),
      );
      await createExpense(
        helper.app,
        trip.id,
        accessToken,
        generateExpenseData({
          title: 'Dinner',
          amount: 100,
          category: 'FOOD',
        }),
      );
      await createExpense(
        helper.app,
        trip.id,
        accessToken,
        generateExpenseData({
          title: 'Subway pass',
          amount: 200,
          category: 'TRANSPORT',
        }),
      );

      const response = await request(helper.app.getHttpServer())
        .get(`/trips/${trip.id}/expenses/summary`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        budget: '1000.00',
        totalSpent: '350.00',
        remainingBudget: '650.00',
        isOverBudget: false,
        totalExpenses: 3,
      });
      expect(response.body.byCategory.length).toBe(2);
      expect(response.body.byCategory[0]).toMatchObject({
        category: 'TRANSPORT',
        totalAmount: '200.00',
      });
      expect(response.body.byCategory[1]).toMatchObject({
        category: 'FOOD',
        totalAmount: '150.00',
      });
    });

    it('should return isOverBudget = true when remaining budget is negative', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData({ budget: 100 }),
      );
      await createExpense(
        helper.app,
        trip.id,
        accessToken,
        generateExpenseData({
          title: 'Dinner',
          amount: 150,
          category: 'FOOD',
        }),
      );

      const response = await request(helper.app.getHttpServer())
        .get(`/trips/${trip.id}/expenses/summary`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        budget: '100.00',
        totalSpent: '150.00',
        remainingBudget: '-50.00',
        isOverBudget: true,
        totalExpenses: 1,
      });
      expect(response.body.byCategory.length).toBe(1);
      expect(response.body.byCategory[0]).toMatchObject({
        category: 'FOOD',
        totalAmount: '150.00',
      });
    });

    it('should clear old cache and return correct summary when expense is created or modified', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData({ budget: 1000 }),
      );
      const expense = await createExpense(
        helper.app,
        trip.id,
        accessToken,
        generateExpenseData({
          title: 'Dinner',
          amount: 100,
          category: 'FOOD',
        }),
      );

      const firstResponse = await request(helper.app.getHttpServer())
        .get(`/trips/${trip.id}/expenses/summary`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(firstResponse.status).toBe(200);
      expect(firstResponse.body).toMatchObject({
        budget: '1000.00',
        totalSpent: '100.00',
        remainingBudget: '900.00',
        isOverBudget: false,
        totalExpenses: 1,
      });
      expect(firstResponse.body.byCategory.length).toBe(1);
      expect(firstResponse.body.byCategory[0]).toMatchObject({
        category: 'FOOD',
        totalAmount: '100.00',
      });

      await createExpense(
        helper.app,
        trip.id,
        accessToken,
        generateExpenseData({
          title: 'Lunch',
          amount: 50,
          category: 'FOOD',
        }),
      );

      const secondResponse = await request(helper.app.getHttpServer())
        .get(`/trips/${trip.id}/expenses/summary`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body).toMatchObject({
        budget: '1000.00',
        totalSpent: '150.00',
        remainingBudget: '850.00',
        isOverBudget: false,
        totalExpenses: 2,
      });
      expect(secondResponse.body.byCategory.length).toBe(1);
      expect(secondResponse.body.byCategory[0]).toMatchObject({
        category: 'FOOD',
        totalAmount: '150.00',
      });

      await request(helper.app.getHttpServer())
        .patch(`/trips/${trip.id}/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ amount: 200 });

      const thirdResponse = await request(helper.app.getHttpServer())
        .get(`/trips/${trip.id}/expenses/summary`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(thirdResponse.status).toBe(200);
      expect(thirdResponse.body).toMatchObject({
        budget: '1000.00',
        totalSpent: '250.00',
        remainingBudget: '750.00',
        isOverBudget: false,
        totalExpenses: 2,
      });
      expect(thirdResponse.body.byCategory.length).toBe(1);
      expect(thirdResponse.body.byCategory[0]).toMatchObject({
        category: 'FOOD',
        totalAmount: '250.00',
      });
    });

    it('should clear old cache and return correct summary when trip budget is modified', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData({ budget: 1000 }),
      );
      await createExpense(
        helper.app,
        trip.id,
        accessToken,
        generateExpenseData({
          title: 'Dinner',
          amount: 100,
          category: 'FOOD',
        }),
      );

      const firstResponse = await request(helper.app.getHttpServer())
        .get(`/trips/${trip.id}/expenses/summary`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(firstResponse.status).toBe(200);
      expect(firstResponse.body).toMatchObject({
        budget: '1000.00',
        totalSpent: '100.00',
        remainingBudget: '900.00',
        isOverBudget: false,
        totalExpenses: 1,
      });
      expect(firstResponse.body.byCategory.length).toBe(1);
      expect(firstResponse.body.byCategory[0]).toMatchObject({
        category: 'FOOD',
        totalAmount: '100.00',
      });

      const updateResponse = await request(helper.app.getHttpServer())
        .patch(`/trips/${trip.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ budget: 3000 });

      expect(updateResponse.status).toBe(200);

      const secondResponse = await request(helper.app.getHttpServer())
        .get(`/trips/${trip.id}/expenses/summary`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body).toMatchObject({
        budget: '3000.00',
        totalSpent: '100.00',
        remainingBudget: '2900.00',
        isOverBudget: false,
        totalExpenses: 1,
      });
      expect(secondResponse.body.byCategory.length).toBe(1);
      expect(secondResponse.body.byCategory[0]).toMatchObject({
        category: 'FOOD',
        totalAmount: '100.00',
      });
    });

    it('should return 403 when trip owner is not current user', async () => {
      const { accessToken: ownerAccessToken } = await createUser(helper.app);
      const { accessToken: currentUserAccessToken } = await createUser(
        helper.app,
      );
      const trip = await createTrip(
        helper.app,
        ownerAccessToken,
        generateTripData(),
      );

      const response = await request(helper.app.getHttpServer())
        .get(`/trips/${trip.id}/expenses/summary`)
        .set('Authorization', `Bearer ${currentUserAccessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('You do not have access to this trip');
    });

    it('should return 404 when trip does not exist', async () => {
      const { accessToken } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .get('/trips/999/expenses/summary')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });

    testUnauthorizedCases(helper, 'get', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );

      return `/trips/${trip.id}/expenses/summary`;
    });
  });

  describe('GET /trips/:tripId/expenses/:expenseId', () => {
    it('should return expense and 200', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );
      const expense = await createExpense(
        helper.app,
        trip.id,
        accessToken,
        generateExpenseData(),
      );

      const response = await request(helper.app.getHttpServer())
        .get(`/trips/${trip.id}/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expectExpense(response.body, { id: expense.id, title: expense.title });
    });

    it('should return 403 when trip and expense owner is not current user', async () => {
      const { accessToken: ownerAccessToken } = await createUser(helper.app);
      const { accessToken: currentUserAccessToken } = await createUser(
        helper.app,
      );
      const trip = await createTrip(
        helper.app,
        ownerAccessToken,
        generateTripData(),
      );
      const expense = await createExpense(
        helper.app,
        trip.id,
        ownerAccessToken,
        generateExpenseData(),
      );

      const response = await request(helper.app.getHttpServer())
        .get(`/trips/${trip.id}/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${currentUserAccessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('You do not have access to this trip');
    });

    it('should return 404 when expense does not exist', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );

      const response = await request(helper.app.getHttpServer())
        .get(`/trips/${trip.id}/expenses/999`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 404 when expense belongs to another trip', async () => {
      const { accessToken } = await createUser(helper.app);
      const tripWithExpense = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );
      const tripWithoutExpense = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );
      const expense = await createExpense(
        helper.app,
        tripWithExpense.id,
        accessToken,
        generateExpenseData(),
      );

      const response = await request(helper.app.getHttpServer())
        .get(`/trips/${tripWithoutExpense.id}/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });

    testUnauthorizedCases(helper, 'get', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );
      const expense = await createExpense(
        helper.app,
        trip.id,
        accessToken,
        generateExpenseData(),
      );

      return `/trips/${trip.id}/expenses/${expense.id}`;
    });
  });

  describe('PATCH /trips/:tripId/expenses/:expenseId', () => {
    it('should update expense and return 200', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );
      const expense = await createExpense(
        helper.app,
        trip.id,
        accessToken,
        generateExpenseData(),
      );

      const response = await request(helper.app.getHttpServer())
        .patch(`/trips/${trip.id}/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          amount: 25,
        });

      expect(response.status).toBe(200);
      expectExpense(response.body, {
        id: expense.id,
        title: expense.title,
        amount: '25.00',
      });
    });

    it('should return 400 when any of input data is invalid', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );
      const expense = await createExpense(
        helper.app,
        trip.id,
        accessToken,
        generateExpenseData(),
      );

      const response = await request(helper.app.getHttpServer())
        .patch(`/trips/${trip.id}/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 1,
          amount: -50,
          category: 'abc',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 when body is empty', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );
      const expense = await createExpense(
        helper.app,
        trip.id,
        accessToken,
        generateExpenseData(),
      );

      const response = await request(helper.app.getHttpServer())
        .patch(`/trips/${trip.id}/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Body must contain at least one field to update',
      );
    });

    it('should return 403 when trip and expense owner is not current user', async () => {
      const { accessToken: ownerAccessToken } = await createUser(helper.app);
      const { accessToken: currentUserAccessToken } = await createUser(
        helper.app,
      );
      const trip = await createTrip(
        helper.app,
        ownerAccessToken,
        generateTripData(),
      );
      const expense = await createExpense(
        helper.app,
        trip.id,
        ownerAccessToken,
        generateExpenseData(),
      );

      const response = await request(helper.app.getHttpServer())
        .patch(`/trips/${trip.id}/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${currentUserAccessToken}`)
        .send({
          amount: 25,
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('You do not have access to this trip');
    });

    it('should return 404 when expense does not exist', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );

      const response = await request(helper.app.getHttpServer())
        .patch(`/trips/${trip.id}/expenses/999`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ amount: 25 });

      expect(response.status).toBe(404);
    });

    it('should return 404 when expense belongs to another trip', async () => {
      const { accessToken } = await createUser(helper.app);
      const tripWithExpense = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );
      const tripWithoutExpense = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );
      const expense = await createExpense(
        helper.app,
        tripWithExpense.id,
        accessToken,
        generateExpenseData(),
      );

      const response = await request(helper.app.getHttpServer())
        .patch(`/trips/${tripWithoutExpense.id}/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ amount: 25 });

      expect(response.status).toBe(404);
    });

    testUnauthorizedCases(helper, 'patch', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );
      const expense = await createExpense(
        helper.app,
        trip.id,
        accessToken,
        generateExpenseData(),
      );

      return `/trips/${trip.id}/expenses/${expense.id}`;
    });
  });

  describe('DELETE /trips/:tripId/expenses/:expenseId', () => {
    it('should delete expense and return 204', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );
      const expense = await createExpense(
        helper.app,
        trip.id,
        accessToken,
        generateExpenseData(),
      );

      const response = await request(helper.app.getHttpServer())
        .delete(`/trips/${trip.id}/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(204);

      const afterDeleteResponse = await request(helper.app.getHttpServer())
        .get(`/trips/${trip.id}/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(afterDeleteResponse.status).toBe(404);
    });

    it('should return 403 when trip and expense owner is not current user', async () => {
      const { accessToken: ownerAccessToken } = await createUser(helper.app);
      const { accessToken: currentUserAccessToken } = await createUser(
        helper.app,
      );
      const trip = await createTrip(
        helper.app,
        ownerAccessToken,
        generateTripData(),
      );
      const expense = await createExpense(
        helper.app,
        trip.id,
        ownerAccessToken,
        generateExpenseData(),
      );

      const response = await request(helper.app.getHttpServer())
        .delete(`/trips/${trip.id}/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${currentUserAccessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('You do not have access to this trip');
    });

    it('should return 404 when expense does not exist', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );

      const response = await request(helper.app.getHttpServer())
        .delete(`/trips/${trip.id}/expenses/999`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 404 when expense belongs to another trip', async () => {
      const { accessToken } = await createUser(helper.app);
      const tripWithExpense = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );
      const tripWithoutExpense = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );
      const expense = await createExpense(
        helper.app,
        tripWithExpense.id,
        accessToken,
        generateExpenseData(),
      );

      const response = await request(helper.app.getHttpServer())
        .delete(`/trips/${tripWithoutExpense.id}/expenses/${expense.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });

    testUnauthorizedCases(helper, 'delete', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );
      const expense = await createExpense(
        helper.app,
        trip.id,
        accessToken,
        generateExpenseData(),
      );

      return `/trips/${trip.id}/expenses/${expense.id}`;
    });
  });
});

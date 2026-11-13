import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  createManyTrips,
  createTrip,
  createUser,
  expectPaginationMeta,
  expectTrip,
  generateTripData,
  testUnauthorizedCases,
} from './helpers';
import { TestHelper } from './test-helper';

describe('Trips', () => {
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

  describe('POST /trips', () => {
    it('should create trip and return 201', async () => {
      const { accessToken } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .post('/trips')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Trip to Italy',
          country: 'Italy',
          city: 'Rome',
          startDate: '2026-08-01',
          endDate: '2026-08-07',
          budget: 3000,
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        title: 'Trip to Italy',
        country: 'Italy',
        city: 'Rome',
        startDate: '2026-08-01',
        endDate: '2026-08-07',
        budget: '3000.00',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should return 400 when any of input data is invalid', async () => {
      const { accessToken } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .post('/trips')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 1,
          country: 'a',
          city: 'b',
          startDate: '2026',
          endDate: '07/08/2026',
          budget: '',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 when start date is greater than end date', async () => {
      const { accessToken } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .post('/trips')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Trip to Italy',
          country: 'Italy',
          city: 'Rome',
          startDate: '2026-08-07',
          endDate: '2026-08-01',
          budget: 3000,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'End date must be greater than or equal to start date',
      );
    });

    testUnauthorizedCases(helper, 'post', '/trips');
  });

  describe('GET /trips', () => {
    it('should return empty data array, default meta, and 200 when user has no trips', async () => {
      const { accessToken } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .get('/trips')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

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

    it('should return empty data array, default meta, and 200 when trips exist but owner is not current user', async () => {
      const { accessToken: ownerAccessToken } = await createUser(helper.app);
      const { accessToken: currentUserAccessToken } = await createUser(
        helper.app,
      );
      await createTrip(helper.app, ownerAccessToken, generateTripData());
      const response = await request(helper.app.getHttpServer())
        .get('/trips')
        .set('Authorization', `Bearer ${currentUserAccessToken}`)
        .send();

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

    it('should return trips array and 200', async () => {
      const { accessToken } = await createUser(helper.app);
      await createTrip(helper.app, accessToken, generateTripData());

      const response = await request(helper.app.getHttpServer())
        .get('/trips')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

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
      await createManyTrips(helper.app, accessToken, 12);

      const response = await request(helper.app.getHttpServer())
        .get('/trips')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

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
      await createManyTrips(helper.app, accessToken, 12);

      const response = await request(helper.app.getHttpServer())
        .get('/trips?page=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

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

    it('should change number of trips on page', async () => {
      const { accessToken } = await createUser(helper.app);
      await createManyTrips(helper.app, accessToken, 12);

      const response = await request(helper.app.getHttpServer())
        .get('/trips?limit=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

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

    it('should return trips based on search by title', async () => {
      const { accessToken } = await createUser(helper.app);
      await createManyTrips(helper.app, accessToken, 10);
      await createTrip(
        helper.app,
        accessToken,
        generateTripData({ title: 'Summer in Rome' }),
      );

      const response = await request(helper.app.getHttpServer())
        .get('/trips?search=summer')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toBe('Summer in Rome');
      expect(response.body).toHaveProperty('meta');
      expectPaginationMeta(response.body.meta, {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter trips by country name', async () => {
      const { accessToken } = await createUser(helper.app);
      await createManyTrips(helper.app, accessToken, 10);
      await createTrip(
        helper.app,
        accessToken,
        generateTripData({
          title: 'Summer in Paris',
          country: 'France',
          city: 'Paris',
        }),
      );

      const response = await request(helper.app.getHttpServer())
        .get('/trips?country=France')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].country).toBe('France');
      expect(response.body).toHaveProperty('meta');
      expectPaginationMeta(response.body.meta, {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter trips by city name', async () => {
      const { accessToken } = await createUser(helper.app);
      await createManyTrips(helper.app, accessToken, 10);
      await createTrip(
        helper.app,
        accessToken,
        generateTripData({
          title: 'Summer in Paris',
          country: 'France',
          city: 'Paris',
        }),
      );

      const response = await request(helper.app.getHttpServer())
        .get('/trips?city=Paris')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].city).toBe('Paris');
      expect(response.body).toHaveProperty('meta');
      expectPaginationMeta(response.body.meta, {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should sort trips by budget in ascending order', async () => {
      const { accessToken } = await createUser(helper.app);
      await createTrip(
        helper.app,
        accessToken,
        generateTripData({ budget: 3000 }),
      );
      await createTrip(
        helper.app,
        accessToken,
        generateTripData({ budget: 1000 }),
      );
      await createTrip(
        helper.app,
        accessToken,
        generateTripData({ budget: 2000 }),
      );

      const response = await request(helper.app.getHttpServer())
        .get('/trips?sortBy=budget&order=asc')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(3);
      expect(response.body.data[0].budget).toBe('1000.00');
      expect(response.body.data[1].budget).toBe('2000.00');
      expect(response.body.data[2].budget).toBe('3000.00');
      expect(response.body).toHaveProperty('meta');
      expectPaginationMeta(response.body.meta, {
        total: 3,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should return trips within specified range', async () => {
      const { accessToken } = await createUser(helper.app);
      await createTrip(
        helper.app,
        accessToken,
        generateTripData({ startDate: '2026-06-01', endDate: '2026-06-07' }),
      );
      await createTrip(
        helper.app,
        accessToken,
        generateTripData({ startDate: '2026-06-03', endDate: '2026-06-10' }),
      );
      await createTrip(
        helper.app,
        accessToken,
        generateTripData({ startDate: '2026-07-01', endDate: '2026-07-14' }),
      );

      const response = await request(helper.app.getHttpServer())
        .get('/trips?from=2026-06-01&to=2026-06-14')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].startDate).toBe('2026-06-03');
      expect(response.body.data[0].endDate).toBe('2026-06-10');
      expect(response.body.data[1].startDate).toBe('2026-06-01');
      expect(response.body.data[1].endDate).toBe('2026-06-07');
      expect(response.body).toHaveProperty('meta');
      expectPaginationMeta(response.body.meta, {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should return 400 when parameter from is greater than parameter to', async () => {
      const { accessToken } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .get('/trips?from=2026-06-07&to=2026-06-01')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Parameter "to" must be greater than or equal to parameter "from"',
      );
    });

    testUnauthorizedCases(helper, 'get', '/trips');
  });

  describe('GET /trips/:id', () => {
    it('should return trip and 200', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );

      const response = await request(helper.app.getHttpServer())
        .get(`/trips/${trip.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(200);
      expectTrip(response.body, { id: trip.id, title: trip.title });
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
        .get(`/trips/${trip.id}`)
        .set('Authorization', `Bearer ${currentUserAccessToken}`)
        .send();

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('You do not have access to this trip');
    });

    it('should return 404 when trip does not exist', async () => {
      const { accessToken } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .get('/trips/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(404);
    });

    testUnauthorizedCases(helper, 'get', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );

      return `/trips/${trip.id}`;
    });
  });

  describe('PATCH /trips/:id', () => {
    it('should update trip and return 200', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );

      const response = await request(helper.app.getHttpServer())
        .patch(`/trips/${trip.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          city: 'Venice',
        });

      expect(response.status).toBe(200);
      expectTrip(response.body, { city: 'Venice' });
    });

    it('should return 400 when start date for update is greater than end date', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData({ endDate: '2026-08-01' }),
      );

      const response = await request(helper.app.getHttpServer())
        .patch(`/trips/${trip.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          startDate: '2026-08-07',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'End date must be greater than or equal to start date',
      );
    });

    it('should return 400 when body is empty', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );

      const response = await request(helper.app.getHttpServer())
        .patch(`/trips/${trip.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Body must contain at least one field to update',
      );
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
        .patch(`/trips/${trip.id}`)
        .set('Authorization', `Bearer ${currentUserAccessToken}`)
        .send({
          city: 'Venice',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('You do not have access to this trip');
    });

    it('should return 404 when trip does not exist', async () => {
      const { accessToken } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .patch('/trips/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          city: 'Venice',
        });

      expect(response.status).toBe(404);
    });

    testUnauthorizedCases(helper, 'patch', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );

      return `/trips/${trip.id}`;
    });
  });

  describe('DELETE /trips/:id', () => {
    it('should delete trip and return 204', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );

      const response = await request(helper.app.getHttpServer())
        .delete(`/trips/${trip.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(204);
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
        .delete(`/trips/${trip.id}`)
        .set('Authorization', `Bearer ${currentUserAccessToken}`)
        .send();

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('You do not have access to this trip');
    });

    it('should return 404 when trip does not exist', async () => {
      const { accessToken } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .delete('/trips/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(404);
    });

    testUnauthorizedCases(helper, 'delete', async () => {
      const { accessToken } = await createUser(helper.app);
      const trip = await createTrip(
        helper.app,
        accessToken,
        generateTripData(),
      );

      return `/trips/${trip.id}`;
    });
  });
});

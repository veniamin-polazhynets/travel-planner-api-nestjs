import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  createAdmin,
  createUser,
  expectPaginationMeta,
  expectUser,
  testUnauthorizedCases,
} from './helpers';
import { TestHelper } from './test-helper';

describe('Users', () => {
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

  describe('GET /users', () => {
    it('should return users array and 200', async () => {
      const { accessToken: adminAccessToken, user: admin } = await createAdmin(
        helper.app,
      );

      const response = await request(helper.app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0]).toMatchObject({
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toMatchObject({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should apply pagination and return 200', async () => {
      const { accessToken: adminAccessToken } = await createAdmin(helper.app);
      await createUser(helper.app);
      await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .get('/users?limit=2&page=1')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(2);
      expect(response.body).toHaveProperty('meta');
      expectPaginationMeta(response.body.meta, {
        total: 3,
        page: 1,
        limit: 2,
        totalPages: 2,
      });
    });

    it('should return 403 when user is not admin', async () => {
      const { accessToken } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(403);
    });

    testUnauthorizedCases(helper, 'get', '/users');
  });

  describe('GET /users/:id', () => {
    it('should return user and 200', async () => {
      const { accessToken: adminAccessToken } = await createAdmin(helper.app);
      const { user: targetUser } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .get(`/users/${targetUser.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send();

      expect(response.status).toBe(200);
      expectUser(response.body, {
        id: targetUser.id,
        username: targetUser.username,
        email: targetUser.email,
      });
    });

    it('should return 403 when user is not admin', async () => {
      const { accessToken } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .get('/users/1')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(403);
    });

    it('should return 404 when user does not exist', async () => {
      const { accessToken: adminAccessToken } = await createAdmin(helper.app);

      const response = await request(helper.app.getHttpServer())
        .get('/users/999')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send();

      expect(response.status).toBe(404);
    });

    testUnauthorizedCases(helper, 'get', async () => {
      const { user } = await createUser(helper.app);

      return `/users/${user.id}`;
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update user and return 200', async () => {
      const { accessToken: adminAccessToken } = await createAdmin(helper.app);
      const { user: targetUser } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .patch(`/users/${targetUser.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          username: 'User',
          email: 'user@example.com',
          role: 'ADMIN',
        });

      expect(response.status).toBe(200);
      expectUser(response.body, {
        username: 'User',
        email: 'user@example.com',
        role: 'ADMIN',
      });
    });

    it('should update only username and return 200', async () => {
      const { accessToken: adminAccessToken } = await createAdmin(helper.app);
      const { user: targetUser } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .patch(`/users/${targetUser.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          username: 'User',
        });

      expect(response.status).toBe(200);
      expectUser(response.body, {
        username: 'User',
      });
    });

    it('should update only email and return 200', async () => {
      const { accessToken: adminAccessToken } = await createAdmin(helper.app);
      const { user: targetUser } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .patch(`/users/${targetUser.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          email: 'user@example.com',
        });

      expect(response.status).toBe(200);
      expectUser(response.body, {
        email: 'user@example.com',
      });
    });

    it('should update only role and return 200', async () => {
      const { accessToken: adminAccessToken } = await createAdmin(helper.app);
      const { user: targetUser } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .patch(`/users/${targetUser.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          role: 'ADMIN',
        });

      expect(response.status).toBe(200);
      expectUser(response.body, {
        role: 'ADMIN',
      });
    });

    it('should return 400 when admin is trying to change their own role', async () => {
      const { accessToken: adminAccessToken, user: admin } = await createAdmin(
        helper.app,
      );

      const response = await request(helper.app.getHttpServer())
        .patch(`/users/${admin.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          role: 'USER',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'You cannot change your own role via admin panel',
      );
    });

    it('should return 400 when body is empty', async () => {
      const { accessToken: adminAccessToken } = await createAdmin(helper.app);
      const { user: targetUser } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .patch(`/users/${targetUser.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Body must contain at least one field to update',
      );
    });

    it('should return 403 when user is not admin', async () => {
      const { accessToken } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .patch('/users/1')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(403);
    });

    it('should return 404 when user does not exist', async () => {
      const { accessToken: adminAccessToken } = await createAdmin(helper.app);

      const response = await request(helper.app.getHttpServer())
        .patch('/users/999')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ username: 'User' });

      expect(response.status).toBe(404);
    });

    it('should return 409 when username for update already exists', async () => {
      const { accessToken: adminAccessToken } = await createAdmin(helper.app);
      const { credentials: ownerCredentials } = await createUser(helper.app);
      const { user: targetUser } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .patch(`/users/${targetUser.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          username: ownerCredentials.username,
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        'Record with this username already exists',
      );
    });

    it('should return 409 when email for update already exists', async () => {
      const { accessToken: adminAccessToken } = await createAdmin(helper.app);
      const { credentials: ownerCredentials } = await createUser(helper.app);
      const { user: targetUser } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .patch(`/users/${targetUser.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          email: ownerCredentials.email,
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        'Record with this email already exists',
      );
    });

    testUnauthorizedCases(helper, 'patch', async () => {
      const { user } = await createUser(helper.app);

      return `/users/${user.id}`;
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete user and return 204', async () => {
      const { accessToken: adminAccessToken } = await createAdmin(helper.app);
      const { user: targetUser } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .delete(`/users/${targetUser.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send();

      expect(response.status).toBe(204);
    });

    it('should return 400 when admin is trying to delete their own account', async () => {
      const { accessToken: adminAccessToken, user: admin } = await createAdmin(
        helper.app,
      );

      const response = await request(helper.app.getHttpServer())
        .delete(`/users/${admin.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send();

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'You cannot delete your own account via admin panel',
      );
    });

    it('should return 403 when user is not admin', async () => {
      const { accessToken } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .delete('/users/1')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(403);
    });

    it('should return 404 when user does not exist', async () => {
      const { accessToken: adminAccessToken } = await createAdmin(helper.app);

      const response = await request(helper.app.getHttpServer())
        .delete('/users/999')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send();

      expect(response.status).toBe(404);
    });

    testUnauthorizedCases(helper, 'delete', async () => {
      const { user } = await createUser(helper.app);

      return `/users/${user.id}`;
    });
  });
});

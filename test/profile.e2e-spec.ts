import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createUser, expectUser, testUnauthorizedCases } from './helpers';
import { TestHelper } from './test-helper';

describe('Profile', () => {
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

  describe('GET /profile', () => {
    it('should return current user profile and 200', async () => {
      const { accessToken } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .get('/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(200);
      expectUser(response.body);
    });

    testUnauthorizedCases(helper, 'get', '/profile');
  });

  describe('PATCH /profile', () => {
    it('should update current user profile and return 200', async () => {
      const { accessToken } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          username: 'User',
          email: 'user@example.com',
        });

      expect(response.status).toBe(200);
      expectUser(response.body, {
        username: 'User',
        email: 'user@example.com',
      });
    });

    it('should update only username and return 200', async () => {
      const { accessToken } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          username: 'User',
        });

      expect(response.status).toBe(200);
      expectUser(response.body, {
        username: 'User',
      });
    });

    it('should update only email and return 200', async () => {
      const { accessToken } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          email: 'user@example.com',
        });

      expect(response.status).toBe(200);
      expectUser(response.body, {
        email: 'user@example.com',
      });
    });

    it('should return 400 when body is empty', async () => {
      const { accessToken } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Body must contain at least one field to update',
      );
    });

    it('should return 400 when username is invalid', async () => {
      const { accessToken } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ username: 'U' });

      expect(response.status).toBe(400);
    });

    it('should return 400 when email is invalid', async () => {
      const { accessToken } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: 'bademail' });

      expect(response.status).toBe(400);
    });

    it('should return 409 when username for update already exists', async () => {
      const { credentials: ownerCredentials } = await createUser(helper.app);
      const { accessToken: currentUserAccessToken } = await createUser(
        helper.app,
      );

      const response = await request(helper.app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${currentUserAccessToken}`)
        .send({
          username: ownerCredentials.username,
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        'Record with this username already exists',
      );
    });

    it('should return 409 when email for update already exists', async () => {
      const { credentials: ownerCredentials } = await createUser(helper.app);
      const { accessToken: currentUserAccessToken } = await createUser(
        helper.app,
      );

      const response = await request(helper.app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${currentUserAccessToken}`)
        .send({
          email: ownerCredentials.email,
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        'Record with this email already exists',
      );
    });

    testUnauthorizedCases(helper, 'patch', '/profile');
  });

  describe('DELETE /profile', () => {
    it('should delete current user account and return 204', async () => {
      const { accessToken, credentials } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .delete('/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ password: credentials.password });

      expect(response.status).toBe(204);
    });

    it('should return 401 when password is invalid', async () => {
      const { accessToken } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .delete('/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ password: 'wrongPassword123' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid password');
    });

    testUnauthorizedCases(helper, 'delete', '/profile');
  });
});

import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  createUser,
  generateCredentials,
  registerUser,
  testUnauthorizedCases,
} from './helpers';
import { TestHelper } from './test-helper';

describe('Auth', () => {
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

  describe('POST /auth/register', () => {
    it('should register a new user and return 201', async () => {
      const response = await request(helper.app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'User',
          email: 'user@example.com',
          password: 'Password123',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        user: {
          id: expect.any(Number),
          username: 'User',
          email: 'user@example.com',
          role: 'USER',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        accessToken: expect.any(String),
      });
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('refreshToken=');
      expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
      expect(response.headers['set-cookie'][0]).toContain('SameSite');
    });

    it('should return 400 when username is invalid', async () => {
      const credentials = generateCredentials();
      const response = await registerUser(helper.app, {
        username: 'U',
        email: credentials.email,
        password: credentials.password,
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 when email is invalid', async () => {
      const credentials = generateCredentials();
      const response = await registerUser(helper.app, {
        username: credentials.username,
        email: 'userexample.com',
        password: credentials.password,
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 when password is invalid', async () => {
      const credentials = generateCredentials();
      const response = await registerUser(helper.app, {
        username: credentials.username,
        email: credentials.email,
        password: '1234',
      });

      expect(response.status).toBe(400);
    });

    it('should return 409 when username already exists', async () => {
      const firstUserCredentials = generateCredentials();
      await registerUser(helper.app, firstUserCredentials);
      const secondUserCredentials = generateCredentials();

      const response = await registerUser(helper.app, {
        username: firstUserCredentials.username,
        email: secondUserCredentials.email,
        password: secondUserCredentials.password,
      });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(
        'User with this username already exists',
      );
    });

    it('should return 409 when email already exists', async () => {
      const firstUserCredentials = generateCredentials();
      await registerUser(helper.app, firstUserCredentials);
      const secondUserCredentials = generateCredentials();

      const response = await registerUser(helper.app, {
        username: secondUserCredentials.username,
        email: firstUserCredentials.email,
        password: secondUserCredentials.password,
      });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('User with this email already exists');
    });
  });

  describe('POST /auth/login', () => {
    it('should return user profile, access token, and 200', async () => {
      const credentials = generateCredentials();
      await registerUser(helper.app, credentials);

      const response = await request(helper.app.getHttpServer())
        .post('/auth/login')
        .send({
          email: credentials.email,
          password: credentials.password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        user: {
          id: expect.any(Number),
          username: credentials.username,
          email: credentials.email,
          role: 'USER',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        accessToken: expect.any(String),
      });
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('refreshToken=');
      expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
      expect(response.headers['set-cookie'][0]).toContain('SameSite');
    });

    it('should return 400 when email is invalid', async () => {
      const credentials = generateCredentials();

      const response = await request(helper.app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'userexample.com',
          password: credentials.password,
        });

      expect(response.status).toBe(400);
    });

    it('should return 401 when email does not exist', async () => {
      const credentials = generateCredentials();
      await registerUser(helper.app, credentials);

      const response = await request(helper.app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user@example.com',
          password: credentials.password,
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return 401 when password is invalid', async () => {
      const credentials = generateCredentials();
      await registerUser(helper.app, credentials);

      const response = await request(helper.app.getHttpServer())
        .post('/auth/login')
        .send({
          email: credentials.email,
          password: 'Password123',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Invalid email or password');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh access token and return 200', async () => {
      const { cookies } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookies)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should return 401 when refresh token is not provided', async () => {
      const response = await request(helper.app.getHttpServer())
        .post('/auth/refresh')
        .send();

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Refresh token not provided');
    });

    it('should return 401 when refresh token is invalid', async () => {
      const response = await request(helper.app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', ['refreshToken=invalid_token_123'])
        .send();

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid or expired refresh token');
    });
  });

  describe('POST /auth/logout', () => {
    it('should log out user, clear refresh token cookie, and return 204', async () => {
      const { accessToken, cookies } = await createUser(helper.app);

      const response = await request(helper.app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', cookies)
        .set('Authorization', `Bearer ${accessToken}`)
        .send();
      const clearedCookies = response.headers['set-cookie'];

      expect(response.status).toBe(204);
      expect(clearedCookies).toBeDefined();
      expect(clearedCookies[0]).toContain('refreshToken=;');
      expect(clearedCookies[0]).toContain(
        'Expires=Thu, 01 Jan 1970 00:00:00 GMT;',
      );
    });

    it('should return 401 when you try to access secure endpoint after logout', async () => {
      const { accessToken, cookies } = await createUser(helper.app);

      await request(helper.app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', cookies)
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      const response = await request(helper.app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookies)
        .send();

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Token has been invalidated');
    });

    testUnauthorizedCases(helper, 'post', '/auth/logout');
  });
});

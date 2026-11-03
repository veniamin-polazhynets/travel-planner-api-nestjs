import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { TestHelper } from './test-helper';
import request from 'supertest'

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
    it('should register new user and return 201', async () => {
      const response = await request(helper.app.getHttpServer()).post('/auth/register').send({
        username: 'user',
        email: 'user@gmail.com',
        password: 'Password123'
      })

      expect(response.status).toBe(201)
    })
  })
});

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { TestHelper } from './test-helper';
import request from 'supertest';

describe('Health', () => {
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

  describe('GET /health', () => {
    it('should return healthy database and redis statuses and 200', async () => {
      const response = await request(helper.app.getHttpServer()).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'ok',
        database: 'up',
        redis: 'up',
      });
    });

    it('should return 503 when database is down', async () => {
      vi.spyOn(helper.prisma, '$queryRaw').mockRejectedValueOnce(
        new Error('DB down'),
      );

      const response = await request(helper.app.getHttpServer()).get('/health');

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        status: 'error',
        database: 'down',
        redis: 'up',
      });
    });

    it('should return 503 when redis is down', async () => {
      vi.spyOn(helper.redis, 'ping').mockResolvedValueOnce(false);

      const response = await request(helper.app.getHttpServer()).get('/health');

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        status: 'error',
        database: 'up',
        redis: 'down',
      });
    });

    it('should return 503 when both services are down', async () => {
      vi.spyOn(helper.prisma, '$queryRaw').mockRejectedValueOnce(
        new Error('db down'),
      );
      vi.spyOn(helper.redis, 'ping').mockResolvedValueOnce(false);

      const response = await request(helper.app.getHttpServer()).get('/health');

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        status: 'error',
        database: 'down',
        redis: 'down',
      });
    });
  });
});

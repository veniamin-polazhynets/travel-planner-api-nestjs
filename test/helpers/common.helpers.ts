import request from 'supertest';
import { expect, it } from 'vitest';
import { PaginationMetaDto } from '../../src/common/dto';
import { TestHelper } from '../test-helper';
import { createUser } from './auth.helpers';

export const generateUniqueSuffix = () => {
  const timestamp = Date.now().toString();
  const randomSalt = Math.random().toString(36).substring(2, 7);
  const uniqueSuffix = `${timestamp}_${randomSalt}`;

  return uniqueSuffix;
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

export const testUnauthorizedCases = (
  helper: TestHelper,
  method: 'post' | 'get' | 'patch' | 'delete',
  url: string | (() => Promise<string>),
) => {
  const getUrl = async () => (typeof url === 'string' ? url : await url());

  it('should return 401 when token is missing, invalid or expired', async () => {
    const resolvedUrl = await getUrl();

    const response = await request(helper.app.getHttpServer())
      [method](resolvedUrl)
      .set('Authorization', 'Bearer ');

    expect(response.status).toBe(401);
  });

  it('should return 401 when authorization header is not provided', async () => {
    const resolvedUrl = await getUrl();

    const response = await request(helper.app.getHttpServer())[method](
      resolvedUrl,
    );

    expect(response.status).toBe(401);
  });

  it('should return 401 when authorization type is invalid', async () => {
    const resolvedUrl = await getUrl();
    const { accessToken } = await createUser(helper.app);

    const response = await request(helper.app.getHttpServer())
      [method](resolvedUrl)
      .set('Authorization', `Basic ${accessToken}`);

    expect(response.status).toBe(401);
  });

  it('should return 401 when user no longer exists', async () => {
    const resolvedUrl = await getUrl();
    const { accessToken, user } = await createUser(helper.app);

    await helper.prisma.user.delete({ where: { id: user.id } });

    const response = await request(helper.app.getHttpServer())
      [method](resolvedUrl)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('User no longer exists');
  });
};

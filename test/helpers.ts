import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { expect, it } from 'vitest';
import { RegistrationDto } from '../src/auth/dto';
import { UserResponseDto } from '../src/users/dto';
import { TestHelper } from './test-helper';

export type CreatedUserData = {
  credentials: RegistrationDto;
  user: UserResponseDto;
  accessToken: string;
  cookies: string[];
  registerResponse: request.Response;
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
) => {
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

  return {
    credentials,
    user: registerResponse.body.user,
    accessToken: registerResponse.body.accessToken,
    cookies,
    registerResponse,
  };
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

  it('should return 401 when you try to access secure endpoint after logout', async () => {
    const url = await getUrl();
    const { accessToken } = await createUser(helper.app);

    await request(helper.app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    const response = await request(helper.app.getHttpServer())
      [method](url)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Token has been invalidated');
  });

  it('should return 401 when user no longer exists', async () => {
    const url = await getUrl();
    const { accessToken, credentials } = await createUser(helper.app);

    await request(helper.app.getHttpServer())
      .delete('/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        password: credentials.password,
      });

    const response = await request(helper.app.getHttpServer())
      [method](url)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('User no longer exists');
  });
};

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { expect } from 'vitest';
import { RegistrationDto } from '../../src/auth/dto';
import { RedisService } from '../../src/common/redis/redis.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UserResponseDto } from '../../src/users/dto';
import { generateUniqueSuffix } from './common.helpers';

export type CreatedUserData = {
  credentials: RegistrationDto;
  user: UserResponseDto;
  accessToken: string;
  cookies: string[];
  registerResponse: request.Response;
};

export const generateCredentials = () => {
  const uniqueSuffix = generateUniqueSuffix();

  return {
    username: `User${uniqueSuffix}`.slice(0, 30),
    email: `user${uniqueSuffix}@example.com`,
    password: `Password${uniqueSuffix}`,
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

  if (registerResponse.status !== 201) {
    throw new Error(
      `createUser failed (${registerResponse.status}): ${JSON.stringify(registerResponse.body)}`,
    );
  }

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
  expect(actualUser).toMatchObject({
    id: expect.any(Number),
    username: expect.any(String),
    email: expect.any(String),
    role: expect.any(String),
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
    ...expected,
  });
  expect(actualUser).not.toHaveProperty('passwordHash');
};

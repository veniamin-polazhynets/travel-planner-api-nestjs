import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { RegistrationDto } from '../src/auth/dto';
import { UserResponseDto } from '../src/users/dto';

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

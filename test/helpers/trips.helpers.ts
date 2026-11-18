import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { expect } from 'vitest';
import { TripResponseDto } from '../../src/trips/dto';
import { generateUniqueSuffix } from './common.helpers';

export type CreateTripPayload = {
  title: string;
  country: string;
  city: string;
  startDate: string;
  endDate: string;
  budget: number;
};

export const generateTripData = (overrides?: Partial<CreateTripPayload>) => {
  const uniqueSuffix = generateUniqueSuffix();

  const tripData: CreateTripPayload = {
    title: `Trip to Italy ${uniqueSuffix}`,
    country: 'Italy',
    city: 'Rome',
    startDate: '2026-08-01',
    endDate: '2026-08-07',
    budget: 3000,
  };

  return { ...tripData, ...overrides };
};

export const createTrip = async (
  app: INestApplication,
  accessToken: string,
  tripData: CreateTripPayload,
): Promise<TripResponseDto> => {
  const response = await request(app.getHttpServer())
    .post('/trips')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(tripData);

  if (response.status !== 201) {
    throw new Error(
      `createTrip failed (${response.status}): ${JSON.stringify(response.body)}`,
    );
  }

  return response.body;
};

export const createManyTrips = async (
  app: INestApplication,
  accessToken: string,
  count: number,
): Promise<void> => {
  for (let i = 0; i < count; i++) {
    await createTrip(app, accessToken, generateTripData());
  }
};

export const expectTrip = (
  actualTrip: TripResponseDto,
  expected?: Partial<TripResponseDto>,
) => {
  return expect(actualTrip).toMatchObject({
    id: expect.any(Number),
    title: expect.any(String),
    country: expect.any(String),
    city: expect.any(String),
    startDate: expect.any(String),
    endDate: expect.any(String),
    budget: expect.any(String),
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
    ...expected,
  });
};

import { BadRequestException } from '@nestjs/common';

export function assertNonEmptyBody<T extends object>(dto: T) {
  const hasUpdates = Object.values(dto).some((value) => value !== undefined);

  if (!hasUpdates) {
    throw new BadRequestException(
      'Body must contain at least one field to update',
    );
  }
}

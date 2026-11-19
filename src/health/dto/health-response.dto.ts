import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({
    enum: ['ok', 'error'],
    example: 'ok',
  })
  status: 'ok' | 'error';

  @ApiProperty({
    enum: ['up', 'down'],
    example: 'up',
  })
  database: 'up' | 'down';

  @ApiProperty({
    enum: ['up', 'down'],
    example: 'up',
  })
  redis: 'up' | 'down';
}

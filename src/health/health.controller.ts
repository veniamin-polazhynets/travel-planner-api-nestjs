import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { RedisService } from '../common/redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { HealthResponseDto } from './dto';

@SkipThrottle()
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check status of database and redis' })
  @ApiOkResponse({
    description: 'All services are running',
    type: HealthResponseDto,
  })
  @ApiServiceUnavailableResponse({
    description: 'One or both services are down',
  })
  async check(): Promise<HealthResponseDto> {
    const [isDbHealthy, isRedisHealthy] = await Promise.all([
      this.prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
      this.redis.ping(),
    ]);

    const result: HealthResponseDto = {
      status: isDbHealthy && isRedisHealthy ? 'ok' : 'error',
      database: isDbHealthy ? 'up' : 'down',
      redis: isRedisHealthy ? 'up' : 'down',
    };

    if (!isDbHealthy || !isRedisHealthy) {
      throw new ServiceUnavailableException(result);
    }

    return result;
  }
}

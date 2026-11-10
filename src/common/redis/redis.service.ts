import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger('RedisService');

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: configService.get<number>('REDIS_PORT', 6379),
      db: configService.get<number>('REDIS_DB', 0),
    });
  }

  async onModuleInit() {
    try {
      await this.client.ping();
      this.logger.log('Redis connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
    }
  }

  async set<T = string | number | object>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<'OK' | null> {
    const stringValue =
      typeof value === 'object' ? JSON.stringify(value) : String(value);

    if (ttlSeconds) {
      return await this.client.set(key, stringValue, 'EX', ttlSeconds);
    }

    return await this.client.set(key, stringValue);
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async del(keys: string | string[]): Promise<number> {
    if (Array.isArray(keys)) {
      return await this.client.del(...keys);
    }
    return await this.client.del(keys);
  }

  async flushdb(): Promise<'OK'> {
    return await this.client.flushdb();
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}

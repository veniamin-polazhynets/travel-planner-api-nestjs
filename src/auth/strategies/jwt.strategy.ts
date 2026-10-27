import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { User } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RedisService } from '../../common/redis/redis.service';
import { UsersRepository } from '../../users/users.repository';
import { JwtPayload } from '../types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly usersRepository: UsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_TOKEN_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const cacheKey = `user:${payload.sub}:session`;
    const cachedUser = await this.redisService.get(cacheKey);

    if (cachedUser) {
      const user: User = JSON.parse(cachedUser);

      if (user.tokenVersion !== payload.tokenVersion) {
        throw new UnauthorizedException('Token has been invalidated');
      }

      return user;
    }

    const user = await this.usersRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Token has been invalidated');
    }

    const { passwordHash: _, ...safeUser } = user;
    await this.redisService.set(cacheKey, safeUser, 900);

    return user;
  }
}

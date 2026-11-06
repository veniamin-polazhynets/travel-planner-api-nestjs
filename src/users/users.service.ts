import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResponseDto, PaginationDto } from '../common/dto';
import { RedisService } from '../common/redis/redis.service';
import { assertNonEmptyBody } from '../common/utils';
import { UpdateUserDto, UserResponseDto } from './dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly redisService: RedisService,
  ) {}

  async getMany(
    query: PaginationDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const take = limit;

    const [users, total] = await this.usersRepository.findMany(skip, take);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: users.map(UserResponseDto.fromEntity),
      meta: { total, page, limit, totalPages },
    };
  }

  async getById(id: number): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return UserResponseDto.fromEntity(user);
  }

  async update(
    currentUserId: number,
    targetUserId: number,
    dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    assertNonEmptyBody(dto);

    if (currentUserId === targetUserId) {
      if (dto.role) {
        throw new BadRequestException(
          'You cannot change your own role via admin panel',
        );
      }
    }

    const updatedUser = await this.usersRepository.update(targetUserId, dto);
    await this.redisService.del(`user:${updatedUser.id}:session`);

    return UserResponseDto.fromEntity(updatedUser);
  }

  async delete(currentUserId: number, targetUserId: number): Promise<void> {
    if (currentUserId === targetUserId) {
      throw new BadRequestException(
        'You cannot delete your own account via admin panel',
      );
    }
    await this.usersRepository.delete(targetUserId);
    await this.redisService.del(`user:${targetUserId}:session`);
  }
}

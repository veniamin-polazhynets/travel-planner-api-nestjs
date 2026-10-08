import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginatedResponseDto, PaginationDto } from '../common/dto';
import { UpdateUserDto, UserResponseDto } from './dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getMany(
    dto: PaginationDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const { page, limit } = dto;
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

  async update(id: number, dto: UpdateUserDto): Promise<UserResponseDto> {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        'Body must contain at least one field to update',
      );
    }
    if (dto.username) {
      const existing = await this.usersRepository.findByUsername(dto.username);
      if (existing && existing.id !== id) {
        throw new ConflictException('This username already exists');
      }
    }
    if (dto.email) {
      const existing = await this.usersRepository.findByEmail(dto.email);
      if (existing && existing.id !== id) {
        throw new ConflictException('This email already exists');
      }
    }

    const updatedUser = await this.usersRepository.update(id, dto);

    return UserResponseDto.fromEntity(updatedUser);
  }

  async delete(id: number): Promise<void> {
    try {
      await this.usersRepository.delete(id);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }

      throw error;
    }
  }
}

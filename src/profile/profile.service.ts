import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { HashService } from '../common/hash/hash.service';
import { UserResponseDto } from '../users/dto';
import { UsersRepository } from '../users/users.repository';
import { DeleteAccountDto, UpdateProfileDto } from './dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly hashService: HashService,
  ) {}

  async update(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        'Body must contain at least one field to update',
      );
    }

    const updatedUser = await this.usersRepository.update(userId, dto);

    return UserResponseDto.fromEntity(updatedUser);
  }

  async delete(userId: number, dto: DeleteAccountDto): Promise<void> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await this.hashService.verify(
      user.passwordHash,
      dto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    await this.usersRepository.delete(userId);
  }
}

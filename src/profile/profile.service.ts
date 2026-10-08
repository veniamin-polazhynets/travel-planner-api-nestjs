import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { HashService } from '../common/hash/hash.service';
import { UserResponseDto } from '../users/dto';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { DeleteAccountDto, UpdateProfileDto } from './dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersService: UsersService,
    private readonly hashService: HashService,
  ) {}

  async update(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return await this.usersService.update(userId, dto);
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

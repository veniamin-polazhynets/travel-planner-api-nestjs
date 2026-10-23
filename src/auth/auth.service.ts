import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { HashService } from '../common/hash/hash.service';
import { UserResponseDto } from '../users/dto';
import { UsersRepository } from '../users/users.repository';
import { LoginDto, RefreshResponseDto, RegistrationDto } from './dto';
import { AuthResult, JwtPayload } from './types';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegistrationDto): Promise<AuthResult> {
    const existingUsername = await this.usersRepository.findByUsername(
      dto.username,
    );
    if (existingUsername) {
      throw new ConflictException('User with this username already exists');
    }

    const existingEmail = await this.usersRepository.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await this.hashService.hash(dto.password);
    const user = await this.usersRepository.create({
      username: dto.username,
      email: dto.email,
      passwordHash: hashedPassword,
    });
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.tokenVersion,
    );

    return {
      user: UserResponseDto.fromEntity(user),
      accessToken,
      refreshToken,
    };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.hashService.verify(
      user.passwordHash,
      dto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.tokenVersion,
    );

    return {
      user: UserResponseDto.fromEntity(user),
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string): Promise<RefreshResponseDto> {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Token has been invalidated');
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, tokenVersion: user.tokenVersion },
      {
        secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: '15m',
      },
    );
    return { accessToken };
  }

  async logout(userId: number): Promise<void> {
    await this.usersRepository.incrementTokenVersion(userId);
  }

  private async generateTokens(userId: number, tokenVersion: number) {
    const payload = { sub: userId, tokenVersion };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: '15m',
      }),

      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }
}

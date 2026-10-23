import { ApiProperty } from '@nestjs/swagger';
import { User, UserRole } from '@prisma/client';
import { PaginationMetaDto } from '../../common/dto';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'User' })
  username: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'USER' })
  role: UserRole;

  @ApiProperty({ example: '2026-06-01T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-01T12:00:00.000Z' })
  updatedAt: Date;

  static fromEntity(user: User): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

export class UsersPaginatedResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

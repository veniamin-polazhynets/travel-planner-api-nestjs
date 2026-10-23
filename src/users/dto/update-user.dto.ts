import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Cool User' })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ example: 'cooluser@example.com' })
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'ADMIN' })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

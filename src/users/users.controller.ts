import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole, type User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, Roles } from '../common/decorators';
import { PaginatedResponseDto, PaginationDto } from '../common/dto';
import { RolesGuard } from '../common/guards';
import {
  UpdateUserDto,
  UserResponseDto,
  UsersPaginatedResponseDto,
} from './dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@ApiBadRequestResponse({ description: 'Validation failed' })
@ApiUnauthorizedResponse({
  description: 'Missing, invalid or expired access token',
})
@ApiForbiddenResponse({ description: 'Access denied: your role must be ADMIN' })
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get list of users' })
  @ApiOkResponse({
    description: 'Successfully returned list of users',
    type: UsersPaginatedResponseDto,
  })
  async getMany(
    @Query() query: PaginationDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    return await this.usersService.getMany(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user by id' })
  @ApiOkResponse({
    description: 'Successfully returned user',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    return await this.usersService.getById(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user' })
  @ApiOkResponse({
    description: 'Successfully updated user',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async update(
    @CurrentUser() currentUser: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return await this.usersService.update(currentUser.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  @ApiNoContentResponse({
    description: 'Successfully deleted user',
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async delete(
    @CurrentUser() currentUser: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.usersService.delete(currentUser.id, id);
  }
}

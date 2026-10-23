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
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { PaginatedResponseDto } from '../common/dto';
import { CreateTripDto, QueryTripsDto, UpdateTripDto } from './dto';
import {
  TripResponseDto,
  TripsPaginatedResponseDto,
} from './dto/trip-response.dto';
import { TripsService } from './trips.service';

@UseGuards(JwtAuthGuard)
@ApiTags('Trips')
@ApiBearerAuth('JWT-auth')
@ApiBadRequestResponse({ description: 'Validation failed' })
@ApiUnauthorizedResponse({
  description: 'Missing, invalid or expired access token',
})
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create trip' })
  @ApiCreatedResponse({
    description: 'Successfully created trip',
    type: TripResponseDto,
  })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateTripDto,
  ): Promise<TripResponseDto> {
    return await this.tripsService.create(user.id, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get list of trips' })
  @ApiOkResponse({
    description: 'Successfully returned list of trips',
    type: TripsPaginatedResponseDto,
  })
  async getMany(
    @CurrentUser() user: User,
    @Query() query: QueryTripsDto,
  ): Promise<PaginatedResponseDto<TripResponseDto>> {
    return await this.tripsService.getMany(user.id, query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get trip by id' })
  @ApiOkResponse({
    description: 'Successfully returned trip',
    type: TripResponseDto,
  })
  @ApiForbiddenResponse({ description: 'You do not have access to this trip' })
  @ApiNotFoundResponse({ description: 'Trip not found' })
  async getById(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TripResponseDto> {
    return await this.tripsService.getById(user.id, id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update trip' })
  @ApiOkResponse({
    description: 'Successfully updated trip',
    type: TripResponseDto,
  })
  @ApiForbiddenResponse({ description: 'You do not have access to this trip' })
  @ApiNotFoundResponse({ description: 'Trip not found' })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTripDto,
  ): Promise<TripResponseDto> {
    return await this.tripsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete trip' })
  @ApiNoContentResponse({
    description: 'Successfully deleted trip',
  })
  @ApiForbiddenResponse({ description: 'You do not have access to this trip' })
  @ApiNotFoundResponse({ description: 'Trip not found' })
  async delete(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return await this.tripsService.delete(user.id, id);
  }
}

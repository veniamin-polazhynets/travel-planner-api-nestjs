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
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { PaginatedResponseDto } from '../common/dto';
import { CreateTripDto, QueryTripsDto, UpdateTripDto } from './dto';
import { TripResponseDto } from './dto/trip-response.dto';
import { TripsService } from './trips.service';

@UseGuards(JwtAuthGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateTripDto,
  ): Promise<TripResponseDto> {
    return await this.tripsService.create(user.id, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getMany(
    @CurrentUser() user: User,
    @Query() query: QueryTripsDto,
  ): Promise<PaginatedResponseDto<TripResponseDto>> {
    return await this.tripsService.getMany(user.id, query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getById(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TripResponseDto> {
    return await this.tripsService.getById(user.id, id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTripDto,
  ): Promise<TripResponseDto> {
    return await this.tripsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return await this.tripsService.delete(user.id, id);
  }
}

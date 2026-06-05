// apps/api/src/tourist/tourist.controller.ts
import { Controller, Get, Put, Post, Body, UseGuards, Request } from '@nestjs/common';
import { TouristService } from './tourist.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { CreateTripDtoImpl } from './dto/create-trip.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class TouristController {
  constructor(private readonly touristService: TouristService) {}

  @Get('tourist/profile')
  async getProfile(@Request() req) {
    return this.touristService.getProfile(req.user.id);
  }

  @Put('tourist/profile')
  async upsertProfile(@Request() req, @Body() dto: CreateProfileDto) {
    return this.touristService.upsertProfile(req.user.id, dto);
  }

  @Get('trips/active')
  async getActiveTrip(@Request() req) {
    return this.touristService.getActiveTrip(req.user.id);
  }

  @Post('trips')
  async createTrip(@Request() req, @Body() dto: CreateTripDtoImpl) {
    return this.touristService.createTrip(req.user.id, dto);
  }
}

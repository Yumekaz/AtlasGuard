import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { GeofenceService } from './geofence.service';
import { GeofenceCheckDto } from './dto/geofence-check.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('geofence')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GeofenceController {
  constructor(private readonly geofenceService: GeofenceService) {}

  @Post('check')
  @Roles('TOURIST')
  async check(@Request() req, @Body() dto: GeofenceCheckDto) {
    return this.geofenceService.checkGeofence(
      req.user.id,
      dto.latitude,
      dto.longitude,
      dto.lastAlertedZoneId,
    );
  }
}
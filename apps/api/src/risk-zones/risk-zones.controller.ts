import { Controller, Get, UseGuards } from '@nestjs/common';
import { RiskZonesService } from './risk-zones.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('risk-zones')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TOURIST', 'OPERATOR', 'RESPONDER', 'ADMIN')
export class RiskZonesController {
  constructor(private readonly riskZonesService: RiskZonesService) {}

  @Get()
  async listActive() {
    return this.riskZonesService.listActiveZones();
  }
}
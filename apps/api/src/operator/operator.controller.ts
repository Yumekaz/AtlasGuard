import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('operator')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OPERATOR', 'ADMIN')
export class OperatorController {
  @Get('incidents')
  async getIncidents() {
    return [
      { id: 'mock-incident-1', type: 'SOS', status: 'CREATED', severity: 'HIGH' }
    ];
  }
}

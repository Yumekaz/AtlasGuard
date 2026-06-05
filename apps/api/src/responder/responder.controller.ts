import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('responder')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RESPONDER', 'ADMIN')
export class ResponderController {
  @Get('incidents')
  async getIncidents() {
    return [
      { id: 'mock-incident-2', type: 'LOST', status: 'ASSIGNED', severity: 'MEDIUM' }
    ];
  }
}

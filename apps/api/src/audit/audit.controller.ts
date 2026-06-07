import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditIntegrityService } from './audit-integrity.service';
import { AuditService } from './audit.service';
import { IncidentsService } from '../incidents/incidents.service';
import { EventsGateway } from '../events/events.gateway';

@Controller('ops/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OPERATOR', 'ADMIN')
export class OpsAuditController {
  constructor(
    private auditService: AuditService,
    private integrityService: AuditIntegrityService,
    private eventsGateway: EventsGateway,
  ) {}

  @Get('incidents')
  async listIncidents() {
    return this.auditService.listAuditIncidents();
  }

  @Get('incidents/:id/verify')
  async verifyIncident(@Param('id') id: string) {
    const result = await this.integrityService.verifyIncidentChain(id);
    this.eventsGateway.emitAuditVerified(result);
    return result;
  }
}

@Controller('incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentAuditController {
  constructor(
    private integrityService: AuditIntegrityService,
    private incidentsService: IncidentsService,
  ) {}

  @Get(':id/audit/verify')
  @Roles('TOURIST', 'OPERATOR', 'RESPONDER', 'ADMIN')
  async verifyIncident(@Request() req, @Param('id') id: string) {
    await this.incidentsService.getIncidentStatus(req.user.id, req.user.role, id);
    return this.integrityService.verifyIncidentChain(id);
  }
}
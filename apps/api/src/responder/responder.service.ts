import { Injectable } from '@nestjs/common';
import { IncidentsService } from '../incidents/incidents.service';
import { UserRole } from '@atlasguard/shared';

@Injectable()
export class ResponderService {
  constructor(private incidentsService: IncidentsService) {}

  getAssignments(userId: string) {
    return this.incidentsService.getResponderAssignments(userId);
  }

  markDispatched(incidentId: string, actorId: string, actorRole: UserRole) {
    return this.incidentsService.transitionStatus(incidentId, 'DISPATCHED', actorId, actorRole);
  }

  markReached(incidentId: string, actorId: string, actorRole: UserRole) {
    return this.incidentsService.transitionStatus(incidentId, 'REACHED', actorId, actorRole);
  }

  markResolved(incidentId: string, actorId: string, actorRole: UserRole) {
    return this.incidentsService.transitionStatus(incidentId, 'RESOLVED', actorId, actorRole);
  }
}
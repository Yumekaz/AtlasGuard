import { Injectable } from '@nestjs/common';
import { IncidentsService } from '../incidents/incidents.service';
import { RiskZonesService } from '../risk-zones/risk-zones.service';
import { OpsMapData, UserRole } from '@atlasguard/shared';

@Injectable()
export class OperatorService {
  constructor(
    private incidentsService: IncidentsService,
    private riskZonesService: RiskZonesService,
  ) {}

  listIncidents() {
    return this.incidentsService.listActiveIncidents();
  }

  getIncident(id: string) {
    return this.incidentsService.getIncidentById(id);
  }

  acknowledge(id: string, actorId: string, actorRole: UserRole) {
    return this.incidentsService.acknowledgeIncident(id, actorId, actorRole);
  }

  assign(id: string, responderId: string, actorId: string, actorRole: UserRole) {
    return this.incidentsService.assignResponder(id, responderId, actorId, actorRole);
  }

  listResponders() {
    return this.incidentsService.listResponders();
  }

  async getMapData(): Promise<OpsMapData> {
    const [zones, incidents, responders] = await Promise.all([
      this.riskZonesService.listActiveZones(),
      this.incidentsService.listActiveIncidents(),
      this.incidentsService.listResponders(),
    ]);
    return { zones, incidents, responders };
  }
}
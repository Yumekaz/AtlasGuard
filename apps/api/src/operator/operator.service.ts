import { Injectable } from '@nestjs/common';
import { IncidentsService } from '../incidents/incidents.service';
import { RiskZonesService } from '../risk-zones/risk-zones.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  DashboardSummary,
  IncidentSeverity,
  OpsMapData,
  UserRole,
} from '@atlasguard/shared';

@Injectable()
export class OperatorService {
  constructor(
    private incidentsService: IncidentsService,
    private riskZonesService: RiskZonesService,
    private prisma: PrismaService,
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

  async getDashboardSummary(): Promise<DashboardSummary> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const activeIncidents = await this.prisma.incident.findMany({
      where: { status: { notIn: ['RESOLVED', 'CANCELLED'] } },
      select: { severity: true, riskScore: true },
    });

    const activeBySeverity: Record<IncidentSeverity, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    for (const incident of activeIncidents) {
      const severity = incident.severity as IncidentSeverity;
      if (severity in activeBySeverity) {
        activeBySeverity[severity] += 1;
      }
    }

    const acknowledgedEvents = await this.prisma.incidentEvent.findMany({
      where: { eventType: 'ACKNOWLEDGED' },
      select: {
        createdAt: true,
        incident: { select: { createdAt: true } },
      },
    });

    let averageResponseTimeMinutes: number | null = null;
    if (acknowledgedEvents.length > 0) {
      const totalMinutes = acknowledgedEvents.reduce((sum, event) => {
        const diffMs =
          event.createdAt.getTime() - event.incident.createdAt.getTime();
        return sum + diffMs / 60000;
      }, 0);
      averageResponseTimeMinutes =
        Math.round((totalMinutes / acknowledgedEvents.length) * 10) / 10;
    }

    const resolvedToday = await this.prisma.incident.count({
      where: {
        status: 'RESOLVED',
        updatedAt: { gte: startOfToday },
      },
    });

    return {
      totalActive: activeIncidents.length,
      activeBySeverity,
      averageResponseTimeMinutes,
      criticalCount: activeBySeverity.CRITICAL,
      resolvedToday,
    };
  }
}
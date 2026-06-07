import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { RiskZonesService } from '../risk-zones/risk-zones.service';
import { AuditService } from '../audit/audit.service';
import { IncidentEventsService } from '../incidents/incident-events.service';
import { IncidentsService } from '../incidents/incidents.service';
import { DEMO_LOCATIONS, SimulateDemoResponse } from '@atlasguard/shared';
import {
  applyDemoAcknowledgeTiming,
  prepareDemoScenario,
  seedDemoAccounts,
  withDemoSimLock,
} from './seed-demo.helper';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(
    private prisma: PrismaService,
    private riskZonesService: RiskZonesService,
    private auditService: AuditService,
    private eventsService: IncidentEventsService,
    private incidentsService: IncidentsService,
  ) {}

  @Get('audit')
  async getAuditFeed() {
    return this.auditService.getAuditFeed();
  }

  @Get('risk-zones')
  async getRiskZones() {
    return this.riskZonesService.listAllZones();
  }

  @Get('users')
  async getUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return users;
  }

  @Post('seed')
  async seed() {
    await seedDemoAccounts(this.prisma);
    return { message: 'Seeding completed successfully' };
  }

  @Post('simulate-demo')
  async simulateDemo(): Promise<SimulateDemoResponse> {
    return withDemoSimLock(async () => {
      const { touristProfile, adminUser, operatorUser } = await seedDemoAccounts(
        this.prisma,
      );
      const cancelledCount = await prepareDemoScenario(
        this.prisma,
        this.eventsService,
        touristProfile.id,
        adminUser.id,
      );

      const demoIncident = await this.incidentsService.triggerSos(
        touristProfile.userId,
        {
          latitude: DEMO_LOCATIONS.remoteNorth.lat,
          longitude: DEMO_LOCATIONS.remoteNorth.lng,
          description: 'Auto-triggered demo MEDICAL SOS — Remote North Route',
          type: 'MEDICAL',
        },
      );

      await this.incidentsService.acknowledgeIncident(
        demoIncident.id,
        operatorUser.id,
        'OPERATOR',
      );

      await applyDemoAcknowledgeTiming(
        this.prisma,
        this.eventsService,
        demoIncident.id,
      );

      const expectedRisk = demoIncident.riskExplanation
        ? JSON.parse(demoIncident.riskExplanation)
        : { score: demoIncident.riskScore, severity: demoIncident.severity, reasons: [] };

      return {
        message: `Demo scenario prepared (${cancelledCount} open incident(s) cleared); MEDICAL SOS auto-triggered and acknowledged`,
        playbook: {
          title: 'AtlasGuard 5-Minute Risk Scoring Demo',
          steps: [
            'Log in as operator@demo.com — active MEDICAL incident is already on the dashboard.',
            `Review Risk Analysis for incident ${demoIncident.id} (Remote North CRITICAL zone).`,
            'Show dashboard analytics: avg response time ~2–3 min, severity breakdown.',
            'Assign responder@demo.com and walk through dispatch workflow.',
            'Log in as tourist@demo.com to show Safety Map and incident status.',
            'Show audit chain integrity and notification records.',
          ],
          highRiskLocation: DEMO_LOCATIONS.remoteNorth,
          suggestedSosPayload: {
            latitude: DEMO_LOCATIONS.remoteNorth.lat,
            longitude: DEMO_LOCATIONS.remoteNorth.lng,
            description: 'Demo high-risk SOS from Remote North Route',
            type: 'MEDICAL',
          },
          demoIncidentId: demoIncident.id,
          autoTriggered: true,
          expectedRiskScore: expectedRisk.score,
          expectedSeverity: expectedRisk.severity,
          expectedReasonCount: expectedRisk.reasons?.length ?? 0,
        },
      };
    });
  }
}
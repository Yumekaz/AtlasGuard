import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { RiskZonesService } from '../risk-zones/risk-zones.service';
import { AuditService } from '../audit/audit.service';
import { IncidentEventsService } from '../incidents/incident-events.service';
import { DEMO_LOCATIONS, SimulateDemoResponse } from '@atlasguard/shared';
import {
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
      const { touristProfile, adminUser } = await seedDemoAccounts(this.prisma);
      const cancelledCount = await prepareDemoScenario(
        this.prisma,
        this.eventsService,
        touristProfile.id,
        adminUser.id,
      );

      return {
        message: `Demo scenario prepared (${cancelledCount} open incident(s) cleared)`,
        playbook: {
          title: 'AtlasGuard 5-Minute Risk Scoring Demo',
          steps: [
            'Log in as tourist@demo.com and open the Safety Map.',
            `Move to Remote North Route (CRITICAL zone) at ${DEMO_LOCATIONS.remoteNorth.lat}, ${DEMO_LOCATIONS.remoteNorth.lng}.`,
            'Trigger SOS — observe elevated risk score and CRITICAL/HIGH severity.',
            'Log in as operator@demo.com — review dashboard summary and risk explanation panel.',
            'Acknowledge, assign responder, and walk through dispatch workflow.',
            'Show audit chain integrity and notification records.',
          ],
          highRiskLocation: DEMO_LOCATIONS.remoteNorth,
          suggestedSosPayload: {
            latitude: DEMO_LOCATIONS.remoteNorth.lat,
            longitude: DEMO_LOCATIONS.remoteNorth.lng,
            description: 'Demo high-risk SOS from Remote North Route',
          },
        },
      };
    });
  }
}
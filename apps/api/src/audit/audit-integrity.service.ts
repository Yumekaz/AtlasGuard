import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditIntegrityResult } from '@atlasguard/shared';
import { PrismaService } from '../prisma/prisma.service';
import { IncidentEventsService } from '../incidents/incident-events.service';

@Injectable()
export class AuditIntegrityService {
  constructor(
    private prisma: PrismaService,
    private eventsService: IncidentEventsService,
  ) {}

  async verifyIncidentChain(incidentId: string): Promise<AuditIntegrityResult> {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
    });
    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    const events = await this.prisma.incidentEvent.findMany({
      where: { incidentId },
      orderBy: { createdAt: 'asc' },
    });

    if (events.length === 0) {
      return {
        incidentId,
        verified: true,
        totalEvents: 0,
        message: 'No audit events recorded yet.',
      };
    }

    let expectedPrevious = 'GENESIS';
    for (const event of events) {
      if (event.previousHash !== expectedPrevious) {
        return {
          incidentId,
          verified: false,
          totalEvents: events.length,
          brokenAtEventId: event.id,
          message: `Chain broken at event ${event.eventType}: previous hash mismatch.`,
        };
      }

      const expectedHash = this.eventsService.computeHash(
        event.incidentId,
        event.actorId,
        event.eventType,
        event.metadata ?? '',
        event.createdAt,
        event.previousHash,
      );

      if (event.currentHash !== expectedHash) {
        return {
          incidentId,
          verified: false,
          totalEvents: events.length,
          brokenAtEventId: event.id,
          message: `Chain broken at event ${event.eventType}: current hash invalid.`,
        };
      }

      expectedPrevious = event.currentHash;
    }

    return {
      incidentId,
      verified: true,
      totalEvents: events.length,
      message: 'Audit integrity: Verified',
    };
  }
}
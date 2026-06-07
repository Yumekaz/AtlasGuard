import { Injectable } from '@nestjs/common';
import { AuditEventFeedItem, AuditIncidentSummary } from '@atlasguard/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async listAuditIncidents(): Promise<AuditIncidentSummary[]> {
    const incidents = await this.prisma.incident.findMany({
      where: { events: { some: {} } },
      include: {
        tourist: { include: { user: true } },
        events: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { events: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    return incidents.map((inc) => ({
      id: inc.id,
      type: inc.type as AuditIncidentSummary['type'],
      status: inc.status as AuditIncidentSummary['status'],
      touristName: inc.tourist.user.name,
      eventCount: inc._count.events,
      lastEventAt: inc.events[0]?.createdAt.toISOString() ?? inc.updatedAt.toISOString(),
    }));
  }

  async getAuditFeed(limit = 100): Promise<AuditEventFeedItem[]> {
    const events = await this.prisma.incidentEvent.findMany({
      include: {
        actor: true,
        incident: { include: { tourist: { include: { user: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return events.map((e) => ({
      id: e.id,
      incidentId: e.incidentId,
      incidentType: e.incident.type as AuditEventFeedItem['incidentType'],
      incidentStatus: e.incident.status as AuditEventFeedItem['incidentStatus'],
      touristName: e.incident.tourist.user.name,
      actorId: e.actorId,
      actorName: e.actor.name,
      eventType: e.eventType as AuditEventFeedItem['eventType'],
      previousHash: e.previousHash,
      currentHash: e.currentHash,
      createdAt: e.createdAt.toISOString(),
    }));
  }
}
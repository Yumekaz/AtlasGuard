import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  IncidentDetail,
  IncidentStatus,
  IncidentSummary,
  UserRole,
} from '@atlasguard/shared';
import { PrismaService } from '../prisma/prisma.service';
import { IncidentStateService } from './incident-state.service';
import { IncidentEventsService } from './incident-events.service';
import { TriggerSosDto } from './dto/trigger-sos.dto';
import { EventsGateway } from '../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';

const DEMO_LAT = 27.3314;
const DEMO_LNG = 88.6138;
const SOS_IDEMPOTENCY_WINDOW_MS = 60_000;

@Injectable()
export class IncidentsService {
  constructor(
    private prisma: PrismaService,
    private eventsService: IncidentEventsService,
    private eventsGateway: EventsGateway,
    private stateMachine: IncidentStateService,
    private notificationsService: NotificationsService,
  ) {}

  private async getTouristProfileForUser(userId: string) {
    const profile = await this.prisma.touristProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!profile) {
      throw new BadRequestException('Please complete your safety profile first.');
    }
    return profile;
  }

  private mapIncidentDetail(incident: any): IncidentDetail {
    const assignment = incident.assignments?.[0];
    const responder = assignment?.responder;

    return {
      id: incident.id,
      touristId: incident.touristId,
      tripId: incident.tripId ?? undefined,
      type: incident.type,
      status: incident.status,
      severity: incident.severity,
      latitude: incident.latitude,
      longitude: incident.longitude,
      riskScore: incident.riskScore,
      riskExplanation: incident.riskExplanation ?? undefined,
      description: incident.description ?? undefined,
      createdAt: incident.createdAt.toISOString(),
      updatedAt: incident.updatedAt.toISOString(),
      touristName: incident.tourist?.user?.name ?? 'Unknown',
      touristPhone: incident.tourist?.phone,
      safetyId: incident.trip?.safetyId,
      destinationName: incident.trip?.destinationName,
      assignedResponderId: responder?.id,
      assignedResponderName: responder?.user?.name,
      assignedResponderUnit: responder?.unitName,
      events: (incident.events ?? []).map((e: any) => ({
        id: e.id,
        incidentId: e.incidentId,
        actorId: e.actorId,
        actorName: e.actor?.name,
        eventType: e.eventType,
        metadata: e.metadata ?? undefined,
        previousHash: e.previousHash,
        currentHash: e.currentHash,
        createdAt: e.createdAt.toISOString(),
      })),
      evidenceFiles: (incident.evidenceFiles ?? []).map((f: any) => ({
        id: f.id,
        incidentId: f.incidentId,
        uploadedById: f.uploadedById,
        uploadedByName: f.uploadedBy?.name,
        fileUrl: f.fileUrl,
        fileType: f.fileType,
        description: f.description ?? undefined,
        createdAt: f.createdAt.toISOString(),
      })),
    };
  }

  private mapIncidentSummary(incident: any): IncidentSummary {
    const assignment = incident.assignments?.[0];
    return {
      id: incident.id,
      type: incident.type,
      status: incident.status,
      severity: incident.severity,
      latitude: incident.latitude,
      longitude: incident.longitude,
      riskScore: incident.riskScore,
      touristName: incident.tourist?.user?.name ?? 'Unknown',
      safetyId: incident.trip?.safetyId,
      destinationName: incident.trip?.destinationName,
      assignedResponderName: assignment?.responder?.user?.name,
      createdAt: incident.createdAt.toISOString(),
      updatedAt: incident.updatedAt.toISOString(),
    };
  }

  private incidentInclude() {
    return {
      tourist: { include: { user: true } },
      trip: true,
      assignments: {
        where: { status: { in: ['ASSIGNED', 'ACCEPTED'] } },
        orderBy: { assignedAt: 'desc' as const },
        take: 1,
        include: {
          responder: { include: { user: true } },
        },
      },
      events: {
        orderBy: { createdAt: 'asc' as const },
        include: { actor: true },
      },
      evidenceFiles: {
        orderBy: { createdAt: 'desc' as const },
        include: { uploadedBy: true },
      },
    };
  }

  async triggerSos(userId: string, dto: TriggerSosDto): Promise<IncidentDetail> {
    const profile = await this.getTouristProfileForUser(userId);

    const activeTrip = await this.prisma.trip.findFirst({
      where: { touristId: profile.id, status: 'ACTIVE' },
    });
    if (!activeTrip) {
      throw new BadRequestException('An active trip is required to trigger SOS.');
    }

    const cutoff = new Date(Date.now() - SOS_IDEMPOTENCY_WINDOW_MS);
    const recentOpen = await this.prisma.incident.findFirst({
      where: {
        touristId: profile.id,
        status: { notIn: ['RESOLVED', 'CANCELLED'] },
        createdAt: { gte: cutoff },
      },
      include: this.incidentInclude(),
    });
    if (recentOpen) {
      return this.mapIncidentDetail(recentOpen);
    }

    const latitude = dto.latitude ?? DEMO_LAT;
    const longitude = dto.longitude ?? DEMO_LNG;

    const incident = await this.prisma.$transaction(async (tx) => {
      const created = await tx.incident.create({
        data: {
          touristId: profile.id,
          tripId: activeTrip.id,
          type: 'SOS',
          status: 'CREATED',
          severity: 'MEDIUM',
          latitude,
          longitude,
          riskScore: 0,
          description: dto.description,
        },
      });

      await this.eventsService.appendEvent(tx, {
        incidentId: created.id,
        actorId: userId,
        eventType: 'SOS_TRIGGERED',
        metadata: {
          latitude,
          longitude,
          safetyId: activeTrip.safetyId,
          destination: activeTrip.destinationName,
        },
      });

      return tx.incident.findUnique({
        where: { id: created.id },
        include: this.incidentInclude(),
      });
    });

    const detail = this.mapIncidentDetail(incident);
    this.eventsGateway.emitIncidentCreated(detail);
    this.eventsGateway.emitIncidentUpdated(detail, profile.userId);
    void this.notificationsService.notifyIncidentCreated(detail.id, {
      type: detail.type,
      status: detail.status,
      touristName: detail.touristName,
      safetyId: detail.safetyId,
    });
    return detail;
  }

  async getMyIncidents(userId: string): Promise<IncidentSummary[]> {
    const profile = await this.prisma.touristProfile.findUnique({
      where: { userId },
    });
    if (!profile) return [];

    const incidents = await this.prisma.incident.findMany({
      where: { touristId: profile.id },
      include: {
        tourist: { include: { user: true } },
        trip: true,
        assignments: {
          where: { status: { in: ['ASSIGNED', 'ACCEPTED'] } },
          orderBy: { assignedAt: 'desc' },
          take: 1,
          include: { responder: { include: { user: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return incidents.map((i) => this.mapIncidentSummary(i));
  }

  async getIncidentStatus(userId: string, role: UserRole, incidentId: string): Promise<IncidentDetail> {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        ...this.incidentInclude(),
        tourist: { include: { user: true } },
      },
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    if (role === 'TOURIST') {
      const profile = await this.prisma.touristProfile.findUnique({
        where: { userId },
      });
      if (!profile || incident.touristId !== profile.id) {
        throw new ForbiddenException('You can only view your own incidents');
      }
    } else if (role === 'RESPONDER') {
      const responder = await this.prisma.responderProfile.findUnique({
        where: { userId },
      });
      const assignment = await this.prisma.responderAssignment.findFirst({
        where: {
          incidentId,
          responderId: responder?.id,
          status: { in: ['ASSIGNED', 'ACCEPTED'] },
        },
      });
      if (!responder || !assignment) {
        throw new ForbiddenException('You can only view incidents assigned to you');
      }
    }

    return this.mapIncidentDetail(incident);
  }

  async cancelIncident(userId: string, incidentId: string): Promise<IncidentDetail> {
    const profile = await this.getTouristProfileForUser(userId);
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      include: this.incidentInclude(),
    });

    if (!incident) throw new NotFoundException('Incident not found');
    if (incident.touristId !== profile.id) {
      throw new ForbiddenException('You can only cancel your own incidents');
    }
    if (incident.status !== 'CREATED') {
      throw new BadRequestException('Only unacknowledged SOS incidents can be cancelled');
    }

    return this.transitionStatus(incidentId, 'CANCELLED', userId, 'TOURIST');
  }

  async listActiveIncidents(): Promise<IncidentSummary[]> {
    const incidents = await this.prisma.incident.findMany({
      where: { status: { notIn: ['RESOLVED', 'CANCELLED'] } },
      include: {
        tourist: { include: { user: true } },
        trip: true,
        assignments: {
          where: { status: { in: ['ASSIGNED', 'ACCEPTED'] } },
          orderBy: { assignedAt: 'desc' },
          take: 1,
          include: { responder: { include: { user: true } } },
        },
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    });
    return incidents.map((i) => this.mapIncidentSummary(i));
  }

  async getIncidentById(incidentId: string): Promise<IncidentDetail> {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      include: this.incidentInclude(),
    });
    if (!incident) throw new NotFoundException('Incident not found');
    return this.mapIncidentDetail(incident);
  }

  async acknowledgeIncident(incidentId: string, actorId: string, actorRole: UserRole): Promise<IncidentDetail> {
    return this.transitionStatus(incidentId, 'ACKNOWLEDGED', actorId, actorRole);
  }

  async assignResponder(
    incidentId: string,
    responderId: string,
    actorId: string,
    actorRole: UserRole,
  ): Promise<IncidentDetail> {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      include: { tourist: { include: { user: true } } },
    });
    if (!incident) throw new NotFoundException('Incident not found');

    this.stateMachine.validateTransition(
      incident.status as IncidentStatus,
      'ASSIGNED',
      actorRole,
    );

    const responder = await this.prisma.responderProfile.findUnique({
      where: { id: responderId },
      include: { user: true },
    });
    if (!responder) throw new NotFoundException('Responder not found');

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.incident.update({
        where: { id: incidentId },
        data: { status: 'ASSIGNED' },
      });

      await tx.responderAssignment.create({
        data: {
          incidentId,
          responderId,
          assignedById: actorId,
          status: 'ASSIGNED',
        },
      });

      await this.eventsService.appendEvent(tx, {
        incidentId,
        actorId,
        eventType: 'ASSIGNED',
        metadata: {
          responderId,
          responderName: responder.user.name,
          unitName: responder.unitName,
        },
      });

      return tx.incident.findUnique({
        where: { id: incidentId },
        include: this.incidentInclude(),
      });
    });

    const detail = this.mapIncidentDetail(updated);
    this.eventsGateway.emitResponderAssigned({
      incidentId,
      responderUserId: responder.userId,
      touristUserId: incident.tourist.userId,
      assignment: detail,
    });
    this.eventsGateway.emitIncidentUpdated(detail, incident.tourist.userId);
    void this.notificationsService.notifyResponderAssigned(responder.userId, incidentId, {
      responderName: responder.user.name,
      unitName: responder.unitName,
      touristName: detail.touristName,
      status: detail.status,
    });
    void this.notificationsService.notifyIncidentUpdated(incident.tourist.userId, incidentId, {
      status: detail.status,
      assignedResponderName: detail.assignedResponderName,
    });
    return detail;
  }

  async transitionStatus(
    incidentId: string,
    toStatus: IncidentStatus,
    actorId: string,
    actorRole: UserRole,
  ): Promise<IncidentDetail> {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        tourist: { include: { user: true } },
        assignments: {
          where: { status: { in: ['ASSIGNED', 'ACCEPTED'] } },
          orderBy: { assignedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!incident) throw new NotFoundException('Incident not found');

    const fromStatus = incident.status as IncidentStatus;
    this.stateMachine.validateTransition(fromStatus, toStatus, actorRole);

    if (actorRole === 'RESPONDER') {
      const responderProfile = await this.prisma.responderProfile.findUnique({
        where: { userId: actorId },
      });
      const assignment = incident.assignments[0];
      if (
        !responderProfile ||
        !assignment ||
        assignment.responderId !== responderProfile.id
      ) {
        throw new ForbiddenException('You can only update incidents assigned to you');
      }
    }

    if (toStatus === 'CANCELLED' && actorRole === 'TOURIST') {
      const profile = await this.prisma.touristProfile.findUnique({
        where: { userId: actorId },
      });
      if (!profile || incident.touristId !== profile.id) {
        throw new ForbiddenException('You can only cancel your own incidents');
      }
    }

    const eventType = this.stateMachine.getEventTypeForStatus(toStatus);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.incident.update({
        where: { id: incidentId },
        data: { status: toStatus },
      });

      if (toStatus === 'RESOLVED') {
        await tx.responderAssignment.updateMany({
          where: { incidentId, status: { in: ['ASSIGNED', 'ACCEPTED'] } },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
      }

      await this.eventsService.appendEvent(tx, {
        incidentId,
        actorId,
        eventType: eventType as any,
        metadata: { fromStatus, toStatus },
      });

      return tx.incident.findUnique({
        where: { id: incidentId },
        include: this.incidentInclude(),
      });
    });

    const detail = this.mapIncidentDetail(updated);
    this.eventsGateway.emitIncidentUpdated(detail, incident.tourist.userId);
    void this.notificationsService.notifyIncidentUpdated(incident.tourist.userId, incidentId, {
      status: detail.status,
      fromStatus,
      toStatus,
    });
    return detail;
  }

  async listResponders(): Promise<any[]> {
    const responders = await this.prisma.responderProfile.findMany({
      include: {
        user: true,
        assignments: {
          where: {
            status: { in: ['ASSIGNED', 'ACCEPTED'] },
            incident: { status: { notIn: ['RESOLVED', 'CANCELLED'] } },
          },
        },
      },
    });

    return responders.map((r) => ({
      id: r.id,
      userId: r.userId,
      name: r.user.name,
      phone: r.phone,
      unitName: r.unitName,
      availabilityStatus: r.availabilityStatus,
      lastLatitude: r.lastLatitude ?? undefined,
      lastLongitude: r.lastLongitude ?? undefined,
      activeAssignments: r.assignments.length,
    }));
  }

  async getResponderAssignments(userId: string): Promise<IncidentSummary[]> {
    const responder = await this.prisma.responderProfile.findUnique({
      where: { userId },
    });
    if (!responder) return [];

    const assignments = await this.prisma.responderAssignment.findMany({
      where: {
        responderId: responder.id,
        status: { in: ['ASSIGNED', 'ACCEPTED'] },
        incident: { status: { notIn: ['RESOLVED', 'CANCELLED'] } },
      },
      include: {
        incident: {
          include: {
            tourist: { include: { user: true } },
            trip: true,
            assignments: {
              where: { status: { in: ['ASSIGNED', 'ACCEPTED'] } },
              orderBy: { assignedAt: 'desc' },
              take: 1,
              include: { responder: { include: { user: true } } },
            },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return assignments.map((a) => this.mapIncidentSummary(a.incident));
  }
}
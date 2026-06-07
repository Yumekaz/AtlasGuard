import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { NotificationRecord } from '@atlasguard/shared';
import { PrismaService } from '../prisma/prisma.service';
import {
  NOTIFICATION_QUEUE,
  NotificationJobData,
  NotificationTemplate,
} from './notifications.constants';
import { getRedisConnection } from './redis.connection';

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private queue: Queue | null = null;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    const connection = getRedisConnection();
    this.queue = new Queue(NOTIFICATION_QUEUE, { connection });
    this.logger.log('Notification queue connected');
  }

  async onModuleDestroy() {
    await this.queue?.close();
  }

  private async enqueue(data: NotificationJobData) {
    if (!this.queue) return;
    await this.queue.add(data.template, data, {
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  }

  async notifyUser(
    userId: string,
    channels: NotificationJobData['channel'][],
    template: NotificationTemplate,
    payload: Record<string, unknown>,
    incidentId?: string,
  ) {
    for (const channel of channels) {
      await this.enqueue({ userId, incidentId, channel, template, payload });
    }
  }

  async notifyOperators(
    template: NotificationTemplate,
    payload: Record<string, unknown>,
    incidentId?: string,
  ) {
    const operators = await this.prisma.user.findMany({
      where: { role: { in: ['OPERATOR', 'ADMIN'] }, status: 'ACTIVE' },
    });

    for (const op of operators) {
      await this.notifyUser(
        op.id,
        ['IN_APP', 'SMS', 'EMAIL'],
        template,
        payload,
        incidentId,
      );
    }
  }

  async notifyIncidentCreated(incidentId: string, payload: Record<string, unknown>) {
    await this.notifyOperators('incident.created', payload, incidentId);
  }

  async notifyResponderAssigned(
    responderUserId: string,
    incidentId: string,
    payload: Record<string, unknown>,
  ) {
    await this.notifyUser(responderUserId, ['IN_APP', 'SMS'], 'responder.assigned', payload, incidentId);
  }

  async notifyIncidentUpdated(
    touristUserId: string,
    incidentId: string,
    payload: Record<string, unknown>,
  ) {
    await this.notifyUser(touristUserId, ['IN_APP', 'SMS'], 'incident.updated', payload, incidentId);
  }

  async notifyGeofenceAlert(
    touristUserId: string,
    payload: Record<string, unknown>,
  ) {
    await this.notifyUser(touristUserId, ['IN_APP', 'SMS'], 'geofence.alert', payload);
  }

  async getMyNotifications(userId: string): Promise<NotificationRecord[]> {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((n) => this.mapNotification(n));
  }

  async listOpsNotifications(): Promise<NotificationRecord[]> {
    const rows = await this.prisma.notification.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((n) => ({
      ...this.mapNotification(n),
      userName: n.user.name,
    }));
  }

  private mapNotification(n: any): NotificationRecord {
    return {
      id: n.id,
      userId: n.userId,
      incidentId: n.incidentId ?? undefined,
      channel: n.channel,
      status: n.status,
      payload: n.payload,
      attempts: n.attempts,
      createdAt: n.createdAt.toISOString(),
      sentAt: n.sentAt?.toISOString(),
    };
  }
}
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { NotificationRecord } from '@atlasguard/shared';
import { PrismaService } from '../prisma/prisma.service';
import {
  NOTIFICATION_QUEUE,
  NotificationJobData,
  NotificationTemplate,
} from './notifications.constants';
import { getRedisConnection } from '../redis.connection';

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
    if (!this.queue) {
      throw new Error('Notification queue is not initialized');
    }
    await this.queue.add(data.template, data, {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  }

  private async safeNotify(
    label: string,
    task: () => Promise<void>,
    failureMeta?: { userId?: string; incidentId?: string },
  ): Promise<void> {
    try {
      await task();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Notification enqueue failed (${label}): ${message}`);
      if (failureMeta?.userId) {
        await this.recordEnqueueFailure(
          failureMeta.userId,
          failureMeta.incidentId,
          label,
          message,
        );
      }
    }
  }

  private async recordEnqueueFailure(
    userId: string,
    incidentId: string | undefined,
    template: string,
    error: string,
  ) {
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          incidentId,
          channel: 'IN_APP',
          status: 'FAILED',
          payload: JSON.stringify({ template, error, stage: 'enqueue' }),
          attempts: 0,
        },
      });
    } catch (recordErr) {
      const message = recordErr instanceof Error ? recordErr.message : String(recordErr);
      this.logger.error(`Could not record notification failure: ${message}`);
    }
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
    await this.safeNotify(
      'incident.created',
      () => this.notifyOperators('incident.created', payload, incidentId),
      { incidentId },
    );
  }

  async notifyResponderAssigned(
    responderUserId: string,
    incidentId: string,
    payload: Record<string, unknown>,
  ) {
    await this.safeNotify(
      'responder.assigned',
      () =>
        this.notifyUser(
          responderUserId,
          ['IN_APP', 'SMS'],
          'responder.assigned',
          payload,
          incidentId,
        ),
      { userId: responderUserId, incidentId },
    );
  }

  async notifyIncidentUpdated(
    touristUserId: string,
    incidentId: string,
    payload: Record<string, unknown>,
  ) {
    await this.safeNotify(
      'incident.updated',
      () =>
        this.notifyUser(
          touristUserId,
          ['IN_APP', 'SMS'],
          'incident.updated',
          payload,
          incidentId,
        ),
      { userId: touristUserId, incidentId },
    );
  }

  async notifyGeofenceAlert(
    touristUserId: string,
    payload: Record<string, unknown>,
  ) {
    await this.safeNotify(
      'geofence.alert',
      () =>
        this.notifyUser(touristUserId, ['IN_APP', 'SMS'], 'geofence.alert', payload),
      { userId: touristUserId },
    );
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
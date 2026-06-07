import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { NOTIFICATION_QUEUE, NotificationJobData } from './notifications.constants';
import { getRedisConnection } from './redis.connection';

@Injectable()
export class NotificationsProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsProcessor.name);
  private worker: Worker | null = null;

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  onModuleInit() {
    const connection = getRedisConnection();

    this.worker = new Worker(
      NOTIFICATION_QUEUE,
      async (job: Job<NotificationJobData>) => this.processJob(job),
      { connection },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Notification job ${job?.id} failed: ${err.message}`);
    });

    this.logger.log('Notification worker started');
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }

  private async processJob(job: Job<NotificationJobData>) {
    const { userId, incidentId, channel, template, payload } = job.data;

    const record = await this.prisma.notification.create({
      data: {
        userId,
        incidentId,
        channel,
        status: 'PENDING',
        payload: JSON.stringify({ template, ...payload }),
        attempts: 0,
      },
    });

    try {
      await new Promise((r) => setTimeout(r, 100));

      const isMock = channel === 'SMS' || channel === 'EMAIL';
      const status = isMock ? 'MOCKED' : 'SENT';

      const updated = await this.prisma.notification.update({
        where: { id: record.id },
        data: {
          status,
          attempts: 1,
          sentAt: new Date(),
        },
      });

      const logLine = isMock
        ? `[MOCK ${channel}] to user ${userId}: ${template} — ${JSON.stringify(payload)}`
        : `[${channel}] to user ${userId}: ${template}`;
      this.logger.log(logLine);

      this.eventsGateway.emitNotificationCreated({
        id: updated.id,
        userId: updated.userId,
        incidentId: updated.incidentId ?? undefined,
        channel: updated.channel as any,
        status: updated.status as any,
        payload: updated.payload,
        attempts: updated.attempts,
        createdAt: updated.createdAt.toISOString(),
        sentAt: updated.sentAt?.toISOString(),
      });

      return updated;
    } catch (err) {
      await this.prisma.notification.update({
        where: { id: record.id },
        data: { status: 'FAILED', attempts: 1 },
      });
      throw err;
    }
  }
}
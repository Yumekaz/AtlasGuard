import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { IncidentEventType } from '@atlasguard/shared';

@Injectable()
export class IncidentEventsService {
  computeHash(
    incidentId: string,
    actorId: string,
    eventType: string,
    metadata: string,
    createdAt: Date,
    previousHash: string,
  ): string {
    const payload = [
      incidentId,
      actorId,
      eventType,
      metadata,
      createdAt.toISOString(),
      previousHash,
    ].join('|');

    return createHash('sha256').update(payload).digest('hex');
  }

  async getPreviousHash(
    tx: Prisma.TransactionClient,
    incidentId: string,
  ): Promise<string> {
    const lastEvent = await tx.incidentEvent.findFirst({
      where: { incidentId },
      orderBy: { createdAt: 'desc' },
    });
    return lastEvent?.currentHash ?? 'GENESIS';
  }

  async appendEvent(
    tx: Prisma.TransactionClient,
    params: {
      incidentId: string;
      actorId: string;
      eventType: IncidentEventType;
      metadata?: Record<string, unknown>;
    },
  ) {
    const previousHash = await this.getPreviousHash(tx, params.incidentId);
    const metadataStr = JSON.stringify(params.metadata ?? {});
    const createdAt = new Date();
    const currentHash = this.computeHash(
      params.incidentId,
      params.actorId,
      params.eventType,
      metadataStr,
      createdAt,
      previousHash,
    );

    return tx.incidentEvent.create({
      data: {
        incidentId: params.incidentId,
        actorId: params.actorId,
        eventType: params.eventType,
        metadata: metadataStr,
        previousHash,
        currentHash,
        createdAt,
      },
    });
  }
}
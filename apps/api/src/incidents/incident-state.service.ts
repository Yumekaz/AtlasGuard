import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { IncidentStatus, UserRole } from '@atlasguard/shared';

const TERMINAL_STATUSES: IncidentStatus[] = ['RESOLVED', 'CANCELLED'];

const TRANSITIONS: Record<
  IncidentStatus,
  Partial<Record<IncidentStatus, UserRole[]>>
> = {
  CREATED: {
    ACKNOWLEDGED: ['OPERATOR', 'ADMIN'],
    CANCELLED: ['TOURIST', 'OPERATOR', 'ADMIN'],
  },
  ACKNOWLEDGED: {
    ASSIGNED: ['OPERATOR', 'ADMIN'],
  },
  ASSIGNED: {
    DISPATCHED: ['RESPONDER'],
    CANCELLED: ['OPERATOR', 'ADMIN'],
  },
  DISPATCHED: {
    REACHED: ['RESPONDER'],
    CANCELLED: ['OPERATOR', 'ADMIN'],
  },
  REACHED: {
    RESOLVED: ['RESPONDER', 'OPERATOR', 'ADMIN'],
  },
  RESOLVED: {},
  CANCELLED: {},
};

const EVENT_TYPE_MAP: Partial<Record<IncidentStatus, string>> = {
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  ASSIGNED: 'ASSIGNED',
  DISPATCHED: 'DISPATCHED',
  REACHED: 'REACHED',
  RESOLVED: 'RESOLVED',
  CANCELLED: 'CANCELLED',
};

@Injectable()
export class IncidentStateService {
  assertNotTerminal(status: IncidentStatus): void {
    if (TERMINAL_STATUSES.includes(status)) {
      throw new BadRequestException(`Incident is already ${status} and cannot be modified`);
    }
  }

  validateTransition(
    from: IncidentStatus,
    to: IncidentStatus,
    actorRole: UserRole,
  ): void {
    this.assertNotTerminal(from);

    const allowed = TRANSITIONS[from]?.[to];
    if (!allowed) {
      throw new BadRequestException(
        `Invalid transition: ${from} -> ${to}`,
      );
    }

    if (!allowed.includes(actorRole)) {
      throw new ForbiddenException(
        `Role ${actorRole} cannot transition ${from} -> ${to}`,
      );
    }
  }

  getEventTypeForStatus(status: IncidentStatus): string {
    const eventType = EVENT_TYPE_MAP[status];
    if (!eventType) {
      throw new BadRequestException(`No event type mapped for status ${status}`);
    }
    return eventType;
  }
}
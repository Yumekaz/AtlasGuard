import { Module } from '@nestjs/common';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { IncidentEventsService } from './incident-events.service';
import { IncidentStateService } from './incident-state.service';
import { EvidenceService } from './evidence.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, EventsModule, NotificationsModule],
  controllers: [IncidentsController],
  providers: [
    IncidentsService,
    IncidentEventsService,
    IncidentStateService,
    EvidenceService,
  ],
  exports: [IncidentsService, IncidentEventsService, EvidenceService],
})
export class IncidentsModule {}
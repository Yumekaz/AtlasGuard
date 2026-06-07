import { Module } from '@nestjs/common';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { IncidentEventsService } from './incident-events.service';
import { IncidentStateService } from './incident-state.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [IncidentsController],
  providers: [
    IncidentsService,
    IncidentEventsService,
    IncidentStateService,
  ],
  exports: [IncidentsService],
})
export class IncidentsModule {}
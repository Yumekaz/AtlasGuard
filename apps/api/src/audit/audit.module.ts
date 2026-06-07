import { Module } from '@nestjs/common';
import { AuditIntegrityService } from './audit-integrity.service';
import { AuditService } from './audit.service';
import { OpsAuditController, IncidentAuditController } from './audit.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { IncidentsModule } from '../incidents/incidents.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [PrismaModule, IncidentsModule, EventsModule],
  controllers: [OpsAuditController, IncidentAuditController],
  providers: [AuditIntegrityService, AuditService],
  exports: [AuditIntegrityService, AuditService],
})
export class AuditModule {}
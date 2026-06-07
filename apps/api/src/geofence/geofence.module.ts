import { Module } from '@nestjs/common';
import { GeofenceController } from './geofence.controller';
import { GeofenceService } from './geofence.service';
import { RiskZonesModule } from '../risk-zones/risk-zones.module';
import { EventsModule } from '../events/events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [RiskZonesModule, EventsModule, PrismaModule, NotificationsModule],
  controllers: [GeofenceController],
  providers: [GeofenceService],
})
export class GeofenceModule {}
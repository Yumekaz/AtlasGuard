import { Module } from '@nestjs/common';
import { GeofenceController } from './geofence.controller';
import { GeofenceService } from './geofence.service';
import { RiskZonesModule } from '../risk-zones/risk-zones.module';
import { EventsModule } from '../events/events.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [RiskZonesModule, EventsModule, PrismaModule],
  controllers: [GeofenceController],
  providers: [GeofenceService],
})
export class GeofenceModule {}
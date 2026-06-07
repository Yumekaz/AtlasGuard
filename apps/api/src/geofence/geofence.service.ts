import { BadRequestException, Injectable } from '@nestjs/common';
import { GeofenceCheckResult } from '@atlasguard/shared';
import { RiskZonesService } from '../risk-zones/risk-zones.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import {
  buildWarningMessage,
  findMatchingZones,
  getHighestRisk,
} from './geofence.utils';

@Injectable()
export class GeofenceService {
  constructor(
    private riskZonesService: RiskZonesService,
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async checkGeofence(
    userId: string,
    latitude: number,
    longitude: number,
    lastAlertedZoneId?: string,
  ): Promise<GeofenceCheckResult> {
    const profile = await this.prisma.touristProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!profile) {
      throw new BadRequestException('Please complete your safety profile first.');
    }

    const activeTrip = await this.prisma.trip.findFirst({
      where: { touristId: profile.id, status: 'ACTIVE' },
    });
    if (!activeTrip) {
      throw new BadRequestException('An active trip is required for geofence monitoring.');
    }

    const zones = await this.riskZonesService.getZonesForCheck();
    const matchedZones = findMatchingZones(latitude, longitude, zones);
    const highestRisk = getHighestRisk(matchedZones);
    const inside = matchedZones.length > 0;
    const message = buildWarningMessage(matchedZones, highestRisk);

    const primaryZone = matchedZones.find((z) => z.riskLevel === highestRisk) ?? matchedZones[0];
    const shouldAlert =
      inside &&
      !!primaryZone &&
      primaryZone.id !== lastAlertedZoneId &&
      (highestRisk === 'HIGH' || highestRisk === 'CRITICAL' || highestRisk === 'MEDIUM');

    if (shouldAlert && primaryZone) {
      this.eventsGateway.emitGeofenceAlert({
        zoneId: primaryZone.id,
        zoneName: primaryZone.name,
        riskLevel: primaryZone.riskLevel,
        message,
        latitude,
        longitude,
        touristName: profile.user.name,
        touristUserId: userId,
      });
    }

    return {
      inside,
      matchedZones,
      highestRisk,
      message,
      shouldAlert: !!shouldAlert,
      alertZoneId: shouldAlert ? primaryZone?.id : undefined,
    };
  }
}
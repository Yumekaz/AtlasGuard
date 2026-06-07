import { Injectable } from '@nestjs/common';
import {
  computeRiskScore,
  hasMobilityNeedsFromProfile,
  IncidentType,
  RiskScoreExplanation,
} from '@atlasguard/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RiskZonesService } from '../risk-zones/risk-zones.service';
import { findMatchingZones, getHighestRisk } from '../geofence/geofence.utils';
import { haversineDistanceKm, isNightTime } from './geo.utils';

export interface EvaluateRiskParams {
  latitude: number;
  longitude: number;
  incidentType: IncidentType;
  touristId: string;
  excludeIncidentId?: string;
  at?: Date;
}

@Injectable()
export class RiskScoringService {
  constructor(
    private prisma: PrismaService,
    private riskZonesService: RiskZonesService,
  ) {}

  async evaluate(params: EvaluateRiskParams): Promise<RiskScoreExplanation> {
    const zones = await this.riskZonesService.getZonesForCheck();
    const matched = findMatchingZones(params.latitude, params.longitude, zones);
    const highestZoneRisk = getHighestRisk(matched);

    const tourist = await this.prisma.touristProfile.findUnique({
      where: { id: params.touristId },
      select: { medicalNotes: true, mobilityNeeds: true },
    });
    const hasMedicalNotes = Boolean(tourist?.medicalNotes?.trim());
    const hasMobilityNeeds = hasMobilityNeedsFromProfile(tourist?.mobilityNeeds);

    const responders = await this.prisma.responderProfile.findMany({
      where: {
        availabilityStatus: 'AVAILABLE',
        lastLatitude: { not: null },
        lastLongitude: { not: null },
      },
      select: { lastLatitude: true, lastLongitude: true },
    });

    let nearestResponderDistanceKm: number | null = null;
    for (const responder of responders) {
      if (responder.lastLatitude == null || responder.lastLongitude == null) continue;
      const distance = haversineDistanceKm(
        params.latitude,
        params.longitude,
        responder.lastLatitude,
        responder.lastLongitude,
      );
      if (nearestResponderDistanceKm === null || distance < nearestResponderDistanceKm) {
        nearestResponderDistanceKm = distance;
      }
    }

    const activeIncidents = await this.prisma.incident.findMany({
      where: { status: { notIn: ['RESOLVED', 'CANCELLED'] } },
      select: { id: true, latitude: true, longitude: true },
    });

    const nearbyActiveIncidentCount = activeIncidents.filter((incident) => {
      if (params.excludeIncidentId && incident.id === params.excludeIncidentId) {
        return false;
      }
      return (
        haversineDistanceKm(
          params.latitude,
          params.longitude,
          incident.latitude,
          incident.longitude,
        ) <= 2
      );
    }).length;

    return computeRiskScore({
      incidentType: params.incidentType,
      highestZoneRisk,
      isNightTime: isNightTime(params.at ?? new Date()),
      hasMedicalNotes,
      hasMobilityNeeds,
      nearestResponderDistanceKm,
      nearbyActiveIncidentCount,
    });
  }
}
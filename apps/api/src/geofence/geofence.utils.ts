import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import { GeoJsonPolygon, MatchedZone, RiskLevel, RISK_LEVEL_ORDER } from '@atlasguard/shared';

export interface ZoneForCheck {
  id: string;
  name: string;
  description: string;
  riskLevel: RiskLevel;
  polygon: GeoJsonPolygon;
}

export function findMatchingZones(
  latitude: number,
  longitude: number,
  zones: ZoneForCheck[],
): MatchedZone[] {
  const pt = point([longitude, latitude]);
  const matched: MatchedZone[] = [];

  for (const zone of zones) {
    if (booleanPointInPolygon(pt, zone.polygon)) {
      matched.push({
        id: zone.id,
        name: zone.name,
        riskLevel: zone.riskLevel,
        description: zone.description,
      });
    }
  }

  return matched;
}

export function getHighestRisk(matched: MatchedZone[]): RiskLevel | null {
  if (matched.length === 0) return null;
  return matched.reduce((highest, zone) =>
    RISK_LEVEL_ORDER[zone.riskLevel] > RISK_LEVEL_ORDER[highest] ? zone.riskLevel : highest,
  matched[0].riskLevel);
}

export function buildWarningMessage(matched: MatchedZone[], highest: RiskLevel | null): string {
  if (!highest || matched.length === 0) {
    return 'You are outside monitored risk zones.';
  }
  const primary = matched.find((z) => z.riskLevel === highest) ?? matched[0];
  return `Warning: You have entered ${primary.name} (${highest} risk). ${primary.description}`;
}
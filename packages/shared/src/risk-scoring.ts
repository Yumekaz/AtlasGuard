import type { IncidentSeverity, IncidentType, RiskLevel } from './index';

export interface RiskScoreExplanation {
  score: number;
  severity: IncidentSeverity;
  reasons: string[];
}

export interface RiskScoreInput {
  incidentType: IncidentType;
  highestZoneRisk: RiskLevel | null;
  isNightTime: boolean;
  hasMedicalNotes: boolean;
  hasMobilityNeeds: boolean;
  nearestResponderDistanceKm: number | null;
  nearbyActiveIncidentCount: number;
}

export const RISK_SCORE_CAP = 100;

/**
 * Sum of all scoring rules when every rule applies (Bible §17.2 weights):
 * - CRITICAL zone +30 (mutually exclusive with HIGH +25 / MEDIUM +15)
 * - Night hours +10
 * - MEDICAL incident type +20
 * - Medical notes on profile +10
 * - Mobility needs +5 (non-empty and not "None")
 * - Nearest responder >5 km +10
 * - Nearby active incidents >3 +10
 * CRITICAL-path maximum: 30+10+20+10+5+10+10 = 95
 */
export const MAX_ACCUMULATED_RULE_SCORE = 95;

export function capRiskScore(score: number): number {
  return Math.min(score, RISK_SCORE_CAP);
}

export function scoreToSeverity(score: number): IncidentSeverity {
  if (score <= 30) return 'LOW';
  if (score <= 55) return 'MEDIUM';
  if (score <= 80) return 'HIGH';
  return 'CRITICAL';
}

export function computeRiskScore(input: RiskScoreInput): RiskScoreExplanation {
  let score = 0;
  const reasons: string[] = [];

  if (input.highestZoneRisk === 'CRITICAL') {
    score += 30;
    reasons.push('Incident location is in a CRITICAL-risk geofence zone (+30)');
  } else if (input.highestZoneRisk === 'HIGH') {
    score += 25;
    reasons.push('Incident location is in a HIGH-risk geofence zone (+25)');
  } else if (input.highestZoneRisk === 'MEDIUM') {
    score += 15;
    reasons.push('Incident location is in a MEDIUM-risk geofence zone (+15)');
  }

  if (input.isNightTime) {
    score += 10;
    reasons.push('Incident occurred during night hours (20:00–06:00) (+10)');
  }

  if (input.incidentType === 'MEDICAL') {
    score += 20;
    reasons.push('Incident type is MEDICAL (+20)');
  }

  if (input.hasMedicalNotes) {
    score += 10;
    reasons.push('Tourist profile includes medical notes (+10)');
  }

  if (input.hasMobilityNeeds) {
    score += 5;
    reasons.push('Tourist profile reports mobility assistance needs (+5)');
  }

  if (
    input.nearestResponderDistanceKm !== null &&
    input.nearestResponderDistanceKm > 5
  ) {
    score += 10;
    reasons.push(
      `Nearest available responder is ${input.nearestResponderDistanceKm.toFixed(1)} km away (>5 km) (+10)`,
    );
  }

  if (input.nearbyActiveIncidentCount > 3) {
    score += 10;
    reasons.push(
      `${input.nearbyActiveIncidentCount} active incidents within ~2 km (>3) (+10)`,
    );
  }

  const cappedScore = capRiskScore(score);

  if (reasons.length === 0) {
    reasons.push('Baseline risk — no elevated factors detected');
  }

  return {
    score: cappedScore,
    severity: scoreToSeverity(cappedScore),
    reasons,
  };
}
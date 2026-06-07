import { describe, it, expect } from 'vitest';
import {
  capRiskScore,
  computeRiskScore,
  hasMobilityNeedsFromProfile,
  MAX_ACCUMULATED_RULE_SCORE,
  RISK_SCORE_CAP,
  scoreToSeverity,
} from './risk-scoring';

describe('scoreToSeverity', () => {
  it('maps score bands to severity levels', () => {
    expect(scoreToSeverity(0)).toBe('LOW');
    expect(scoreToSeverity(30)).toBe('LOW');
    expect(scoreToSeverity(31)).toBe('MEDIUM');
    expect(scoreToSeverity(55)).toBe('MEDIUM');
    expect(scoreToSeverity(56)).toBe('HIGH');
    expect(scoreToSeverity(80)).toBe('HIGH');
    expect(scoreToSeverity(81)).toBe('CRITICAL');
    expect(scoreToSeverity(100)).toBe('CRITICAL');
  });
});

describe('computeRiskScore', () => {
  const baseInput = {
    incidentType: 'SOS' as const,
    highestZoneRisk: null,
    isNightTime: false,
    hasMedicalNotes: false,
    hasMobilityNeeds: false,
    nearestResponderDistanceKm: 2,
    nearbyActiveIncidentCount: 0,
  };

  it('returns baseline when no rules apply', () => {
    const result = computeRiskScore(baseInput);
    expect(result.score).toBe(0);
    expect(result.severity).toBe('LOW');
    expect(result.reasons).toContain('Baseline risk — no elevated factors detected');
  });

  it('applies CRITICAL zone rule (+30)', () => {
    const result = computeRiskScore({ ...baseInput, highestZoneRisk: 'CRITICAL' });
    expect(result.score).toBe(30);
    expect(result.severity).toBe('LOW');
    expect(result.reasons.some((r) => r.includes('CRITICAL-risk geofence'))).toBe(true);
  });

  it('applies HIGH zone rule (+25)', () => {
    const result = computeRiskScore({ ...baseInput, highestZoneRisk: 'HIGH' });
    expect(result.score).toBe(25);
    expect(result.reasons.some((r) => r.includes('HIGH-risk geofence'))).toBe(true);
  });

  it('applies MEDIUM zone rule (+15)', () => {
    const result = computeRiskScore({ ...baseInput, highestZoneRisk: 'MEDIUM' });
    expect(result.score).toBe(15);
    expect(result.severity).toBe('LOW');
    expect(result.reasons.some((r) => r.includes('MEDIUM-risk geofence'))).toBe(true);
  });

  it('prefers CRITICAL over HIGH and MEDIUM when multiple zones overlap', () => {
    const result = computeRiskScore({ ...baseInput, highestZoneRisk: 'CRITICAL' });
    expect(result.score).toBe(30);
    expect(result.reasons.some((r) => r.includes('CRITICAL-risk geofence'))).toBe(true);
    expect(result.reasons.some((r) => r.includes('HIGH-risk geofence'))).toBe(false);
    expect(result.reasons.some((r) => r.includes('MEDIUM-risk geofence'))).toBe(false);
  });

  it('applies MEDICAL incident type rule (+20)', () => {
    const result = computeRiskScore({ ...baseInput, incidentType: 'MEDICAL' });
    expect(result.score).toBe(20);
    expect(result.reasons.some((r) => r.includes('MEDICAL'))).toBe(true);
  });

  it('applies medical notes rule (+10)', () => {
    const result = computeRiskScore({ ...baseInput, hasMedicalNotes: true });
    expect(result.score).toBe(10);
    expect(result.reasons.some((r) => r.includes('medical notes'))).toBe(true);
  });

  it('applies mobility needs rule (+5)', () => {
    const result = computeRiskScore({ ...baseInput, hasMobilityNeeds: true });
    expect(result.score).toBe(5);
    expect(result.reasons.some((r) => r.includes('mobility assistance'))).toBe(true);
  });

  it('stacks all current rules to the documented maximum of 95', () => {
    const result = computeRiskScore({
      incidentType: 'MEDICAL',
      highestZoneRisk: 'CRITICAL',
      isNightTime: true,
      hasMedicalNotes: true,
      hasMobilityNeeds: true,
      nearestResponderDistanceKm: 12,
      nearbyActiveIncidentCount: 5,
    });
    expect(result.score).toBe(MAX_ACCUMULATED_RULE_SCORE);
    expect(result.severity).toBe('CRITICAL');
    expect(result.reasons.length).toBe(7);
  });

  it('caps scores at RISK_SCORE_CAP via capRiskScore', () => {
    expect(capRiskScore(110)).toBe(RISK_SCORE_CAP);
    expect(capRiskScore(MAX_ACCUMULATED_RULE_SCORE)).toBe(MAX_ACCUMULATED_RULE_SCORE);
  });

  it('does not apply distant responder rule when within 5 km', () => {
    const result = computeRiskScore({
      ...baseInput,
      nearestResponderDistanceKm: 4.9,
    });
    expect(result.reasons.some((r) => r.includes('responder'))).toBe(false);
  });

  it('does not apply distant responder rule at exactly 5.0 km (threshold is >5)', () => {
    const result = computeRiskScore({
      ...baseInput,
      nearestResponderDistanceKm: 5.0,
    });
    expect(result.score).toBe(0);
    expect(result.reasons.some((r) => r.includes('responder'))).toBe(false);
  });

  it('does not apply nearby incidents rule at exactly 3 (threshold is >3)', () => {
    const result = computeRiskScore({
      ...baseInput,
      nearbyActiveIncidentCount: 3,
    });
    expect(result.score).toBe(0);
    expect(result.reasons.some((r) => r.includes('active incidents within'))).toBe(false);
  });

  it('applies night-time rule (+10)', () => {
    const result = computeRiskScore({ ...baseInput, isNightTime: true });
    expect(result.score).toBe(10);
    expect(result.reasons.some((r) => r.includes('night hours'))).toBe(true);
  });

  it('applies nearby incidents rule when count exceeds 3', () => {
    const result = computeRiskScore({
      ...baseInput,
      nearbyActiveIncidentCount: 4,
    });
    expect(result.score).toBe(10);
    expect(result.reasons.some((r) => r.includes('active incidents within'))).toBe(true);
  });
});

describe('hasMobilityNeedsFromProfile', () => {
  it('returns false for empty or "None" sentinel values', () => {
    expect(hasMobilityNeedsFromProfile(undefined)).toBe(false);
    expect(hasMobilityNeedsFromProfile(null)).toBe(false);
    expect(hasMobilityNeedsFromProfile('')).toBe(false);
    expect(hasMobilityNeedsFromProfile('None')).toBe(false);
    expect(hasMobilityNeedsFromProfile('none')).toBe(false);
    expect(hasMobilityNeedsFromProfile('  None  ')).toBe(false);
  });

  it('returns true for non-empty mobility needs', () => {
    expect(hasMobilityNeedsFromProfile('Limited mobility — knee injury')).toBe(true);
  });
});
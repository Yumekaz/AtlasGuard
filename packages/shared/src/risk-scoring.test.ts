import { describe, it, expect } from 'vitest';
import {
  capRiskScore,
  computeRiskScore,
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

  it('stacks all current rules to the documented maximum of 90', () => {
    const result = computeRiskScore({
      incidentType: 'MEDICAL',
      highestZoneRisk: 'CRITICAL',
      isNightTime: true,
      hasMedicalNotes: true,
      nearestResponderDistanceKm: 12,
      nearbyActiveIncidentCount: 5,
    });
    expect(result.score).toBe(MAX_ACCUMULATED_RULE_SCORE);
    expect(result.severity).toBe('CRITICAL');
    expect(result.reasons.length).toBe(6);
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
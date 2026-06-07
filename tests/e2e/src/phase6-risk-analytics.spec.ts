import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:3001';

async function loginToken(request: import('@playwright/test').APIRequestContext, email: string) {
  const login = await request.post(`${API_URL}/auth/login`, {
    data: { email, password: 'password123' },
  });
  expect(login.ok()).toBeTruthy();
  const { token } = await login.json();
  return token as string;
}

test.describe('Phase 6 - Risk Scoring & Analytics (API)', () => {
  test.beforeAll(async ({ request }) => {
    const adminToken = await loginToken(request, 'admin@demo.com');
    await request.post(`${API_URL}/admin/simulate-demo`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  });

  test('SOS at remoteNorth CRITICAL zone yields elevated risk score', async ({ request }) => {
    const touristToken = await loginToken(request, 'tourist@demo.com');

    const sos = await request.post(`${API_URL}/incidents/sos`, {
      headers: { Authorization: `Bearer ${touristToken}` },
      data: {
        latitude: 27.34,
        longitude: 88.6275,
        description: 'Phase 6 high-risk SOS test',
      },
    });
    expect(sos.ok()).toBeTruthy();
    const incident = await sos.json();

    expect(incident.riskScore).toBeGreaterThanOrEqual(30);
    expect(['HIGH', 'CRITICAL', 'MEDIUM']).toContain(incident.severity);
    expect(incident.riskExplanation).toBeTruthy();

    const explanation = JSON.parse(incident.riskExplanation);
    expect(explanation.score).toBe(incident.riskScore);
    expect(explanation.reasons.length).toBeGreaterThan(0);
    expect(
      explanation.reasons.some((r: string) => r.includes('CRITICAL') || r.includes('medical')),
    ).toBeTruthy();
  });

  test('dashboard summary returns analytics fields', async ({ request }) => {
    const operatorToken = await loginToken(request, 'operator@demo.com');
    const res = await request.get(`${API_URL}/ops/dashboard/summary`, {
      headers: { Authorization: `Bearer ${operatorToken}` },
    });
    expect(res.ok()).toBeTruthy();

    const summary = await res.json();
    expect(summary).toHaveProperty('totalActive');
    expect(summary).toHaveProperty('activeBySeverity');
    expect(summary.activeBySeverity).toHaveProperty('LOW');
    expect(summary.activeBySeverity).toHaveProperty('CRITICAL');
    expect(summary).toHaveProperty('averageResponseTimeMinutes');
    expect(summary).toHaveProperty('criticalCount');
    expect(summary).toHaveProperty('resolvedToday');
    expect(summary.totalActive).toBeGreaterThanOrEqual(1);
  });

  test('simulate-demo returns playbook with remoteNorth location', async ({ request }) => {
    const adminToken = await loginToken(request, 'admin@demo.com');
    const res = await request.post(`${API_URL}/admin/simulate-demo`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.playbook).toBeTruthy();
    expect(body.playbook.highRiskLocation.lat).toBe(27.34);
    expect(body.playbook.highRiskLocation.lng).toBe(88.6275);
    expect(body.playbook.steps.length).toBeGreaterThanOrEqual(4);
    expect(body.playbook.suggestedSosPayload.latitude).toBe(27.34);
  });
});
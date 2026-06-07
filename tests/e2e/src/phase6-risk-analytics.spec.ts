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
        type: 'MEDICAL',
      },
    });
    expect(sos.ok()).toBeTruthy();
    const incident = await sos.json();

    expect(incident.riskScore).toBeGreaterThanOrEqual(56);
    expect(['HIGH', 'CRITICAL']).toContain(incident.severity);
    expect(incident.riskExplanation).toBeTruthy();

    const explanation = JSON.parse(incident.riskExplanation);
    expect(explanation.score).toBe(incident.riskScore);
    expect(explanation.reasons.length).toBeGreaterThanOrEqual(3);
    expect(
      explanation.reasons.some((r: string) => r.includes('CRITICAL') || r.includes('MEDICAL')),
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
    expect(summary.averageResponseTimeMinutes).not.toBeNull();
  });

  test('simulate-demo returns playbook with remoteNorth location and auto-trigger', async ({ request }) => {
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
    expect(body.playbook.autoTriggered).toBe(true);
    expect(body.playbook.demoIncidentId).toBeTruthy();
    expect(body.playbook.expectedRiskScore).toBeGreaterThanOrEqual(56);
    expect(['HIGH', 'CRITICAL']).toContain(body.playbook.expectedSeverity);
    expect(body.playbook.expectedReasonCount).toBeGreaterThanOrEqual(3);
  });

  test('full demo golden path: simulate → acknowledge analytics populated', async ({ request }) => {
    const adminToken = await loginToken(request, 'admin@demo.com');
    const sim = await request.post(`${API_URL}/admin/simulate-demo`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(sim.ok()).toBeTruthy();
    const simBody = await sim.json();
    const incidentId = simBody.playbook.demoIncidentId as string;
    expect(incidentId).toBeTruthy();

    const operatorToken = await loginToken(request, 'operator@demo.com');
    const incidentRes = await request.get(`${API_URL}/ops/incidents/${incidentId}`, {
      headers: { Authorization: `Bearer ${operatorToken}` },
    });
    expect(incidentRes.ok()).toBeTruthy();
    const incident = await incidentRes.json();
    expect(incident.status).toBe('ACKNOWLEDGED');

    const summaryRes = await request.get(`${API_URL}/ops/dashboard/summary`, {
      headers: { Authorization: `Bearer ${operatorToken}` },
    });
    expect(summaryRes.ok()).toBeTruthy();
    const summary = await summaryRes.json();
    expect(summary.averageResponseTimeMinutes).not.toBeNull();
    expect(summary.averageResponseTimeMinutes).toBeGreaterThan(0);
  });
});

test.describe('Phase 6 - Risk Analytics (Browser)', () => {
  test('operator dashboard shows risk analysis reasons after selecting incident', async ({ browser }) => {
    test.setTimeout(60000);
    const context = await browser.newContext();
    const page = await context.newPage();

    const adminLogin = await page.request.post(`${API_URL}/auth/login`, {
      data: { email: 'admin@demo.com', password: 'password123' },
    });
    const { token: adminToken } = await adminLogin.json();
    await page.request.post(`${API_URL}/admin/simulate-demo`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    await page.goto('/login');
    await page.getByRole('button', { name: 'Operator Demo' }).click();
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/dashboard/operator**', { timeout: 15000 });
    await expect(page.getByText('Welcome back,')).toBeVisible({ timeout: 15000 });

    await expect(page.getByText('Active Operations Queue')).toBeVisible({ timeout: 15000 });
    const incidentRow = page.locator('tbody tr').first();
    await expect(incidentRow).toBeVisible({ timeout: 15000 });
    await incidentRow.click();

    await expect(page.getByText(/Risk Analysis/)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Risk Factors')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Incident type is MEDICAL (+20)')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/CRITICAL-risk geofence zone/)).toBeVisible({
      timeout: 15000,
    });

    await context.close();
  });
});
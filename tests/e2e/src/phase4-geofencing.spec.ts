import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:3001';

async function getTouristToken(request: import('@playwright/test').APIRequestContext) {
  const login = await request.post(`${API_URL}/auth/login`, {
    data: { email: 'tourist@demo.com', password: 'password123' },
  });
  expect(login.ok()).toBeTruthy();
  const { token } = await login.json();
  return token as string;
}

test.describe('Phase 4 - Geofencing (API)', () => {
  test.beforeAll(async ({ request }) => {
    const adminLogin = await request.post(`${API_URL}/auth/login`, {
      data: { email: 'admin@demo.com', password: 'password123' },
    });
    const { token: adminToken } = await adminLogin.json();
    await request.post(`${API_URL}/admin/seed`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  });

  test('lists seeded risk zones', async ({ request }) => {
    const token = await getTouristToken(request);
    const res = await request.get(`${API_URL}/risk-zones`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const zones = await res.json();
    expect(zones.length).toBeGreaterThanOrEqual(4);
    expect(zones.some((z: { name: string }) => z.name === 'Viewpoint Ridge')).toBeTruthy();
  });

  test('detects HIGH risk zone at Viewpoint Ridge', async ({ request }) => {
    const token = await getTouristToken(request);
    const res = await request.post(`${API_URL}/geofence/check`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { latitude: 27.335, longitude: 88.620 },
    });
    expect(res.ok()).toBeTruthy();
    const result = await res.json();
    expect(result.inside).toBe(true);
    expect(result.highestRisk).toBe('HIGH');
    expect(result.shouldAlert).toBe(true);
    expect(result.alertZoneId).toBeTruthy();
  });

  test('reports outside zones at default start', async ({ request }) => {
    const token = await getTouristToken(request);
    const res = await request.post(`${API_URL}/geofence/check`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { latitude: 27.325, longitude: 88.600 },
    });
    expect(res.ok()).toBeTruthy();
    const result = await res.json();
    expect(result.inside).toBe(false);
    expect(result.highestRisk).toBeNull();
    expect(result.shouldAlert).toBe(false);
  });

  test('de-dupes alerts with lastAlertedZoneId', async ({ request }) => {
    const token = await getTouristToken(request);
    const first = await request.post(`${API_URL}/geofence/check`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { latitude: 27.34, longitude: 88.6275 },
    });
    const firstResult = await first.json();
    expect(firstResult.shouldAlert).toBe(true);
    expect(firstResult.highestRisk).toBe('CRITICAL');

    const second = await request.post(`${API_URL}/geofence/check`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        latitude: 27.34,
        longitude: 88.6275,
        lastAlertedZoneId: firstResult.alertZoneId,
      },
    });
    const secondResult = await second.json();
    expect(secondResult.inside).toBe(true);
    expect(secondResult.shouldAlert).toBe(false);
  });

  test('operator map endpoint returns zones, incidents, responders', async ({ request }) => {
    const login = await request.post(`${API_URL}/auth/login`, {
      data: { email: 'operator@demo.com', password: 'password123' },
    });
    const { token } = await login.json();
    const res = await request.get(`${API_URL}/ops/map`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.zones.length).toBeGreaterThanOrEqual(4);
    expect(Array.isArray(data.incidents)).toBeTruthy();
    expect(Array.isArray(data.responders)).toBeTruthy();
  });
});

async function loginViaUi(page: import('@playwright/test').Page, role: 'Tourist' | 'Admin') {
  await page.goto('/login');
  await page.getByRole('button', { name: `${role} Demo` }).click();
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });
  await expect(page.getByText('Welcome back,')).toBeVisible({ timeout: 15000 });
}

test.describe('Phase 4 - Geofencing (Browser)', () => {
  test.beforeAll(async ({ request }) => {
    const adminLogin = await request.post(`${API_URL}/auth/login`, {
      data: { email: 'admin@demo.com', password: 'password123' },
    });
    const { token: adminToken } = await adminLogin.json();
    await request.post(`${API_URL}/admin/seed`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  });

  test('tourist safety map shows zone alert for high-risk preset', async ({ browser }) => {
    test.setTimeout(60000);
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginViaUi(page, 'Tourist');
    await page.getByRole('link', { name: 'Safety Map' }).click();
    await page.waitForURL('**/dashboard/tourist/map**', { timeout: 15000 });
    await expect(page.getByText('Simulate Location')).toBeVisible({ timeout: 20000 });

    await page.getByRole('button', { name: /Viewpoint Ridge/i }).click();
    const alertBanner = page.locator('.alert').filter({ hasText: 'Geofence Alert' });
    await expect(alertBanner).toBeVisible({ timeout: 15000 });
    await expect(alertBanner.getByText(/HIGH risk/i)).toBeVisible();

    await context.close();
  });

  test('admin zones page shows seeded zone registry', async ({ browser }) => {
    test.setTimeout(60000);
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginViaUi(page, 'Admin');
    await page.getByRole('link', { name: 'Risk Zones Control' }).click();
    await page.waitForURL('**/dashboard/admin/zones**', { timeout: 15000 });

    await expect(page.getByText('Zone Registry')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Viewpoint Ridge')).toBeVisible();
    await expect(page.getByText('MG Marg Festival Zone')).toBeVisible();

    await context.close();
  });
});
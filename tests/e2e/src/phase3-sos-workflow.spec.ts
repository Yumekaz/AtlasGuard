import { test, expect, APIRequestContext } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:3001';

async function cleanupOpenIncidents(request: APIRequestContext) {
  const touristLogin = await request.post(`${API_URL}/auth/login`, {
    data: { email: 'tourist@demo.com', password: 'password123' },
  });
  const { token: tToken } = await touristLogin.json();

  const myIncidents = await request.get(`${API_URL}/incidents/my`, {
    headers: { Authorization: `Bearer ${tToken}` },
  });
  const incidents = await myIncidents.json();

  for (const inc of incidents) {
    if (inc.status === 'CREATED') {
      await request.post(`${API_URL}/incidents/${inc.id}/cancel`, {
        headers: { Authorization: `Bearer ${tToken}` },
      });
    }
  }

  // Resolve any remaining open incidents via operator + responder APIs
  const operatorLogin = await request.post(`${API_URL}/auth/login`, {
    data: { email: 'operator@demo.com', password: 'password123' },
  });
  const { token: oToken } = await operatorLogin.json();
  const openList = await request.get(`${API_URL}/ops/incidents`, {
    headers: { Authorization: `Bearer ${oToken}` },
  });
  const open = await openList.json();

  if (open.length > 0) {
    const responderLogin = await request.post(`${API_URL}/auth/login`, {
      data: { email: 'responder@demo.com', password: 'password123' },
    });
    const { token: rToken } = await responderLogin.json();
    const responders = await request.get(`${API_URL}/ops/responders`, {
      headers: { Authorization: `Bearer ${oToken}` },
    });
    const responderList = await responders.json();

    for (const inc of open) {
      if (inc.status === 'CREATED') {
        await request.post(`${API_URL}/ops/incidents/${inc.id}/acknowledge`, {
          headers: { Authorization: `Bearer ${oToken}` },
        });
      }
      const refreshed = await request.get(`${API_URL}/ops/incidents/${inc.id}`, {
        headers: { Authorization: `Bearer ${oToken}` },
      });
      const detail = await refreshed.json();
      if (detail.status === 'ACKNOWLEDGED' && responderList[0]) {
        await request.post(`${API_URL}/ops/incidents/${inc.id}/assign`, {
          headers: { Authorization: `Bearer ${oToken}` },
          data: { responderId: responderList[0].id },
        });
      }
      await request.post(`${API_URL}/responder/incidents/${inc.id}/dispatched`, {
        headers: { Authorization: `Bearer ${rToken}` },
      });
      await request.post(`${API_URL}/responder/incidents/${inc.id}/reached`, {
        headers: { Authorization: `Bearer ${rToken}` },
      });
      await request.post(`${API_URL}/responder/incidents/${inc.id}/resolved`, {
        headers: { Authorization: `Bearer ${rToken}` },
      });
    }
  }
}

async function loginViaUi(page: import('@playwright/test').Page, role: 'Tourist' | 'Operator' | 'Responder') {
  await page.goto('/login');
  await page.getByRole('button', { name: `${role} Demo` }).click();
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(`**/dashboard/**`, { timeout: 15000 });
}

test.describe('Phase 3 - SOS Workflow (Browser)', () => {
  test.beforeEach(async ({ request }) => {
    await cleanupOpenIncidents(request);
  });

  test('Golden path: tourist SOS through operator assign to responder resolve', async ({ browser }) => {
    // Ensure demo tourist has active trip (seed handles this)
    const touristContext = await browser.newContext();
    const touristPage = await touristContext.newPage();

    await loginViaUi(touristPage, 'Tourist');
    await touristPage.waitForURL('**/dashboard/tourist**');

    // Trigger SOS (or use existing active incident link)
    const viewLink = touristPage.getByRole('link', { name: 'View Live Incident Status' });
    const triggerButton = touristPage.getByRole('button', { name: /TRIGGER/i });

    if (await viewLink.isVisible().catch(() => false)) {
      await viewLink.click();
    } else {
      await expect(triggerButton).toBeVisible({ timeout: 10000 });
      await triggerButton.click();
    }

    await touristPage.waitForURL('**/dashboard/tourist/incident/**', { timeout: 15000 });
    await expect(touristPage.getByText('LIVE TRACKING')).toBeVisible();
    await expect(touristPage.locator('.badge-admin').filter({ hasText: 'CREATED' })).toBeVisible();

    const incidentUrl = touristPage.url();
    const incidentId = incidentUrl.split('/').pop()!;

    // Operator flow in separate browser context
    const operatorContext = await browser.newContext();
    const operatorPage = await operatorContext.newPage();
    await loginViaUi(operatorPage, 'Operator');
    await operatorPage.waitForURL('**/dashboard/operator**');

    // Wait for incident in queue (REST load + possible socket)
    await expect(operatorPage.getByText('Demo Tourist').first()).toBeVisible({ timeout: 15000 });

    const acknowledgeBtn = operatorPage.getByRole('button', { name: 'Acknowledge' });
    await expect(acknowledgeBtn).toBeVisible({ timeout: 10000 });
    await acknowledgeBtn.click();

    await expect(operatorPage.getByText('ACKNOWLEDGED')).toBeVisible({ timeout: 10000 });

    await operatorPage.getByRole('button', { name: 'Assign Responder' }).click();
    await operatorPage.locator('select.form-input').selectOption({ index: 1 });
    await operatorPage.getByRole('button', { name: 'Confirm Assignment' }).click();

    await expect(operatorPage.getByText('ASSIGNED')).toBeVisible({ timeout: 10000 });

    // Responder flow
    const responderContext = await browser.newContext();
    const responderPage = await responderContext.newPage();
    await loginViaUi(responderPage, 'Responder');
    await responderPage.waitForURL('**/dashboard/responder**');

    await expect(responderPage.getByRole('heading', { name: /SOS — Demo Tourist/ })).toBeVisible({ timeout: 15000 });

    await responderPage.getByRole('button', { name: 'Mark Dispatched' }).click();
    await expect(responderPage.getByText('DISPATCHED')).toBeVisible({ timeout: 10000 });

    await responderPage.getByRole('button', { name: 'Mark Reached' }).click();
    await expect(responderPage.getByText('REACHED')).toBeVisible({ timeout: 10000 });

    await responderPage.getByRole('button', { name: 'Resolve Case' }).click();
    await expect(responderPage.getByText(/Status updated to RESOLVED|RESOLVED/)).toBeVisible({ timeout: 10000 });

    // Tourist sees resolved (reload tracking page)
    await touristPage.reload();
    await expect(touristPage.locator('.badge-responder').filter({ hasText: 'RESOLVED' })).toBeVisible({ timeout: 15000 });
    await expect(touristPage.getByText('You are safe. This incident has been resolved')).toBeVisible();

    // Verify via API
    const token = await touristPage.evaluate(() => localStorage.getItem('token'));
    const statusRes = await touristPage.request.get(`${API_URL}/incidents/${incidentId}/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(statusRes.ok()).toBeTruthy();
    const body = await statusRes.json();
    expect(body.status).toBe('RESOLVED');
    expect(body.events.length).toBeGreaterThanOrEqual(5);

    await touristContext.close();
    await operatorContext.close();
    await responderContext.close();
  });
});
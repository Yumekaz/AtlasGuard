import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const API_URL = process.env.API_URL || 'http://127.0.0.1:3001';

async function loginToken(request: import('@playwright/test').APIRequestContext, email: string) {
  const login = await request.post(`${API_URL}/auth/login`, {
    data: { email, password: 'password123' },
  });
  expect(login.ok()).toBeTruthy();
  const { token } = await login.json();
  return token as string;
}

test.describe('Phase 5 - Audit, Notifications, Evidence (API)', () => {
  let incidentId: string;
  let touristToken: string;

  test.beforeAll(async ({ request }) => {
    const adminToken = await loginToken(request, 'admin@demo.com');
    await request.post(`${API_URL}/admin/seed`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    touristToken = await loginToken(request, 'tourist@demo.com');

    const myIncidents = await request.get(`${API_URL}/incidents/my`, {
      headers: { Authorization: `Bearer ${touristToken}` },
    });
    const incidents = await myIncidents.json();
    for (const inc of incidents) {
      if (inc.status === 'CREATED') {
        await request.post(`${API_URL}/incidents/${inc.id}/cancel`, {
          headers: { Authorization: `Bearer ${touristToken}` },
        });
      }
    }

    const sos = await request.post(`${API_URL}/incidents/sos`, {
      headers: { Authorization: `Bearer ${touristToken}` },
      data: { latitude: 27.3314, longitude: 88.6138 },
    });
    expect(sos.ok()).toBeTruthy();
    const body = await sos.json();
    incidentId = body.id;

    await new Promise((r) => setTimeout(r, 2500));
  });

  test('audit chain verifies as true after SOS', async ({ request }) => {
    const verify = await request.get(`${API_URL}/incidents/${incidentId}/audit/verify`, {
      headers: { Authorization: `Bearer ${touristToken}` },
    });
    expect(verify.ok()).toBeTruthy();
    const result = await verify.json();
    expect(result.verified).toBe(true);
    expect(result.totalEvents).toBeGreaterThanOrEqual(1);
  });

  test('SOS creates notification records for operators', async ({ request }) => {
    const operatorToken = await loginToken(request, 'operator@demo.com');
    const res = await request.get(`${API_URL}/ops/notifications`, {
      headers: { Authorization: `Bearer ${operatorToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const notifications = await res.json();
    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications.some((n: { status: string }) => ['MOCKED', 'SENT', 'PENDING'].includes(n.status))).toBeTruthy();
  });

  test('evidence can be uploaded and listed', async ({ request }) => {
    const tmpFile = path.join(os.tmpdir(), `atlasguard-evidence-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, 'Demo evidence note for Phase 5 test');

    const upload = await request.post(`${API_URL}/incidents/${incidentId}/evidence`, {
      headers: { Authorization: `Bearer ${touristToken}` },
      multipart: {
        file: {
          name: 'evidence.txt',
          mimeType: 'text/plain',
          buffer: fs.readFileSync(tmpFile),
        },
        description: 'Phase 5 test evidence',
      },
    });
    fs.unlinkSync(tmpFile);

    expect(upload.ok()).toBeTruthy();
    const uploaded = await upload.json();
    expect(uploaded.fileType).toBe('text');

    const list = await request.get(`${API_URL}/incidents/${incidentId}/evidence`, {
      headers: { Authorization: `Bearer ${touristToken}` },
    });
    const files = await list.json();
    expect(files.some((f: { id: string }) => f.id === uploaded.id)).toBeTruthy();

    const verify = await request.get(`${API_URL}/incidents/${incidentId}/audit/verify`, {
      headers: { Authorization: `Bearer ${touristToken}` },
    });
    const audit = await verify.json();
    expect(audit.verified).toBe(true);
    expect(audit.totalEvents).toBeGreaterThanOrEqual(2);
  });

  test('admin audit feed returns events', async ({ request }) => {
    const adminToken = await loginToken(request, 'admin@demo.com');
    const res = await request.get(`${API_URL}/admin/audit`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const feed = await res.json();
    expect(feed.length).toBeGreaterThan(0);
  });
});

test.describe('Phase 5 - Audit (Browser)', () => {
  test('operator audit page shows verified integrity', async ({ browser }) => {
    test.setTimeout(60000);
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/login');
    await page.getByRole('button', { name: 'Operator Demo' }).click();
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/dashboard/operator**', { timeout: 15000 });
    await expect(page.getByText('Welcome back,')).toBeVisible({ timeout: 15000 });

    await page.getByRole('link', { name: 'Safety Ledger' }).click();
    await page.waitForURL('**/dashboard/operator/audit**', { timeout: 15000 });

    await expect(page.getByText(/Integrity: Verified|Audit integrity: Verified/i)).toBeVisible({ timeout: 15000 });

    await context.close();
  });
});
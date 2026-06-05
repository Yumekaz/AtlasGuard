import { test, expect } from '@playwright/test';

const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

test.describe('F4 - Next.js Protected Dashboards', () => {
  test('Unauthenticated user accessing /dashboard/tourist is redirected to /login', async ({ page }) => {
    await page.goto('/dashboard/tourist');
    await page.waitForURL('**/login**');
    expect(page.url()).toContain('/login');
  });

  test('Unauthenticated user accessing /dashboard/operator is redirected to /login', async ({ page }) => {
    await page.goto('/dashboard/operator');
    await page.waitForURL('**/login**');
    expect(page.url()).toContain('/login');
  });

  test('Logged-in TOURIST successfully accesses /dashboard/tourist', async ({ page }) => {
    // Seed localStorage before navigation
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'fake-tourist-token');
      window.localStorage.setItem('user', JSON.stringify({
        id: 'tourist-id-123',
        name: 'Tourist Demo',
        email: 'tourist@demo.com',
        role: 'TOURIST'
      }));
    });

    await page.goto('/dashboard/tourist');
    // Verify we are on the tourist dashboard and not redirected
    await page.waitForURL('**/dashboard/tourist**');
    expect(page.url()).toContain('/dashboard/tourist');
  });

  test('Logged-in TOURIST attempting to access /dashboard/admin is redirected/blocked (403 or redirect)', async ({ page }) => {
    // Seed localStorage as tourist
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'fake-tourist-token');
      window.localStorage.setItem('user', JSON.stringify({
        id: 'tourist-id-123',
        name: 'Tourist Demo',
        email: 'tourist@demo.com',
        role: 'TOURIST'
      }));
    });

    await page.goto('/dashboard/admin');
    // Expecting redirect to login, a custom 403 page, or home
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('/dashboard/admin');
  });

  test('Logged-in OPERATOR successfully accesses /dashboard/operator', async ({ page }) => {
    // Seed localStorage as operator
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'fake-operator-token');
      window.localStorage.setItem('user', JSON.stringify({
        id: 'operator-id-123',
        name: 'Operator Demo',
        email: 'operator@demo.com',
        role: 'OPERATOR'
      }));
    });

    await page.goto('/dashboard/operator');
    await page.waitForURL('**/dashboard/operator**');
    expect(page.url()).toContain('/dashboard/operator');
  });
});

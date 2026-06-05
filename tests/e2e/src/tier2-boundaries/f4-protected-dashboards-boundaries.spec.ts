import { test, expect } from '@playwright/test';

const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

test.describe('F4 Boundaries - Next.js Protected Dashboards', () => {
  async function loginAsTourist(page: any) {
    await page.goto('/login');
    await page.evaluate(() => {
      window.localStorage.setItem('token', 'fake-tourist-token');
      window.localStorage.setItem('user', JSON.stringify({
        id: 'tourist-id-123',
        name: 'Tourist Demo',
        email: 'tourist@demo.com',
        role: 'TOURIST'
      }));
    });
  }

  test('Accessing invalid dashboard sub-route (returns 404 or redirects)', async ({ page }) => {
    await loginAsTourist(page);
    await page.goto('/dashboard/tourist/invalid-sub-route-xyz');
    // Check that it shows 404 text or redirects
    await page.waitForTimeout(2000);
    const bodyText = await page.innerText('body');
    // Common checks: either a 404 message is shown, or user is redirected
    const is404OrRedirected = bodyText.includes('404') || 
                              bodyText.toLowerCase().includes('not found') || 
                              page.url() !== `${WEB_URL}/dashboard/tourist/invalid-sub-route-xyz`;
    expect(is404OrRedirected).toBe(true);
  });

  test('LocalStorage token tampered with (should redirect to login)', async ({ page }) => {
    await loginAsTourist(page);
    await page.goto('/dashboard/tourist');
    
    // Now tamper with localStorage token
    await page.evaluate(() => {
      window.localStorage.setItem('token', 'TAMPERED-BAD-TOKEN-SIGNATURE');
    });

    // Reload page or navigate to trigger validation check
    await page.reload();
    await page.waitForURL('**/login**');
    expect(page.url()).toContain('/login');
  });

  test('Fast navigation toggling between dashboards', async ({ page }) => {
    await loginAsTourist(page);
    // Navigate to tourist dashboard
    await page.goto('/dashboard/tourist');
    expect(page.url()).toContain('/dashboard/tourist');

    // Immediately toggle/navigate to operator dashboard (which tourist doesn't have access to)
    await page.goto('/dashboard/operator');
    await page.waitForTimeout(1000);
    // Should block operator dashboard and redirect away
    expect(page.url()).not.toContain('/dashboard/operator');
  });

  test('Accessing dashboard immediately after logout (should redirect)', async ({ page }) => {
    await loginAsTourist(page);
    await page.goto('/dashboard/tourist');
    expect(page.url()).toContain('/dashboard/tourist');

    // Simulate clicking Logout / clearing token
    await page.evaluate(() => {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
    });

    // Attempt to access tourist dashboard again
    try {
      await page.goto('/dashboard/tourist');
    } catch (err: any) {
      if (!err.message.includes('net::ERR_ABORTED')) {
        throw err;
      }
    }
    await page.waitForURL('**/login**');
    expect(page.url()).toContain('/login');
  });

  test('Router transition checks from tourist to admin dashboard', async ({ page }) => {
    await loginAsTourist(page);
    await page.goto('/dashboard/tourist');
    expect(page.url()).toContain('/dashboard/tourist');

    // Navigate programmatically to admin dashboard
    await page.goto('/dashboard/admin');
    await page.waitForTimeout(2000);
    
    // Check that tourist was forbidden/redirected and is not on admin dashboard
    expect(page.url()).not.toContain('/dashboard/admin');
  });
});

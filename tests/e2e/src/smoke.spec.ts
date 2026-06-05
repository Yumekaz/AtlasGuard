import { test, expect } from '@playwright/test';

// Retrieve API and WEB URLs from environment or defaults
const API_URL = process.env.API_URL || 'http://localhost:3001';
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

test.describe('Smoke Tests - Infrastructure Verification', () => {
  
  test('API Endpoint - Connection Attempt', async ({ request }) => {
    console.log(`Attempting to connect to API at: ${API_URL}`);
    try {
      // Attempt to hit the auth or root endpoint
      const response = await request.get(`${API_URL}/auth/me`, {
        timeout: 5000 // fail relatively quickly
      });
      console.log(`Successfully reached API. Status: ${response.status()}`);
      // Simple assertion to verify if we get a valid response
      expect(response.status()).toBe(200);
    } catch (error: any) {
      console.warn(`API connection failed gracefully: ${error.message}`);
      // Throw a descriptive error indicating the server is offline as expected
      throw new Error(`API connection failed at ${API_URL}. Server is likely offline. Original error: ${error.message}`);
    }
  });

  test('UI Frontend - Navigation Attempt', async ({ page }) => {
    console.log(`Attempting to navigate to UI at: ${WEB_URL}`);
    try {
      // Attempt to navigate to the landing/login page
      await page.goto('/', {
        timeout: 5000 // fail relatively quickly
      });
      console.log(`Successfully navigated to UI page. Title: ${await page.title()}`);
      expect(page.url()).toContain(WEB_URL);
    } catch (error: any) {
      console.warn(`UI navigation failed gracefully: ${error.message}`);
      // Throw a descriptive error indicating the server is offline as expected
      throw new Error(`UI navigation failed at ${WEB_URL}. Server is likely offline. Original error: ${error.message}`);
    }
  });

});

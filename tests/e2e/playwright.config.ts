import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Read from .env file if it exists
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Backend API and Frontend Web URLs
export const WEB_URL = process.env.WEB_URL || 'http://127.0.0.1:3000';
export const API_URL = process.env.API_URL || 'http://127.0.0.1:3001';

// Set them back into process.env to ensure they are available in tests
process.env.WEB_URL = WEB_URL;
process.env.API_URL = API_URL;

export default defineConfig({
  testDir: './src',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests to avoid SQLite database locks. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html', { open: 'never' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: WEB_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

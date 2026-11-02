import { defineConfig, devices } from '@playwright/test';

/**
 * Two projects, two public demo systems (no employer code or data anywhere):
 *  - ui  -> https://www.saucedemo.com            (UI under test)
 *  - api -> https://restful-booker.herokuapp.com (API under test)
 *
 * Override targets with UI_BASE_URL / API_BASE_URL if you host your own copies.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    // JSON report feeds scripts/triage_failures.py
    ['json', { outputFile: 'reports/results.json' }],
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'ui',
      testDir: './tests/ui',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.UI_BASE_URL ?? 'https://www.saucedemo.com',
        // SauceDemo uses data-test attributes; this makes page.getByTestId() use them.
        testIdAttribute: 'data-test',
          launchOptions: { slowMo: Number(process.env.SLOW_MO ?? 0) },
      },
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: process.env.API_BASE_URL ?? 'https://restful-booker.herokuapp.com',
        extraHTTPHeaders: { Accept: 'application/json' },
      },
    },
  ],
});

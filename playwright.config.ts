import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests against a running app seeded with `npm run db:seed`.
 * Locally: `npm run build && npm start` (and `npm run start:worker`), then `npm run test:e2e`.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:9002',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});

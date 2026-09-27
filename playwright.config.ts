import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end smoke tests. Supabase is mocked at the network level (see
 * e2e/fixtures.ts) so the suite runs without a database or secrets.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // The static preview server becomes flaky beyond two concurrent browsers on Windows.
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    locale: 'fr-FR',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npx vite build --mode e2e && npx vite preview --mode e2e --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});

import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config. Runs against the REAL backend (NestJS on :3000) and a Next.js dev server
 * on :3001. The backend + a seeded database must be running before `npm run test:e2e`.
 * See e2e/README.md.
 */
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3001';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    // Logs in the seeded test users once and saves their auth state (tokens + en locale).
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      // Public surfaces + signed-out flows. English locale, no auth tokens.
      name: 'public',
      testMatch: /[\\/]public-.*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/public.json' },
      dependencies: ['setup'],
    },
    {
      // Precise patterns: `[\\/]admin-` won't match `org-admin-...`.
      name: 'admin',
      testMatch: /[\\/]admin-.*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/admin.json' },
      dependencies: ['setup'],
    },
    {
      name: 'org-admin',
      testMatch: /[\\/]org-admin-.*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/org.json' },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'next dev -p 3001',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
